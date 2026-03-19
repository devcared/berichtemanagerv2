'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { TrainerFeedback } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  StarAward01Icon, Add01Icon, Edit01Icon, Delete01Icon,
  Cancel01Icon, CheckmarkCircle01Icon, Alert01Icon,
} from '@hugeicons/core-free-icons'

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'

interface Member { id: string; first_name: string; last_name: string; role: string }

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: i <= (hover || value) ? '#f59e0b' : 'hsl(var(--border))', transition: 'transform 100ms, color 100ms', transform: hover === i ? 'scale(1.2)' : 'scale(1)' }}
        >★</button>
      ))}
    </div>
  )
}

const EMPTY_FORM = { periodLabel: '', ratingPunctuality: 0, ratingEffort: 0, ratingExpertise: 0, ratingSocial: 0, comment: '' }

export default function FeedbackGebenPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [members, setMembers] = useState<Member[]>([])
  const [feedback, setFeedback] = useState<TrainerFeedback[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [fRes, tRes] = await Promise.all([
      fetch('/api/company/feedback'),
      fetch('/api/company/trainers'),
    ])
    const fJson = await fRes.json()
    const tJson = await tRes.json()
    setFeedback(fJson.feedback ?? [])
    const apprentices = (tJson.members ?? []).filter((m: Member) => m.role === 'apprentice')
    setMembers(apprentices)
    if (!selectedId && apprentices.length > 0) setSelectedId(apprentices[0].id)
    setLoading(false)
  }, [selectedId])

  useEffect(() => {
    if (!profileLoading && profile?.companyId && profile.role !== 'apprentice') load()
  }, [profileLoading, profile, load])

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true) }

  function openEdit(f: TrainerFeedback) {
    setEditingId(f.id)
    setForm({ periodLabel: f.periodLabel, ratingPunctuality: f.ratingPunctuality ?? 0, ratingEffort: f.ratingEffort ?? 0, ratingExpertise: f.ratingExpertise ?? 0, ratingSocial: f.ratingSocial ?? 0, comment: f.comment ?? '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.periodLabel || !selectedId) return
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : { apprenticeId: selectedId, ...form }
      await fetch('/api/company/feedback', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowForm(false)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Feedback wirklich löschen?')) return
    await fetch('/api/company/feedback', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await load()
  }

  if (profileLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${(branding.accentColor || '#4285f4')}30`, borderTopColor: branding.accentColor || '#4285f4', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (profile?.role === 'apprentice') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', padding: '1.5rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>Nur für Ausbilder und Admins.</p>
    </div>
  )

  const myFeedback = feedback.filter(f => f.apprenticeId === selectedId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const selectedMember = members.find(m => m.id === selectedId)

  const ratingLabels = [
    { key: 'ratingPunctuality' as const, label: 'Pünktlichkeit' },
    { key: 'ratingEffort' as const, label: 'Einsatz & Motivation' },
    { key: 'ratingExpertise' as const, label: 'Fachkompetenz' },
    { key: 'ratingSocial' as const, label: 'Sozialverhalten' },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 2rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HugeiconsIcon icon={StarAward01Icon} size={22} style={{ color: primary }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.01em' }}>Feedback geben</h1>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Azubi-Bewertungen erfassen</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={!selectedId}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, border: 'none', background: selectedId ? primary : 'hsl(var(--muted))', color: selectedId ? 'white' : 'hsl(var(--muted-foreground))', fontSize: '0.875rem', fontWeight: 500, cursor: selectedId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: selectedId ? `0 2px 6px ${primary}40` : 'none', transition: 'all 150ms' }}
        >
          <HugeiconsIcon icon={Add01Icon} size={15} /> Neues Feedback
        </button>
      </div>

      {/* Apprentice chips */}
      {members.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); setShowForm(false) }}
              style={{
                padding: '7px 16px', borderRadius: 20,
                border: `1.5px solid ${selectedId === m.id ? primary : 'hsl(var(--border))'}`,
                background: selectedId === m.id ? primary : 'hsl(var(--card))',
                color: selectedId === m.id ? 'white' : 'hsl(var(--foreground))',
                fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 150ms', fontFamily: 'inherit',
                boxShadow: selectedId === m.id ? `0 2px 6px ${primary}40` : elev1,
              }}
            >
              {m.first_name} {m.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div style={{ padding: '1.375rem', borderRadius: 16, background: 'hsl(var(--card))', marginBottom: '1.5rem', boxShadow: elev1, border: `1px solid ${primary}25` }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 1.125rem', color: 'hsl(var(--foreground))' }}>
            {editingId ? 'Feedback bearbeiten' : `Feedback für ${selectedMember?.first_name ?? ''}`}
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <Label className="text-xs text-muted-foreground mb-1 block">Zeitraum / Bezeichnung *</Label>
            <Input value={form.periodLabel} onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))} placeholder="z.B. Q1 2025 oder März 2025" className="h-9 text-sm" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {ratingLabels.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-2 block">{label}</Label>
                <StarPicker value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Label className="text-xs text-muted-foreground mb-1 block">Kommentar (optional)</Label>
            <textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Freitextkommentar..."
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', padding: '8px 12px', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              maxLength={1000}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !form.periodLabel}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, border: 'none', background: primary, color: 'white', fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: !form.periodLabel ? 0.5 : 1 }}
            >
              {saving ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />}
              Speichern
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--foreground))', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} /> Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${primary}30`, borderTopColor: primary, animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : myFeedback.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Noch kein Feedback für diesen Azubi.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {myFeedback.map(f => {
            const ratings = [f.ratingPunctuality, f.ratingEffort, f.ratingExpertise, f.ratingSocial].filter(v => v !== null) as number[]
            const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1.125rem', borderRadius: 14, background: 'hsl(var(--card))', boxShadow: elev1, border: '1px solid hsl(var(--border)/0.4)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{f.periodLabel}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>
                    {format(parseISO(f.createdAt), 'd. MMM yyyy', { locale: de })}
                    {avg && <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 500 }}>⌀ {avg} ★</span>}
                  </div>
                </div>
                <button onClick={() => openEdit(f)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                </button>
                <button onClick={() => handleDelete(f.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: '#d93025', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fce8e6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <HugeiconsIcon icon={Delete01Icon} size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
