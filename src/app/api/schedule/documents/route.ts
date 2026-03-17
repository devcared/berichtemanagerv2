import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** GET /api/schedule/documents — returns signed-URL documents assigned to the current user */
export async function GET() {
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

    const admin = createAdminClient()

    /* fetch assignments */
    const { data: assignments } = await admin
      .from('schedule_document_assignments')
      .select('document_id')
      .eq('profile_id', user.id)

    if (!assignments?.length) return NextResponse.json({ documents: [] })

    const docIds = assignments.map(a => a.document_id)
    const { data: docs, error } = await admin
      .from('schedule_documents')
      .select('id, title, file_name, file_path, file_size, created_at')
      .in('id', docIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    /* generate signed URLs (1-hour expiry) */
    const documentsWithUrls = await Promise.all(
      (docs ?? []).map(async doc => {
        const { data } = await admin.storage
          .from('schedule-documents')
          .createSignedUrl(doc.file_path, 3600)
        return {
          id:        doc.id,
          title:     doc.title,
          fileName:  doc.file_name,
          fileSize:  doc.file_size,
          createdAt: doc.created_at,
          url:       data?.signedUrl ?? null,
        }
      })
    )

    return NextResponse.json({ documents: documentsWithUrls })
  } catch (err) {
    console.error('GET /api/schedule/documents:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
