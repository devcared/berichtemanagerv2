import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function verifyTrainer(): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'trainer'
}

/** POST /api/admin/invite – Nutzer per E-Mail einladen */
export async function POST(req: NextRequest) {
  try {
    const isTrainer = await verifyTrainer()
    if (!isTrainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const { email, role = 'apprentice' } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'E-Mail-Adresse fehlt.' }, { status: 400 })
    }
    if (!['apprentice', 'trainer'].includes(role)) {
      return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Prüfen ob Nutzer schon existiert
    const { data: { users } } = await admin.auth.admin.listUsers()
    const existing = users.find(u => u.email === email.trim())
    if (existing) {
      return NextResponse.json(
        { error: 'Ein Nutzer mit dieser E-Mail existiert bereits.' },
        { status: 409 }
      )
    }

    // Einladung versenden
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
      data: {
        invited_role: role,   // wird beim ersten Login in profiles übernommen
        needsSetup: true,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback`,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      message: `Einladung an ${email} wurde versendet.`,
    })
  } catch (err) {
    console.error('POST /api/admin/invite:', err)
    const msg = err instanceof Error ? err.message : 'Interner Fehler.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
