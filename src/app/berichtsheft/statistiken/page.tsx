/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useReports } from '@/hooks/use-reports'
import { useProfile } from '@/hooks/use-profile'
import { formatWeekId, getCalendarWeekLabel } from '@/lib/week-utils'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { cn } from '@/lib/utils'
import {
  Add01Icon,
  ClockIcon,
  BuildingIcon,
  BookOpenIcon,
  AnalyticsUpIcon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getISOWeekYear, eachWeekOfInterval, getISOWeek as fnsGetISOWeek } from 'date-fns'
import type { WeeklyReport } from '@/types'

function CompletionRing({ percentage }: { percentage: number }) {
  const size = 140
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
        <span className="text-xs text-muted-foreground mt-0.5">Abgeschlossen</span>
      </div>
    </div>
  )
}

export default function StatistikenPage() {
  const router = useRouter()
  const { reports, loading } = useReports()
  const { profile } = useProfile()

  const stats = useMemo(() => {
    const completed = reports.filter(r => r.status === 'submitted' || r.status === 'in_review' || r.status === 'approved').length
    const drafts = reports.filter(r => r.status === 'draft').length
    const total = reports.length
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

    let totalHours = 0
    let companyHours = 0
    let schoolHours = 0
    let interCompanyHours = 0
    let vacationDays = 0
    let sickDays = 0

    reports.forEach(r => {
      totalHours += r.totalHours
      r.entries.forEach(e => {
        if (e.category === 'company') companyHours += e.hours
        else if (e.category === 'vocationalSchool') schoolHours += e.hours
        else if (e.category === 'interCompany') interCompanyHours += e.hours
        else if (e.category === 'vacation') vacationDays++
        else if (e.category === 'sick') sickDays++
      })
    })

    return {
      completed,
      drafts,
      total,
      completionPct,
      totalHours,
      companyHours,
      schoolHours,
      interCompanyHours,
      vacationDays,
      sickDays,
    }
  }, [reports])

  // Find missing weeks (training period so far)
  const missingWeeks = useMemo(() => {
    if (!profile) return []
    const reportSet = new Set(reports.map(r => formatWeekId(r.year, r.calendarWeek)))
    const trainingStart = new Date(profile.trainingStart)
    const now = new Date()
    // Get all work weeks from training start to now
    const weeks = eachWeekOfInterval(
      { start: trainingStart, end: now },
      { weekStartsOn: 1 }
    )
    return weeks
      .map(w => ({
        week: fnsGetISOWeek(w),
        year: getISOWeekYear(w),
        date: w,
      }))
      .filter(({ week, year }) => !reportSet.has(formatWeekId(year, week)))
      .slice(-10)
      .reverse()
  }, [profile, reports])

  const weeklyTarget = profile?.weeklyHours ?? 40
  const hoursPct = stats.totalHours > 0 ? Math.min(100, Math.round((stats.companyHours / stats.totalHours) * 100)) : 0
  const schoolPct = stats.totalHours > 0 ? Math.min(100, Math.round((stats.schoolHours / stats.totalHours) * 100)) : 0
  const interPct = stats.totalHours > 0 ? Math.min(100, Math.round((stats.interCompanyHours / stats.totalHours) * 100)) : 0

  const vacationMax = 25
  const sickMax = 15

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-medium text-foreground">Statistiken</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Übersicht deines Ausbildungsfortschritts</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Lade Daten...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Completion Ring */}
          <Card className="bg-card border-border md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={AnalyticsUpIcon} size={16} className="text-primary" />
                Fortschritt
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <CompletionRing percentage={stats.completionPct} />
              <div className="grid grid-cols-3 w-full gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Gesamt</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-500">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Fertig</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-500">{stats.drafts}</div>
                  <div className="text-xs text-muted-foreground">Entwürfe</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hours Breakdown */}
          <Card className="bg-card border-border md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={ClockIcon} size={16} className="text-primary" />
                Stunden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-foreground">{stats.totalHours}</div>
                <div className="text-sm text-muted-foreground mt-1">Gesamtstunden</div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500 inline-block" />
                      Betrieb
                    </span>
                    <span className="text-foreground font-medium">{stats.companyHours}h ({hoursPct}%)</span>
                  </div>
                  <Progress value={hoursPct} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                      Berufsschule
                    </span>
                    <span className="text-foreground font-medium">{stats.schoolHours}h ({schoolPct}%)</span>
                  </div>
                  <Progress value={schoolPct} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-violet-500 inline-block" />
                      Überbetrieblich
                    </span>
                    <span className="text-foreground font-medium">{stats.interCompanyHours}h ({interPct}%)</span>
                  </div>
                  <Progress value={interPct} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Absences */}
          <Card className="bg-card border-border md:col-span-2 xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={BookOpenIcon} size={16} className="text-primary" />
                Abwesenheiten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">Urlaub</span>
                    <span className={cn(
                      'font-semibold text-xs',
                      stats.vacationDays > vacationMax * 0.8 ? 'text-red-400' : 'text-foreground'
                    )}>
                      {stats.vacationDays} / {vacationMax} Tage
                    </span>
                  </div>
                  <Progress
                    value={(stats.vacationDays / vacationMax) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">Krank</span>
                    <span className={cn(
                      'font-semibold text-xs',
                      stats.sickDays > sickMax * 0.8 ? 'text-red-400' : 'text-foreground'
                    )}>
                      {stats.sickDays} / {sickMax} Tage
                    </span>
                  </div>
                  <Progress
                    value={(stats.sickDays / sickMax) * 100}
                    className="h-2"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-2xl font-bold text-amber-400">{stats.vacationDays}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Urlaubstage</div>
                  <div className="text-xs text-muted-foreground">{vacationMax - stats.vacationDays} übrig</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-2xl font-bold text-red-400">{stats.sickDays}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Kranktage</div>
                  <div className="text-xs text-muted-foreground">{sickMax - stats.sickDays} übrig</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Missing Weeks */}
          {missingWeeks.length > 0 && (
            <Card className="bg-card border-border md:col-span-2 xl:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-yellow-500" />
                  Fehlende Berichte
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {missingWeeks.length} ausstehend
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {missingWeeks.map(({ week, year, date }) => (
                    <div
                      key={formatWeekId(year, week)}
                      className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
                          <span className="text-yellow-500 text-xs font-bold">{week}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {getCalendarWeekLabel(week, year)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(date, "d. MMM yyyy", { locale: de })}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                        onClick={() => router.push(`/berichtsheft/editor/${formatWeekId(year, week)}`)}
                      >
                        <HugeiconsIcon icon={Add01Icon} size={14} data-icon="inline-start" />
                        Jetzt ausfüllen
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
