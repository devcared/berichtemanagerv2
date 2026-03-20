import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verify-server'

/** PATCH /api/admin/companies/assign
 *
 * Assigning → sets pending_company_id/name (user must confirm).
 * Unassigning (companyId: null) → directly clears company_id and any pending fields.
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, companyId, companyName } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId fehlt.' }, { status: 400 })
    }

    const admin = createAdminClient()

    if (companyId === null || companyId === undefined) {
      // Direct unassign — no confirmation needed
      const { error } = await admin
        .from('profiles')
        .update({
          company_id: null,
          pending_company_id: null,
          pending_company_name: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (error) throw error
    } else {
      // Set as pending — user must confirm in the app
      const { error } = await admin
        .from('profiles')
        .update({
          pending_company_id: companyId,
          pending_company_name: companyName ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/companies/assign:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
