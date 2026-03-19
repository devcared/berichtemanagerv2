import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getCallerProfile(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile?.role) return null
  return { userId: user.id, role: profile.role as string }
}

export async function verifyAdmin(): Promise<{ userId: string; role: 'admin' } | null> {
  const caller = await getCallerProfile()
  if (!caller || caller.role !== 'admin') return null
  return { userId: caller.userId, role: 'admin' }
}

export async function verifyTrainerOrAdmin(): Promise<{ userId: string; role: 'trainer' | 'admin' } | null> {
  const caller = await getCallerProfile()
  if (!caller || (caller.role !== 'trainer' && caller.role !== 'admin')) return null
  return { userId: caller.userId, role: caller.role as 'trainer' | 'admin' }
}
