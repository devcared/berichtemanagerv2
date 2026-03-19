import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getCallerProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('id, role, company_id').eq('id', user.id).single()
  return profile ?? null
}

/** GET /api/company/trainers – assignments + all profiles in company */
export async function GET() {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const admin = createAdminClient()

    // All assignments in this company
    const { data: assignments, error: aErr } = await admin
      .from('apprentice_trainers')
      .select('*, trainer:profiles!trainer_id(id,first_name,last_name), apprentice:profiles!apprentice_id(id,first_name,last_name)')
      .eq('company_id', caller.company_id)

    if (aErr) throw aErr

    // All profiles in this company
    const { data: members, error: mErr } = await admin
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('company_id', caller.company_id)

    if (mErr) throw mErr

    const mapped = (assignments ?? []).map((a: Record<string, unknown>) => {
      const tr = a.trainer as { first_name: string; last_name: string } | null
      const ap = a.apprentice as { first_name: string; last_name: string } | null
      return {
        apprenticeId: a.apprentice_id, trainerId: a.trainer_id, companyId: a.company_id,
        assignedBy: a.assigned_by, assignedAt: a.assigned_at,
        trainerName: tr ? `${tr.first_name} ${tr.last_name}` : '',
        apprenticeName: ap ? `${ap.first_name} ${ap.last_name}` : '',
      }
    })

    return NextResponse.json({ assignments: mapped, members: members ?? [] })
  } catch (err) {
    console.error('GET /api/company/trainers:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** POST /api/company/trainers – assign trainer to apprentice */
export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { apprenticeId, trainerId } = await req.json()
    if (!apprenticeId || !trainerId)
      return NextResponse.json({ error: 'apprenticeId und trainerId erforderlich.' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('apprentice_trainers')
      .upsert({
        apprentice_id: apprenticeId, trainer_id: trainerId,
        company_id: caller.company_id, assigned_by: caller.id,
      })

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/company/trainers:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** DELETE /api/company/trainers – remove assignment */
export async function DELETE(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { apprenticeId, trainerId } = await req.json()
    if (!apprenticeId || !trainerId)
      return NextResponse.json({ error: 'apprenticeId und trainerId erforderlich.' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('apprentice_trainers')
      .delete()
      .eq('apprentice_id', apprenticeId)
      .eq('trainer_id', trainerId)
      .eq('company_id', caller.company_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/company/trainers:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
