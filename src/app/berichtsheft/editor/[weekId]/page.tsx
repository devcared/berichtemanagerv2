'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { WeekSelector } from '@/components/berichtsheft/week-selector'
import { useReports } from '@/hooks/use-reports'
import { useProfile } from '@/hooks/use-profile'
import { parseWeekId, formatWeekId, getWeekStart } from '@/lib/week-utils'
import type { WeeklyReport, DailyEntry, ActivityCategory, ReportStatus } from '@/types'
import { cn } from '@/lib/utils'
import {
  CheckmarkCircle01Icon,
  FloppyDiskIcon,
  FileUploadIcon,
  Delete02Icon,
  ViewIcon,
  PrinterIcon,
  Edit02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

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

  // PDF Features
  const [isPdfReport, setIsPdfReport] = useState(false)
  const [pdfData, setPdfData] = useState<string | undefined>(undefined)

  const [isNewReport, setIsNewReport] = useState(false)

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const targetHours = profile?.weeklyHours ?? 40

  const currentReport = reports.find(
    r => r.calendarWeek === week && r.year === year
  )

  useEffect(() => {
    setIsLoaded(false)
    if (currentReport) {
      setEntries(currentReport.entries)
      setStatus(currentReport.status)
      setIsPdfReport(currentReport.isPdfReport ?? false)
      setPdfData(currentReport.pdfData)
      setIsNewReport(false)
      setIsLoaded(true)
    } else {
      setIsNewReport(true)
      const weekStart = getWeekStart(year, week)
      const newReportId = generateId()
      const defaultEntries = createDefaultEntries(newReportId, weekStart)
      setEntries(defaultEntries)
      setStatus('draft')
      setIsPdfReport(false)
      setPdfData(undefined)
      setIsLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, year, reports.length]) // Only depend on reports length to prevent infinite loops, and week/year.

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
      totalHours: isPdfReport ? targetHours : totalHours, // If PDF, assume full hours for progress
      isPdfReport,
      pdfData,
      createdAt: currentReport?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(reportStatus === 'exported' ? { exportedAt: new Date().toISOString() } : {}),
    }
  }, [week, year, currentReport, reportId, profile, entries, totalHours, isPdfReport, pdfData, targetHours])

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

  // Auto-save
  useEffect(() => {
    if (!isLoaded || isNewReport) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      handleSave('draft')
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, isPdfReport, pdfData, isLoaded])

  function handleWeekChange(newWeek: number, newYear: number) {
    setWeek(newWeek)
    setYear(newYear)
    router.replace(`/berichtsheft/editor/${formatWeekId(newYear, newWeek)}`)
  }

  function updateEntry(updated: DailyEntry) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const weekStart = getWeekStart(year, week)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPdfData(event.target?.result as string)
        setIsPdfReport(true)
      }
      reader.readAsDataURL(file)
    } else {
      alert("Es sind nur PDF-Dateien erlaubt.")
    }
  }

  const handleExport = () => {
    window.print()
  }

  const handleChooseType = (isPdf: boolean) => {
    setIsPdfReport(isPdf)
    setIsNewReport(false)
    handleSave('draft')
  }

  if (isLoaded && isNewReport) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-80px)] items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Nachweis erstellen</h1>
            <p className="text-muted-foreground text-sm">
              Wie möchtest du deinen Bericht für KW {week} / {year} erstellen?
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <button
              onClick={() => handleChooseType(false)}
              className="relative group flex p-6 flex-col items-center justify-center gap-4 bg-card hover:bg-muted/30 hover:border-primary/50 transition-all text-center"
            >
              <div className="size-16 bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <HugeiconsIcon icon={Edit02Icon} size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Im Editor schreiben</h3>
                <p className="text-sm border-t border-border mt-3 pt-3 text-muted-foreground">
                  Schreibe den Bericht bequem direkt hier im System Tag für Tag.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleChooseType(true)}
              className="relative group flex p-6 flex-col items-center justify-center gap-4 bg-card hover:bg-muted/30 hover:border-primary/50 transition-all text-center"
            >
              <div className="size-16 bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <HugeiconsIcon icon={FileUploadIcon} size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">PDF hochladen</h3>
                <p className="text-sm border-t border-border mt-3 pt-3 text-muted-foreground">
                  Lade einen extern erstellten Bericht (Word, Excel, etc.) als Datei hoch.
                </p>
              </div>
            </button>
          </div>

          <div className="text-center mt-6">
            <Button variant="ghost" onClick={() => router.push('/berichtsheft')}>
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full print:bg-white print:text-black">
      {/* Sticky Header (Hidden while printing) */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm print:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <WeekSelector week={week} year={year} onChange={handleWeekChange} />

          <div className="flex items-center gap-4">
            {savedAt && !isSaving && (
              <div className="flex items-center gap-1.5 text-xs text-status-success">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                <span>Gespeichert</span>
              </div>
            )}
            {isSaving && (
              <span className="text-xs text-muted-foreground">Speichert...</span>
            )}

            {/* Export Button */}
            <Button variant="secondary" size="sm" onClick={handleExport} className="h-8 gap-1.5" disabled={!isLoaded || isPdfReport}>
              <HugeiconsIcon icon={PrinterIcon} size={14} />
              Als PDF exportieren
            </Button>
          </div>
        </div>

        {/* Progress Bar (Hidden while printing) */}
        {!isPdfReport && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground uppercase tracking-wider font-semibold">Wochenstunden</span>
              <span className={cn(
                'font-bold',
                totalHours >= targetHours ? 'text-status-success' : 'text-primary'
              )}>
                {totalHours} / {targetHours} Stunden
              </span>
            </div>
            <Progress
              value={Math.min((totalHours / targetHours) * 100, 100)}
              className="h-2 rounded-full overflow-hidden border border-border"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col gap-6 print:p-0 print:max-w-full">
        <Tabs value={isPdfReport ? "pdf" : "text"} className="w-full">
          {/* TEXT EDITOR TAB */}
          <TabsContent value="text" className="space-y-6 m-0 print:block">

            {/* PRINT HEADER ONLY VISIBLE WHEN PRINTING */}
            <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-bold mb-2">Ausbildungsnachweis - Woche {week} / {year}</h1>
              <div className="flex justify-between text-sm">
                <div>
                  <strong>Name:</strong> {profile?.firstName} {profile?.lastName}<br />
                  <strong>Beruf:</strong> {profile?.occupation}
                </div>
                <div className="text-right">
                  <strong>Zeitraum:</strong> {format(weekStart, "dd.MM.yyyy")} - {format(new Date(weekStart.getTime() + 4 * 86400000), "dd.MM.yyyy")}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {isLoaded && entries.map((entry, i) => {
                const dayName = DAY_NAMES[i] ?? `Tag ${i + 1}`
                const dateLabel = format(new Date(entry.date), 'dd.MM.yyyy', { locale: de })

                return (
                  <Card key={entry.id} className="bg-card border-border overflow-hidden print:border-none print:shadow-none print:bg-transparent">
                    {/* Visual left bar accent */}
                    <div className="flex">
                      <div className="w-1.5 bg-primary/80 print:hidden" />
                      <div className="flex-1 p-5">
                        <div className="flex items-center justify-between mb-5 border-b border-border/50 pb-4 print:border-black/20">
                          <div>
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2 print:text-black">
                              {dayName}
                              <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full print:bg-transparent print:text-gray-600 print:p-0">
                                {dateLabel}
                              </span>
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Label htmlFor={`hours-${entry.id}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-black">
                              Dauer (h)
                            </Label>
                            <Input
                              id={`hours-${entry.id}`}
                              type="number"
                              min={0}
                              max={24}
                              step={0.5}
                              value={entry.hours}
                              onChange={e => updateEntry({ ...entry, hours: parseFloat(e.target.value) || 0 })}
                              className="w-20 text-center font-semibold bg-background border-border focus-visible:ring-primary print:border-black print:text-black print:w-auto"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                          {/* Category */}
                          <div className="space-y-2 md:col-span-1 print:hidden">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategorie</Label>
                            <Select
                              value={entry.category}
                              onValueChange={(val) => updateEntry({ ...entry, category: val as ActivityCategory })}
                            >
                              <SelectTrigger className="bg-background border-border focus:ring-primary h-10">
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

                          {/* Print Only Category */}
                          <div className="hidden print:block space-y-1">
                            <strong className="text-sm">Kategorie:</strong>
                            <div>{CATEGORY_OPTIONS.find(c => c.value === entry.category)?.label}</div>
                          </div>

                          {/* Activities */}
                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`activities-${entry.id}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-black">
                              Tätigkeiten / Unterrichtsinhalt
                            </Label>
                            <Textarea
                              id={`activities-${entry.id}`}
                              value={entry.activities}
                              onChange={e => updateEntry({ ...entry, activities: e.target.value })}
                              placeholder={`Was hast du am ${dayName} gelernt oder gearbeitet?`}
                              className="min-h-[120px] bg-background border-border focus-visible:ring-primary resize-y leading-relaxed print:min-h-0 print:border-none print:p-0 print:text-black print:resize-none"
                            />
                          </div>

                          {/* Notes (Hidden while printing unless populated) */}
                          <div className={cn("space-y-2 md:col-span-4", !entry.notes && "print:hidden")}>
                            <Label htmlFor={`notes-${entry.id}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-black">
                              Notizen
                            </Label>
                            <Input
                              id={`notes-${entry.id}`}
                              value={entry.notes ?? ''}
                              onChange={e => updateEntry({ ...entry, notes: e.target.value })}
                              placeholder="Anmerkungen für deinen Ausbilder (optional)"
                              className="bg-background border-border focus-visible:ring-primary print:border-none print:p-0 print:text-black"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Signature Area Only visible on Print */}
            <div className="hidden print:flex justify-between items-end mt-16 pt-8 break-inside-avoid">
              <div className="w-[40%] border-t border-black text-center pt-2">
                <span className="text-sm">Datum, Unterschrift Auszubildender</span>
              </div>
              <div className="w-[40%] border-t border-black text-center pt-2">
                <span className="text-sm">Datum, Unterschrift Ausbilder</span>
              </div>
            </div>
          </TabsContent>

          {/* PDF UPLOAD TAB */}
          <TabsContent value="pdf" className="m-0 print:hidden">
            <Card className="bg-card border-border overflow-hidden min-h-[500px] flex flex-col justify-center items-center">
              {pdfData ? (
                <div className="w-full h-full flex flex-col">
                  {/* PDF Viewer Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <HugeiconsIcon icon={ViewIcon} />
                      Betrachtung des PDF-Berichts
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setPdfData(undefined)} className="gap-2">
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                      PDF Entfernen
                    </Button>
                  </div>
                  {/* Embedded PDF */}
                  <iframe src={pdfData} className="w-full flex-1 min-h-[600px] bg-white" title="PDF Report" />
                </div>
              ) : (
                <div className="text-center p-12 max-w-sm">
                  <div className="size-20 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center mb-6">
                    <HugeiconsIcon icon={FileUploadIcon} size={36} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Bericht hochladen (PDF)</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Statt das Dashboard zu nutzen, kannst du hier deinen eigenen Bericht als PDF hochladen.
                  </p>
                  <Button asChild className="relative overflow-hidden cursor-pointer h-12 w-full text-base font-medium">
                    <Label htmlFor="pdf-upload" className="cursor-pointer">
                      <HugeiconsIcon icon={FileUploadIcon} size={20} className="mr-2" />
                      PDF Auswählen
                    </Label>
                  </Button>
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Action Bar (Hidden while printing) */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-medium">
            KW {week} · {format(weekStart, "d. MMM", { locale: de })} – {format(new Date(weekStart.getTime() + 4 * 86400000), "d. MMM yyyy", { locale: de })}
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="px-6 font-semibold"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={18} className="mr-2" />
              Entwurf speichern
            </Button>
            <Button
              size="lg"
              className="px-8 font-semibold shadow-lg shadow-primary/20"
              onClick={() => handleSave('completed')}
              disabled={isSaving || status === 'completed'}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="mr-2" />
              {status === 'completed' ? 'Abgeschlossen' : 'Abschließen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
