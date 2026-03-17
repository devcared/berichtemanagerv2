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

/** POST /api/admin/reset-password – Passwort-Reset-E-Mail senden */
export async function POST(req: NextRequest) {
  try {
    const isTrainer = await verifyTrainer()
    if (!isTrainer) {
      return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })
    }

    const { email } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback`,
      },
    })

    if (error) throw error

    return NextResponse.json({ success: true, message: `Passwort-Reset wurde an ${email} gesendet.` })
  } catch (err) {
    console.error('POST /api/admin/reset-password:', err)
    const msg = err instanceof Error ? err.message : 'Interner Fehler.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
