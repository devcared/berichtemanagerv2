'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { DepartmentRotation } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CalendarCheckIn01Icon, Add01Icon, Edit01Icon, Delete01Icon,
  Cancel01Icon, CheckmarkCircle01Icon, Alert01Icon,
} from '@hugeicons/core-free-icons'

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
      const body = editingId
        ? { id: editingId, ...form }
        : { apprenticeId: selectedId, ...form }
      await fetch('/api/company/rotations', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      setShowForm(false)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Rotation wirklich löschen?')) return
    await fetch('/api/company/rotations', {
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

  const myRotations = rotations.filter(r => r.apprenticeId === selectedId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const selectedMember = members.find(m => m.id === selectedId)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={22} style={{ color: primary }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Rotationen verwalten</h1>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Abteilungseinsätze planen</p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} disabled={!selectedId} style={{ background: primary, color: 'white', border: 'none' }}>
          <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" /> Neue Rotation
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
            {editingId ? 'Rotation bearbeiten' : `Neue Rotation für ${selectedMember?.first_name ?? ''}`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Abteilung *</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="z.B. IT-Entwicklung" className="h-9 text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Beginn *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Ende (optional)</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Notizen</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..." className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.department || !form.startDate} style={{ background: primary, color: 'white', border: 'none' }}>
              {saving ? <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1.5" /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-1.5" />}
              Speichern
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-1.5" /> Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Rotation list */}
      {loading ? (
        <div className="flex items-center justify-center py-10"><div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>
      ) : myRotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Noch keine Rotationen für diesen Azubi.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {myRotations.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: primary, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{r.department}</div>
                <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                  {format(parseISO(r.startDate), 'd. MMM yyyy', { locale: de })}
                  {' – '}
                  {r.endDate ? format(parseISO(r.endDate), 'd. MMM yyyy', { locale: de }) : 'offen'}
                </div>
                {r.notes && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{r.notes}</div>}
              </div>
              <button onClick={() => openEdit(r)} style={{ padding: 6, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
                <HugeiconsIcon icon={Edit01Icon} size={14} />
              </button>
              <button onClick={() => handleDelete(r.id)} style={{ padding: 6, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: '#ea4335' }}>
                <HugeiconsIcon icon={Delete01Icon} size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
