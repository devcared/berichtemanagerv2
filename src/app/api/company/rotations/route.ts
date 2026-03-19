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

/** GET /api/company/rotations – returns rotations for the caller's company */
export async function GET() {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id) return NextResponse.json({ error: 'Nicht angemeldet oder kein Unternehmen.' }, { status: 401 })

    const admin = createAdminClient()
    let query = admin
      .from('department_rotations')
      .select('*, apprentice:profiles!apprentice_id(id, first_name, last_name)')
      .eq('company_id', caller.company_id)
      .order('start_date', { ascending: true })

    if (caller.role === 'apprentice') {
      query = query.eq('apprentice_id', caller.id)
    }

    const { data, error } = await query
    if (error) throw error

    const rotations = (data ?? []).map((r: Record<string, unknown>) => {
      const ap = r.apprentice as { first_name: string; last_name: string } | null
      return {
        id: r.id, companyId: r.company_id, apprenticeId: r.apprentice_id,
        apprenticeName: ap ? `${ap.first_name} ${ap.last_name}` : '',
        department: r.department, startDate: r.start_date, endDate: r.end_date,
        notes: r.notes, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
      }
    })

    return NextResponse.json({ rotations })
  } catch (err) {
    console.error('GET /api/company/rotations:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** POST /api/company/rotations – create rotation (trainer/admin only) */
export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { apprenticeId, department, startDate, endDate, notes } = await req.json()
    if (!apprenticeId || !department || !startDate)
      return NextResponse.json({ error: 'apprenticeId, department und startDate erforderlich.' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('department_rotations')
      .insert({
        company_id: caller.company_id,
        apprentice_id: apprenticeId,
        department: department.trim(),
        start_date: startDate,
        end_date: endDate || null,
        notes: notes?.trim() || null,
        created_by: caller.id,
      })
      .select().single()

    if (error) throw error
    return NextResponse.json({ rotation: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/company/rotations:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** PATCH /api/company/rotations – update rotation */
export async function PATCH(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { id, department, startDate, endDate, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })

    const admin = createAdminClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (department !== undefined) updates.department = department.trim()
    if (startDate !== undefined) updates.start_date = startDate
    if (endDate !== undefined) updates.end_date = endDate || null
    if (notes !== undefined) updates.notes = notes?.trim() || null

    const { data, error } = await admin
      .from('department_rotations')
      .update(updates)
      .eq('id', id)
      .eq('company_id', caller.company_id)
      .select().single()

    if (error) throw error
    return NextResponse.json({ rotation: data })
  } catch (err) {
    console.error('PATCH /api/company/rotations:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** DELETE /api/company/rotations – delete rotation */
export async function DELETE(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('department_rotations')
      .delete()
      .eq('id', id)
      .eq('company_id', caller.company_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/company/rotations:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
