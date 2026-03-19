import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verify-server'

/** PATCH /api/admin/companies/assign – assign or unassign a company to a user */
export async function PATCH(req: NextRequest) {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, companyId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId fehlt.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('profiles')
      .update({
        company_id: companyId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/companies/assign:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
