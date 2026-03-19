'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { MailSend01Icon, MessageMultiple01Icon, Cancel01Icon, Image01Icon, Delete01Icon, Copy01Icon } from '@hugeicons/core-free-icons'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✅']

type RawReaction = { message_id: string; user_id: string; emoji: string }
type ReactionMap = Map<string, RawReaction[]>
type Member = { id: string; firstName: string; lastName: string }

const senderCache = new Map<string, { name: string; initials: string }>()

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'
const elev2 = '0 1px 2px rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)'
const elev3 = '0 4px 12px rgba(60,64,67,.2), 0 2px 6px 2px rgba(60,64,67,.15)'

// Highlight @mentions in message text
function renderContent(content: string, primary: string) {
  const parts = content.split(/(@\S+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} style={{ color: primary, fontWeight: 600 }}>{part}</span>
      : part
  )
}

export default function ChatPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reactions, setReactions] = useState<ReactionMap>(new Map())
  const [chatReady, setChatReady] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pickerMsgId, setPickerMsgId] = useState<string | null>(null)

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{
    msg: ChatMessage; x: number; y: number; isOwn: boolean
  } | null>(null)
  const [ctxPickerOpen, setCtxPickerOpen] = useState(false)

  // @mention autocomplete
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [mentionAnchor, setMentionAnchor] = useState(0) // index of '@' in input string
  const [mentionIdx, setMentionIdx] = useState(0)

  // Long press (mobile context menu)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // ── Bootstrap ──────────────────────────────────────────────
  useEffect(() => {
    if (profileLoading || !profile?.companyId || !profile?.id) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    const supabase = createClient()
    const companyId = profile.companyId

    const fn0 = profile.firstName ?? '', ln0 = profile.lastName ?? ''
    senderCache.set(profile.id, {
      name: `${fn0} ${ln0}`.trim() || 'Ich',
      initials: `${fn0[0] ?? ''}${ln0[0] ?? ''}`.toUpperCase() || '??',
    })

    // Load members for @mentions
    fetch('/api/company/trainers')
      .then(r => r.ok ? r.json() : { members: [] })
      .then(json => {
        const list = (json.members ?? []).map((m: { id: string; first_name: string; last_name: string }) => ({
          id: m.id,
          firstName: m.first_name,
          lastName: m.last_name,
        }))
        setMembers(list)
      })
      .catch(() => {})

    // Load history
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
        for (const msg of msgs) {
          if (msg.replyToId) {
            const ref = contentMap.get(msg.replyToId)
            if (ref) { msg.replyToContent = ref.content; msg.replyToSenderName = ref.senderName }
          }
        }
        setMessages(msgs)

        const { data: rxnData, error: rxnErr } = await supabase
          .from('chat_reactions').select('message_id, user_id, emoji')
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

    // Realtime: INSERT messages
    const msgCh = supabase.channel(`chat-msg-${companyId}`)
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
      )
      // Realtime: DELETE messages
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const id = (payload.old as { id: string }).id
          setMessages(prev => prev.filter(m => m.id !== id))
        }
      ).subscribe()

    // Realtime: reactions
    const rxnCh = supabase.channel(`chat-rxn-${companyId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_reactions' }, (payload) => {
        const r = payload.new as RawReaction
        setReactions(prev => {
          const next = new Map(prev)
          const list = next.get(r.message_id) ?? []
          if (list.some(x => x.user_id === r.user_id && x.emoji === r.emoji)) return prev
          next.set(r.message_id, [...list, r])
          return next
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_reactions' }, (payload) => {
        const r = payload.old as RawReaction
        setReactions(prev => {
          const next = new Map(prev)
          const list = next.get(r.message_id) ?? []
          next.set(r.message_id, list.filter(x => !(x.user_id === r.user_id && x.emoji === r.emoji)))
          return next
        })
      }).subscribe()

    return () => { supabase.removeChannel(msgCh); supabase.removeChannel(rxnCh) }
  }, [profileLoading, profile?.companyId, profile?.id]) // eslint-disable-line

  useEffect(() => { if (chatReady) scrollToBottom() }, [messages, chatReady, scrollToBottom])

  // ── Image handling ─────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
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

  // ── @mention input handling ────────────────────────────────
  const filteredMembers = mentionSearch !== null
    ? members.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(mentionSearch.toLowerCase())).slice(0, 6)
    : []

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setInput(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@([^\s@]*)$/)
    if (match) {
      setMentionSearch(match[1])
      setMentionAnchor(cursor - match[0].length)
      setMentionIdx(0)
    } else {
      setMentionSearch(null)
    }
  }

  function selectMention(m: Member) {
    const tag = `@${m.firstName}`
    const cursor = inputRef.current?.selectionStart ?? input.length
    const before = input.slice(0, mentionAnchor)
    const after = input.slice(cursor)
    const newVal = before + tag + ' ' + after
    setInput(newVal)
    setMentionSearch(null)
    setTimeout(() => {
      const pos = before.length + tag.length + 1
      inputRef.current?.setSelectionRange(pos, pos)
      inputRef.current?.focus()
    }, 0)
  }

  // ── Send ───────────────────────────────────────────────────
  async function sendMessage() {
    const content = input.trim()
    if ((!content && !imageFile) || sending || !profile?.companyId || !profile?.id) return

    const capturedReply = replyTo
    const capturedFile = imageFile
    const capturedPreview = imagePreview
    setSending(true); setInput(''); setReplyTo(null); setImageFile(null); setImagePreview(null); setMentionSearch(null)

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
    const payload: Record<string, unknown> = { company_id: profile.companyId, sender_id: profile.id, content: content || '📷' }
    if (imageUrl !== null) payload.image_url = imageUrl
    if (capturedReply?.id) payload.reply_to_id = capturedReply.id

    const { data: inserted, error } = await supabase.from('chat_messages').insert(payload).select('id, created_at').single()

    if (error) {
      console.error('send:', error.message)
      setInput(content); setReplyTo(capturedReply)
      if (capturedFile) { setImageFile(capturedFile); setImagePreview(URL.createObjectURL(capturedFile)) }
    } else if (inserted) {
      const fn = profile.firstName ?? '', ln = profile.lastName ?? ''
      const ownInfo = senderCache.get(profile.id) ?? { name: `${fn} ${ln}`.trim() || 'Ich', initials: `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '??' }
      const newMsg: ChatMessage = {
        id: inserted.id, companyId: profile.companyId, senderId: profile.id,
        senderName: ownInfo.name, senderInitials: ownInfo.initials,
        content: content || '📷', imageUrl,
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

  // ── Delete message ─────────────────────────────────────────
  async function deleteMessage(messageId: string) {
    const supabase = createClient()
    await supabase.from('chat_messages').delete().eq('id', messageId).eq('sender_id', profile!.id)
    setMessages(prev => prev.filter(m => m.id !== messageId))
    setCtxMenu(null)
  }

  // ── Reactions ──────────────────────────────────────────────
  async function toggleReaction(messageId: string, emoji: string) {
    if (!profile?.id) return
    const supabase = createClient()
    const list = reactions.get(messageId) ?? []
    const mine = list.find(r => r.user_id === profile.id && r.emoji === emoji)
    if (mine) {
      await supabase.from('chat_reactions').delete().eq('message_id', messageId).eq('user_id', profile.id).eq('emoji', emoji)
    } else {
      await supabase.from('chat_reactions').insert({ message_id: messageId, user_id: profile.id, emoji })
    }
    setCtxMenu(null); setPickerMsgId(null); setCtxPickerOpen(false)
  }

  // ── Context menu ───────────────────────────────────────────
  function openCtxMenu(e: React.MouseEvent | React.TouchEvent, msg: ChatMessage, isOwn: boolean) {
    e.preventDefault(); e.stopPropagation()
    const x = 'clientX' in e ? e.clientX : (e as React.TouchEvent).touches[0]?.clientX ?? 0
    const y = 'clientY' in e ? e.clientY : (e as React.TouchEvent).touches[0]?.clientY ?? 0
    setCtxMenu({ msg, x, y, isOwn })
    setCtxPickerOpen(false)
    setPickerMsgId(null)
  }

  function startLongPress(msg: ChatMessage, isOwn: boolean) {
    pressTimer.current = setTimeout(() => {
      // triggered by touch end at position — we don't have position here so center of screen
      setCtxMenu({ msg, x: window.innerWidth / 2, y: window.innerHeight / 2, isOwn })
      setCtxPickerOpen(false)
    }, 500)
  }
  function cancelLongPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  // Clamp context menu to viewport
  const ctxX = ctxMenu ? Math.min(ctxMenu.x, window.innerWidth - 188) : 0
  const ctxY = ctxMenu ? (ctxMenu.y + 240 > window.innerHeight ? ctxMenu.y - 240 : ctxMenu.y + 8) : 0

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Navigate mention suggestions
    if (mentionSearch !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filteredMembers.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); selectMention(filteredMembers[mentionIdx]); return }
      if (e.key === 'Escape') { setMentionSearch(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    if (e.key === 'Escape') { setReplyTo(null); setPickerMsgId(null); setCtxMenu(null) }
  }

  const closeAll = () => { setCtxMenu(null); setPickerMsgId(null); setCtxPickerOpen(false); setMentionSearch(null) }

  if (!profileLoading && !profile?.companyId) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', padding: '1.5rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HugeiconsIcon icon={MessageMultiple01Icon} size={28} className="text-muted-foreground" />
      </div>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>Du bist keinem Unternehmen zugeordnet.</p>
    </div>
  )

  // Group by date
  const grouped: { date: string; msgs: ChatMessage[] }[] = []
  for (const msg of messages) {
    const d = msg.createdAt.slice(0, 10)
    const last = grouped[grouped.length - 1]
    if (last?.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  }

  const hasInput = !!(input.trim() || imageFile)

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, fontFamily: '"Google Sans","Roboto",sans-serif', background: 'hsl(var(--background))', position: 'relative' }}
      onClick={closeAll}
    >
      {/* ── Header ── */}
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid hsl(var(--border)/0.6)', background: 'hsl(var(--card))', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HugeiconsIcon icon={MessageMultiple01Icon} size={18} style={{ color: primary }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>Firmen-Chat</div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.2 }}>{branding.name}</div>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 0, minHeight: 0, background: 'hsl(var(--muted)/0.25)' }}>
        {!chatReady ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 48 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${primary}30`, borderTopColor: primary, animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: 'hsl(var(--muted-foreground))' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={MessageMultiple01Icon} size={28} style={{ opacity: 0.4 }} />
            </div>
            <p style={{ fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>Noch keine Nachrichten.<br />Starte die Unterhaltung!</p>
          </div>
        ) : grouped.map(group => (
          <div key={group.date}>
            {/* Date chip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px 0 10px' }}>
              <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500, padding: '3px 12px', borderRadius: 20, background: 'hsl(var(--background))', border: '1px solid hsl(var(--border)/0.6)' }}>
                {format(new Date(group.date + 'T12:00:00'), 'EEEE, d. MMMM', { locale: de })}
              </span>
            </div>

            {group.msgs.map((msg, i) => {
              const isOwn = msg.senderId === profile?.id
              const prevMsg = group.msgs[i - 1]
              const nextMsg = group.msgs[i + 1]
              const isFirst = prevMsg?.senderId !== msg.senderId
              const isLast = !nextMsg || nextMsg.senderId !== msg.senderId
              const showSender = !isOwn && isFirst
              const time = format(new Date(msg.createdAt), 'HH:mm')
              const msgRxns = reactions.get(msg.id) ?? []
              const rxnGroups = new Map<string, { count: number; hasOwn: boolean }>()
              for (const r of msgRxns) {
                const g = rxnGroups.get(r.emoji) ?? { count: 0, hasOwn: false }
                rxnGroups.set(r.emoji, { count: g.count + 1, hasOwn: g.hasOwn || r.user_id === profile?.id })
              }

              const ownRadius = isFirst && isLast ? '20px 20px 6px 20px' : isFirst ? '20px 20px 4px 20px' : isLast ? '20px 20px 6px 20px' : '20px 20px 4px 20px'
              const otherRadius = isFirst && isLast ? '20px 20px 20px 6px' : isFirst ? '20px 20px 20px 4px' : isLast ? '20px 20px 20px 6px' : '20px 20px 20px 4px'

              return (
                <div
                  key={msg.id}
                  style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginBottom: rxnGroups.size > 0 ? 20 : isLast ? 8 : 2, position: 'relative' }}
                  onMouseEnter={() => setHoveredId(msg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onContextMenu={e => openCtxMenu(e, msg, isOwn)}
                  onTouchStart={() => startLongPress(msg, isOwn)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: primary, color: 'white', fontWeight: 700, fontSize: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', visibility: isLast ? 'visible' : 'hidden', marginBottom: rxnGroups.size > 0 ? 18 : 0, boxShadow: elev1 }}>
                      {msg.senderInitials}
                    </div>
                  )}

                  {/* Bubble column */}
                  <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    {showSender && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: primary, marginBottom: 3, paddingLeft: 14 }}>
                        {msg.senderName}
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      id={`msg-${msg.id}`}
                      style={{ padding: msg.imageUrl && msg.content === '📷' ? 4 : '10px 14px', borderRadius: isOwn ? ownRadius : otherRadius, background: isOwn ? primary : 'hsl(var(--card))', color: isOwn ? 'white' : 'hsl(var(--foreground))', fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflow: 'hidden', boxShadow: isOwn ? `0 1px 2px ${primary}40` : elev1, cursor: 'default', userSelect: 'text' }}
                    >
                      {/* Reply quote */}
                      {msg.replyToId && (
                        <div
                          onClick={e => { e.stopPropagation(); document.getElementById(`msg-${msg.replyToId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
                          style={{ display: 'flex', gap: 0, marginBottom: 8, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: isOwn ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.05)' }}
                        >
                          <div style={{ width: 3, flexShrink: 0, background: isOwn ? 'rgba(255,255,255,0.8)' : primary }} />
                          <div style={{ padding: '5px 10px', minWidth: 0 }}>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 700, marginBottom: 1, color: isOwn ? 'rgba(255,255,255,0.95)' : primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.replyToSenderName ?? '…'}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                              {msg.replyToContent ?? '📷 Bild'}
                            </div>
                          </div>
                        </div>
                      )}

                      {msg.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.imageUrl} alt="Bild" style={{ display: 'block', maxWidth: 260, maxHeight: 320, borderRadius: msg.content !== '📷' ? 10 : 16, objectFit: 'cover', cursor: 'pointer', margin: msg.replyToId ? '0 -14px' : '-4px' }}
                          onClick={e => { e.stopPropagation(); window.open(msg.imageUrl!, '_blank') }} />
                      )}
                      {msg.content !== '📷' && (
                        <span style={{ display: 'block', paddingTop: msg.imageUrl ? 7 : 0 }}>
                          {renderContent(msg.content, isOwn ? 'rgba(255,255,255,0.9)' : primary)}
                        </span>
                      )}
                    </div>

                    {/* Time */}
                    <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', marginTop: 3, paddingLeft: isOwn ? 0 : 4, paddingRight: isOwn ? 4 : 0 }}>{time}</span>

                    {/* Reactions */}
                    {rxnGroups.size > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {[...rxnGroups.entries()].map(([emoji, { count, hasOwn }]) => (
                          <button key={emoji} onClick={e => { e.stopPropagation(); toggleReaction(msg.id, emoji) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 14, border: `1.5px solid ${hasOwn ? primary : 'hsl(var(--border))'}`, background: hasOwn ? primary + '15' : 'hsl(var(--card))', cursor: 'pointer', fontSize: '0.8125rem', color: hasOwn ? primary : 'hsl(var(--foreground))', fontWeight: hasOwn ? 600 : 400, boxShadow: elev1 }}>
                            {emoji} <span style={{ fontSize: '0.7rem' }}>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover action strip (desktop) */}
                  {(hoveredId === msg.id || pickerMsgId === msg.id) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignSelf: 'flex-end', paddingBottom: rxnGroups.size > 0 ? 26 : 6, position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setPickerMsgId(prev => prev === msg.id ? null : msg.id)} title="Reaktion"
                        style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: elev1 }}>😊</button>
                      <button onClick={() => { setReplyTo(msg); inputRef.current?.focus() }} title="Antworten"
                        style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: elev1 }}>↩</button>

                      {/* Emoji picker popup */}
                      {pickerMsgId === msg.id && (
                        <div style={{ position: 'absolute', [isOwn ? 'right' : 'left']: 36, bottom: rxnGroups.size > 0 ? 44 : 4, zIndex: 200, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border)/0.5)', borderRadius: 16, padding: '6px 8px', display: 'flex', gap: 2, boxShadow: elev2, whiteSpace: 'nowrap' }}>
                          {EMOJIS.map(e => (
                            <button key={e} onClick={() => toggleReaction(msg.id, e)}
                              style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 8, transition: 'transform 120ms' }}
                              onMouseEnter={el => { el.currentTarget.style.transform = 'scale(1.35)' }}
                              onMouseLeave={el => { el.currentTarget.style.transform = 'scale(1)' }}>
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* ── Reply preview ── */}
      {replyTo && (
        <div style={{ padding: '8px 1rem 8px 1.25rem', background: 'hsl(var(--card))', borderTop: `2px solid ${primary}20`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: primary, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: primary }}>{replyTo.senderName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.imageUrl && replyTo.content === '📷' ? '📷 Bild' : replyTo.content}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 6, borderRadius: '50%', display: 'flex' }}>
            <HugeiconsIcon icon={Cancel01Icon} size={15} />
          </button>
        </div>
      )}

      {/* ── Image preview ── */}
      {imagePreview && (
        <div style={{ padding: '8px 1.25rem', background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border)/0.4)', display: 'flex', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Vorschau" style={{ height: 76, borderRadius: 10, objectFit: 'cover', border: '1px solid hsl(var(--border))' }} />
            <button onClick={clearImage} style={{ position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%', background: '#ea4335', border: '2px solid hsl(var(--card))', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={Cancel01Icon} size={10} />
            </button>
          </div>
          {uploading && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Wird hochgeladen…</span>}
        </div>
      )}

      {/* ── Input bar ── */}
      <div
        style={{ padding: '0.625rem 1rem', background: 'hsl(var(--card))', borderTop: replyTo || imagePreview ? 'none' : '1px solid hsl(var(--border)/0.5)', flexShrink: 0, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* @mention suggestion popup */}
        {mentionSearch !== null && filteredMembers.length > 0 && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '1rem', right: '1rem', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border)/0.5)', borderRadius: 14, overflow: 'hidden', boxShadow: elev3, zIndex: 100 }}>
            {filteredMembers.map((m, idx) => {
              const initials = `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase()
              return (
                <button
                  key={m.id}
                  onMouseDown={e => { e.preventDefault(); selectMention(m) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', border: 'none', background: idx === mentionIdx ? primary + '12' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 100ms' }}
                  onMouseEnter={() => setMentionIdx(idx)}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: primary, color: 'white', fontWeight: 700, fontSize: '0.6875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{m.firstName} {m.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>@{m.firstName}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: 760, margin: '0 auto' }}>
          {/* Attach image */}
          <button onClick={() => fileRef.current?.click()} title="Bild senden"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
            <HugeiconsIcon icon={Image01Icon} size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

          {/* Pill input */}
          <div style={{ flex: 1, background: 'hsl(var(--muted)/0.5)', borderRadius: 22, border: '1px solid hsl(var(--border)/0.6)', display: 'flex', alignItems: 'flex-end', padding: '0 12px', minHeight: 38 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Nachricht schreiben… @ zum Erwähnen"
              rows={1}
              style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', color: 'hsl(var(--foreground))', padding: '9px 0', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', maxHeight: 120, overflowY: 'auto', lineHeight: 1.5 }}
              maxLength={2000}
            />
          </div>

          {/* Send FAB */}
          <button onClick={sendMessage} disabled={!hasInput || sending || uploading}
            style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: hasInput ? primary : 'hsl(var(--muted))', color: hasInput ? 'white' : 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: hasInput ? 'pointer' : 'not-allowed', transition: 'background 200ms, box-shadow 200ms', flexShrink: 0, boxShadow: hasInput ? `0 2px 8px ${primary}50` : 'none' }}>
            {sending ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} /> : <HugeiconsIcon icon={MailSend01Icon} size={17} />}
          </button>
        </div>
      </div>

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', left: ctxX, top: ctxY, zIndex: 300, background: 'hsl(var(--card))', borderRadius: 16, overflow: 'hidden', boxShadow: elev3, border: '1px solid hsl(var(--border)/0.4)', minWidth: 180 }}
        >
          {/* Emoji strip at top */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid hsl(var(--border)/0.6)', display: 'flex', gap: 2 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => toggleReaction(ctxMenu.msg.id, e)}
                style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 8, transition: 'transform 120ms, background 120ms' }}
                onMouseEnter={el => { el.currentTarget.style.transform = 'scale(1.35)'; el.currentTarget.style.background = 'hsl(var(--muted))' }}
                onMouseLeave={el => { el.currentTarget.style.transform = 'scale(1)'; el.currentTarget.style.background = 'none' }}>
                {e}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: '6px 0' }}>
            {[
              { icon: '↩', label: 'Antworten', action: () => { setReplyTo(ctxMenu.msg); setCtxMenu(null); inputRef.current?.focus() } },
              {
                icon: '📋', label: 'Kopieren', action: () => {
                  if (ctxMenu.msg.content !== '📷') navigator.clipboard.writeText(ctxMenu.msg.content)
                  setCtxMenu(null)
                }
              },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', color: 'hsl(var(--foreground))', fontFamily: 'inherit', textAlign: 'left', transition: 'background 100ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}

            {/* Delete — own messages only */}
            {ctxMenu.isOwn && (
              <>
                <div style={{ height: 1, background: 'hsl(var(--border)/0.6)', margin: '4px 0' }} />
                <button
                  onClick={() => deleteMessage(ctxMenu.msg.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', color: '#d93025', fontFamily: 'inherit', textAlign: 'left', transition: 'background 100ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fce8e6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <HugeiconsIcon icon={Delete01Icon} size={16} />
                  Löschen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
