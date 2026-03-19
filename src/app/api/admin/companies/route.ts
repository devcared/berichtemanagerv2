import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verify-server'

/** GET /api/admin/companies – returns all companies with user counts */
export async function GET() {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Fetch all companies
    const { data: companies, error: companiesError } = await admin
      .from('companies')
      .select('id, name, logo_url, accent_color, website, created_at, updated_at')
      .order('name', { ascending: true })

    if (companiesError) throw companiesError

    // Fetch user counts per company
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('company_id')
      .not('company_id', 'is', null)

    if (profilesError) throw profilesError

    // Build count map
    const countMap: Record<string, number> = {}
    for (const p of profiles ?? []) {
      if (p.company_id) {
        countMap[p.company_id] = (countMap[p.company_id] ?? 0) + 1
      }
    }

    const result = (companies ?? []).map(c => ({
      id: c.id,
      name: c.name,
      logo_url: c.logo_url,
      accent_color: c.accent_color,
      website: c.website,
      user_count: countMap[c.id] ?? 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))

    return NextResponse.json({ companies: result })
  } catch (err) {
    console.error('GET /api/admin/companies:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** POST /api/admin/companies – create a new company */
export async function POST(req: NextRequest) {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, logoUrl, accentColor, website } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name ist erforderlich.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('companies')
      .insert({
        name: name.trim(),
        logo_url: logoUrl || null,
        accent_color: accentColor || '#4285f4',
        website: website || null,
      })
      .select('id, name, logo_url, accent_color, website, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ company: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/companies:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** PATCH /api/admin/companies – update a company */
export async function PATCH(req: NextRequest) {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, logoUrl, accentColor, website } = body

    if (!id) {
      return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    }
    if (name !== undefined) updates.name = String(name).trim()
    if (logoUrl !== undefined) updates.logo_url = logoUrl || null
    if (accentColor !== undefined) updates.accent_color = accentColor
    if (website !== undefined) updates.website = website || null

    const { data, error } = await admin
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select('id, name, logo_url, accent_color, website, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ company: data })
  } catch (err) {
    console.error('PATCH /api/admin/companies:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** DELETE /api/admin/companies – delete a company */
export async function DELETE(req: NextRequest) {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/companies:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
