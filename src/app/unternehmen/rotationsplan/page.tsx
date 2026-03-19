'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { DepartmentRotation } from '@/types'
import { format, isWithinInterval, parseISO, isAfter, isBefore } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarCheckIn01Icon, Building01Icon } from '@hugeicons/core-free-icons'

function isCurrentRotation(r: DepartmentRotation): boolean {
  const today = new Date()
  const start = parseISO(r.startDate)
  if (r.endDate) {
    return isWithinInterval(today, { start, end: parseISO(r.endDate) })
  }
  return !isAfter(start, today)
}

export default function RotationsplanPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [rotations, setRotations] = useState<DepartmentRotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading || !profile?.companyId) return
    fetch('/api/company/rotations')
      .then(r => r.ok ? r.json() : { rotations: [] })
      .then(json => { setRotations(json.rotations ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profileLoading, profile?.companyId])

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

  const sorted = [...rotations].sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HugeiconsIcon icon={CalendarCheckIn01Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Rotationsplan</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Deine Abteilungseinsätze</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
          <HugeiconsIcon icon={CalendarCheckIn01Icon} size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: '0.875rem' }}>Noch kein Rotationsplan hinterlegt.</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'hsl(var(--border))' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sorted.map((r) => {
              const current = isCurrentRotation(r)
              const past = r.endDate ? isBefore(parseISO(r.endDate), new Date()) : false
              const future = isAfter(parseISO(r.startDate), new Date())

              return (
                <div key={r.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: current ? primary : 'hsl(var(--card))',
                    border: `2px solid ${current ? primary : 'hsl(var(--border))'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <HugeiconsIcon
                      icon={Building01Icon}
                      size={16}
                      style={{ color: current ? 'white' : 'hsl(var(--muted-foreground))' }}
                    />
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, borderRadius: 14,
                    border: `1px solid ${current ? primary + '40' : 'hsl(var(--border))'}`,
                    background: current ? primary + '08' : 'hsl(var(--card))',
                    padding: '0.875rem 1rem',
                    opacity: past && !current ? 0.6 : 1,
                    boxShadow: current ? `0 0 0 1px ${primary}20` : 'none',
                    marginBottom: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        {r.department}
                      </span>
                      {current && (
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: primary, color: 'white' }}>
                          Aktuell
                        </span>
                      )}
                      {future && (
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                          Geplant
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '4px 0 0' }}>
                      {format(parseISO(r.startDate), 'd. MMMM yyyy', { locale: de })}
                      {' – '}
                      {r.endDate ? format(parseISO(r.endDate), 'd. MMMM yyyy', { locale: de }) : 'offen'}
                    </p>

                    {r.notes && (
                      <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))', margin: '8px 0 0', background: 'hsl(var(--muted)/0.5)', borderRadius: 8, padding: '6px 10px' }}>
                        {r.notes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
