'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { TrainerFeedback } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  StarAward01Icon, Add01Icon, Edit01Icon, Delete01Icon,
  Cancel01Icon, CheckmarkCircle01Icon, Alert01Icon,
} from '@hugeicons/core-free-icons'

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
          style={{ fontSize: '1.375rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', color: i <= (hover || value) ? '#f59e0b' : 'hsl(var(--border))' }}
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

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(f: TrainerFeedback) {
    setEditingId(f.id)
    setForm({
      periodLabel: f.periodLabel,
      ratingPunctuality: f.ratingPunctuality ?? 0,
      ratingEffort: f.ratingEffort ?? 0,
      ratingExpertise: f.ratingExpertise ?? 0,
      ratingSocial: f.ratingSocial ?? 0,
      comment: f.comment ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.periodLabel || !selectedId) return
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId
        ? { id: editingId, ...form }
        : { apprenticeId: selectedId, ...form }
      await fetch('/api/company/feedback', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      setShowForm(false)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Feedback wirklich löschen?')) return
    await fetch('/api/company/feedback', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    await load()
  }

  if (profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>

  if (profile?.role === 'apprentice') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
      <p className="text-muted-foreground text-sm">Nur für Ausbilder und Admins.</p>
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={StarAward01Icon} size={22} style={{ color: primary }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Feedback geben</h1>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Azubi-Bewertungen erfassen</p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} disabled={!selectedId} style={{ background: primary, color: 'white', border: 'none' }}>
          <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> Neues Feedback
        </Button>
      </div>

      {/* Apprentice selector */}
      {members.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); setShowForm(false) }}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${selectedId === m.id ? primary : 'hsl(var(--border))'}`,
                background: selectedId === m.id ? primary + '15' : 'transparent',
                color: selectedId === m.id ? primary : 'hsl(var(--foreground))',
                fontSize: '0.875rem', fontWeight: selectedId === m.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              {m.first_name} {m.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div style={{ padding: '1.25rem', borderRadius: 14, border: `1px solid ${primary}30`, background: primary + '06', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 1rem', color: 'hsl(var(--foreground))' }}>
            {editingId ? 'Feedback bearbeiten' : `Feedback für ${selectedMember?.first_name ?? ''}`}
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <Label className="text-xs text-muted-foreground mb-1 block">Zeitraum / Bezeichnung *</Label>
            <Input
              value={form.periodLabel}
              onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))}
              placeholder="z.B. Q1 2025 oder März 2025"
              className="h-9 text-sm"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
            {ratingLabels.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
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
              style={{
                width: '100%', borderRadius: 8, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                padding: '8px 12px', fontSize: '0.875rem', fontFamily: 'inherit',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
              maxLength={1000}
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.periodLabel} style={{ background: primary, color: 'white', border: 'none' }}>
              {saving ? <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1.5" /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-1.5" />}
              Speichern
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-1.5" /> Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {loading ? (
        <div className="flex items-center justify-center py-10"><div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>
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
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{f.periodLabel}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                    {format(parseISO(f.createdAt), 'd. MMM yyyy', { locale: de })}
                    {avg && <span style={{ marginLeft: 8 }}>⌀ {avg}/5</span>}
                  </div>
                </div>
                <button onClick={() => openEdit(f)} style={{ padding: 6, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                </button>
                <button onClick={() => handleDelete(f.id)} style={{ padding: 6, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: '#ea4335' }}>
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
