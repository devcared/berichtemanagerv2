'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { ApprenticeTrainer } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building01Icon, Add01Icon, Delete01Icon, Alert01Icon } from '@hugeicons/core-free-icons'

interface Member { id: string; first_name: string; last_name: string; role: string }

export default function AusbilderZuordnungPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [members, setMembers] = useState<Member[]>([])
  const [assignments, setAssignments] = useState<ApprenticeTrainer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedApprentice, setSelectedApprentice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/company/trainers')
    const json = await res.json()
    setMembers(json.members ?? [])
    setAssignments(json.assignments ?? [])
    const apprentices = (json.members ?? []).filter((m: Member) => m.role === 'apprentice')
    if (!selectedApprentice && apprentices.length > 0) setSelectedApprentice(apprentices[0].id)
    setLoading(false)
  }, [selectedApprentice])

  useEffect(() => {
    if (!profileLoading && profile?.companyId && profile.role !== 'apprentice') load()
  }, [profileLoading, profile, load])

  async function assign(apprenticeId: string, trainerId: string) {
    const key = `${apprenticeId}-${trainerId}`
    setSaving(key)
    await fetch('/api/company/trainers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apprenticeId, trainerId }),
    })
    await load()
    setSaving(null)
  }

  async function unassign(apprenticeId: string, trainerId: string) {
    const key = `${apprenticeId}-${trainerId}`
    setSaving(key)
    await fetch('/api/company/trainers', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apprenticeId, trainerId }),
    })
    await load()
    setSaving(null)
  }

  if (profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>

  if (profile?.role === 'apprentice') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
      <p className="text-muted-foreground text-sm">Nur für Admins.</p>
    </div>
  )

  const apprentices = members.filter(m => m.role === 'apprentice')
  const trainers = members.filter(m => m.role !== 'apprentice')

  const activeAssignments = assignments.filter(a => a.apprenticeId === selectedApprentice)
  const assignedTrainerIds = new Set(activeAssignments.map(a => a.trainerId))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HugeiconsIcon icon={Building01Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Ausbilder-Zuordnung</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Azubis ihren Ausbildern zuweisen</p>
        </div>
      </div>

      {/* Apprentice selector */}
      {apprentices.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {apprentices.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedApprentice(m.id)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${selectedApprentice === m.id ? primary : 'hsl(var(--border))'}`,
                background: selectedApprentice === m.id ? primary + '15' : 'transparent',
                color: selectedApprentice === m.id ? primary : 'hsl(var(--foreground))',
                fontSize: '0.875rem', fontWeight: selectedApprentice === m.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              {m.first_name} {m.last_name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10"><div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>
      ) : trainers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Keine Ausbilder im Unternehmen gefunden.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 0.5rem' }}>
            Verfügbare Ausbilder — klicke zum Hinzufügen oder Entfernen:
          </p>
          {trainers.map(t => {
            const isAssigned = assignedTrainerIds.has(t.id)
            const key = `${selectedApprentice}-${t.id}`
            const isSaving = saving === key
            const initials = `${t.first_name[0] ?? ''}${t.last_name[0] ?? ''}`.toUpperCase()

            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem',
                borderRadius: 12,
                border: `1px solid ${isAssigned ? primary + '50' : 'hsl(var(--border))'}`,
                background: isAssigned ? primary + '07' : 'hsl(var(--card))',
                transition: 'all 200ms',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: isAssigned ? primary : 'hsl(var(--muted))', color: isAssigned ? 'white' : 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 200ms' }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t.first_name} {t.last_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>{t.role === 'admin' ? 'Admin' : 'Ausbilder'}</div>
                </div>
                {isAssigned ? (
                  <button
                    onClick={() => unassign(selectedApprentice, t.id)}
                    disabled={isSaving || !selectedApprentice}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${primary}40`, background: 'transparent', cursor: 'pointer', color: '#ea4335', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {isSaving ? <div className="size-3 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : <HugeiconsIcon icon={Delete01Icon} size={13} />}
                    Entfernen
                  </button>
                ) : (
                  <button
                    onClick={() => assign(selectedApprentice, t.id)}
                    disabled={isSaving || !selectedApprentice}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${primary}40`, background: primary + '12', cursor: 'pointer', color: primary, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {isSaving ? <div className="size-3 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : <HugeiconsIcon icon={Add01Icon} size={13} />}
                    Zuweisen
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
