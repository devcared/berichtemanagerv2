'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useReports } from '@/hooks/use-reports'
import { formatWeekId, getISOWeek } from '@/lib/week-utils'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Add01Icon,
  Calendar01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getISOWeekYear } from 'date-fns'
import type { WeeklyReport } from '@/types'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getDayIndex(date: Date): number {
  const d = getDay(date)
  return d === 0 ? 6 : d - 1
}

export default function KalenderPage() {
  const router = useRouter()
  const { reports } = useReports()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const reportsByWeek = useMemo(() => {
    const map: Record<string, WeeklyReport> = {}
    reports.forEach(r => {
      const key = formatWeekId(r.year, r.calendarWeek)
      map[key] = r
    })
    return map
  }, [reports])

  const { days, prefixDays } = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const d = eachDayOfInterval({ start, end })
    const prefix: null[] = Array(getDayIndex(start)).fill(null)
    return { days: d, prefixDays: prefix }
  }, [currentMonth])

  function getDayReport(date: Date): WeeklyReport | undefined {
    const week = getISOWeek(date)
    const year = getISOWeekYear(date)
    return reportsByWeek[formatWeekId(year, week)]
  }

  function navigateToWeek(date: Date) {
    const week = getISOWeek(date)
    const year = getISOWeekYear(date)
    router.push(`/berichtsheft/editor/${formatWeekId(year, week)}`)
  }

  function getDotStyle(date: Date): { className: string; show: boolean } {
    const report = getDayReport(date)
    if (!report) return { className: '', show: false }
    if (report.status === 'completed' || report.status === 'exported')
      return { className: 'bg-green-500', show: true }
    if (report.status === 'draft')
      return { className: 'bg-yellow-500', show: true }
    return { className: '', show: false }
  }

  const today = new Date()

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Übersicht aller Berichtswochen</p>
        </div>
        <Button
          onClick={() => {
            const week = getISOWeek(today)
            const year = getISOWeekYear(today)
            router.push(`/berichtsheft/editor/${formatWeekId(year, week)}`)
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} data-icon="inline-start" />
          Neue Woche
        </Button>
      </div>

      <Card className="bg-card border-border flex-1">
        <CardContent className="p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              >
                <HugeiconsIcon icon={ChevronLeft} size={16} />
              </Button>
              <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              >
                <HugeiconsIcon icon={ChevronRight} size={16} />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="text-xs"
              >
                <HugeiconsIcon icon={Calendar01Icon} size={14} data-icon="inline-start" />
                Heute
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {prefixDays.map((_, i) => (
              <div key={`prefix-${i}`} className="bg-background min-h-[80px]" />
            ))}

            {days.map(day => {
              const dayIdx = getDayIndex(day)
              const isWeekend = dayIdx >= 5
              const isCurrentDay = isToday(day)
              const inMonth = isSameMonth(day, currentMonth)
              const dot = getDotStyle(day)
              const dayKey = day.toISOString()
              const isHovered = hoveredDay === dayKey
              const report = getDayReport(day)

              return (
                <div
                  key={dayKey}
                  onClick={() => !isWeekend && navigateToWeek(day)}
                  onMouseEnter={() => !isWeekend && setHoveredDay(dayKey)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={cn(
                    'bg-background min-h-[80px] p-2 flex flex-col gap-1 relative transition-colors',
                    !isWeekend && 'cursor-pointer hover:bg-accent/30',
                    isCurrentDay && 'bg-primary/5',
                  )}
                  style={
                    isWeekend
                      ? {
                          backgroundImage:
                            'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.02) 4px, rgba(255,255,255,0.02) 8px)',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-xs font-medium size-6 flex items-center justify-center rounded-full',
                      isCurrentDay
                        ? 'bg-primary text-primary-foreground'
                        : isWeekend
                          ? 'text-muted-foreground/40'
                          : 'text-foreground',
                      !inMonth && 'opacity-40',
                    )}>
                      {format(day, 'd')}
                    </span>

                    {!isWeekend && isHovered && !report && (
                      <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <HugeiconsIcon icon={Add01Icon} size={10} className="text-primary" />
                      </div>
                    )}
                  </div>

                  {dot.show && !isWeekend && (
                    <div className="flex items-center gap-1">
                      <div className={cn('size-1.5 rounded-full', dot.className)} />
                      {report && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {report.totalHours}h
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Fill remaining cells */}
            {Array.from({
              length: (7 - ((prefixDays.length + days.length) % 7)) % 7,
            }).map((_, i) => (
              <div key={`suffix-${i}`} className="bg-background min-h-[80px]" />
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-green-500" />
              <span>Abgeschlossen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-yellow-500" />
              <span>Entwurf</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="size-3 rounded-sm"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
              <span>Wochenende</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent reports list */}
      {reports.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Alle Berichte</h3>
            <div className="space-y-2">
              {reports.map(report => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 cursor-pointer transition-colors"
                  onClick={() => router.push(`/berichtsheft/editor/${formatWeekId(report.year, report.calendarWeek)}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-bold">{report.calendarWeek}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        KW {report.calendarWeek} / {report.year}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(report.weekStart), 'd. MMM', { locale: de })} –{' '}
                        {format(new Date(report.weekEnd), 'd. MMM yyyy', { locale: de })} · {report.totalHours}h
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
