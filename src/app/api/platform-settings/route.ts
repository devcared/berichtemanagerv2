import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verify-server'

/** GET /api/platform-settings – returns global branding (public) */
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'branding')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    const branding = data?.value ?? { name: 'AzubiHub', logoUrl: '', accentColor: '#4285f4' }
    return NextResponse.json({ branding })
  } catch (err) {
    console.error('GET /api/platform-settings:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

/** PATCH /api/platform-settings – upsert branding (admin only) */
export async function PATCH(req: NextRequest) {
  try {
    const admin_user = await verifyAdmin()
    if (!admin_user) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, logoUrl, accentColor } = body

    const branding = {
      name: typeof name === 'string' ? name.trim() : 'AzubiHub',
      logoUrl: typeof logoUrl === 'string' ? logoUrl.trim() : '',
      accentColor: typeof accentColor === 'string' ? accentColor : '#4285f4',
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('platform_settings')
      .upsert({ key: 'branding', value: branding, updated_at: new Date().toISOString() })

    if (error) throw error

    return NextResponse.json({ branding })
  } catch (err) {
    console.error('PATCH /api/platform-settings:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
