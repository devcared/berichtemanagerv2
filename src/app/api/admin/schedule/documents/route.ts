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

/** GET /api/admin/schedule/documents — list all documents uploaded by this trainer */
export async function GET() {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('schedule_documents')
      .select('*, schedule_document_assignments(profile_id)')
      .eq('uploaded_by', trainer.userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ documents: data ?? [] })
  } catch (err) {
    console.error('GET /api/admin/schedule/documents:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** POST /api/admin/schedule/documents — upload PDF + assign to apprentices */
export async function POST(req: NextRequest) {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const formData    = await req.formData()
    const file        = formData.get('file') as File | null
    const title       = (formData.get('title') as string | null)?.trim()
    const assigneeIds = JSON.parse((formData.get('assigneeIds') as string) ?? '[]') as string[]

    if (!file)  return NextResponse.json({ error: 'Keine Datei übergeben.' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Titel erforderlich.' }, { status: 400 })
    if (file.type !== 'application/pdf')
      return NextResponse.json({ error: 'Nur PDF-Dateien erlaubt.' }, { status: 400 })
    if (file.size > 25 * 1024 * 1024)
      return NextResponse.json({ error: 'Datei zu groß (max. 25 MB).' }, { status: 400 })

    const admin   = createAdminClient()
    const docId   = crypto.randomUUID()
    const filePath = `${trainer.userId}/${docId}.pdf`

    /* upload to storage */
    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await admin.storage
      .from('schedule-documents')
      .upload(filePath, buffer, { contentType: 'application/pdf' })
    if (uploadErr) throw uploadErr

    /* create DB record */
    const { error: dbErr } = await admin.from('schedule_documents').insert({
      id:          docId,
      uploaded_by: trainer.userId,
      title,
      file_path:   filePath,
      file_name:   file.name,
      file_size:   file.size,
    })
    if (dbErr) {
      await admin.storage.from('schedule-documents').remove([filePath])
      throw dbErr
    }

    /* create assignments */
    if (assigneeIds.length > 0) {
      const { error: assignErr } = await admin
        .from('schedule_document_assignments')
        .insert(assigneeIds.map(profileId => ({ document_id: docId, profile_id: profileId })))
      if (assignErr) throw assignErr
    }

    return NextResponse.json({ success: true, docId })
  } catch (err) {
    console.error('POST /api/admin/schedule/documents:', err)
    return NextResponse.json({ error: 'Fehler beim Hochladen.' }, { status: 500 })
  }
}
