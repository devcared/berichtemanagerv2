import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getCallerProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('id, first_name, last_name, role, company_id').eq('id', user.id).single()
  return profile ?? null
}

/** GET /api/company/chat – last 100 messages */
export async function GET() {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('chat_messages')
      .select('*, sender:profiles!sender_id(id, first_name, last_name)')
      .eq('company_id', caller.company_id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error

    const messages = (data ?? []).map((m: Record<string, unknown>) => {
      const s = m.sender as { id: string; first_name: string; last_name: string } | null
      const fn = s?.first_name ?? ''
      const ln = s?.last_name ?? ''
      return {
        id: m.id, companyId: m.company_id, senderId: m.sender_id,
        senderName: `${fn} ${ln}`.trim() || 'Unbekannt',
        senderInitials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??',
        content: m.content, createdAt: m.created_at,
      }
    })

    return NextResponse.json({ messages })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('GET /api/company/chat:', msg)
    return NextResponse.json({ error: 'Interner Fehler.', detail: msg }, { status: 500 })
  }
}

/** POST /api/company/chat – send a message */
export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerProfile()
    if (!caller?.company_id) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const { content } = await req.json()
    if (!content || typeof content !== 'string' || content.trim().length === 0)
      return NextResponse.json({ error: 'Nachricht darf nicht leer sein.' }, { status: 400 })
    if (content.length > 2000)
      return NextResponse.json({ error: 'Nachricht zu lang (max. 2000 Zeichen).' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('chat_messages')
      .insert({ company_id: caller.company_id, sender_id: caller.id, content: content.trim() })
      .select().single()

    if (error) throw error

    const fn = caller.first_name ?? ''
    const ln = caller.last_name ?? ''
    return NextResponse.json({
      message: {
        id: data.id, companyId: data.company_id, senderId: data.sender_id,
        senderName: `${fn} ${ln}`.trim(),
        senderInitials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase(),
        content: data.content, createdAt: data.created_at,
      }
    }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('POST /api/company/chat:', msg)
    return NextResponse.json({ error: 'Interner Fehler.', detail: msg }, { status: 500 })
  }
}
