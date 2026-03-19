import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTrainerOrAdmin } from '@/lib/auth/verify-server'
import { startOfWeek, subWeeks, format } from 'date-fns'
import { de } from 'date-fns/locale'

export async function GET() {
  try {
    const auth = await verifyTrainerOrAdmin()
    if (!auth) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

    const supabase = createAdminClient()

    const [
      { data: profiles },
      { data: reports },
      { data: statusHistory },
      { data: { users: authUsers } },
    ] = await Promise.all([
      supabase.from('profiles').select('id, role, created_at'),
      supabase.from('weekly_reports').select('id, status, submitted_at, created_at, profile_id, calendar_week, year'),
      supabase.from('report_status_history').select('id, new_status, changed_at, changed_by'),
      supabase.auth.admin.listUsers(),
    ])

    // Role distribution
    const roleCount = { apprentice: 0, trainer: 0, admin: 0 }
    for (const p of profiles ?? []) {
      const r = p.role as keyof typeof roleCount
      if (r in roleCount) roleCount[r]++
    }

    // Status distribution
    const statusCount: Record<string, number> = {}
    for (const r of reports ?? []) {
      statusCount[r.status] = (statusCount[r.status] ?? 0) + 1
    }

    // Last 8 weeks submission trend
    const now = new Date()
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 })
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      return {
        label: format(weekStart, "'KW'w", { locale: de }),
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        count: 0,
      }
    })
    for (const r of reports ?? []) {
      if (!r.submitted_at) continue
      const submittedDate = new Date(r.submitted_at)
      for (const week of weeks) {
        if (submittedDate >= new Date(week.start) && submittedDate < new Date(week.end)) {
          week.count++
          break
        }
      }
    }

    // Most active users (by report count)
    const userReportCounts: Record<string, number> = {}
    for (const r of reports ?? []) {
      userReportCounts[r.profile_id] = (userReportCounts[r.profile_id] ?? 0) + 1
    }
    const topUsers = Object.entries(userReportCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => {
        return { id, count }
      })

    // Monthly new users (last 6 months)
    const monthlyUsers = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const month = d.toISOString().slice(0, 7) // YYYY-MM
      return {
        label: format(d, 'MMM', { locale: de }),
        month,
        count: profiles?.filter(p => p.created_at?.startsWith(month)).length ?? 0,
      }
    })

    // Auth users count (total registered accounts)
    const totalAuthUsers = authUsers?.length ?? 0

    // Approval rate
    const totalSubmitted = (reports ?? []).filter(r => r.status !== 'draft').length
    const totalApproved = (reports ?? []).filter(r => r.status === 'approved').length
    const approvalRate = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0

    // This week submissions
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const thisWeekSubmissions = (reports ?? []).filter(r => {
      if (!r.submitted_at) return false
      return new Date(r.submitted_at) >= thisWeekStart
    }).length

    return NextResponse.json({
      roles: roleCount,
      reports: {
        total: reports?.length ?? 0,
        byStatus: statusCount,
      },
      weeklyTrend: weeks,
      monthlyUsers,
      topUsers,
      totalAuthUsers,
      totalProfiles: profiles?.length ?? 0,
      approvalRate,
      thisWeekSubmissions,
    })
  } catch (err) {
    console.error('GET /api/admin/analytics:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
