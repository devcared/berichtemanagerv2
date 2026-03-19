import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/** POST /api/companies/verify – verify join code and link user to company */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user (read-only cookies, same pattern as verify-server.ts)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
    }

    const { companyId, joinCode } = await req.json()
    if (!companyId || !joinCode) {
      return NextResponse.json({ error: 'companyId und joinCode erforderlich.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify the join code matches the company
    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id, join_code')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden.' }, { status: 404 })
    }

    if (!company.join_code || company.join_code.trim().toUpperCase() !== joinCode.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Ungültiger Unternehmens-Code.' }, { status: 400 })
    }

    // Update user profile with company_id
    const { error: updateError } = await admin
      .from('profiles')
      .update({ company_id: companyId, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, companyId })
  } catch (err) {
    console.error('POST /api/companies/verify:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
