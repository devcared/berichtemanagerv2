'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { MailSend01Icon, MessageMultiple01Icon, Cancel01Icon, Image01Icon } from '@hugeicons/core-free-icons'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✅']

type RawReaction = { message_id: string; user_id: string; emoji: string }
type ReactionMap = Map<string, RawReaction[]>  // messageId -> reactions

const senderCache = new Map<string, { name: string; initials: string }>()

export default function ChatPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reactions, setReactions] = useState<ReactionMap>(new Map())
  const [chatReady, setChatReady] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pickerMsgId, setPickerMsgId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fetchedRef = useRef(false)
  const messagesRef = useRef<ChatMessage[]>([])
  const profileRef = useRef(profile)
  useEffect(() => { profileRef.current = profile }, [profile])
  useEffect(() => { messagesRef.current = messages }, [messages])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // ── Bootstrap: history + realtime ─────────────────────────
  useEffect(() => {
    if (profileLoading || !profile?.companyId || !profile?.id) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    const supabase = createClient()
    const companyId = profile.companyId

    // Seed own info in sender cache
    const fn0 = profile.firstName ?? '', ln0 = profile.lastName ?? ''
    senderCache.set(profile.id, {
      name: `${fn0} ${ln0}`.trim() || 'Ich',
      initials: `${fn0[0] ?? ''}${ln0[0] ?? ''}`.toUpperCase() || '??',
    })

    // ── Load history ─────────────────────────────────────────
    supabase
      .from('chat_messages')
      .select('id, company_id, sender_id, content, image_url, reply_to_id, created_at, sender:profiles!sender_id(first_name, last_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(async ({ data, error }) => {
        if (error) { console.error('chat load:', error.message); setChatReady(true); return }

        const contentMap = new Map<string, { content: string; senderName: string }>()
        const msgs: ChatMessage[] = []

        for (const row of (data ?? [])) {
          const s = row.sender as { first_name?: string; last_name?: string } | null
          const fn = s?.first_name ?? '', ln = s?.last_name ?? ''
          const info = { name: `${fn} ${ln}`.trim() || 'Unbekannt', initials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??' }
          senderCache.set(row.sender_id, info)
          contentMap.set(row.id, { content: row.content, senderName: info.name })
          msgs.push({
            id: row.id, companyId: row.company_id, senderId: row.sender_id,
            senderName: info.name, senderInitials: info.initials,
            content: row.content,
            imageUrl: (row as Record<string, unknown>).image_url as string | null ?? null,
            replyToId: (row as Record<string, unknown>).reply_to_id as string | null ?? null,
            createdAt: row.created_at,
          })
        }

        // Resolve reply previews
        for (const msg of msgs) {
          if (msg.replyToId) {
            const ref = contentMap.get(msg.replyToId)
            if (ref) { msg.replyToContent = ref.content; msg.replyToSenderName = ref.senderName }
          }
        }

        setMessages(msgs)

        // Load reactions separately (table may not exist yet if migration pending)
        const { data: rxnData, error: rxnErr } = await supabase
          .from('chat_reactions')
          .select('message_id, user_id, emoji')
          .in('message_id', msgs.map(m => m.id))

        if (!rxnErr && rxnData) {
          const rxnMap: ReactionMap = new Map()
          for (const r of rxnData as RawReaction[]) {
            const list = rxnMap.get(r.message_id) ?? []
            rxnMap.set(r.message_id, [...list, r])
          }
          setReactions(rxnMap)
        }

        setChatReady(true)
      })

    // ── Realtime: new messages ────────────────────────────────
    const msgCh = supabase
      .channel(`chat-msg-${companyId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `company_id=eq.${companyId}` },
        async (payload) => {
          const raw = payload.new as { id: string; company_id: string; sender_id: string; content: string; image_url: string | null; reply_to_id: string | null; created_at: string }

          let info = senderCache.get(raw.sender_id)
          if (!info) {
            const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', raw.sender_id).single()
            const fn = data?.first_name ?? '', ln = data?.last_name ?? ''
            info = { name: `${fn} ${ln}`.trim() || 'Unbekannt', initials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??' }
            senderCache.set(raw.sender_id, info)
          }

          const replyRef = raw.reply_to_id ? messagesRef.current.find(m => m.id === raw.reply_to_id) : null

          const msg: ChatMessage = {
            id: raw.id, companyId: raw.company_id, senderId: raw.sender_id,
            senderName: info.name, senderInitials: info.initials,
            content: raw.content, imageUrl: raw.image_url,
            replyToId: raw.reply_to_id,
            replyToContent: replyRef?.content ?? null,
            replyToSenderName: replyRef?.senderName ?? null,
            createdAt: raw.created_at,
          }

          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        }
      ).subscribe()

    // ── Realtime: reactions ───────────────────────────────────
    const rxnCh = supabase
      .channel(`chat-rxn-${companyId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reactions' },
        (payload) => {
          const r = payload.new as RawReaction
          setReactions(prev => {
            const next = new Map(prev)
            const list = next.get(r.message_id) ?? []
            if (list.some(x => x.user_id === r.user_id && x.emoji === r.emoji)) return prev
            next.set(r.message_id, [...list, r])
            return next
          })
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_reactions' },
        (payload) => {
          const r = payload.old as RawReaction
          setReactions(prev => {
            const next = new Map(prev)
            const list = next.get(r.message_id) ?? []
            next.set(r.message_id, list.filter(x => !(x.user_id === r.user_id && x.emoji === r.emoji)))
            return next
          })
        }
      ).subscribe()

    return () => { supabase.removeChannel(msgCh); supabase.removeChannel(rxnCh) }
  }, [profileLoading, profile?.companyId, profile?.id]) // eslint-disable-line

  useEffect(() => { if (chatReady) scrollToBottom() }, [messages, chatReady, scrollToBottom])

  // ── Image handling ─────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    if (fileRef.current) fileRef.current.value = ''
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null); setImagePreview(null)
  }

  function handlePaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
        break
      }
    }
  }

  // ── Send ───────────────────────────────────────────────────
  async function sendMessage() {
    const content = input.trim()
    if ((!content && !imageFile) || sending || !profile?.companyId || !profile?.id) return

    const capturedReply = replyTo
    const capturedFile = imageFile
    const capturedPreview = imagePreview
    setSending(true); setInput(''); setReplyTo(null); setImageFile(null); setImagePreview(null)

    let imageUrl: string | null = null
    if (capturedFile) {
      setUploading(true)
      const supabase = createClient()
      const ext = capturedFile.name.split('.').pop() ?? 'jpg'
      const path = `${profile.companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('chat-images').upload(path, capturedFile)
      if (!upErr) {
        const { data } = supabase.storage.from('chat-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      } else { console.error('upload:', upErr.message) }
      if (capturedPreview) URL.revokeObjectURL(capturedPreview)
      setUploading(false)
    }

    const supabase = createClient()
    const payload: Record<string, unknown> = {
      company_id: profile.companyId,
      sender_id: profile.id,
      content: content || '📷',
    }
    if (imageUrl !== null) payload.image_url = imageUrl
    if (capturedReply?.id) payload.reply_to_id = capturedReply.id

    const { data: inserted, error } = await supabase
      .from('chat_messages').insert(payload).select('id, created_at').single()

    if (error) {
      console.error('send:', error.message)
      setInput(content)
      setReplyTo(capturedReply)
      if (capturedFile) { setImageFile(capturedFile); setImagePreview(URL.createObjectURL(capturedFile)) }
    } else if (inserted) {
      // Add own message immediately — don't wait for Realtime (which may miss new columns)
      const fn = profile.firstName ?? '', ln = profile.lastName ?? ''
      const ownInfo = senderCache.get(profile.id) ?? {
        name: `${fn} ${ln}`.trim() || 'Ich',
        initials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??',
      }
      const newMsg: ChatMessage = {
        id: inserted.id,
        companyId: profile.companyId,
        senderId: profile.id,
        senderName: ownInfo.name,
        senderInitials: ownInfo.initials,
        content: content || '📷',
        imageUrl: imageUrl,
        replyToId: capturedReply?.id ?? null,
        replyToContent: capturedReply?.content ?? null,
        replyToSenderName: capturedReply?.senderName ?? null,
        createdAt: inserted.created_at,
      }
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
    }
    setSending(false)
    inputRef.current?.focus()
  }

  // ── Reactions ──────────────────────────────────────────────
  async function toggleReaction(messageId: string, emoji: string) {
    if (!profile?.id) return
    const supabase = createClient()
    const list = reactions.get(messageId) ?? []
    const mine = list.find(r => r.user_id === profile.id && r.emoji === emoji)
    if (mine) {
      await supabase.from('chat_reactions').delete()
        .eq('message_id', messageId).eq('user_id', profile.id).eq('emoji', emoji)
    } else {
      await supabase.from('chat_reactions').insert({ message_id: messageId, user_id: profile.id, emoji })
    }
    setPickerMsgId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    if (e.key === 'Escape') { setReplyTo(null); setPickerMsgId(null) }
  }

  if (!profileLoading && !profile?.companyId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <HugeiconsIcon icon={MessageMultiple01Icon} size={40} className="text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Du bist keinem Unternehmen zugeordnet.</p>
    </div>
  )

  // Group messages by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = []
  for (const msg of messages) {
    const d = msg.createdAt.slice(0, 10)
    const last = grouped[grouped.length - 1]
    if (last?.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: '"Google Sans","Roboto",sans-serif' }}
      onClick={() => setPickerMsgId(null)}
    >
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
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
              const showSender = !isOwn && group.msgs[i - 1]?.senderId !== msg.senderId
              const time = format(new Date(msg.createdAt), 'HH:mm')
              const msgRxns = reactions.get(msg.id) ?? []

              // Group: emoji -> { count, hasOwn }
              const rxnGroups = new Map<string, { count: number; hasOwn: boolean }>()
              for (const r of msgRxns) {
                const g = rxnGroups.get(r.emoji) ?? { count: 0, hasOwn: false }
                rxnGroups.set(r.emoji, { count: g.count + 1, hasOwn: g.hasOwn || r.user_id === profile?.id })
              }

              return (
                <div
                  key={msg.id}
                  style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginBottom: rxnGroups.size > 0 ? 22 : 3, position: 'relative' }}
                  onMouseEnter={() => setHoveredId(msg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: primary, color: 'white', fontWeight: 700, fontSize: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: showSender ? 1 : 0, marginBottom: rxnGroups.size > 0 ? 18 : 0 }}>
                      {msg.senderInitials}
                    </div>
                  )}

                  {/* Bubble column */}
                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    {showSender && <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginBottom: 2, paddingLeft: 4 }}>{msg.senderName}</span>}

                    {/* Bubble */}
                    <div
                      id={`msg-${msg.id}`}
                      style={{ padding: msg.imageUrl && !msg.replyToId && !msg.content.trim() ? 4 : '8px 12px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isOwn ? primary : 'hsl(var(--muted))', color: isOwn ? 'white' : 'hsl(var(--foreground))', fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflow: 'hidden' }}
                    >
                      {/* Reply quote — inside bubble */}
                      {msg.replyToId && (
                        <div
                          onClick={() => document.getElementById(`msg-${msg.replyToId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          style={{ display: 'flex', gap: 0, marginBottom: 7, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: isOwn ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)' }}
                        >
                          <div style={{ width: 3, flexShrink: 0, background: isOwn ? 'rgba(255,255,255,0.7)' : primary }} />
                          <div style={{ padding: '5px 9px', minWidth: 0 }}>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 700, marginBottom: 1, color: isOwn ? 'rgba(255,255,255,0.9)' : primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.replyToSenderName ?? '…'}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                              {msg.replyToContent ?? '📷 Bild'}
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.imageUrl} alt="Bild"
                          style={{ display: 'block', maxWidth: 260, maxHeight: 320, borderRadius: msg.content.trim() && msg.content !== '📷' ? '8px 8px 0 0' : 8, objectFit: 'cover', cursor: 'pointer', margin: msg.replyToId ? '0 -12px' : '-4px' }}
                          onClick={() => window.open(msg.imageUrl!, '_blank')}
                        />
                      )}
                      {msg.content.trim() && msg.content !== '📷' && (
                        <span style={{ display: 'block', paddingTop: msg.imageUrl ? 6 : 0 }}>{msg.content}</span>
                      )}
                    </div>

                    {/* Time */}
                    <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>{time}</span>

                    {/* Reactions */}
                    {rxnGroups.size > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {[...rxnGroups.entries()].map(([emoji, { count, hasOwn }]) => (
                          <button
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, border: `1px solid ${hasOwn ? primary : 'hsl(var(--border))'}`, background: hasOwn ? primary + '18' : 'hsl(var(--card))', cursor: 'pointer', fontSize: '0.8rem', color: hasOwn ? primary : 'hsl(var(--foreground))', fontWeight: hasOwn ? 600 : 400 }}
                          >
                            {emoji} <span style={{ fontSize: '0.7rem' }}>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action strip */}
                  <div style={{ visibility: hoveredId === msg.id || pickerMsgId === msg.id ? 'visible' : 'hidden', display: 'flex', flexDirection: 'column', gap: 3, alignSelf: 'flex-end', paddingBottom: rxnGroups.size > 0 ? 22 : 4, position: 'relative' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPickerMsgId(prev => prev === msg.id ? null : msg.id) }}
                      title="Reaktion"
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >😊</button>
                    <button
                      onClick={() => { setReplyTo(msg); inputRef.current?.focus() }}
                      title="Antworten"
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >↩</button>

                    {/* Emoji picker */}
                    {pickerMsgId === msg.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ position: 'absolute', [isOwn ? 'right' : 'left']: 34, bottom: rxnGroups.size > 0 ? 40 : 0, zIndex: 200, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 14, padding: '6px 8px', display: 'flex', gap: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
                      >
                        {EMOJIS.map(e => (
                          <button
                            key={e}
                            onClick={() => toggleReaction(msg.id, e)}
                            style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 8, transition: 'transform 100ms' }}
                            onMouseEnter={el => (el.currentTarget.style.transform = 'scale(1.3)')}
                            onMouseLeave={el => (el.currentTarget.style.transform = 'scale(1)')}
                          >{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={{ padding: '8px 1.25rem', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted)/0.4)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 3, height: 36, borderRadius: 2, background: primary, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: primary }}>{replyTo.senderName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.imageUrl && !replyTo.content.trim() ? '📷 Bild' : replyTo.content}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4 }}>
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div style={{ padding: '8px 1.25rem', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', display: 'flex', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Vorschau" style={{ height: 80, borderRadius: 10, objectFit: 'cover', border: '1px solid hsl(var(--border))' }} />
            <button
              onClick={clearImage}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ea4335', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={10} />
            </button>
          </div>
          {uploading && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Wird hochgeladen…</span>}
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: '0.75rem 1.25rem', borderTop: replyTo || imagePreview ? 'none' : '1px solid hsl(var(--border))', background: 'hsl(var(--card))', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: 720, margin: '0 auto' }}>
          {/* Image button */}
          <button
            onClick={() => fileRef.current?.click()}
            title="Bild senden"
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}
          >
            <HugeiconsIcon icon={Image01Icon} size={16} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Nachricht schreiben… (Enter zum Senden)"
            rows={1}
            style={{ flex: 1, resize: 'none', borderRadius: 20, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', padding: '10px 16px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', maxHeight: 120, overflowY: 'auto', lineHeight: 1.5 }}
            maxLength={2000}
          />

          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !imageFile) || sending || uploading}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: (input.trim() || imageFile) ? primary : 'hsl(var(--muted))', color: (input.trim() || imageFile) ? 'white' : 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (input.trim() || imageFile) ? 'pointer' : 'not-allowed', transition: 'background 200ms, color 200ms', flexShrink: 0 }}
          >
            {sending ? <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <HugeiconsIcon icon={MailSend01Icon} size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
