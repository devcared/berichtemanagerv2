'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { ApprenticeTrainer } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building01Icon, Add01Icon, Delete01Icon, Alert01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'

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
    await fetch('/api/company/trainers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apprenticeId, trainerId }) })
    await load()
    setSaving(null)
  }

  async function unassign(apprenticeId: string, trainerId: string) {
    const key = `${apprenticeId}-${trainerId}`
    setSaving(key)
    await fetch('/api/company/trainers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apprenticeId, trainerId }) })
    await load()
    setSaving(null)
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
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>Nur für Admins.</p>
    </div>
  )

  const apprentices = members.filter(m => m.role === 'apprentice')
  const trainers = members.filter(m => m.role !== 'apprentice')
  const activeAssignments = assignments.filter(a => a.apprenticeId === selectedApprentice)
  const assignedTrainerIds = new Set(activeAssignments.map(a => a.trainerId))

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 2rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HugeiconsIcon icon={Building01Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.01em' }}>Ausbilder-Zuordnung</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Azubis ihren Ausbildern zuweisen</p>
        </div>
      </div>

      {/* Apprentice chips */}
      {apprentices.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {apprentices.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedApprentice(m.id)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                border: `1.5px solid ${selectedApprentice === m.id ? primary : 'hsl(var(--border))'}`,
                background: selectedApprentice === m.id ? primary : 'hsl(var(--card))',
                color: selectedApprentice === m.id ? 'white' : 'hsl(var(--foreground))',
                fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 150ms', fontFamily: 'inherit',
                boxShadow: selectedApprentice === m.id ? `0 2px 6px ${primary}40` : elev1,
              }}
            >
              {m.first_name} {m.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Section label */}
      {!loading && trainers.length > 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 0.75rem', fontWeight: 500 }}>
          Verfügbare Ausbilder
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${primary}30`, borderTopColor: primary, animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : trainers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Keine Ausbilder im Unternehmen gefunden.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {trainers.map(t => {
            const isAssigned = assignedTrainerIds.has(t.id)
            const key = `${selectedApprentice}-${t.id}`
            const isSaving = saving === key
            const initials = `${t.first_name[0] ?? ''}${t.last_name[0] ?? ''}`.toUpperCase()

            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.875rem 1.125rem', borderRadius: 16, background: 'hsl(var(--card))', border: `1px solid ${isAssigned ? primary + '35' : 'hsl(var(--border)/0.4)'}`, boxShadow: isAssigned ? `0 2px 8px ${primary}18, ${elev1}` : elev1, transition: 'all 200ms' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: isAssigned ? primary : 'hsl(var(--muted))', color: isAssigned ? 'white' : 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 200ms', boxShadow: isAssigned ? `0 2px 6px ${primary}40` : 'none' }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t.first_name} {t.last_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>{t.role === 'admin' ? 'Admin' : 'Ausbilder'}</div>
                </div>

                {isAssigned ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: primary, fontWeight: 500 }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                      Zugewiesen
                    </div>
                    <button
                      onClick={() => unassign(selectedApprentice, t.id)}
                      disabled={isSaving || !selectedApprentice}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', color: '#d93025', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fce8e6')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      title="Entfernen"
                    >
                      {isSaving ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #d9302530', borderTopColor: '#d93025', animation: 'spin 0.7s linear infinite' }} /> : <HugeiconsIcon icon={Delete01Icon} size={14} />}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => assign(selectedApprentice, t.id)}
                    disabled={isSaving || !selectedApprentice}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${primary}40`, background: primary + '10', cursor: isSaving ? 'wait' : 'pointer', color: primary, fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'inherit', transition: 'all 150ms' }}
                    onMouseEnter={e => { e.currentTarget.style.background = primary + '20'; e.currentTarget.style.borderColor = primary }}
                    onMouseLeave={e => { e.currentTarget.style.background = primary + '10'; e.currentTarget.style.borderColor = `${primary}40` }}
                  >
                    {isSaving ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${primary}30`, borderTopColor: primary, animation: 'spin 0.7s linear infinite' }} /> : <HugeiconsIcon icon={Add01Icon} size={13} />}
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
