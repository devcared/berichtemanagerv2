'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { DepartmentRotation } from '@/types'
import { format, isWithinInterval, parseISO, isAfter, isBefore } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarCheckIn01Icon, Building01Icon } from '@hugeicons/core-free-icons'

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'

function isCurrentRotation(r: DepartmentRotation): boolean {
  const today = new Date()
  const start = parseISO(r.startDate)
  if (r.endDate) return isWithinInterval(today, { start, end: parseISO(r.endDate) })
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

  const sorted = [...rotations].sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem 2rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HugeiconsIcon icon={CalendarCheckIn01Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.01em' }}>Rotationsplan</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Deine Abteilungseinsätze</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '4rem 1rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={CalendarCheckIn01Icon} size={28} style={{ opacity: 0.35 }} />
          </div>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Noch kein Rotationsplan hinterlegt.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 52 }}>
          {/* Timeline spine */}
          <div style={{ position: 'absolute', left: 19, top: 24, bottom: 24, width: 2, background: `linear-gradient(to bottom, ${primary}60, hsl(var(--border)))`, borderRadius: 2 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sorted.map((r, idx) => {
              const current = isCurrentRotation(r)
              const past = r.endDate ? isBefore(parseISO(r.endDate), new Date()) : false
              const future = isAfter(parseISO(r.startDate), new Date())

              return (
                <div key={r.id} style={{ position: 'relative' }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute', left: -52, top: 14,
                    width: 38, height: 38, borderRadius: '50%', zIndex: 1,
                    background: current ? primary : past ? 'hsl(var(--muted))' : 'hsl(var(--card))',
                    border: `2px solid ${current ? primary : past ? 'hsl(var(--border))' : primary + '60'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: current ? `0 0 0 4px ${primary}20, ${elev1}` : elev1,
                    transition: 'all 200ms',
                  }}>
                    <HugeiconsIcon icon={Building01Icon} size={15} style={{ color: current ? 'white' : past ? 'hsl(var(--muted-foreground))' : primary }} />
                  </div>

                  {/* Card */}
                  <div style={{
                    borderRadius: 16,
                    background: 'hsl(var(--card))',
                    padding: '1rem 1.125rem',
                    opacity: past && !current ? 0.55 : 1,
                    boxShadow: current ? `0 2px 8px ${primary}25, ${elev1}` : elev1,
                    border: current ? `1px solid ${primary}30` : '1px solid hsl(var(--border)/0.5)',
                    transition: 'all 200ms',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Current indicator stripe */}
                    {current && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: primary, borderRadius: '4px 0 0 4px' }} />}

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', paddingLeft: current ? 8 : 0 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{r.department}</span>
                          {current && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: primary, color: 'white', letterSpacing: '0.02em' }}>
                              Aktuell
                            </span>
                          )}
                          {future && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                              Geplant
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                          {format(parseISO(r.startDate), 'd. MMMM yyyy', { locale: de })}
                          {' – '}
                          {r.endDate ? format(parseISO(r.endDate), 'd. MMMM yyyy', { locale: de }) : 'offen'}
                        </p>
                      </div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>#{idx + 1}</div>
                    </div>

                    {r.notes && (
                      <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))', margin: '8px 0 0', background: 'hsl(var(--muted)/0.4)', borderRadius: 8, padding: '7px 10px', lineHeight: 1.5 }}>
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
