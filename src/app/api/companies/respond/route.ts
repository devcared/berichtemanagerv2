import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

/** POST /api/companies/respond – user accepts or rejects a pending company invitation */
export async function POST(req: NextRequest) {
  try {
    // Identify the calling user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
    }

    const { action } = await req.json() // 'accept' | 'reject'
    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'Ungültige Aktion.' }, { status: 400 })
    }

    const admin = createAdminClient()

    if (action === 'accept') {
      // Read the pending company id for this user
      const { data: profile } = await admin
        .from('profiles')
        .select('pending_company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.pending_company_id) {
        return NextResponse.json({ error: 'Keine ausstehende Einladung.' }, { status: 400 })
      }

      const { error } = await admin
        .from('profiles')
        .update({
          company_id: profile.pending_company_id,
          pending_company_id: null,
          pending_company_name: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
    } else {
      // Reject — just clear the pending fields
      const { error } = await admin
        .from('profiles')
        .update({
          pending_company_id: null,
          pending_company_name: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/companies/respond:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
