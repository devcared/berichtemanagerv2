import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verify-server'

export async function GET() {
  try {
    const auth = await verifyAdmin()
    if (!auth) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const supabase = createAdminClient()

    const [
      { count: profileCount },
      { count: reportCount },
      { count: entryCount },
      { count: commentCount },
      { count: historyCount },
      { count: approvalCount },
      { count: templateCount },
      { count: scheduleDocCount },
      { data: { users: authUsers } },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('weekly_reports').select('*', { count: 'exact', head: true }),
      supabase.from('daily_entries').select('*', { count: 'exact', head: true }),
      supabase.from('report_comments').select('*', { count: 'exact', head: true }),
      supabase.from('report_status_history').select('*', { count: 'exact', head: true }),
      supabase.from('report_approvals').select('*', { count: 'exact', head: true }),
      supabase.from('activity_templates').select('*', { count: 'exact', head: true }),
      supabase.from('schedule_documents').select('*', { count: 'exact', head: true }),
      supabase.auth.admin.listUsers(),
    ])

    return NextResponse.json({
      tables: [
        { name: 'profiles', label: 'Nutzerprofile', count: profileCount ?? 0, description: 'Registrierte Ausbildungsprofile', category: 'auth' },
        { name: 'auth.users', label: 'Auth-Konten', count: authUsers?.length ?? 0, description: 'Supabase Auth Nutzerkonten', category: 'auth' },
        { name: 'weekly_reports', label: 'Wochenberichte', count: reportCount ?? 0, description: 'Alle eingereichten Wochenberichte', category: 'reports' },
        { name: 'daily_entries', label: 'Tageseinträge', count: entryCount ?? 0, description: 'Tägliche Tätigkeitseinträge', category: 'reports' },
        { name: 'report_comments', label: 'Kommentare', count: commentCount ?? 0, description: 'Kommentare auf Berichte', category: 'reports' },
        { name: 'report_status_history', label: 'Status-Verlauf', count: historyCount ?? 0, description: 'Audit-Log für Statusänderungen', category: 'reports' },
        { name: 'report_approvals', label: 'Freigaben', count: approvalCount ?? 0, description: 'Ausbilder-Freigaben', category: 'reports' },
        { name: 'activity_templates', label: 'Vorlagen', count: templateCount ?? 0, description: 'Aktivitätsvorlagen', category: 'reports' },
        { name: 'schedule_documents', label: 'Stundenplan-Docs', count: scheduleDocCount ?? 0, description: 'Hochgeladene PDF-Dokumente', category: 'schedule' },
      ],
    })
  } catch (err) {
    console.error('GET /api/admin/data:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
