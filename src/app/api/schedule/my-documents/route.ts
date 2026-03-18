import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/schedule/my-documents
 * Returns documents the current apprentice has uploaded themselves.
 * Includes signed URLs (1h) for the trainer to view.
 */
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

    const { data: docs, error } = await admin
      .from('schedule_documents')
      .select('id, title, description, category, file_name, file_path, file_size, created_at')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    /* filter out trainer-uploaded docs (path starts with trainer UUID, not "apprentice/") */
    const myDocs = (docs ?? []).filter(d =>
      (d.file_path as string).startsWith('apprentice/')
    )

    const withUrls = await Promise.all(
      myDocs.map(async doc => {
        const { data } = await admin.storage
          .from('schedule-documents')
          .createSignedUrl(doc.file_path as string, 3600)
        return {
          id:          doc.id,
          title:       doc.title,
          description: doc.description ?? null,
          category:    doc.category    ?? 'sonstiges',
          fileName:    doc.file_name,
          fileSize:    doc.file_size,
          createdAt:   doc.created_at,
          url:         data?.signedUrl ?? null,
        }
      })
    )

    return NextResponse.json({ documents: withUrls })
  } catch (err) {
    console.error('GET /api/schedule/my-documents:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
