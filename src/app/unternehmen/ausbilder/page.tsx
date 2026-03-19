'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { ApprenticeTrainer } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserGroup02Icon } from '@hugeicons/core-free-icons'

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'

export default function AusbilderPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [assignments, setAssignments] = useState<ApprenticeTrainer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading || !profile?.companyId) return
    fetch('/api/company/trainers')
      .then(r => r.ok ? r.json() : { assignments: [] })
      .then(json => {
        const mine = (json.assignments ?? []).filter((a: ApprenticeTrainer) => a.apprenticeId === profile.id)
        setAssignments(mine)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [profileLoading, profile?.companyId, profile?.id])

  if (profileLoading || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${(branding.accentColor || '#4285f4')}30`, borderTopColor: branding.accentColor || '#4285f4', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!profile?.companyId) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', padding: '1.5rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0 }}>Du bist keinem Unternehmen zugeordnet.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem 1rem 2rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HugeiconsIcon icon={UserGroup02Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.01em' }}>Meine Ausbilder</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Deine zugeordneten Ansprechpartner</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '4rem 1rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={UserGroup02Icon} size={28} style={{ opacity: 0.35 }} />
          </div>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Noch kein Ausbilder zugeordnet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assignments.map(a => {
            const fn = a.trainerFirstName ?? a.trainerName?.split(' ')[0] ?? ''
            const ln = a.trainerLastName ?? a.trainerName?.split(' ')[1] ?? ''
            const initials = `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase() || '?'
            const fullName = (a.trainerName ?? `${fn} ${ln}`.trim()) || 'Unbekannt'
            return (
              <div key={`${a.apprenticeId}-${a.trainerId}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', borderRadius: 16, background: 'hsl(var(--card))', boxShadow: elev1, border: '1px solid hsl(var(--border)/0.4)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary, color: 'white', fontWeight: 700, fontSize: '1.0625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 6px ${primary}40` }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{fullName}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>Ausbilder</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
