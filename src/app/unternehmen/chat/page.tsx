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

export default function ChatPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatReady, setChatReady] = useState(false)   // true after first history load
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Stable refs — prevent effects from re-running on profile re-renders
  const fetchedRef = useRef(false)
  const companyIdRef = useRef<string | null>(null)
  const profileRef = useRef(profile)
  useEffect(() => { profileRef.current = profile }, [profile])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // ── Load history ONCE when companyId is known ──────────────
  useEffect(() => {
    if (profileLoading || !profile?.companyId) return
    if (fetchedRef.current) return          // already loaded — don't overwrite realtime messages
    if (companyIdRef.current === profile.companyId) return  // same company, skip

    companyIdRef.current = profile.companyId
    fetchedRef.current = true

    fetch('/api/company/chat')
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(json => {
        setMessages(json.messages ?? [])
        setChatReady(true)
      })
      .catch(() => setChatReady(true))
  }, [profileLoading, profile?.companyId])

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    if (!profile?.companyId) return
    const companyId = profile.companyId
    const supabase = createClient()

    const channel = supabase
      .channel(`chat-${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `company_id=eq.${companyId}` },
        async (payload) => {
          const raw = payload.new as {
            id: string; company_id: string; sender_id: string; content: string; created_at: string
          }

          // Skip dedup check will be done below in setState
          let fn = '', ln = ''
          if (raw.sender_id === profileRef.current?.id) {
            // Own message — use profile we already have
            fn = profileRef.current?.firstName ?? ''
            ln = profileRef.current?.lastName ?? ''
          } else {
            // Other sender — fetch name
            const { data } = await supabase
              .from('profiles').select('first_name, last_name').eq('id', raw.sender_id).single()
            fn = data?.first_name ?? ''
            ln = data?.last_name ?? ''
          }

          const msg: ChatMessage = {
            id: raw.id,
            companyId: raw.company_id,
            senderId: raw.sender_id,
            senderName: `${fn} ${ln}`.trim() || 'Unbekannt',
            senderInitials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??',
            content: raw.content,
            createdAt: raw.created_at,
          }

          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.companyId]) // only re-subscribe if company changes

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatReady) scrollToBottom()
  }, [messages, chatReady, scrollToBottom])

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    try {
      await fetch('/api/company/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      // Realtime will deliver the message — no need to manually add it
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Only block render if we have NO companyId at all ──────
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
            {/* Date divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                {format(new Date(group.date + 'T12:00:00'), 'EEEE, d. MMMM', { locale: de })}
              </span>
              <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
            </div>

            {group.msgs.map((msg, i) => {
              const isOwn = msg.senderId === profile?.id
              const prevMsg = group.msgs[i - 1]
              const showSender = !isOwn && prevMsg?.senderId !== msg.senderId
              const time = format(new Date(msg.createdAt), 'HH:mm')

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 }}>
                  {/* Avatar */}
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
              maxHeight: 120, overflowY: 'auto',
              lineHeight: 1.5,
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
              transition: 'background 200ms, color 200ms',
              flexShrink: 0,
            }}
          >
            <HugeiconsIcon icon={MailSend01Icon} size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
