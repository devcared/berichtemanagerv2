import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: bucket } = await admin.storage.getBucket('schedule-documents')
  if (!bucket) {
    const { error } = await admin.storage.createBucket('schedule-documents', {
      public: false,
      fileSizeLimit: 26214400,
      allowedMimeTypes: ['application/pdf'],
    })
    if (error) throw new Error(`Bucket konnte nicht erstellt werden: ${error.message}`)
  }
}

/**
 * POST /api/schedule/documents/upload
 * Allows an apprentice to upload a PDF document for their trainer to see.
 * FormData: file (PDF), title (string), description? (string), category? (string)
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const formData    = await req.formData()
    const file        = formData.get('file')        as File | null
    const title       = (formData.get('title')       as string | null)?.trim()
    const description = (formData.get('description') as string | null)?.trim() || null
    const category    = (formData.get('category')    as string | null) ?? 'sonstiges'

    if (!file)  return NextResponse.json({ error: 'Keine Datei übergeben.' },   { status: 400 })
    if (!title) return NextResponse.json({ error: 'Titel erforderlich.' },      { status: 400 })
    if (file.type !== 'application/pdf')
      return NextResponse.json({ error: 'Nur PDF-Dateien erlaubt.' },           { status: 400 })
    if (file.size > 25 * 1024 * 1024)
      return NextResponse.json({ error: 'Datei zu groß (max. 25 MB).' },        { status: 400 })

    const admin = createAdminClient()
    await ensureBucket(admin)

    const docId    = crypto.randomUUID()
    const filePath = `apprentice/${user.id}/${docId}.pdf`

    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await admin.storage
      .from('schedule-documents')
      .upload(filePath, buffer, { contentType: 'application/pdf' })
    if (uploadErr) throw new Error(`Speicherfehler: ${uploadErr.message}`)

    const { error: dbErr } = await admin.from('schedule_documents').insert({
      id:          docId,
      uploaded_by: user.id,
      title,
      description,
      category,
      status:      'published',
      file_path:   filePath,
      file_name:   file.name,
      file_size:   file.size,
    })
    if (dbErr) {
      await admin.storage.from('schedule-documents').remove([filePath])
      throw new Error(`Datenbankfehler: ${dbErr.message}`)
    }

    return NextResponse.json({ success: true, docId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('POST /api/schedule/documents/upload:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
