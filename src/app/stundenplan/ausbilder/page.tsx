'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { addDays, startOfWeek, format, isToday, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import type { ScheduleCategory } from '@/types'
import {
  CheckmarkBadge01Icon, Alert01Icon, UserMultiple02Icon,
  CalendarIcon, Search01Icon, ArrowRight01Icon,
  SortByDown01Icon, SortByUp01Icon, Time01Icon,
  CheckmarkCircle01Icon, ArrowLeft01Icon, ArrowRight02Icon,
  AnalyticsUpIcon, Notification01Icon, Download01Icon, Target01Icon,
  File01Icon, Upload01Icon, Delete02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── TYPES ─── */

interface Apprentice {
  id: string
  first_name: string
  last_name: string
  occupation: string
  company_name: string
  weekly_hours: number
}

interface RawBlock {
  id: string
  profile_id: string
  title: string
  category: ScheduleCategory
  color: string
  day_of_week?: number
  start_time: string
  end_time: string
  is_recurring: boolean
  specific_date?: string
  description?: string
}

interface TrainerDocument {
  id: string
  title: string
  file_name: string
  file_size: number
  created_at: string
  schedule_document_assignments: { profile_id: string }[]
}

/* ─── CONSTANTS ─── */

const HOUR_START = 6
const HOUR_END   = 22
const SLOTS      = (HOUR_END - HOUR_START) * 2
const SLOT_H     = 44
const TOTAL_H    = SLOTS * SLOT_H
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const CAT_META: Record<ScheduleCategory, { label: string; color: string }> = {
  arbeit:    { label: 'Arbeit',       color: '#3B82F6' },
  schule:    { label: 'Berufsschule', color: '#8B5CF6' },
  lernen:    { label: 'Lernen',       color: '#F59E0B' },
  sport:     { label: 'Sport',        color: '#10B981' },
  freizeit:  { label: 'Freizeit',     color: '#EC4899' },
  sonstiges: { label: 'Sonstiges',    color: '#6B7280' },
}
const CAT_KEYS = Object.keys(CAT_META) as ScheduleCategory[]

const PERSON_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EC4899',
  '#8B5CF6','#06B6D4','#EF4444','#84CC16',
]

const FILTER_TABS = [
  { value: 'alle',       label: 'Alle' },
  { value: 'mit_plan',  label: 'Mit Zeitplan' },
  { value: 'ohne_plan', label: 'Ohne Zeitplan' },
  { value: 'konflikte', label: 'Konflikte' },
] as const

type FilterTab = typeof FILTER_TABS[number]['value']
type SortKey   = 'name' | 'hours_desc' | 'hours_asc' | 'conflicts' | 'target'

/* ─── HELPERS ─── */

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtH(h: number) {
  if (h === 0) return '0h'
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

function getWeekBlocks(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return blocks.filter(b => {
    if (b.profile_id !== profileId) return false
    if (b.is_recurring) return true
    if (b.specific_date) return weekDates.some(d => isSameDay(parseISO(b.specific_date!), d))
    return false
  })
}

function getDayBlocks(blocks: RawBlock[], profileId: string, dayIdx: number, weekDates: Date[]) {
  const date = weekDates[dayIdx]
  return blocks.filter(b => {
    if (b.profile_id !== profileId) return false
    if (b.is_recurring) return b.day_of_week === dayIdx
    if (b.specific_date) return isSameDay(parseISO(b.specific_date), date)
    return false
  })
}

function calcHours(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return getWeekBlocks(blocks, profileId, weekDates)
    .reduce((acc, b) => acc + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
}

function calcConflicts(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  let n = 0
  for (let d = 0; d < 7; d++) {
    const day = getDayBlocks(blocks, profileId, d, weekDates)
      .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time))
    for (let i = 0; i < day.length - 1; i++) {
      if (timeToMin(day[i].end_time) > timeToMin(day[i + 1].start_time)) n++
    }
  }
  return n
}

function getConflictDetails(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  const result: { day: string; a: RawBlock; b: RawBlock }[] = []
  for (let d = 0; d < 7; d++) {
    const day = getDayBlocks(blocks, profileId, d, weekDates)
      .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time))
    for (let i = 0; i < day.length - 1; i++) {
      if (timeToMin(day[i].end_time) > timeToMin(day[i + 1].start_time)) {
        result.push({ day: DAY_LABELS[d], a: day[i], b: day[i + 1] })
      }
    }
  }
  return result
}

function calcCoveredDays(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return Array.from({ length: 7 }, (_, i) => getDayBlocks(blocks, profileId, i, weekDates).length > 0)
}

function calcHoursPerCat(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  const result: Partial<Record<ScheduleCategory, number>> = {}
  for (const cat of CAT_KEYS) {
    const h = getWeekBlocks(blocks, profileId, weekDates)
      .filter(b => b.category === cat)
      .reduce((acc, b) => acc + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
    if (h > 0) result[cat] = h
  }
  return result
}

function isCurrentlyActive(blocks: RawBlock[], profileId: string): boolean {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7
  const cur = now.getHours() * 60 + now.getMinutes()
  return blocks.some(b => {
    if (b.profile_id !== profileId) return false
    if (b.is_recurring) { if (b.day_of_week !== dow) return false }
    else { if (!b.specific_date || !isSameDay(parseISO(b.specific_date), now)) return false }
    return timeToMin(b.start_time) <= cur && cur < timeToMin(b.end_time)
  })
}

function calcBusiestDay(blocks: RawBlock[], profileId: string, weekDates: Date[]): number | null {
  const perDay = Array.from({ length: 7 }, (_, i) =>
    getDayBlocks(blocks, profileId, i, weekDates)
      .reduce((a, b) => a + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
  )
  const max = Math.max(...perDay)
  return max === 0 ? null : perDay.indexOf(max)
}

function calcAvgBlockDuration(blocks: RawBlock[], profileId: string, weekDates: Date[]): number {
  const wb = getWeekBlocks(blocks, profileId, weekDates)
  if (wb.length === 0) return 0
  const total = wb.reduce((a, b) => a + (timeToMin(b.end_time) - timeToMin(b.start_time)), 0)
  return total / wb.length / 60
}

/* ─── READ-ONLY WEEK GRID ─── */

function ReadonlyGrid({ blocks, profileId, weekDates }: {
  blocks: RawBlock[]; profileId: string; weekDates: Date[]
}) {
  const nowY = useMemo(() => {
    const n = new Date()
    return ((n.getHours() * 60 + n.getMinutes() - HOUR_START * 60) / 30) * SLOT_H
  }, [])

  return (
    <div className="flex border border-border/40 rounded-xl overflow-hidden">
      <div className="w-[46px] shrink-0 border-r border-border/30">
        <div className="h-9 border-b border-border/20" />
        <div style={{ height: TOTAL_H, position: 'relative' }}>
          {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', top: i * SLOT_H * 2 - 8, right: 4 }}>
              <span className="text-[9px] font-mono text-muted-foreground/40">
                {String(HOUR_START + i).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid border-b border-border/20 sticky top-0 bg-card z-10"
          style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {weekDates.map((d, i) => (
            <div key={i} className={cn(
              'h-9 flex flex-col items-center justify-center border-r border-border/20 last:border-r-0',
              isToday(d) && 'bg-primary/5'
            )}>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider',
                isToday(d) ? 'text-primary' : 'text-muted-foreground/50')}>{DAY_LABELS[i]}</span>
              <span className={cn('text-xs font-black leading-none',
                isToday(d) ? 'text-primary' : 'text-foreground/60')}>{format(d, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7,1fr)', height: TOTAL_H }}>
          {weekDates.map((date, dayIdx) => {
            const dayBlocks = getDayBlocks(blocks, profileId, dayIdx, weekDates)
            return (
              <div key={dayIdx}
                className={cn('relative border-r border-border/20 last:border-r-0', isToday(date) && 'bg-primary/[0.02]')}
                style={{ height: TOTAL_H }}>
                {Array.from({ length: SLOTS }, (_, si) => (
                  <div key={si} style={{ position: 'absolute', top: si * SLOT_H, height: SLOT_H, width: '100%' }}
                    className={cn('border-b', si % 2 === 0 ? 'border-border/20' : 'border-border/[0.07]')} />
                ))}
                {dayBlocks.map(b => {
                  const top = ((timeToMin(b.start_time) - HOUR_START * 60) / 30) * SLOT_H
                  const h   = Math.max(((timeToMin(b.end_time) - timeToMin(b.start_time)) / 30) * SLOT_H - 2, 20)
                  const cat = CAT_META[b.category]
                  return (
                    <div key={b.id} style={{
                      position: 'absolute', top: top + 1, left: 3, right: 3, height: h,
                      backgroundColor: `${cat.color}1a`, borderLeft: `3px solid ${cat.color}`,
                    }} className="rounded-r-md overflow-hidden">
                      <p className="text-[10px] font-semibold px-1.5 py-1 truncate" style={{ color: cat.color }}>{b.title}</p>
                    </div>
                  )
                })}
                {isToday(date) && nowY >= 0 && nowY <= TOTAL_H && (
                  <div style={{ position: 'absolute', top: nowY, left: 0, right: 0, zIndex: 20 }}
                    className="pointer-events-none flex items-center">
                    <div className="size-2 rounded-full bg-primary -ml-1 shrink-0" />
                    <div className="flex-1 h-px bg-primary/80" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ─── */

export default function AusbilderStundenplanPage() {
  const router = useRouter()
  const { profile: trainerProfile, loading: profileLoading } = useProfile()

  const [weekStart, setWeekStart]       = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [apprentices, setApprentices]   = useState<Apprentice[]>([])
  const [blocks, setBlocks]             = useState<RawBlock[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [activeTab, setActiveTab]       = useState<FilterTab>('alle')
  const [search, setSearch]             = useState('')
  const [sortKey, setSortKey]           = useState<SortKey>('name')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc')
  const [catFilter, setCatFilter]       = useState<ScheduleCategory | null>(null)
  const [sheetProfile, setSheetProfile] = useState<Apprentice | null>(null)
  const [sheetTab, setSheetTab]         = useState<'plan' | 'analyse'>('plan')

  /* ── Document management state ── */
  const [docsSheetOpen, setDocsSheetOpen]     = useState(false)
  const [documents, setDocuments]             = useState<TrainerDocument[]>([])
  const [docsLoading, setDocsLoading]         = useState(false)
  const [uploadOpen, setUploadOpen]           = useState(false)
  const [uploadFile, setUploadFile]           = useState<File | null>(null)
  const [uploadTitle, setUploadTitle]         = useState('')
  const [uploadAssignees, setUploadAssignees] = useState<Set<string>>(new Set())
  const [uploading, setUploading]             = useState(false)
  const [uploadError, setUploadError]         = useState<string | null>(null)

  const weekDates     = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const isCurrentWeek = weekDates.some(d => isToday(d))

  /* ── Load ── */
  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/schedule')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setApprentices(data.profiles ?? [])
        setBlocks(data.blocks ?? [])
      })
      .catch(() => setError('Fehler beim Laden der Daten.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (profileLoading) return
    if (trainerProfile?.role !== 'trainer') { router.push('/stundenplan'); return }
    load()
  }, [profileLoading, trainerProfile, router, load])

  /* ── Document functions ── */
  function loadDocs() {
    setDocsLoading(true)
    fetch('/api/admin/schedule/documents')
      .then(r => r.json())
      .then(data => setDocuments(data.documents ?? []))
      .catch(() => {})
      .finally(() => setDocsLoading(false))
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('title', uploadTitle.trim())
      fd.append('assigneeIds', JSON.stringify([...uploadAssignees]))
      const res  = await fetch('/api/admin/schedule/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Fehler.'); return }
      setUploadOpen(false)
      setUploadFile(null)
      setUploadTitle('')
      setUploadAssignees(new Set())
      loadDocs()
    } catch {
      setUploadError('Netzwerkfehler beim Hochladen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDoc(docId: string) {
    await fetch(`/api/admin/schedule/documents/${docId}`, { method: 'DELETE' })
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  function fmtFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  /* ── Active now ── */
  const activeNow = useMemo(() =>
    new Set(apprentices.filter(ap => isCurrentlyActive(blocks, ap.id)).map(ap => ap.id)),
    [apprentices, blocks]
  )

  /* ── Per-apprentice stats ── */
  const stats = useMemo(() => apprentices.map((ap, idx) => ({
    ap,
    color:     PERSON_COLORS[idx % PERSON_COLORS.length],
    hours:     calcHours(blocks, ap.id, weekDates),
    conflicts: calcConflicts(blocks, ap.id, weekDates),
    covered:   calcCoveredDays(blocks, ap.id, weekDates),
    cats:      calcHoursPerCat(blocks, ap.id, weekDates),
    hasBlocks: blocks.some(b => b.profile_id === ap.id),
    isActive:  activeNow.has(ap.id),
  })), [apprentices, blocks, weekDates, activeNow])

  /* ── Team-wide stats ── */
  const teamStats = useMemo(() => {
    const totalHours   = stats.reduce((a, s) => a + s.hours, 0)
    const avgCompletion = stats.length
      ? stats.reduce((a, s) => a + Math.min(s.hours / (s.ap.weekly_hours || 40), 1), 0) / stats.length * 100
      : 0
    const catTotals: Partial<Record<ScheduleCategory, number>> = {}
    stats.forEach(s => (Object.entries(s.cats) as [ScheduleCategory, number][]).forEach(([c, h]) => {
      catTotals[c] = (catTotals[c] || 0) + h
    }))
    const topCat = (Object.entries(catTotals) as [ScheduleCategory, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return { totalHours, avgCompletion, topCat }
  }, [stats])

  /* ── Summary counts ── */
  const counts = useMemo(() => ({
    alle:      stats.length,
    mit_plan:  stats.filter(s => s.hasBlocks).length,
    ohne_plan: stats.filter(s => !s.hasBlocks).length,
    konflikte: stats.filter(s => s.conflicts > 0).length,
  }), [stats])

  const avgHours     = stats.length ? stats.reduce((a, s) => a + s.hours, 0) / stats.length : 0
  const conflictCount = counts.konflikte
  const activeCount   = activeNow.size

  /* ── Filtered + sorted ── */
  const filtered = useMemo(() => {
    let list = stats.filter(s => {
      if (activeTab === 'mit_plan')  return s.hasBlocks
      if (activeTab === 'ohne_plan') return !s.hasBlocks
      if (activeTab === 'konflikte') return s.conflicts > 0
      return true
    })
    if (catFilter) {
      list = list.filter(s => (s.cats[catFilter] ?? 0) > 0)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        `${s.ap.first_name} ${s.ap.last_name}`.toLowerCase().includes(q) ||
        s.ap.occupation.toLowerCase().includes(q) ||
        s.ap.company_name.toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'hours_desc' || sortKey === 'hours_asc') {
        cmp = a.hours - b.hours
      } else if (sortKey === 'conflicts') {
        cmp = a.conflicts - b.conflicts
      } else if (sortKey === 'target') {
        const aPct = a.hours / (a.ap.weekly_hours || 40)
        const bPct = b.hours / (b.ap.weekly_hours || 40)
        cmp = aPct - bPct
      } else {
        cmp = `${a.ap.last_name}${a.ap.first_name}`.localeCompare(`${b.ap.last_name}${b.ap.first_name}`)
      }
      const dir = (sortKey === 'hours_asc') ? 1
        : (sortKey === 'name' && sortDir === 'asc') ? 1
        : -1
      return cmp * dir
    })
    return list
  }, [stats, activeTab, catFilter, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  /* ── Sheet prev / next ── */
  const sheetIdx      = sheetProfile ? filtered.findIndex(s => s.ap.id === sheetProfile.id) : -1
  const canPrev       = sheetIdx > 0
  const canNext       = sheetIdx >= 0 && sheetIdx < filtered.length - 1
  function goSheet(dir: 1 | -1) {
    const next = sheetIdx + dir
    if (next < 0 || next >= filtered.length) return
    setSheetProfile(filtered[next].ap)
  }

  /* ── Sheet data ── */
  const sheetStats = useMemo(() => {
    if (!sheetProfile) return null
    const hours   = calcHours(blocks, sheetProfile.id, weekDates)
    const target  = sheetProfile.weekly_hours || 40
    const perDay  = Array.from({ length: 7 }, (_, i) =>
      getDayBlocks(blocks, sheetProfile.id, i, weekDates)
        .reduce((a, b) => a + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
    )
    return {
      hours,
      cats:         calcHoursPerCat(blocks, sheetProfile.id, weekDates),
      conflicts:    getConflictDetails(blocks, sheetProfile.id, weekDates),
      covered:      calcCoveredDays(blocks, sheetProfile.id, weekDates),
      perDay,
      busiestDay:   calcBusiestDay(blocks, sheetProfile.id, weekDates),
      avgDuration:  calcAvgBlockDuration(blocks, sheetProfile.id, weekDates),
      completion:   Math.min(hours / target * 100, 100),
      blockCount:   getWeekBlocks(blocks, sheetProfile.id, weekDates).length,
    }
  }, [sheetProfile, blocks, weekDates])

  /* ── Export CSV ── */
  function exportCSV() {
    const rows: (string | number)[][] = [
      ['Name', 'Beruf', 'Betrieb', 'Stunden (Ist)', 'Stunden (Soll)', '% Ziel', 'Konflikte', 'Tage abgedeckt', 'Blöcke gesamt'],
      ...stats.map(s => [
        `${s.ap.first_name} ${s.ap.last_name}`,
        s.ap.occupation,
        s.ap.company_name,
        s.hours.toFixed(1),
        s.ap.weekly_hours || 40,
        ((s.hours / (s.ap.weekly_hours || 40)) * 100).toFixed(0),
        s.conflicts,
        s.covered.filter(Boolean).length,
        getWeekBlocks(blocks, s.ap.id, weekDates).length,
      ]),
    ]
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `stundenplan-kw${format(weekStart, 'w')}-${format(weekStart, 'yyyy')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = sortDir === 'asc' ? SortByUp01Icon : SortByDown01Icon

  /* ── Guards ── */
  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">Lädt…</div>
  }
  if (trainerProfile?.role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Kein Zugriff</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Dieser Bereich ist nur für Ausbilder zugänglich.</p>
      </div>
    )
  }

  /* ── RENDER ── */
  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── Hero Header ── */}
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={24} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Willkommen zurück,</p>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  {trainerProfile.firstName} {trainerProfile.lastName}
                  {activeCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                      {activeCount} aktiv
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })} · KW {format(weekStart, 'w')}
                </p>
              </div>
            </div>

            {/* Week nav + actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-1 py-1">
                <button onClick={() => setWeekStart(d => addDays(d, -7))}
                  className="size-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="text-muted-foreground" />
                </button>
                <span className="text-xs font-semibold px-2 tabular-nums text-muted-foreground min-w-[150px] text-center">
                  {format(weekStart, 'dd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
                </span>
                <button onClick={() => setWeekStart(d => addDays(d, 7))}
                  className="size-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                  <HugeiconsIcon icon={ArrowRight02Icon} size={14} className="text-muted-foreground" />
                </button>
              </div>
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" className="h-8 text-xs"
                  onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                  Heute
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={load}>
                Aktualisieren
              </Button>
              {!loading && stats.length > 0 && (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportCSV}>
                  <HugeiconsIcon icon={Download01Icon} size={12} />
                  CSV
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                onClick={() => { setDocsSheetOpen(true); loadDocs() }}>
                <HugeiconsIcon icon={File01Icon} size={12} />
                Dokumente
                {documents.length > 0 && (
                  <span className="size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {documents.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Conflict banner */}
          {conflictCount > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/8 px-4 py-3">
              <div className="size-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Notification01Icon} size={14} className="text-orange-500" />
              </div>
              <p className="text-sm font-medium text-orange-400">
                <strong>{conflictCount} {conflictCount === 1 ? 'Auszubildende/r hat' : 'Auszubildende haben'}</strong> Zeitkonflikte im Stundenplan dieser Woche.
              </p>
              <Button size="sm" variant="outline"
                className="ml-auto h-7 text-xs border-orange-500/30 text-orange-500 hover:bg-orange-500/10 shrink-0"
                onClick={() => setActiveTab('konflikte')}>
                Jetzt prüfen
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {([
            {
              key: 'alle' as FilterTab, label: 'Auszubildende gesamt',
              value: counts.alle, icon: UserMultiple02Icon,
              color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
            },
            {
              key: 'mit_plan' as FilterTab, label: 'Mit Zeitplan',
              value: counts.mit_plan, icon: CheckmarkCircle01Icon,
              color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20',
            },
            {
              key: 'ohne_plan' as FilterTab, label: 'Ohne Zeitplan',
              value: counts.ohne_plan, icon: CalendarIcon,
              color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
            },
            {
              key: 'konflikte' as FilterTab, label: 'Mit Konflikten',
              value: counts.konflikte, icon: Alert01Icon,
              color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20',
            },
          ]).map(s => (
            <button key={s.key} onClick={() => setActiveTab(s.key)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all hover:scale-[1.02]',
                activeTab === s.key ? `${s.border} ${s.bg}` : 'border-border bg-card hover:border-border/80'
              )}>
              <div className={cn('size-9 rounded-xl flex items-center justify-center mb-3', s.bg, s.color)}>
                <HugeiconsIcon icon={s.icon} size={18} />
              </div>
              <div className={cn('text-3xl font-bold tabular-nums', activeTab === s.key ? s.color : '')}>
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">{s.label}</div>
            </button>
          ))}
        </div>

        {/* ── Team Insights Row ── */}
        {!loading && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              {
                icon: Time01Icon,
                label: 'Gesamtstunden',
                value: fmtH(teamStats.totalHours),
                sub: 'Team diese Woche',
                color: 'text-primary',
              },
              {
                icon: Target01Icon,
                label: 'Ø Zielerreichung',
                value: `${Math.round(teamStats.avgCompletion)}%`,
                sub: `Ø ${fmtH(avgHours)} / Azubi`,
                color: teamStats.avgCompletion >= 80 ? 'text-green-400' : teamStats.avgCompletion >= 50 ? 'text-yellow-400' : 'text-red-400',
              },
              {
                icon: CheckmarkBadge01Icon,
                label: 'Gerade aktiv',
                value: String(activeCount),
                sub: activeCount === 1 ? '1 Azubi im Block' : `${activeCount} Azubis im Block`,
                color: activeCount > 0 ? 'text-green-400' : 'text-muted-foreground',
              },
              {
                icon: AnalyticsUpIcon,
                label: 'Top-Kategorie',
                value: teamStats.topCat ? CAT_META[teamStats.topCat].label : '–',
                sub: teamStats.topCat ? `Meistgeplante Kategorie` : 'Keine Daten',
                color: teamStats.topCat ? undefined : 'text-muted-foreground',
                catColor: teamStats.topCat ? CAT_META[teamStats.topCat].color : undefined,
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5 flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={item.icon} size={13}
                    className={item.color ?? ''}
                    style={item.catColor ? { color: item.catColor } : {}} />
                </div>
                <div className="min-w-0">
                  <p style={item.catColor ? { color: item.catColor } : {}}
                    className={cn('text-xs font-bold leading-tight truncate', !item.catColor && item.color)}>
                    {item.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 truncate">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main card ── */}
        <Card className="border-border overflow-hidden">

          {/* Toolbar */}
          <div className="border-b border-border px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs min-w-[160px]">
              <HugeiconsIcon icon={Search01Icon} size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Azubi suchen…"
                className="h-8 pl-8 text-xs bg-background border-border" />
            </div>

            {!loading && stats.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 shrink-0">
                <HugeiconsIcon icon={Time01Icon} size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Ø {fmtH(avgHours)} / Woche</span>
              </div>
            )}

            {/* Sort buttons */}
            <div className="flex items-center gap-1 ml-auto flex-wrap">
              {([
                { key: 'name'       as SortKey, label: 'Name' },
                { key: 'hours_desc' as SortKey, label: 'Stunden' },
                { key: 'conflicts'  as SortKey, label: 'Konflikte' },
                { key: 'target'     as SortKey, label: 'Ziel' },
              ] as const).map(s => (
                <button key={s.key} onClick={() => toggleSort(s.key)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    sortKey === s.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}>
                  {s.label}
                  {sortKey === s.key && <HugeiconsIcon icon={SortIcon} size={11} />}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter chips */}
          <div className="border-b border-border/60 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] text-muted-foreground/60 shrink-0 mr-1">Kategorie:</span>
            <button
              onClick={() => setCatFilter(null)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                catFilter === null
                  ? 'bg-foreground/10 border-border text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border/40 hover:text-foreground'
              )}>
              Alle
            </button>
            {CAT_KEYS.map(cat => {
              const meta    = CAT_META[cat]
              const isActive = catFilter === cat
              const count   = stats.filter(s => (s.cats[cat] ?? 0) > 0).length
              if (count === 0) return null
              return (
                <button key={cat}
                  onClick={() => setCatFilter(isActive ? null : cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                    isActive ? 'border-transparent' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  style={isActive ? { backgroundColor: `${meta.color}20`, color: meta.color, borderColor: `${meta.color}40` } : {}}>
                  <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {FILTER_TABS.map(tab => {
              const count = counts[tab.value]
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                    activeTab === tab.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}>
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center',
                      activeTab === tab.value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
            {catFilter && (
              <div className="ml-auto flex items-center px-3">
                <span className="text-[10px] text-muted-foreground">
                  Gefiltert: <strong style={{ color: CAT_META[catFilter].color }}>{CAT_META[catFilter].label}</strong>
                </span>
              </div>
            )}
          </div>

          {/* List */}
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center">
                <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Stundenpläne werden geladen…</p>
              </div>
            ) : error ? (
              <div className="py-10 px-6">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <HugeiconsIcon icon={CalendarIcon} size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {search ? 'Kein Azubi gefunden' : catFilter ? 'Keine Einträge in dieser Kategorie' : 'Keine Einträge'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search ? `Keine Ergebnisse für „${search}"` : 'Probiere eine andere Filterauswahl.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(({ ap, color, hours, conflicts, covered, hasBlocks, isActive }) => {
                  const target       = ap.weekly_hours || 40
                  const pct          = Math.min((hours / target) * 100, 100)
                  const coveredCount = covered.filter(Boolean).length
                  const overTarget   = hours > target
                  const initials     = `${ap.first_name[0] ?? ''}${ap.last_name[0] ?? ''}`.toUpperCase()

                  return (
                    <button key={ap.id}
                      onClick={() => { setSheetTab('plan'); setSheetProfile(ap) }}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left group">

                      {/* Avatar + active dot */}
                      <div className="relative shrink-0">
                        <div className="size-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: color }}>
                          {initials}
                        </div>
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-green-400 border-2 border-card" />
                        )}
                      </div>

                      {/* Name + Occupation */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight flex items-center gap-1.5 flex-wrap">
                          {ap.first_name} {ap.last_name}
                          {isActive && (
                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                              Jetzt aktiv
                            </span>
                          )}
                          {conflicts > 0 && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                              {conflicts} Konflikt{conflicts > 1 ? 'e' : ''}
                            </span>
                          )}
                          {!hasBlocks && (
                            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                              Kein Plan
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {ap.occupation} · {ap.company_name}
                        </p>
                      </div>

                      {/* Day coverage */}
                      <div className="hidden lg:flex items-center gap-0.5 shrink-0">
                        {covered.map((has, i) => (
                          <div key={i} title={DAY_LABELS[i]}
                            className={cn('size-5 rounded flex items-center justify-center text-[9px] font-bold',
                              has ? 'text-white' : 'bg-muted/40 text-muted-foreground/30')}
                            style={has ? { backgroundColor: `${color}bb` } : {}}>
                            {DAY_LABELS[i][0]}
                          </div>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1.5">{coveredCount}/7</span>
                      </div>

                      {/* Hours vs target */}
                      <div className="hidden sm:block text-right shrink-0 w-28">
                        <div className="flex items-center justify-end gap-1 mb-1">
                          <span className={cn('text-sm font-semibold tabular-nums',
                            overTarget ? 'text-yellow-400' : '')}
                            style={!overTarget && hours > 0 ? { color } : {}}>
                            {fmtH(hours)}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {fmtH(target)}</span>
                        </div>
                        <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: overTarget ? '#F59E0B' : color }} />
                        </div>
                      </div>

                      {/* Arrow */}
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16}
                        className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Documents Sheet ── */}
      <Sheet open={docsSheetOpen} onOpenChange={setDocsSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0 bg-card">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HugeiconsIcon icon={File01Icon} size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base">Dokumente</p>
                  <p className="text-xs text-muted-foreground font-normal">PDFs für Auszubildende</p>
                </div>
              </div>
              <Button size="sm" className="h-8 gap-1.5 text-xs"
                onClick={() => { setUploadOpen(true); setUploadError(null) }}>
                <HugeiconsIcon icon={Upload01Icon} size={12} />
                Hochladen
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {docsLoading ? (
              <div className="py-12 text-center">
                <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Laden…</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center">
                <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={File01Icon} size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold mb-1">Noch keine Dokumente</p>
                <p className="text-xs text-muted-foreground mb-4">Lade ein PDF hoch, um es Auszubildenden bereitzustellen.</p>
                <Button size="sm" className="gap-1.5 text-xs"
                  onClick={() => { setUploadOpen(true); setUploadError(null) }}>
                  <HugeiconsIcon icon={Upload01Icon} size={12} />
                  Erstes Dokument hochladen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => {
                  const assignees = doc.schedule_document_assignments ?? []
                  const assignedNames = assignees
                    .map(a => apprentices.find(ap => ap.id === a.profile_id))
                    .filter(Boolean)
                  return (
                    <div key={doc.id}
                      className="rounded-2xl border border-border/50 bg-card p-4 flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={File01Icon} size={18} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtFileSize(doc.file_size)} · {format(new Date(doc.created_at), 'dd.MM.yyyy', { locale: de })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {assignees.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground/50 italic">Noch niemand zugewiesen</span>
                          ) : (
                            assignedNames.map((ap, i) => ap ? (
                              <span key={i} className="text-[10px] font-medium bg-muted/40 px-1.5 py-0.5 rounded-full text-foreground/70">
                                {ap.first_name} {ap.last_name}
                              </span>
                            ) : null)
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteDoc(doc.id)}
                        className="size-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0">
                        <HugeiconsIcon icon={Delete02Icon} size={14} className="text-destructive/70" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Upload Dialog ── */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base">PDF hochladen</h2>
                <button onClick={() => setUploadOpen(false)}
                  className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors text-lg leading-none">
                  ×
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* File picker */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  PDF-Datei *
                </label>
                <label className={cn(
                  'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors',
                  uploadFile ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/20'
                )}>
                  <HugeiconsIcon icon={Upload01Icon} size={22}
                    className={uploadFile ? 'text-primary' : 'text-muted-foreground/50'} />
                  {uploadFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-primary truncate max-w-[280px]">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtFileSize(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Klicken zum Auswählen</p>
                      <p className="text-xs text-muted-foreground/60">PDF · max. 25 MB</p>
                    </div>
                  )}
                  <input type="file" accept=".pdf,application/pdf" className="sr-only"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Titel *
                </label>
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                  placeholder="z. B. Arbeitsplan KW 12, Ausbildungsrahmenplan…"
                  className="h-9 text-sm" />
              </div>

              {/* Apprentice multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Auszubildende
                  </label>
                  <button onClick={() => {
                    if (uploadAssignees.size === apprentices.length) {
                      setUploadAssignees(new Set())
                    } else {
                      setUploadAssignees(new Set(apprentices.map(a => a.id)))
                    }
                  }} className="text-[10px] text-primary hover:underline">
                    {uploadAssignees.size === apprentices.length ? 'Alle abwählen' : 'Alle auswählen'}
                  </button>
                </div>
                {apprentices.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 italic">Keine Auszubildenden gefunden.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-border/40 p-2">
                    {apprentices.map((ap, idx) => {
                      const checked = uploadAssignees.has(ap.id)
                      return (
                        <label key={ap.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                          <div className={cn(
                            'size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            checked ? 'bg-primary border-primary' : 'border-border'
                          )}>
                            {checked && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-primary-foreground" />}
                          </div>
                          <div className="size-7 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: PERSON_COLORS[idx % PERSON_COLORS.length] }}>
                            {ap.first_name[0]}{ap.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ap.first_name} {ap.last_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{ap.occupation}</p>
                          </div>
                          <input type="checkbox" className="sr-only" checked={checked}
                            onChange={e => {
                              setUploadAssignees(prev => {
                                const next = new Set(prev)
                                e.target.checked ? next.add(ap.id) : next.delete(ap.id)
                                return next
                              })
                            }} />
                        </label>
                      )
                    })}
                  </div>
                )}
                {uploadAssignees.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {uploadAssignees.size} {uploadAssignees.size === 1 ? 'Person' : 'Personen'} ausgewählt
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-2 justify-end border-t border-border/40 pt-4">
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)}>
                Abbrechen
              </Button>
              <Button size="sm" className="gap-1.5"
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                onClick={handleUpload}>
                {uploading ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Hochladen…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Upload01Icon} size={13} />
                    Hochladen
                    {uploadAssignees.size > 0 && ` (${uploadAssignees.size})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Sheet ── */}
      <Sheet open={!!sheetProfile} onOpenChange={v => !v && setSheetProfile(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col overflow-hidden">
          {sheetProfile && (() => {
            const idx   = apprentices.findIndex(a => a.id === sheetProfile.id)
            const color = PERSON_COLORS[idx % PERSON_COLORS.length]
            return (
              <>
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0 bg-card">
                  <SheetTitle className="flex items-center gap-3">
                    {/* Prev / Next */}
                    <button onClick={() => goSheet(-1)} disabled={!canPrev}
                      className="size-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                      <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="text-muted-foreground" />
                    </button>

                    <div className="size-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                      style={{ backgroundColor: color }}>
                      {sheetProfile.first_name[0]}{sheetProfile.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base flex items-center gap-2">
                        {sheetProfile.first_name} {sheetProfile.last_name}
                        {activeNow.has(sheetProfile.id) && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                            <span className="size-1.5 rounded-full bg-green-400 animate-pulse" /> Aktiv
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-normal">{sheetProfile.occupation} · {sheetProfile.company_name}</p>
                    </div>

                    <button onClick={() => goSheet(1)} disabled={!canNext}
                      className="size-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                      <HugeiconsIcon icon={ArrowRight02Icon} size={12} className="text-muted-foreground" />
                    </button>
                  </SheetTitle>

                  <div className="flex items-center gap-1 mt-1">
                    {(['plan', 'analyse'] as const).map(t => (
                      <button key={t} onClick={() => setSheetTab(t)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          sheetTab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/40'
                        )}>
                        <HugeiconsIcon icon={t === 'plan' ? CalendarIcon : AnalyticsUpIcon} size={12} />
                        {t === 'plan' ? 'Zeitplan' : 'Analyse'}
                      </button>
                    ))}
                    {/* Week nav in sheet */}
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => setWeekStart(d => addDays(d, -7))}
                        className="size-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={12} className="text-muted-foreground" />
                      </button>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        KW {format(weekStart, 'w')} · {format(weekStart, 'dd.MM')}–{format(addDays(weekStart, 6), 'dd.MM.yy')}
                      </span>
                      <button onClick={() => setWeekStart(d => addDays(d, 7))}
                        className="size-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                        <HugeiconsIcon icon={ArrowRight02Icon} size={12} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Position indicator */}
                  {filtered.length > 1 && (
                    <p className="text-[10px] text-muted-foreground/50 text-center">
                      {sheetIdx + 1} / {filtered.length}
                    </p>
                  )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {sheetTab === 'plan' && (
                    <ReadonlyGrid blocks={blocks} profileId={sheetProfile.id} weekDates={weekDates} />
                  )}

                  {sheetTab === 'analyse' && sheetStats && (
                    <div className="space-y-4">

                      {/* Summary pills */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Blöcke',     value: String(sheetStats.blockCount),         sub: 'diese Woche' },
                          { label: 'Ø Dauer',    value: fmtH(sheetStats.avgDuration),          sub: 'pro Block' },
                          { label: 'Abdeckung',  value: `${sheetStats.covered.filter(Boolean).length}/7`, sub: 'Tage' },
                        ].map((item, i) => (
                          <div key={i} className="rounded-xl border border-border/40 bg-card p-3 text-center">
                            <p className="text-xl font-black tabular-nums" style={{ color }}>{item.value}</p>
                            <p className="text-xs font-semibold text-foreground/80 mt-0.5">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Hours + target */}
                      <div className="rounded-2xl border border-border/40 bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wochenstunden</p>
                          <span className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-full',
                            sheetStats.completion >= 100 ? 'bg-green-500/10 text-green-400'
                              : sheetStats.completion >= 70 ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                          )}>
                            {Math.round(sheetStats.completion)}%
                          </span>
                        </div>
                        <div className="flex items-end gap-3 mb-3">
                          <span className="text-3xl font-black tabular-nums" style={{ color }}>
                            {fmtH(sheetStats.hours)}
                          </span>
                          <span className="text-sm text-muted-foreground mb-1">
                            / {fmtH(sheetProfile.weekly_hours || 40)} Ziel
                          </span>
                          <span className="text-xs text-muted-foreground mb-1 ml-auto">
                            {sheetStats.hours > (sheetProfile.weekly_hours || 40)
                              ? `+${fmtH(sheetStats.hours - (sheetProfile.weekly_hours || 40))} über Ziel`
                              : `${fmtH((sheetProfile.weekly_hours || 40) - sheetStats.hours)} fehlen`}
                          </span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${sheetStats.completion}%`, backgroundColor: color }} />
                        </div>
                      </div>

                      {/* Hours per day */}
                      <div className="rounded-2xl border border-border/40 bg-card p-4">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stunden pro Tag</p>
                          {sheetStats.busiestDay !== null && (
                            <span className="text-[10px] text-muted-foreground">
                              Intensivster Tag: <strong className="text-foreground">{DAY_LABELS[sheetStats.busiestDay]}</strong>
                            </span>
                          )}
                        </div>
                        <div className="flex items-end gap-1.5 h-24">
                          {sheetStats.perDay.map((h, i) => {
                            const maxH = Math.max(...sheetStats.perDay, 1)
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[9px] text-muted-foreground tabular-nums">{h > 0 ? fmtH(h) : ''}</span>
                                <div className="w-full flex-1 flex flex-col justify-end">
                                  <div className="rounded-sm transition-all"
                                    style={{
                                      height: `${(h / maxH) * 100}%`,
                                      backgroundColor: sheetStats.busiestDay === i ? color : `${color}70`,
                                      minHeight: h > 0 ? 4 : 0,
                                    }} />
                                </div>
                                <span className={cn('text-[10px] font-bold',
                                  isToday(weekDates[i]) ? 'text-primary' : 'text-muted-foreground/60')}>
                                  {DAY_LABELS[i]}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="rounded-2xl border border-border/40 bg-card p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kategorien</p>
                        {Object.entries(sheetStats.cats).length > 0 ? (
                          <div className="space-y-2.5">
                            {(Object.entries(sheetStats.cats) as [ScheduleCategory, number][])
                              .sort((a, b) => b[1] - a[1])
                              .map(([cat, h]) => {
                                const meta = CAT_META[cat]
                                const pct  = sheetStats.hours > 0 ? (h / sheetStats.hours) * 100 : 0
                                return (
                                  <div key={cat} className="flex items-center gap-3">
                                    <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                                    <span className="text-xs text-muted-foreground w-24 shrink-0">{meta.label}</span>
                                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                                    </div>
                                    <span className="text-xs font-bold w-16 text-right tabular-nums" style={{ color: meta.color }}>
                                      {fmtH(h)} ({Math.round(pct)}%)
                                    </span>
                                  </div>
                                )
                              })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic">Keine Blöcke in dieser Woche.</p>
                        )}
                      </div>

                      {/* Day coverage */}
                      <div className="rounded-2xl border border-border/40 bg-card p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tagesabdeckung</p>
                        <div className="grid grid-cols-7 gap-1.5">
                          {sheetStats.covered.map((has, i) => (
                            <div key={i} className={cn(
                              'flex flex-col items-center gap-1 py-2 rounded-xl',
                              has ? 'bg-card border border-border/50' : 'bg-muted/20'
                            )}>
                              <span className={cn('text-xs font-bold', has ? 'text-foreground' : 'text-muted-foreground/40')}>
                                {DAY_LABELS[i]}
                              </span>
                              <div className={cn('size-1.5 rounded-full', !has && 'bg-muted/40')}
                                style={has ? { backgroundColor: color } : {}} />
                              <span className="text-[9px] text-muted-foreground/60">
                                {fmtH(sheetStats.perDay[i])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conflicts */}
                      <div className="rounded-2xl border border-border/40 bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Überschneidungen</p>
                          {sheetStats.conflicts.length === 0 ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={11} /> Keine
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                              {sheetStats.conflicts.length} gefunden
                            </span>
                          )}
                        </div>
                        {sheetStats.conflicts.length > 0 ? (
                          <div className="space-y-2">
                            {sheetStats.conflicts.map((c, i) => (
                              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2.5">
                                <HugeiconsIcon icon={Alert01Icon} size={13} className="text-destructive mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-destructive mb-0.5">{c.day}</p>
                                  <p className="text-xs text-muted-foreground">
                                    „{c.a.title}" ({c.a.start_time}–{c.a.end_time}) ↔ „{c.b.title}" ({c.b.start_time}–{c.b.end_time})
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                    Überlappung: {
                                      (() => {
                                        const overlap = timeToMin(c.a.end_time) - timeToMin(c.b.start_time)
                                        return `${overlap} Min.`
                                      })()
                                    }
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic">Keine Überschneidungen gefunden.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}
