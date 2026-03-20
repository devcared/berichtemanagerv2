'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getISOWeekYear, eachWeekOfInterval, getISOWeek as fnsGetISOWeek } from 'date-fns'
import { Progress } from '@/components/ui/progress'
import { useReports } from '@/hooks/use-reports'
import { useProfile } from '@/hooks/use-profile'
import { formatWeekId, getCalendarWeekLabel } from '@/lib/week-utils'
import {
  AnalyticsUpIcon, ClockIcon, BuildingIcon, BookOpenIcon, AlertCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

function CompletionRing({ percentage }: { percentage: number }) {
  const size = 120
  const sw   = 9
  const r    = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={sw} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--primary))" strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1 }}>{percentage}%</span>
        <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Fertig</span>
      </div>
    </div>
  )
}

export default function StatistikenPage() {
  const router  = useRouter()
  const { reports, loading } = useReports()
  const { profile } = useProfile()

  const stats = useMemo(() => {
    const completed = reports.filter(r => ['submitted', 'in_review', 'approved'].includes(r.status)).length
    const approved  = reports.filter(r => r.status === 'approved').length
    const drafts    = reports.filter(r => r.status === 'draft').length
    const total     = reports.length
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

    let totalHours = 0, companyH = 0, schoolH = 0, interH = 0, vacDays = 0, sickDays = 0

    reports.forEach(r => {
      totalHours += r.totalHours
      r.entries.forEach(e => {
        if (e.category === 'company')          companyH += e.hours
        else if (e.category === 'vocationalSchool') schoolH += e.hours
        else if (e.category === 'interCompany')     interH  += e.hours
        else if (e.category === 'vacation')         vacDays++
        else if (e.category === 'sick')             sickDays++
      })
    })

    return { completed, approved, drafts, total, completionPct, totalHours, companyH, schoolH, interH, vacDays, sickDays }
  }, [reports])

  const missingWeeks = useMemo(() => {
    if (!profile) return []
    const reportSet = new Set(reports.map(r => formatWeekId(r.year, r.calendarWeek)))
    const trainingStart = new Date(profile.trainingStart)
    const now = new Date()
    return eachWeekOfInterval({ start: trainingStart, end: now }, { weekStartsOn: 1 })
      .map(w => ({ week: fnsGetISOWeek(w), year: getISOWeekYear(w), date: w }))
      .filter(({ week, year }) => !reportSet.has(formatWeekId(year, week)))
      .slice(-8)
      .reverse()
  }, [profile, reports])

  const vacMax  = 25
  const sickMax = 15

  const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.875rem',
  }

  const card: React.CSSProperties = {
    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
    borderRadius: 12, padding: '1.125rem',
  }

  if (loading) {
    return (
      <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
        Lade Statistiken…
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: 2 }}>Statistiken</h1>
        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Auswertung deines Ausbildungsfortschritts</p>
      </div>

      {/* ── Top stat grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { value: stats.total,       label: 'Berichte gesamt',    color: 'hsl(var(--foreground))' },
          { value: stats.approved,    label: 'Freigegeben',        color: '#22c55e' },
          { value: stats.completed,   label: 'Eingereicht',        color: '#3b82f6' },
          { value: stats.drafts,      label: 'Entwürfe',           color: '#eab308' },
          { value: stats.totalHours,  label: 'Stunden gesamt',     color: 'hsl(var(--foreground))' },
          { value: stats.vacDays,     label: 'Urlaubstage',        color: '#8b5cf6' },
          { value: stats.sickDays,    label: 'Kranktage',          color: '#ef4444' },
          { value: missingWeeks.length, label: 'Fehlende Wochen',  color: '#f97316' },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ ...card, textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="md:grid-cols-2 xl:grid-cols-3">

        {/* Completion ring */}
        <div style={card}>
          <p style={sectionLabel}>Berichts-Fortschritt</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <CompletionRing percentage={stats.completionPct} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Freigegeben', value: stats.approved,  color: '#22c55e' },
                { label: 'Eingereicht', value: stats.completed - stats.approved, color: '#3b82f6' },
                { label: 'Entwürfe',    value: stats.drafts,    color: '#eab308' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hours breakdown */}
        <div style={card}>
          <p style={sectionLabel}>Stunden-Aufteilung</p>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1 }}>{stats.totalHours}</div>
            <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Gesamtstunden</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { label: 'Betrieb',     icon: BuildingIcon,  value: stats.companyH, percent: pct(stats.companyH, stats.totalHours), color: '#3b82f6' },
              { label: 'Berufsschule', icon: BookOpenIcon, value: stats.schoolH,  percent: pct(stats.schoolH,  stats.totalHours), color: '#8b5cf6' },
              { label: 'Überbetrieblich', icon: BuildingIcon, value: stats.interH, percent: pct(stats.interH,  stats.totalHours), color: '#06b6d4' },
            ].map(({ label, icon, value, percent, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HugeiconsIcon icon={icon} size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{value}h <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>({percent}%)</span></span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'hsl(var(--border))', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 500ms ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Absences */}
        <div style={card}>
          <p style={sectionLabel}>Abwesenheiten</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Urlaub</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{stats.vacDays} / {vacMax} Tage</span>
              </div>
              <Progress value={pct(stats.vacDays, vacMax)} className="h-1.5" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Kranktage</span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{stats.sickDays} Tage</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'hsl(var(--border))', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, pct(stats.sickDays, sickMax))}%`, height: '100%', background: '#ef4444', borderRadius: 3, transition: 'width 500ms ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missing weeks */}
      {missingWeeks.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
            <HugeiconsIcon icon={AlertCircleIcon} size={16} style={{ color: '#f97316', flexShrink: 0 }} />
            <p style={{ ...sectionLabel, marginBottom: 0 }}>Fehlende Wochen ({missingWeeks.length})</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {missingWeeks.map((w, i) => (
              <button
                key={`${w.year}-${w.week}`}
                onClick={() => router.push(`/berichtsheft/editor/${formatWeekId(w.year, w.week)}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', textAlign: 'left', fontFamily: 'inherit',
                  borderRadius: 8, transition: 'background 100ms',
                  borderTop: i > 0 ? '1px solid hsl(var(--border))' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
                  {getCalendarWeekLabel(w.week, w.year)}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(249,115,22,0.12)', color: '#f97316', fontWeight: 500 }}>
                  Ausstehend
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
