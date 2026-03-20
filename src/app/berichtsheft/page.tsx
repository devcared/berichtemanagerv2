'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isToday, isSameDay,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { getISOWeekYear } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useProfile } from '@/hooks/use-profile'
import { useReports } from '@/hooks/use-reports'
import { formatWeekId, getISOWeek, getCurrentWeekId, getCalendarWeekLabel } from '@/lib/week-utils'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { cn } from '@/lib/utils'
import {
  Add01Icon,
  ChevronLeft,
  ChevronRight,
  ArrowRight01Icon,
  BuildingIcon,
  UserIcon,
  CalendarIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { WeeklyReport } from '@/types'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getDayIndex(date: Date): number {
  const d = getDay(date)
  return d === 0 ? 6 : d - 1
}

/* ── Compact mini calendar ── */
function MiniCalendar({ reports }: { reports: WeeklyReport[] }) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const reportsByWeek = useMemo(() => {
    const map: Record<string, WeeklyReport> = {}
    reports.forEach(r => { map[formatWeekId(r.year, r.calendarWeek)] = r })
    return map
  }, [reports])

  const { days, prefixDays } = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end   = endOfMonth(currentMonth)
    const days  = eachDayOfInterval({ start, end })
    return { days, prefixDays: Array<null>(getDayIndex(start)).fill(null) }
  }, [currentMonth])

  function getDotColor(date: Date): string | null {
    const key = formatWeekId(getISOWeekYear(date), getISOWeek(date))
    const r = reportsByWeek[key]
    if (!r) return null
    if (r.status === 'approved')   return '#22c55e'
    if (r.status === 'submitted' || r.status === 'in_review') return '#3b82f6'
    if (r.status === 'needs_revision') return '#ef4444'
    if (r.status === 'draft')      return '#eab308'
    return null
  }

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <HugeiconsIcon icon={ChevronLeft} size={13} />
          </button>
          <button
            onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            style={{ width: 26, height: 26, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <HugeiconsIcon icon={ChevronRight} size={13} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {prefixDays.map((_, i) => <div key={`p-${i}`} />)}
        {days.map(date => {
          const dot  = getDotColor(date)
          const today = isToday(date)
          const inMonth = isSameMonth(date, currentMonth)
          const weekId = formatWeekId(getISOWeekYear(date), getISOWeek(date))

          return (
            <button
              key={date.toISOString()}
              onClick={() => router.push(`/berichtsheft/editor/${weekId}`)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '3px 0', borderRadius: 6, border: 'none',
                background: today ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                cursor: 'pointer', transition: 'background 100ms',
                opacity: inMonth ? 1 : 0.3,
              }}
              onMouseEnter={e => { if (!today) e.currentTarget.style.background = 'hsl(var(--accent))' }}
              onMouseLeave={e => { if (!today) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '0.6875rem', fontWeight: today ? 600 : 400, color: today ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                {format(date, 'd')}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: dot ?? 'transparent', marginTop: 1, flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: '#22c55e', label: 'Freigegeben' },
          { color: '#3b82f6', label: 'Eingereicht' },
          { color: '#eab308', label: 'Entwurf' },
          { color: '#ef4444', label: 'Überarbeiten' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function BerichtsheftDashboard() {
  const router  = useRouter()
  const { profile } = useProfile()
  const { reports, loading } = useReports()

  const vacationUsed  = 8
  const vacationTotal = 25
  const sickUsed      = 3

  const currentWeekId  = getCurrentWeekId()
  const currentReport  = useMemo(() => {
    const map: Record<string, WeeklyReport> = {}
    reports.forEach(r => { map[formatWeekId(r.year, r.calendarWeek)] = r })
    return map[currentWeekId]
  }, [reports, currentWeekId])

  const recentReports = reports.slice(0, 5)
  const trainingYear  = profile?.currentYear ?? 1
  const totalYears    = 3

  const trainingStart = profile?.trainingStart ? new Date(profile.trainingStart) : null
  const trainingEnd   = profile?.trainingEnd   ? new Date(profile.trainingEnd)   : null
  const trainingPct   = trainingStart && trainingEnd
    ? Math.min(100, Math.max(0, Math.round(((Date.now() - trainingStart.getTime()) / (trainingEnd.getTime() - trainingStart.getTime())) * 100)))
    : 0

  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : 'AZ'

  const currentKW = getCalendarWeekLabel(getISOWeek(new Date()), getISOWeekYear(new Date()))

  function statusBg(status: WeeklyReport['status']) {
    if (status === 'approved')     return 'rgba(34,197,94,0.08)'
    if (status === 'submitted' || status === 'in_review') return 'rgba(59,130,246,0.08)'
    if (status === 'needs_revision') return 'rgba(239,68,68,0.08)'
    return 'rgba(234,179,8,0.08)'
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))',
    marginBottom: '0.75rem',
  }

  const card: React.CSSProperties = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 12,
    padding: '1.125rem',
  }

  return (
<<<<<<< HEAD
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <Button className="self-start sm:self-auto" onClick={() => router.push(`/berichtsheft/editor/${currentWeekId}`)}>
          <HugeiconsIcon icon={Add01Icon} size={16} data-icon="inline-start" />
          <span className="hidden sm:inline">Aktuelle KW ausfüllen</span>
          <span className="sm:hidden">KW ausfüllen</span>
        </Button>
      </div>
=======
    <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="lg:grid-cols-[1fr_300px]">
>>>>>>> c7e38c75d92a41da0e090cad901c0eb81b72169b

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* 1. Current week status */}
          <div style={card}>
            <p style={sectionLabel}>Aktuelle Woche</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '1.0625rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: 6 }}>
                  {currentKW}
                </div>
                {currentReport ? (
                  <StatusBadge status={currentReport.status} />
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>Noch kein Bericht angelegt</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {currentReport && (currentReport.status === 'draft' || currentReport.status === 'needs_revision') && (
                  <Button size="sm" onClick={() => router.push(`/berichtsheft/editor/${currentWeekId}`)}>
                    Bericht öffnen
                  </Button>
                )}
                {currentReport && currentReport.status !== 'draft' && currentReport.status !== 'needs_revision' && (
                  <Button size="sm" variant="outline" onClick={() => router.push(`/berichtsheft/editor/${currentWeekId}`)}>
                    Ansehen
                  </Button>
                )}
                {!currentReport && (
                  <Button size="sm" onClick={() => router.push(`/berichtsheft/editor/${currentWeekId}`)}>
                    <HugeiconsIcon icon={Add01Icon} size={15} style={{ marginRight: 4 }} />
                    Neuen Bericht erstellen
                  </Button>
                )}
              </div>
            </div>
            {currentReport?.status === 'approved' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.8125rem', color: '#22c55e' }}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                <span>Freigegeben</span>
              </div>
            )}
          </div>

          {/* 2. Recent reports list */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <p style={{ ...sectionLabel, marginBottom: 0 }}>Letzte Berichte</p>
              <button
                onClick={() => router.push('/berichtsheft/kalender')}
                style={{ fontSize: '0.8125rem', color: 'hsl(var(--primary))', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
              >
                Alle anzeigen
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '1rem 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', textAlign: 'center' }}>
                Laden…
              </div>
            ) : recentReports.length === 0 ? (
              <div style={{ padding: '1rem 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', textAlign: 'center' }}>
                Noch keine Berichte
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentReports.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => router.push(`/berichtsheft/editor/${formatWeekId(r.year, r.calendarWeek)}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 8px', border: 'none', cursor: 'pointer',
                      background: 'transparent', textAlign: 'left', fontFamily: 'inherit',
                      borderRadius: 8, transition: 'background 100ms',
                      borderTop: i > 0 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                        KW {r.calendarWeek} / {r.year}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>
                        {format(new Date(r.weekStart), 'dd.MM.')} – {format(new Date(r.weekEnd), 'dd.MM.yyyy')}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                    <HugeiconsIcon icon={ArrowRight01Icon} size={15} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Shortcuts */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: '+ Neuer Bericht', href: `/berichtsheft/editor/${currentWeekId}` },
              { label: 'Kalender', href: '/berichtsheft/kalender' },
              { label: 'Statistiken', href: '/berichtsheft/statistiken' },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
                  fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--card))')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile card */}
          <div style={card}>
            <p style={sectionLabel}>Profil</p>
            {profile ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.firstName} {profile.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.occupation}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                    <HugeiconsIcon icon={BuildingIcon} size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.companyName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                    <HugeiconsIcon icon={UserIcon} size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.trainerName}</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>Kein Profil</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/setup')}>Einrichten</Button>
              </div>
            )}
          </div>

          {/* Training progress */}
          <div style={card}>
            <p style={sectionLabel}>Ausbildungsfortschritt</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                  <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                    Ausbildungsjahr {trainingYear} von {totalYears}
                  </span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{trainingPct}%</span>
                </div>
                <Progress value={trainingPct} className="h-1.5" />
              </div>
              <div style={{ height: 1, background: 'hsl(var(--border))' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Urlaub</span>
                  <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{vacationUsed} / {vacationTotal} Tage</span>
                </div>
                <Progress value={(vacationUsed / vacationTotal) * 100} className="h-1.5" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Kranktage</span>
                  <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{sickUsed} Tage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini calendar */}
          <div style={card}>
            <MiniCalendar reports={reports} />
          </div>
        </div>
      </div>
    </div>
  )
}
