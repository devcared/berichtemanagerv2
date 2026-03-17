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

/** DELETE /api/admin/schedule/documents/[id] */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { id } = await context.params
    const admin  = createAdminClient()

    const { data: doc } = await admin
      .from('schedule_documents')
      .select('file_path, uploaded_by')
      .eq('id', id)
      .single()

    if (!doc || doc.uploaded_by !== trainer.userId)
      return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

    /* remove from storage (ignore error if already missing) */
    await admin.storage.from('schedule-documents').remove([doc.file_path])

    /* cascade deletes assignments via FK */
    const { error } = await admin.from('schedule_documents').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/schedule/documents/[id]:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
