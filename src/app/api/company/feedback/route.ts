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

export async function GET() {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const admin = createAdminClient()
    let query = admin
      .from('trainer_feedback')
      .select('*, trainer:profiles!trainer_id(id,first_name,last_name), apprentice:profiles!apprentice_id(id,first_name,last_name)')
      .eq('company_id', caller.company_id)
      .order('created_at', { ascending: false })

    if (caller.role === 'apprentice') {
      query = query.eq('apprentice_id', caller.id)
    }

    const { data, error } = await query
    if (error) throw error

    const feedback = (data ?? []).map((f: Record<string, unknown>) => {
      const tr = f.trainer as { first_name: string; last_name: string } | null
      const ap = f.apprentice as { first_name: string; last_name: string } | null
      return {
        id: f.id, companyId: f.company_id, trainerId: f.trainer_id,
        trainerName: tr ? `${tr.first_name} ${tr.last_name}` : '',
        apprenticeId: f.apprentice_id,
        apprenticeName: ap ? `${ap.first_name} ${ap.last_name}` : '',
        periodLabel: f.period_label,
        ratingPunctuality: f.rating_punctuality, ratingEffort: f.rating_effort,
        ratingExpertise: f.rating_expertise, ratingSocial: f.rating_social,
        comment: f.comment, createdAt: f.created_at, updatedAt: f.updated_at,
      }
    })

    return NextResponse.json({ feedback })
  } catch (err) {
    console.error('GET /api/company/feedback:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const body = await req.json()
    const { apprenticeId, periodLabel, ratingPunctuality, ratingEffort, ratingExpertise, ratingSocial, comment } = body

    if (!apprenticeId || !periodLabel)
      return NextResponse.json({ error: 'apprenticeId und periodLabel erforderlich.' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('trainer_feedback')
      .insert({
        company_id: caller.company_id, trainer_id: caller.id, apprentice_id: apprenticeId,
        period_label: periodLabel.trim(),
        rating_punctuality: ratingPunctuality || null,
        rating_effort: ratingEffort || null,
        rating_expertise: ratingExpertise || null,
        rating_social: ratingSocial || null,
        comment: comment?.trim() || null,
      })
      .select().single()

    if (error) throw error
    return NextResponse.json({ feedback: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/company/feedback:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { id, periodLabel, ratingPunctuality, ratingEffort, ratingExpertise, ratingSocial, comment } = await req.json()
    if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })

    const admin = createAdminClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (periodLabel !== undefined) updates.period_label = periodLabel.trim()
    if (ratingPunctuality !== undefined) updates.rating_punctuality = ratingPunctuality || null
    if (ratingEffort !== undefined) updates.rating_effort = ratingEffort || null
    if (ratingExpertise !== undefined) updates.rating_expertise = ratingExpertise || null
    if (ratingSocial !== undefined) updates.rating_social = ratingSocial || null
    if (comment !== undefined) updates.comment = comment?.trim() || null

    const { data, error } = await admin
      .from('trainer_feedback')
      .update(updates)
      .eq('id', id)
      .eq('trainer_id', caller.id)
      .select().single()

    if (error) throw error
    return NextResponse.json({ feedback: data })
  } catch (err) {
    console.error('PATCH /api/company/feedback:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id || caller.role === 'apprentice')
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('trainer_feedback')
      .delete()
      .eq('id', id)
      .eq('trainer_id', caller.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/company/feedback:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
