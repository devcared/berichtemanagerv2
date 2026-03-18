import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function verifyTrainer(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') return null
  return { userId: user.id }
}

/** Ensures the storage bucket exists, creating it if necessary. */
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: bucket } = await admin.storage.getBucket('schedule-documents')
  if (!bucket) {
    const { error } = await admin.storage.createBucket('schedule-documents', {
      public: false,
      fileSizeLimit: 26214400, // 25 MB
      allowedMimeTypes: ['application/pdf'],
    })
    if (error) throw new Error(`Bucket konnte nicht erstellt werden: ${error.message}`)
  }
}

/** GET /api/admin/schedule/documents — trainer docs with read receipts + apprentice uploads */
export async function GET() {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const admin = createAdminClient()

    const [{ data: trainerDocs, error: docsErr }, { data: apprentices }] = await Promise.all([
      admin
        .from('schedule_documents')
        .select(`
          id, title, description, category, status,
          file_name, file_size, created_at, expires_at,
          schedule_document_assignments(profile_id),
          schedule_document_reads(profile_id)
        `)
        .eq('uploaded_by', trainer.userId)
        .order('created_at', { ascending: false }),
      admin
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'apprentice'),
    ])

    if (docsErr) throw docsErr

    /* apprentice-uploaded documents */
    const apprenticeIds = (apprentices ?? []).map(a => a.id)
    let apprenticeDocs: Record<string, unknown>[] = []

    if (apprenticeIds.length > 0) {
      const { data: rawDocs } = await admin
        .from('schedule_documents')
        .select('id, title, description, category, file_name, file_size, created_at, file_path, uploaded_by')
        .in('uploaded_by', apprenticeIds)
        .order('created_at', { ascending: false })

      apprenticeDocs = await Promise.all(
        (rawDocs ?? []).map(async doc => {
          const { data: signed } = await admin.storage
            .from('schedule-documents')
            .createSignedUrl(doc.file_path as string, 3600)
          const uploader = (apprentices ?? []).find(a => a.id === doc.uploaded_by)
          return {
            ...doc,
            url: signed?.signedUrl ?? null,
            uploaderName: uploader
              ? `${uploader.first_name} ${uploader.last_name}`
              : 'Unbekannt',
          }
        })
      )
    }

    return NextResponse.json({
      documents:         trainerDocs    ?? [],
      apprenticeDocuments: apprenticeDocs,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('GET /api/admin/schedule/documents:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** POST /api/admin/schedule/documents — upload PDF + description + category + status + expiry */
export async function POST(req: NextRequest) {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const formData    = await req.formData()
    const file        = formData.get('file') as File | null
    const title       = (formData.get('title') as string | null)?.trim()
    const assigneeIds = JSON.parse((formData.get('assigneeIds') as string) ?? '[]') as string[]
    const description = (formData.get('description') as string | null)?.trim() || null
    const category    = (formData.get('category')    as string | null) ?? 'allgemein'
    const status      = (formData.get('status')      as string | null) ?? 'published'
    const expires_at  = (formData.get('expires_at')  as string | null) || null

    if (!file)  return NextResponse.json({ error: 'Keine Datei übergeben.' },   { status: 400 })
    if (!title) return NextResponse.json({ error: 'Titel erforderlich.' },      { status: 400 })
    if (file.type !== 'application/pdf')
      return NextResponse.json({ error: 'Nur PDF-Dateien erlaubt.' },           { status: 400 })
    if (file.size > 25 * 1024 * 1024)
      return NextResponse.json({ error: 'Datei zu groß (max. 25 MB).' },        { status: 400 })

    const admin = createAdminClient()
    await ensureBucket(admin)

    const docId    = crypto.randomUUID()
    const filePath = `${trainer.userId}/${docId}.pdf`

    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await admin.storage
      .from('schedule-documents')
      .upload(filePath, buffer, { contentType: 'application/pdf' })
    if (uploadErr) throw new Error(`Speicherfehler: ${uploadErr.message}`)

    const { error: dbErr } = await admin.from('schedule_documents').insert({
      id:          docId,
      uploaded_by: trainer.userId,
      title,
      description,
      category,
      status,
      expires_at,
      file_path:   filePath,
      file_name:   file.name,
      file_size:   file.size,
    })
    if (dbErr) {
      await admin.storage.from('schedule-documents').remove([filePath])
      throw new Error(`Datenbankfehler: ${dbErr.message}`)
    }

    if (assigneeIds.length > 0) {
      const { error: assignErr } = await admin
        .from('schedule_document_assignments')
        .insert(assigneeIds.map(profileId => ({ document_id: docId, profile_id: profileId })))
      if (assignErr) throw new Error(`Zuweisung fehlgeschlagen: ${assignErr.message}`)
    }

    return NextResponse.json({ success: true, docId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('POST /api/admin/schedule/documents:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
