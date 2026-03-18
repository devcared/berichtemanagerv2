import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * POST /api/schedule/documents/[id]/read
 * Marks a document as read for the current user (upsert).
 * Only succeeds if the document is actually assigned to the user.
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params
    const admin  = createAdminClient()

    /* verify the document is assigned to this user */
    const { data: assignment } = await admin
      .from('schedule_document_assignments')
      .select('document_id')
      .eq('document_id', id)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!assignment) return NextResponse.json({ error: 'Nicht zugewiesen.' }, { status: 403 })

    /* upsert — if already read, just update the timestamp */
    const { error } = await admin
      .from('schedule_document_reads')
      .upsert(
        { document_id: id, profile_id: user.id, read_at: new Date().toISOString() },
        { onConflict: 'document_id,profile_id' }
      )

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('POST /api/schedule/documents/[id]/read:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
