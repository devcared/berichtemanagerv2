'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { MailSend01Icon, MessageMultiple01Icon } from '@hugeicons/core-free-icons'

// Cache sender names so we don't re-fetch on every message
const senderCache = new Map<string, { name: string; initials: string }>()

export default function ChatPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatReady, setChatReady] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fetchedRef = useRef(false)
  const profileRef = useRef(profile)
  useEffect(() => { profileRef.current = profile }, [profile])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // ── Load history + subscribe to realtime ──────────────────
  useEffect(() => {
    if (profileLoading || !profile?.companyId || !profile?.id) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    const supabase = createClient()
    const companyId = profile.companyId

    // Pre-populate own sender info in cache
    const ownFn = profile.firstName ?? ''
    const ownLn = profile.lastName ?? ''
    senderCache.set(profile.id, {
      name: `${ownFn} ${ownLn}`.trim() || 'Ich',
      initials: `${ownFn[0] ?? ''}${ownLn[0] ?? ''}`.toUpperCase() || '??',
    })

    // ── 1. Fetch history directly from Supabase ────────────
    supabase
      .from('chat_messages')
      .select('id, company_id, sender_id, content, created_at, sender:profiles!sender_id(first_name, last_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (error) { console.error('chat history:', error.message); setChatReady(true); return }

        const msgs: ChatMessage[] = (data ?? []).map((row: Record<string, unknown>) => {
          const s = row.sender as { first_name?: string; last_name?: string } | null
          const fn = s?.first_name ?? ''
          const ln = s?.last_name ?? ''
          const senderId = row.sender_id as string
          const info = { name: `${fn} ${ln}`.trim() || 'Unbekannt', initials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??' }
          senderCache.set(senderId, info)
          return {
            id: row.id as string,
            companyId: row.company_id as string,
            senderId,
            senderName: info.name,
            senderInitials: info.initials,
            content: row.content as string,
            createdAt: row.created_at as string,
          }
        })

        setMessages(msgs)
        setChatReady(true)
      })

    // ── 2. Realtime subscription ───────────────────────────
    const channel = supabase
      .channel(`chat-${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `company_id=eq.${companyId}` },
        async (payload) => {
          const raw = payload.new as {
            id: string; company_id: string; sender_id: string; content: string; created_at: string
          }

          // Get sender info from cache or fetch
          let info = senderCache.get(raw.sender_id)
          if (!info) {
            const { data } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', raw.sender_id)
              .single()
            const fn = data?.first_name ?? ''
            const ln = data?.last_name ?? ''
            info = { name: `${fn} ${ln}`.trim() || 'Unbekannt', initials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??' }
            senderCache.set(raw.sender_id, info)
          }

          const msg: ChatMessage = {
            id: raw.id, companyId: raw.company_id, senderId: raw.sender_id,
            senderName: info.name, senderInitials: info.initials,
            content: raw.content, createdAt: raw.created_at,
          }

          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profileLoading, profile?.companyId, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (chatReady) scrollToBottom() }, [messages, chatReady, scrollToBottom])

  // ── Send message directly via Supabase ────────────────────
  async function sendMessage() {
    const content = input.trim()
    if (!content || sending || !profile?.companyId || !profile?.id) return
    setSending(true)
    setInput('')

    const supabase = createClient()
    const { error } = await supabase
      .from('chat_messages')
      .insert({ company_id: profile.companyId, sender_id: profile.id, content })

    if (error) {
      console.error('send message:', error.message)
      setInput(content) // restore on failure
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (!profileLoading && !profile?.companyId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <HugeiconsIcon icon={MessageMultiple01Icon} size={40} className="text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Du bist keinem Unternehmen zugeordnet.</p>
    </div>
  )

  // ── Group messages by date ─────────────────────────────────
  const grouped: { date: string; msgs: ChatMessage[] }[] = []
  for (const msg of messages) {
    const d = msg.createdAt.slice(0, 10)
    const last = grouped[grouped.length - 1]
    if (last?.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={MessageMultiple01Icon} size={18} style={{ color: primary }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Firmen-Chat</h1>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>{branding.name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
        {!chatReady ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            <HugeiconsIcon icon={MessageMultiple01Icon} size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Noch keine Nachrichten. Starte die Unterhaltung!</p>
          </div>
        ) : grouped.map(group => (
          <div key={group.date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                {format(new Date(group.date + 'T12:00:00'), 'EEEE, d. MMMM', { locale: de })}
              </span>
              <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
            </div>

            {group.msgs.map((msg, i) => {
              const isOwn = msg.senderId === profile?.id
              const showSender = !isOwn && group.msgs[i - 1]?.senderId !== msg.senderId
              const time = format(new Date(msg.createdAt), 'HH:mm')

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 }}>
                  {!isOwn && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: primary, color: 'white', fontWeight: 700,
                      fontSize: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: showSender ? 1 : 0,
                    }}>
                      {msg.senderInitials}
                    </div>
                  )}
                  <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    {showSender && (
                      <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginBottom: 2, paddingLeft: 4 }}>
                        {msg.senderName}
                      </span>
                    )}
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOwn ? primary : 'hsl(var(--muted))',
                      color: isOwn ? 'white' : 'hsl(var(--foreground))',
                      fontSize: '0.875rem', lineHeight: 1.5,
                      wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                      {time}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: 720, margin: '0 auto' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben… (Enter zum Senden)"
            rows={1}
            style={{
              flex: 1, resize: 'none', borderRadius: 20,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              padding: '10px 16px', fontSize: '0.875rem',
              fontFamily: 'inherit', outline: 'none',
              maxHeight: 120, overflowY: 'auto', lineHeight: 1.5,
            }}
            maxLength={2000}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: input.trim() ? primary : 'hsl(var(--muted))',
              color: input.trim() ? 'white' : 'hsl(var(--muted-foreground))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 200ms, color 200ms', flexShrink: 0,
            }}
          >
            <HugeiconsIcon icon={MailSend01Icon} size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
