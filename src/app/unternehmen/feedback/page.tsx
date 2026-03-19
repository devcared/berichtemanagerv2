'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import type { TrainerFeedback } from '@/types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarAward01Icon, UserIcon } from '@hugeicons/core-free-icons'

function StarRow({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ fontSize: '0.875rem', color: i <= value ? '#f59e0b' : 'hsl(var(--border))' }}>★</span>
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: '"Google Sans","Roboto",sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HugeiconsIcon icon={StarAward01Icon} size={22} style={{ color: primary }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>Mein Feedback</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>Bewertungen deiner Ausbilder</p>
        </div>
      </div>

      {feedback.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
          <HugeiconsIcon icon={StarAward01Icon} size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: '0.875rem' }}>Noch kein Feedback vorhanden.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedback.map(f => {
            const avg = avgRating(f)
            return (
              <div key={f.id} style={{ borderRadius: 14, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', overflow: 'hidden' }}>
                {/* Top bar */}
                <div style={{ height: 3, background: avg !== null ? (avg >= 4 ? '#22c55e' : avg >= 3 ? '#f59e0b' : '#ef4444') : primary }} />
                <div style={{ padding: '1rem 1.125rem' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{f.periodLabel}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <HugeiconsIcon icon={UserIcon} size={12} />
                        {f.trainerName}
                        <span style={{ opacity: 0.5 }}>·</span>
                        {format(parseISO(f.createdAt), 'd. MMM yyyy', { locale: de })}
                      </div>
                    </div>
                    {avg !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: avg >= 4 ? '#22c55e' : avg >= 3 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{avg.toFixed(1)}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>von 5</div>
                      </div>
                    )}
                  </div>

                  {/* Ratings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: f.comment ? '0.875rem' : 0 }}>
                    <StarRow label="Pünktlichkeit" value={f.ratingPunctuality} />
                    <StarRow label="Einsatz & Motivation" value={f.ratingEffort} />
                    <StarRow label="Fachkompetenz" value={f.ratingExpertise} />
                    <StarRow label="Sozialverhalten" value={f.ratingSocial} />
                  </div>

                  {/* Comment */}
                  {f.comment && (
                    <div style={{ background: 'hsl(var(--muted)/0.5)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
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
