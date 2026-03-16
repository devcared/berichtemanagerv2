'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useProfile } from '@/hooks/use-profile'
import { useReports } from '@/hooks/use-reports'
import { formatWeekId, getISOWeek, getCurrentWeekId, getCalendarWeekLabel } from '@/lib/week-utils'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { cn } from '@/lib/utils'
import {
  BuildingIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckmarkCircle01Icon,
  Add01Icon,
  ChevronLeft,
  ChevronRight,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getISOWeekYear } from 'date-fns'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function getDayIndex(date: Date): number {
  // getDay returns 0=Sun, 1=Mon,...
  const d = getDay(date)
  return d === 0 ? 6 : d - 1
}

export default function BerichtsheftDashboard() {
  const router = useRouter()
  const { profile } = useProfile()
  const { reports, loading } = useReports()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [vacationUsed] = useState(8)
  const [sickUsed] = useState(3)
  const vacationTotal = 25
  const sickTotal = 15

  const completedReports = reports.filter(r => r.status === 'completed' || r.status === 'exported').length
  const totalReports = reports.length
  const completionPct = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0

  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : 'AZ'

  // Calendar days for current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    const firstDayIndex = getDayIndex(start)
    const prefixDays: null[] = Array(firstDayIndex).fill(null)
    return { days, prefixDays }
  }, [currentMonth])

  // Map reports by weekId
  const reportsByWeek = useMemo(() => {
    const map: Record<string, typeof reports[0]> = {}
    reports.forEach(r => {
      const key = formatWeekId(r.year, r.calendarWeek)
      map[key] = r
    })
    return map
  }, [reports])

  function getDayReport(date: Date) {
    const week = getISOWeek(date)
    const year = getISOWeekYear(date)
    const key = formatWeekId(year, week)
    return reportsByWeek[key]
  }

  function getDayDotColor(date: Date): string | null {
    const report = getDayReport(date)
    if (!report) return null
    if (report.status === 'completed' || report.status === 'exported') return 'bg-green-500'
    if (report.status === 'draft') return 'bg-yellow-500'
    return null
  }

  function navigateToWeek(date: Date) {
    const week = getISOWeek(date)
    const year = getISOWeekYear(date)
    router.push(`/berichtsheft/editor/${formatWeekId(year, week)}`)
  }

  const currentWeekId = getCurrentWeekId()
  const currentReport = reportsByWeek[currentWeekId]

  const trainingStartYear = profile?.trainingStart
    ? new Date(profile.trainingStart).getFullYear()
    : new Date().getFullYear()
  const trainingYear = profile?.currentYear ?? 1

  const recentReports = reports.slice(0, 5)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <Button onClick={() => router.push(`/berichtsheft/editor/${currentWeekId}`)}>
          <HugeiconsIcon icon={Add01Icon} size={16} data-icon="inline-start" />
          Aktuelle KW ausfüllen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Profile Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              {profile ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="size-14">
                      <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-foreground text-lg">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {profile.occupation}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={BuildingIcon} size={14} className="shrink-0" />
                      <span className="truncate">{profile.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={UserIcon} size={14} className="shrink-0" />
                      <span className="truncate">Ausbilder: {profile.trainerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={CalendarIcon} size={14} className="shrink-0" />
                      <span>Beginn: {format(new Date(profile.trainingStart), 'dd.MM.yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={ClockIcon} size={14} className="shrink-0" />
                      <span>Ausbildungsjahr {trainingYear}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Absence bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Urlaub</span>
                        <span className="text-foreground font-medium">{vacationUsed} / {vacationTotal} Tage</span>
                      </div>
                      <Progress value={(vacationUsed / vacationTotal) * 100} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Kranktage</span>
                        <span className="text-foreground font-medium">{sickUsed} / {sickTotal} Tage</span>
                      </div>
                      <Progress value={(sickUsed / sickTotal) * 100} className="h-1.5" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">Kein Profil vorhanden</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/berichtsheft/profil/setup')}
                  >
                    Profil einrichten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{totalReports}</div>
                <div className="text-xs text-muted-foreground mt-1">Berichte gesamt</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{completionPct}%</div>
                <div className="text-xs text-muted-foreground mt-1">Abgeschlossen</div>
              </CardContent>
            </Card>
          </div>

          {/* Current Week CTA */}
          <Card className={cn(
            "border",
            currentReport?.status === 'completed' || currentReport?.status === 'exported'
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-yellow-500/30 bg-yellow-500/5'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {getCalendarWeekLabel(getISOWeek(new Date()), getISOWeekYear(new Date()))}
                </span>
                {currentReport ? (
                  <StatusBadge status={currentReport.status} />
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/40 text-xs">
                    Ausstehend
                  </Badge>
                )}
              </div>
              {(!currentReport || currentReport.status === 'draft') && (
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => router.push(`/berichtsheft/editor/${currentWeekId}`)}
                >
                  Jetzt ausfüllen
                </Button>
              )}
              {(currentReport?.status === 'completed' || currentReport?.status === 'exported') && (
                <div className="flex items-center gap-1.5 text-xs text-green-500 mt-1">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                  <span>Woche abgeschlossen</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Calendar + Recent Reports */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Calendar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {format(currentMonth, 'MMMM yyyy', { locale: de })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  >
                    <HugeiconsIcon icon={ChevronLeft} size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  >
                    <HugeiconsIcon icon={ChevronRight} size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-px mb-2">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {monthDays.prefixDays.map((_, i) => (
                  <div key={`prefix-${i}`} />
                ))}
                {monthDays.days.map(day => {
                  const dayIdx = getDayIndex(day)
                  const isWeekend = dayIdx >= 5
                  const today = isToday(day)
                  const inMonth = isSameMonth(day, currentMonth)
                  const dotColor = getDayDotColor(day)

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => !isWeekend && navigateToWeek(day)}
                      className={cn(
                        'relative flex flex-col items-center justify-center rounded-md p-1 min-h-[44px] text-xs select-none',
                        isWeekend
                          ? 'cursor-default'
                          : 'cursor-pointer hover:bg-accent',
                        today && 'ring-1 ring-primary',
                        !inMonth && 'opacity-30',
                      )}
                      style={
                        isWeekend
                          ? {
                              backgroundImage:
                                'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 6px)',
                            }
                          : undefined
                      }
                    >
                      <span className={cn(
                        'font-medium',
                        today ? 'text-primary' : isWeekend ? 'text-muted-foreground/50' : 'text-foreground',
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dotColor && !isWeekend && (
                        <div className={cn('size-1.5 rounded-full mt-0.5', dotColor)} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span>Abgeschlossen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-yellow-500" />
                  <span>Entwurf</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-muted-foreground/40" />
                  <span>Fehlend</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Zuletzt bearbeitet</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-sm text-muted-foreground py-4 text-center">Lade Berichte...</div>
              ) : recentReports.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Noch keine Berichte vorhanden.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReports.map(report => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 cursor-pointer transition-colors"
                      onClick={() => router.push(`/berichtsheft/editor/${formatWeekId(report.year, report.calendarWeek)}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-primary text-xs font-bold">{report.calendarWeek}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {getCalendarWeekLabel(report.calendarWeek, report.year)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {report.totalHours}h · {report.entries.length} Tage
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
