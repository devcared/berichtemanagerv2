'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { DepartmentRotation } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CalendarCheckIn01Icon, Add01Icon, Edit01Icon, Delete01Icon,
  Cancel01Icon, CheckmarkCircle01Icon, Alert01Icon,
} from '@hugeicons/core-free-icons'

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'

interface Member { id: string; first_name: string; last_name: string; role: string }

export default function RotationenVerwaltenPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [members, setMembers] = useState<Member[]>([])
  const [rotations, setRotations] = useState<DepartmentRotation[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ department: '', startDate: '', endDate: '', notes: '' })
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [rRes, tRes] = await Promise.all([
      fetch('/api/company/rotations'),
      fetch('/api/company/trainers'),
    ])
    const rJson = await rRes.json()
    const tJson = await tRes.json()
    setRotations(rJson.rotations ?? [])
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
    setForm({ department: '', startDate: '', endDate: '', notes: '' })
    setShowForm(true)
  }

  function openEdit(r: DepartmentRotation) {
    setEditingId(r.id)
    setForm({ department: r.department, startDate: r.startDate, endDate: r.endDate ?? '', notes: r.notes ?? '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.department || !form.startDate || !selectedId) return
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : { apprenticeId: selectedId, ...form }
      await fetch('/api/company/rotations', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowForm(false)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Rotation wirklich löschen?')) return
    await fetch('/api/company/rotations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
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

  const myRotations = rotations.filter(r => r.apprenticeId === selectedId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const selectedMember = members.find(m => m.id === selectedId)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 2rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={22} style={{ color: primary }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.01em' }}>Rotationen verwalten</h1>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Abteilungseinsätze planen</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={!selectedId}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, border: 'none', background: selectedId ? primary : 'hsl(var(--muted))', color: selectedId ? 'white' : 'hsl(var(--muted-foreground))', fontSize: '0.875rem', fontWeight: 500, cursor: selectedId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: selectedId ? `0 2px 6px ${primary}40` : 'none', transition: 'all 150ms' }}
        >
          <HugeiconsIcon icon={Add01Icon} size={15} /> Neue Rotation
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
        <div style={{ padding: '1.25rem', borderRadius: 16, background: 'hsl(var(--card))', marginBottom: '1.5rem', boxShadow: elev1, border: `1px solid ${primary}25` }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 1rem', color: 'hsl(var(--foreground))' }}>
            {editingId ? 'Rotation bearbeiten' : `Neue Rotation für ${selectedMember?.first_name ?? ''}`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Label className="text-xs text-muted-foreground mb-1 block">Abteilung *</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="z.B. IT-Entwicklung" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Beginn *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Ende (optional)</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Label className="text-xs text-muted-foreground mb-1 block">Notizen</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..." className="h-9 text-sm" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !form.department || !form.startDate}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, border: 'none', background: primary, color: 'white', fontSize: '0.875rem', fontWeight: 500, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: !form.department || !form.startDate ? 0.5 : 1 }}
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

      {/* Rotation list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${primary}30`, borderTopColor: primary, animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : myRotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Noch keine Rotationen für diesen Azubi.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {myRotations.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1.125rem', borderRadius: 14, background: 'hsl(var(--card))', boxShadow: elev1, border: '1px solid hsl(var(--border)/0.4)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: primary, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{r.department}</div>
                <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>
                  {format(parseISO(r.startDate), 'd. MMM yyyy', { locale: de })}
                  {' – '}
                  {r.endDate ? format(parseISO(r.endDate), 'd. MMM yyyy', { locale: de }) : 'offen'}
                </div>
                {r.notes && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{r.notes}</div>}
              </div>
              <button onClick={() => openEdit(r)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <HugeiconsIcon icon={Edit01Icon} size={14} />
              </button>
              <button onClick={() => handleDelete(r.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: '#d93025', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fce8e6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <HugeiconsIcon icon={Delete01Icon} size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
