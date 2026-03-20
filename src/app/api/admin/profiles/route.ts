import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTrainerOrAdmin } from '@/lib/auth/verify-server'

/** GET /api/admin/profiles – alle Profile mit Report-Statistiken */
export async function GET() {
  try {
    const trainer = await verifyTrainerOrAdmin()
    if (!trainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Alle Profile laden (mit Fallback falls pending-Spalten noch nicht migriert)
    let profilesResult = await admin
      .from('profiles')
      .select('id, first_name, last_name, occupation, company_name, role, created_at, company_id, pending_company_id, pending_company_name')
      .order('last_name', { ascending: true })

    if (profilesResult.error) {
      // Spalten pending_company_id/pending_company_name existieren noch nicht → Fallback
      profilesResult = await admin
        .from('profiles')
        .select('id, first_name, last_name, occupation, company_name, role, created_at, company_id')
        .order('last_name', { ascending: true }) as typeof profilesResult
    }

    const { data: profiles, error: profilesError } = profilesResult
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
        companyId: (p as Record<string, unknown>).company_id ?? null,
        pendingCompanyId: (p as Record<string, unknown>).pending_company_id ?? null,
        pendingCompanyName: (p as Record<string, unknown>).pending_company_name ?? null,
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

/** PATCH /api/admin/profiles – Rolle oder Profilfelder eines Nutzers ändern */
export async function PATCH(req: NextRequest) {
  try {
    const trainer = await verifyTrainerOrAdmin()
    if (!trainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId } = body
    if (!userId) {
      return NextResponse.json({ error: 'userId fehlt.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Rollenänderung
    if (body.role !== undefined) {
      if (!['apprentice', 'trainer', 'admin'].includes(body.role)) {
        return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
      }
      if (userId === trainer.userId) {
        return NextResponse.json({ error: 'Du kannst deine eigene Rolle nicht ändern.' }, { status: 400 })
      }
      const { error } = await admin
        .from('profiles')
        .update({ role: body.role, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
    }

    // Profilfelder bearbeiten
    if (body.profileUpdate) {
      const { firstName, lastName, occupation, companyName } = body.profileUpdate
      const updates: Record<string, string> = { updated_at: new Date().toISOString() }
      if (firstName !== undefined) updates.first_name = firstName
      if (lastName !== undefined) updates.last_name = lastName
      if (occupation !== undefined) updates.occupation = occupation
      if (companyName !== undefined) updates.company_name = companyName

      const { error } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/profiles:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** DELETE /api/admin/profiles – Nutzer vollständig löschen */
export async function DELETE(req: NextRequest) {
  try {
    const trainer = await verifyTrainerOrAdmin()
    if (!trainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId fehlt.' }, { status: 400 })
    }
    if (userId === trainer.userId) {
      return NextResponse.json({ error: 'Du kannst dich selbst nicht löschen.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/profiles:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
