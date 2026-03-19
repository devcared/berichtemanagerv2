'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { TrainerFeedback } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarAward01Icon, UserIcon } from '@hugeicons/core-free-icons'

const elev1 = '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)'

function StarRow({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ fontSize: '1rem', color: i <= value ? '#f59e0b' : 'hsl(var(--border))' }}>★</span>
        ))}
      </div>
    </div>
  )
}

function avgRating(f: TrainerFeedback): number | null {
  const vals = [f.ratingPunctuality, f.ratingEffort, f.ratingExpertise, f.ratingSocial].filter(v => v !== null) as number[]
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

function scoreColor(avg: number) {
  if (avg >= 4.2) return '#1e8e3e'
  if (avg >= 3) return '#f29900'
  return '#d93025'
}

export default function FeedbackPage() {
  const { profile, loading: profileLoading } = useProfile()
  const branding = useBranding()
  const primary = branding.accentColor || '#4285f4'

  const [feedback, setFeedback] = useState<TrainerFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading || !profile?.companyId) return
    fetch('/api/company/feedback')
      .then(r => r.ok ? r.json() : { feedback: [] })
      .then(json => { setFeedback(json.feedback ?? []); setLoading(false) })
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

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem 2rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HugeiconsIcon icon={StarAward01Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.01em' }}>Mein Feedback</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Bewertungen deiner Ausbilder</p>
        </div>
      </div>

      {feedback.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '4rem 1rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={StarAward01Icon} size={28} style={{ opacity: 0.35 }} />
          </div>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Noch kein Feedback vorhanden.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedback.map(f => {
            const avg = avgRating(f)
            const color = avg !== null ? scoreColor(avg) : primary
            return (
              <div key={f.id} style={{ borderRadius: 16, background: 'hsl(var(--card))', overflow: 'hidden', boxShadow: elev1, border: '1px solid hsl(var(--border)/0.4)' }}>
                {/* Score banner */}
                <div style={{ padding: '0.875rem 1.25rem', background: color + '0e', borderBottom: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{f.periodLabel}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <HugeiconsIcon icon={UserIcon} size={11} />
                      {f.trainerName}
                      <span style={{ opacity: 0.4 }}>·</span>
                      {format(parseISO(f.createdAt), 'd. MMM yyyy', { locale: de })}
                    </div>
                  </div>
                  {avg !== null && (
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color, lineHeight: 1 }}>{avg.toFixed(1)}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>von 5</div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '0.875rem 1.25rem' }}>
                  {/* Ratings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: f.comment ? '0.875rem' : 0 }}>
                    <StarRow label="Pünktlichkeit" value={f.ratingPunctuality} />
                    <StarRow label="Einsatz & Motivation" value={f.ratingEffort} />
                    <StarRow label="Fachkompetenz" value={f.ratingExpertise} />
                    <StarRow label="Sozialverhalten" value={f.ratingSocial} />
                  </div>

                  {/* Comment */}
                  {f.comment && (
                    <div style={{ background: 'hsl(var(--muted)/0.4)', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: 'hsl(var(--foreground))', lineHeight: 1.55, borderLeft: `3px solid ${color}50` }}>
                      {f.comment}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
