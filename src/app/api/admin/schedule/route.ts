import { NextResponse } from 'next/server'
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
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'trainer') return null
  return { userId: user.id }
}

/** GET /api/admin/schedule
 *  Returns all apprentice profiles + all their schedule blocks.
 */
export async function GET() {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const admin = createAdminClient()

    const [{ data: profiles, error: pErr }, { data: blocks, error: bErr }] = await Promise.all([
      admin
        .from('profiles')
        .select('id, first_name, last_name, occupation, company_name')
        .eq('role', 'apprentice')
        .order('last_name'),
      admin
        .from('schedule_blocks')
        .select('*')
        .order('start_time'),
    ])

    if (pErr) throw pErr
    if (bErr) throw bErr

    return NextResponse.json({ profiles: profiles ?? [], blocks: blocks ?? [] })
  } catch (err) {
    console.error('GET /api/admin/schedule:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
