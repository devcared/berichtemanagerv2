'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameWeek,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { getISOWeekYear } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useReports } from '@/hooks/use-reports'
import { formatWeekId, getISOWeek } from '@/lib/week-utils'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Add01Icon, Calendar01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { WeeklyReport } from '@/types'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getDayIndex(date: Date): number {
  const d = getDay(date)
  return d === 0 ? 6 : d - 1
}

function statusColor(status: WeeklyReport['status']): string {
  if (status === 'approved')       return 'rgba(34,197,94,0.08)'
  if (status === 'submitted' || status === 'in_review') return 'rgba(59,130,246,0.08)'
  if (status === 'needs_revision') return 'rgba(239,68,68,0.08)'
  if (status === 'draft')          return 'rgba(234,179,8,0.08)'
  return 'transparent'
}

function statusDot(status: WeeklyReport['status']): string {
  if (status === 'approved')       return '#22c55e'
  if (status === 'submitted' || status === 'in_review') return '#3b82f6'
  if (status === 'needs_revision') return '#ef4444'
  if (status === 'draft')          return '#eab308'
  return 'transparent'
}

export default function KalenderPage() {
  const router = useRouter()
  const { reports } = useReports()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = new Date()

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

  function getReport(date: Date) {
    return reportsByWeek[formatWeekId(getISOWeekYear(date), getISOWeek(date))]
  }

  function navigateToWeek(date: Date) {
    router.push(`/berichtsheft/editor/${formatWeekId(getISOWeekYear(date), getISOWeek(date))}`)
  }

  /* Build week rows for the current month */
  const weekRows = useMemo(() => {
    const rows: Date[][] = []
    if (days.length === 0) return rows

    // Start from first Monday on or before the first day
    const firstDay = startOfMonth(currentMonth)
    const startMon = startOfWeek(firstDay, { weekStartsOn: 1 })
    const lastDay  = endOfMonth(currentMonth)
    const endSun   = endOfWeek(lastDay, { weekStartsOn: 1 })

    const allDays = eachDayOfInterval({ start: startMon, end: endSun })
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7))
    }
    return rows
  }, [currentMonth, days.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 'clamp(1rem, 3vw, 1.5rem)', gap: '1.25rem', fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: 2 }}>Kalender</h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            Alle Berichtswochen auf einen Blick
          </p>
        </div>
        <Button
          onClick={() => navigateToWeek(today)}
          size="sm"
        >
          <HugeiconsIcon icon={Add01Icon} size={15} style={{ marginRight: 6 }} />
          Neue Woche
        </Button>
      </div>

      {/* Calendar card */}
      <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, overflow: 'hidden', flex: 1 }}>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 100ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <HugeiconsIcon icon={ChevronLeft} size={16} />
            </button>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--foreground))', minWidth: 160, textAlign: 'center' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </h2>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 100ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <HugeiconsIcon icon={ChevronRight} size={16} />
            </button>
          </div>

          <button
            onClick={() => setCurrentMonth(new Date())}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', color: 'hsl(var(--foreground))', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 100ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <HugeiconsIcon icon={Calendar01Icon} size={14} />
            Heute
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ padding: '8px 0', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.04em' }}>
            KW
          </div>
          {DAY_LABELS.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.04em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div>
          {weekRows.map((week, wi) => {
            const mondayOfWeek = week[0]
            const kw = getISOWeek(mondayOfWeek)
            const yr = getISOWeekYear(mondayOfWeek)
            const report = reportsByWeek[formatWeekId(yr, kw)]
            const isCurrentWeek = isSameWeek(mondayOfWeek, today, { weekStartsOn: 1 })

            return (
              <div
                key={wi}
                onClick={() => navigateToWeek(mondayOfWeek)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px repeat(7, 1fr)',
                  borderBottom: '1px solid hsl(var(--border))',
                  cursor: 'pointer',
                  background: report ? statusColor(report.status) : isCurrentWeek ? 'hsl(var(--primary) / 0.04)' : 'transparent',
                  transition: 'background 100ms',
                  minHeight: 72,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                onMouseLeave={e => (e.currentTarget.style.background = report ? statusColor(report.status) : isCurrentWeek ? 'hsl(var(--primary) / 0.04)' : 'transparent')}
              >
                {/* KW cell */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', borderRight: '1px solid hsl(var(--border))', gap: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: isCurrentWeek ? 700 : 500, color: isCurrentWeek ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                    {kw}
                  </span>
                  {report && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot(report.status), flexShrink: 0 }} />
                  )}
                </div>

                {/* Day cells */}
                {week.map((date, di) => {
                  const inMonth = isSameMonth(date, currentMonth)
                  const isWeekend = di >= 5
                  const isCurrent = isToday(date)

                  return (
                    <div
                      key={di}
                      style={{
                        padding: '8px 6px',
                        borderRight: di < 6 ? '1px solid hsl(var(--border) / 0.4)' : 'none',
                        opacity: inMonth ? 1 : 0.35,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8125rem',
                        fontWeight: isCurrent ? 700 : 400,
                        background: isCurrent ? 'hsl(var(--primary))' : 'transparent',
                        color: isCurrent ? 'white' : isWeekend ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                      }}>
                        {format(date, 'd')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Status legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '0.875rem 1.25rem', borderTop: '1px solid hsl(var(--border))' }}>
          {[
            { color: '#22c55e', label: 'Freigegeben' },
            { color: '#3b82f6', label: 'Eingereicht / In Prüfung' },
            { color: '#eab308', label: 'Entwurf' },
            { color: '#ef4444', label: 'Überarbeitung nötig' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
