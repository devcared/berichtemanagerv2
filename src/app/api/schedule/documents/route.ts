import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/schedule/documents
 * Returns published, non-expired documents assigned to the current user.
 * Includes signed URLs (1h), isRead flag, description, category, expiresAt.
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
    const now   = new Date().toISOString()

    /* assignments for this user */
    const { data: assignments } = await admin
      .from('schedule_document_assignments')
      .select('document_id')
      .eq('profile_id', user.id)

    if (!assignments?.length) return NextResponse.json({ documents: [] })

    const docIds = assignments.map(a => a.document_id)

    /* fetch docs — filter draft + expired */
    const { data: docs, error } = await admin
      .from('schedule_documents')
      .select('id, title, description, category, file_name, file_path, file_size, created_at, expires_at')
      .in('id', docIds)
      .eq('status', 'published')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    /* which docs has this user already read? */
    const { data: reads } = await admin
      .from('schedule_document_reads')
      .select('document_id')
      .eq('profile_id', user.id)
      .in('document_id', docIds)

    const readSet = new Set((reads ?? []).map(r => r.document_id))

    /* generate signed URLs (1-hour expiry) */
    const documentsWithUrls = await Promise.all(
      (docs ?? []).map(async doc => {
        const { data } = await admin.storage
          .from('schedule-documents')
          .createSignedUrl(doc.file_path, 3600)
        return {
          id:          doc.id,
          title:       doc.title,
          description: doc.description ?? null,
          category:    doc.category    ?? 'allgemein',
          fileName:    doc.file_name,
          fileSize:    doc.file_size,
          createdAt:   doc.created_at,
          expiresAt:   doc.expires_at  ?? null,
          isRead:      readSet.has(doc.id),
          url:         data?.signedUrl ?? null,
        }
      })
    )

    return NextResponse.json({ documents: documentsWithUrls })
  } catch (err) {
    console.error('GET /api/schedule/documents:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
