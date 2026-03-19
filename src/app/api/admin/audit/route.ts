import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verify-server'

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin()
  if (!auth) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const status = searchParams.get('status')

  const supabase = createAdminClient()

  let query = supabase
    .from('report_status_history')
    .select(`
      id, old_status, new_status, comment, changed_at, changed_by,
      profile:profiles!report_status_history_changed_by_fkey(first_name, last_name),
      report:weekly_reports(calendar_week, year, profile_id,
        apprentice:profiles!weekly_reports_profile_id_fkey(first_name, last_name)
      )
    `, { count: 'exact' })
    .order('changed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('new_status', status)

  const { data, error, count } = await query
  if (error) {
    console.error('GET /api/admin/audit:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data, total: count ?? 0 })
}
