'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { WeekSelector } from '@/components/berichtsheft/week-selector'
import { useReports } from '@/hooks/use-reports'
import { useProfile } from '@/hooks/use-profile'
import { parseWeekId, formatWeekId, getWeekStart } from '@/lib/week-utils'
import type { WeeklyReport, DailyEntry, ActivityCategory, ReportStatus } from '@/types'
import { cn } from '@/lib/utils'
import {
  CheckmarkCircle01Icon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getISOWeekYear } from 'date-fns'

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

const CATEGORY_OPTIONS: { value: ActivityCategory; label: string }[] = [
  { value: 'company', label: 'Betrieb' },
  { value: 'vocationalSchool', label: 'Berufsschule' },
  { value: 'interCompany', label: 'Überbetrieblich' },
  { value: 'vacation', label: 'Urlaub' },
  { value: 'sick', label: 'Krank' },
  { value: 'holiday', label: 'Feiertag' },
]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createDefaultEntries(reportId: string, weekStart: Date): DailyEntry[] {
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return {
      id: generateId(),
      reportId,
      date: date.toISOString(),
      category: 'company' as ActivityCategory,
      activities: '',
      hours: 8,
      notes: '',
    }
  })
}

interface DayEntryCardProps {
  entry: DailyEntry
  dayName: string
  onChange: (updated: DailyEntry) => void
}

function DayEntryCard({ entry, dayName, onChange }: DayEntryCardProps) {
  const dateLabel = format(new Date(entry.date), 'EEEE, d. MMMM yyyy', { locale: de })

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{dayName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(entry.date), 'd. MMMM yyyy', { locale: de })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`hours-${entry.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
              Stunden
            </Label>
            <Input
              id={`hours-${entry.id}`}
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={entry.hours}
              onChange={e => onChange({ ...entry, hours: parseFloat(e.target.value) || 0 })}
              className="w-16 h-8 text-center text-sm bg-input border-border"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kategorie</Label>
            <Select
              value={entry.category}
              onValueChange={(val) => onChange({ ...entry, category: val as ActivityCategory })}
            >
              <SelectTrigger className="h-8 text-sm bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activities */}
          <div className="space-y-1.5">
            <Label htmlFor={`activities-${entry.id}`} className="text-xs text-muted-foreground">
              Tätigkeiten / Unterrichtsinhalt
            </Label>
            <Textarea
              id={`activities-${entry.id}`}
              value={entry.activities}
              onChange={e => onChange({ ...entry, activities: e.target.value })}
              placeholder="Beschreibe deine heutigen Tätigkeiten..."
              className="min-h-[80px] text-sm bg-input border-border resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor={`notes-${entry.id}`} className="text-xs text-muted-foreground">
              Notizen (optional)
            </Label>
            <Textarea
              id={`notes-${entry.id}`}
              value={entry.notes ?? ''}
              onChange={e => onChange({ ...entry, notes: e.target.value })}
              placeholder="Weitere Anmerkungen..."
              className="min-h-[52px] text-sm bg-input border-border resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const weekId = (params.weekId as string) ?? ''
  const { week: parsedWeek, year: parsedYear } = parseWeekId(weekId)

  const [week, setWeek] = useState(parsedWeek)
  const [year, setYear] = useState(parsedYear)

  const { reports, saveReport } = useReports()
  const { profile } = useProfile()

  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [reportId] = useState(() => generateId())
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<ReportStatus>('draft')
  const [isLoaded, setIsLoaded] = useState(false)

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const targetHours = profile?.weeklyHours ?? 40

  const currentReport = reports.find(
    r => r.calendarWeek === week && r.year === year
  )

  // Load or init entries when week/year changes
  useEffect(() => {
    setIsLoaded(false)
    if (currentReport) {
      setEntries(currentReport.entries)
      setStatus(currentReport.status)
      setIsLoaded(true)
    } else {
      const weekStart = getWeekStart(year, week)
      const newReportId = generateId()
      const defaultEntries = createDefaultEntries(newReportId, weekStart)
      setEntries(defaultEntries)
      setStatus('draft')
      setIsLoaded(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, year])

  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)

  const buildReport = useCallback((reportStatus: ReportStatus): WeeklyReport => {
    const weekStart = getWeekStart(year, week)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const id = currentReport?.id ?? reportId

    return {
      id,
      calendarWeek: week,
      year,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      trainingYear: profile?.currentYear ?? 1,
      status: reportStatus,
      entries: entries.map(e => ({ ...e, reportId: id })),
      totalHours,
      createdAt: currentReport?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(reportStatus === 'exported' ? { exportedAt: new Date().toISOString() } : {}),
    }
  }, [week, year, currentReport, reportId, profile, entries, totalHours])

  async function handleSave(reportStatus: ReportStatus = status) {
    setIsSaving(true)
    try {
      const report = buildReport(reportStatus)
      await saveReport(report)
      setStatus(reportStatus)
      setSavedAt(new Date())
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save on entry changes
  useEffect(() => {
    if (!isLoaded) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      handleSave('draft')
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, isLoaded])

  function handleWeekChange(newWeek: number, newYear: number) {
    setWeek(newWeek)
    setYear(newYear)
    router.replace(`/berichtsheft/editor/${formatWeekId(newYear, newWeek)}`)
  }

  function updateEntry(updated: DailyEntry) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const weekStart = getWeekStart(year, week)

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <WeekSelector week={week} year={year} onChange={handleWeekChange} />

          <div className="flex items-center gap-3">
            {/* Save indicator */}
            {savedAt && !isSaving && (
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                <span>Gespeichert</span>
              </div>
            )}
            {isSaving && (
              <span className="text-xs text-muted-foreground">Speichert...</span>
            )}
          </div>
        </div>

        {/* Hours summary bar */}
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Wochenstunden</span>
            <span className={cn(
              'font-semibold',
              totalHours >= targetHours ? 'text-green-500' : 'text-foreground'
            )}>
              {totalHours} / {targetHours} Stunden
            </span>
          </div>
          <Progress
            value={Math.min((totalHours / targetHours) * 100, 100)}
            className="h-1.5"
          />
        </div>
      </div>

      {/* Day Entries */}
      <div className="flex-1 px-6 py-6 space-y-4">
        {isLoaded && entries.map((entry, i) => (
          <DayEntryCard
            key={entry.id}
            entry={entry}
            dayName={DAY_NAMES[i] ?? `Tag ${i + 1}`}
            onChange={updateEntry}
          />
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            KW {week} · {format(weekStart, "d. MMM", { locale: de })} – {format(new Date(weekStart.getTime() + 4 * 86400000), "d. MMM yyyy", { locale: de })}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={16} data-icon="inline-start" />
              Entwurf speichern
            </Button>
            <Button
              onClick={() => handleSave('completed')}
              disabled={isSaving || status === 'completed' || status === 'exported'}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} data-icon="inline-start" />
              Abschließen
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
