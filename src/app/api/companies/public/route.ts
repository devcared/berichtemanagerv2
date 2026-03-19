import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** GET /api/companies/public – returns all companies (name + id only) for setup page */
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('companies')
      .select('id, name, logo_url, accent_color')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ companies: data ?? [] })
  } catch (err) {
    console.error('GET /api/companies/public:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
