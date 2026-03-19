'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { ApprenticeTrainer } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserGroup02Icon } from '@hugeicons/core-free-icons'

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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  )

  if (!profile?.companyId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <p className="text-muted-foreground text-sm">Du bist keinem Unternehmen zugeordnet.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HugeiconsIcon icon={UserGroup02Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Meine Ausbilder</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Deine zugeordneten Ansprechpartner</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
          <HugeiconsIcon icon={UserGroup02Icon} size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: '0.875rem' }}>Noch kein Ausbilder zugeordnet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assignments.map(a => {
            const initials = `${a.trainerName?.split(' ')[0]?.[0] ?? ''}${a.trainerName?.split(' ')[1]?.[0] ?? ''}`.toUpperCase()
            return (
              <div key={`${a.apprenticeId}-${a.trainerId}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.125rem', borderRadius: 14, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: primary, color: 'white', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {initials || '?'}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{a.trainerName}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>Ausbilder</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
