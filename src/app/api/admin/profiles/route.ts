import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Prüft ob der anfragende Nutzer ein Trainer ist */
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

/** GET /api/admin/profiles – alle Profile mit Report-Statistiken */
export async function GET() {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Alle Profile laden
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, first_name, last_name, occupation, company_name, role, created_at')
      .order('last_name', { ascending: true })

    if (profilesError) throw profilesError

    // Report-Statistiken pro Profil laden
    const { data: reports, error: reportsError } = await admin
      .from('weekly_reports')
      .select('profile_id, status, submitted_at')

    if (reportsError) throw reportsError

    // Auth-Nutzer für E-Mails laden
    const { data: { users: authUsers }, error: authError } = await admin.auth.admin.listUsers()
    if (authError) throw authError

    const emailMap = Object.fromEntries(
      authUsers.map(u => [u.id, u.email ?? ''])
    )

    // Stats zusammenführen
    const result = profiles.map(p => {
      const userReports = reports.filter(r => r.profile_id === p.id)
      const lastSubmission = userReports
        .filter(r => r.submitted_at)
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]

      return {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        occupation: p.occupation,
        companyName: p.company_name,
        role: p.role,
        email: emailMap[p.id] ?? '',
        createdAt: p.created_at,
        stats: {
          total: userReports.length,
          approved: userReports.filter(r => r.status === 'approved').length,
          submitted: userReports.filter(r => r.status === 'submitted' || r.status === 'in_review').length,
          needsRevision: userReports.filter(r => r.status === 'needs_revision').length,
          lastSubmissionAt: lastSubmission?.submitted_at ?? null,
        },
      }
    })

    return NextResponse.json({ profiles: result })
  } catch (err) {
    console.error('GET /api/admin/profiles:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** PATCH /api/admin/profiles – Rolle eines Nutzers ändern */
export async function PATCH(req: NextRequest) {
  try {
    const trainer = await verifyTrainer()
    if (!trainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const { userId, role } = await req.json()
    if (!userId || !['apprentice', 'trainer'].includes(role)) {
      return NextResponse.json({ error: 'Ungültige Parameter.' }, { status: 400 })
    }
    // Trainer darf sich nicht selbst degradieren
    if (userId === trainer.userId && role === 'apprentice') {
      return NextResponse.json({ error: 'Du kannst deine eigene Rolle nicht ändern.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/profiles:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
