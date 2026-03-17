'use client'

import { useState, useEffect, useMemo } from 'react'
import { addDays, startOfWeek, format, isToday, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import type { ScheduleCategory } from '@/types'
import {
  ArrowLeft01Icon, ArrowRight01Icon, UserMultiple02Icon,
  CalendarIcon, AnalyticsUpIcon, Time01Icon, Search01Icon,
  Alert01Icon, CheckmarkCircle01Icon, SortByDown01Icon,
  FilterHorizontalIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── TYPES ─── */

interface ApprenticeProfile {
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
  description?: string
  category: ScheduleCategory
  color: string
  day_of_week?: number
  start_time: string
  end_time: string
  is_recurring: boolean
  specific_date?: string
}

/* ─── CONSTANTS ─── */

const HOUR_START = 6
const HOUR_END   = 22
const SLOTS      = (HOUR_END - HOUR_START) * 2
const SLOT_H     = 44
const TOTAL_H    = SLOTS * SLOT_H
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const RANGE_MIN  = (HOUR_END - HOUR_START) * 60

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

/* ─── HELPERS ─── */

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtH(h: number) {
  if (h === 0) return '0h'
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

function blocksForDay(blocks: RawBlock[], profileId: string, dayIdx: number, weekDates: Date[]) {
  const date = weekDates[dayIdx]
  return blocks.filter(b => {
    if (b.profile_id !== profileId) return false
    if (b.is_recurring) return b.day_of_week === dayIdx
    if (b.specific_date) return isSameDay(parseISO(b.specific_date), date)
    return false
  })
}

function weekBlocks(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return blocks.filter(b => {
    if (b.profile_id !== profileId) return false
    if (b.is_recurring) return true
    if (b.specific_date) return weekDates.some(d => isSameDay(parseISO(b.specific_date!), d))
    return false
  })
}

function totalHours(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return weekBlocks(blocks, profileId, weekDates)
    .reduce((acc, b) => acc + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
}

function hoursPerCat(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  const result: Partial<Record<ScheduleCategory, number>> = {}
  for (const cat of CAT_KEYS) {
    const h = weekBlocks(blocks, profileId, weekDates)
      .filter(b => b.category === cat)
      .reduce((acc, b) => acc + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
    if (h > 0) result[cat] = h
  }
  return result
}

/** Counts overlapping block pairs in a week */
function countConflicts(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  let conflicts = 0
  for (let d = 0; d < 7; d++) {
    const day = blocksForDay(blocks, profileId, d, weekDates)
      .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time))
    for (let i = 0; i < day.length - 1; i++) {
      if (timeToMin(day[i].end_time) > timeToMin(day[i + 1].start_time)) conflicts++
    }
  }
  return conflicts
}

/** Returns list of conflict pairs with day label */
function getConflictDetails(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  const result: { day: string; a: RawBlock; b: RawBlock }[] = []
  for (let d = 0; d < 7; d++) {
    const day = blocksForDay(blocks, profileId, d, weekDates)
      .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time))
    for (let i = 0; i < day.length - 1; i++) {
      if (timeToMin(day[i].end_time) > timeToMin(day[i + 1].start_time)) {
        result.push({ day: DAY_LABELS[d], a: day[i], b: day[i + 1] })
      }
    }
  }
  return result
}

/** Days (0–6) that have at least one block */
function coveredDays(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return Array.from({ length: 7 }, (_, i) =>
    blocksForDay(blocks, profileId, i, weekDates).length > 0
  )
}

/* ─── READ-ONLY GRID ─── */

function ReadonlyGrid({ blocks, profileId, weekDates }: {
  blocks: RawBlock[]; profileId: string; weekDates: Date[]
}) {
  const nowY = useMemo(() => {
    const n = new Date()
    return ((n.getHours() * 60 + n.getMinutes() - HOUR_START * 60) / 30) * SLOT_H
  }, [])

  return (
    <div className="flex border border-border/30 rounded-xl overflow-hidden">
      <div className="w-[46px] shrink-0 border-r border-border/30">
        <div className="h-9 border-b border-border/20" />
        <div style={{ height: TOTAL_H, position: 'relative' }}>
          {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', top: i * SLOT_H * 2 - 8, right: 4 }}>
              <span className="text-[9px] font-mono text-muted-foreground/50">
                {String(HOUR_START + i).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid border-b border-border/20 sticky top-0 bg-[hsl(var(--background))] z-10"
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
            const dayBlocks = blocksForDay(blocks, profileId, dayIdx, weekDates)
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

type Tab = 'overview' | 'group' | 'hours'
type SortKey = 'name' | 'hours_desc' | 'hours_asc' | 'conflicts'

export default function AusbilderStundenplanPage() {
  const router = useRouter()
  const { profile: trainerProfile, loading: profileLoading } = useProfile()

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [sheetTab, setSheetTab] = useState<'plan' | 'analyse'>('plan')
  const [apprentices, setApprentices] = useState<ApprenticeProfile[]>([])
  const [blocks, setBlocks] = useState<RawBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetProfile, setSheetProfile] = useState<ApprenticeProfile | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [catFilter, setCatFilter] = useState<ScheduleCategory | null>(null)

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const isCurrentWeek = weekDates.some(d => isToday(d))

  useEffect(() => {
    if (profileLoading) return
    if (trainerProfile?.role !== 'trainer') { router.push('/stundenplan'); return }
    setLoading(true)
    fetch('/api/admin/schedule')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setApprentices(data.profiles ?? [])
        setBlocks(data.blocks ?? [])
      })
      .catch(() => setError('Fehler beim Laden der Daten.'))
      .finally(() => setLoading(false))
  }, [profileLoading, trainerProfile, router])

  /* ── Derived stats for all apprentices ── */
  const apprenticeStats = useMemo(() => apprentices.map((ap, idx) => ({
    ap,
    color:     PERSON_COLORS[idx % PERSON_COLORS.length],
    hours:     totalHours(blocks, ap.id, weekDates),
    cats:      hoursPerCat(blocks, ap.id, weekDates),
    conflicts: countConflicts(blocks, ap.id, weekDates),
    covered:   coveredDays(blocks, ap.id, weekDates),
    hasBlocks: blocks.some(b => b.profile_id === ap.id),
  })), [apprentices, blocks, weekDates])

  /* ── Header stats ── */
  const headerStats = useMemo(() => ({
    total:    apprentices.length,
    withPlan: apprenticeStats.filter(s => s.hasBlocks).length,
    avgHours: apprenticeStats.length
      ? apprenticeStats.reduce((a, s) => a + s.hours, 0) / apprenticeStats.length
      : 0,
    conflicts: apprenticeStats.filter(s => s.conflicts > 0).length,
  }), [apprentices, apprenticeStats])

  /* ── Filtered & sorted list ── */
  const filtered = useMemo(() => {
    let list = apprenticeStats.filter(s => {
      const q = search.toLowerCase()
      return !q || `${s.ap.first_name} ${s.ap.last_name}`.toLowerCase().includes(q)
        || s.ap.occupation.toLowerCase().includes(q)
    })
    switch (sortKey) {
      case 'hours_desc': list = [...list].sort((a, b) => b.hours - a.hours); break
      case 'hours_asc':  list = [...list].sort((a, b) => a.hours - b.hours); break
      case 'conflicts':  list = [...list].sort((a, b) => b.conflicts - a.conflicts); break
      default:           list = [...list].sort((a, b) =>
        `${a.ap.last_name}${a.ap.first_name}`.localeCompare(`${b.ap.last_name}${b.ap.first_name}`))
    }
    return list
  }, [apprenticeStats, search, sortKey])

  /* ── Sheet analysis data ── */
  const sheetStats = useMemo(() => {
    if (!sheetProfile) return null
    return {
      hours:     totalHours(blocks, sheetProfile.id, weekDates),
      cats:      hoursPerCat(blocks, sheetProfile.id, weekDates),
      conflicts: getConflictDetails(blocks, sheetProfile.id, weekDates),
      covered:   coveredDays(blocks, sheetProfile.id, weekDates),
      hoursPerDay: Array.from({ length: 7 }, (_, i) =>
        blocksForDay(blocks, sheetProfile.id, i, weekDates)
          .reduce((a, b) => a + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
      ),
    }
  }, [sheetProfile, blocks, weekDates])

  const tabs: { id: Tab; label: string; icon: typeof CalendarIcon }[] = [
    { id: 'overview', label: 'Übersicht',   icon: UserMultiple02Icon },
    { id: 'group',    label: 'Gruppenplan', icon: CalendarIcon },
    { id: 'hours',    label: 'Stunden',     icon: AnalyticsUpIcon },
  ]

  /* ──────────────────────────────────────────
     TAB: OVERVIEW
  ────────────────────────────────────────── */
  function OverviewTab() {
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
          <HugeiconsIcon icon={Search01Icon} size={28} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Keine Auszubildenden gefunden.' : 'Noch keine Auszubildenden vorhanden.'}
          </p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(({ ap, color, hours, cats, conflicts, covered, hasBlocks }) => {
          const target = ap.weekly_hours || 40
          const pct = Math.min((hours / target) * 100, 100)
          const overTarget = hours > target
          const catList = Object.entries(cats) as [ScheduleCategory, number][]
          const initials = `${ap.first_name[0] ?? ''}${ap.last_name[0] ?? ''}`.toUpperCase()
          const coveredCount = covered.filter(Boolean).length

          return (
            <div key={ap.id}
              className="rounded-2xl border border-border/50 bg-card/40 p-4 flex flex-col gap-3 hover:border-border/80 transition-colors">

              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ backgroundColor: color }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ap.first_name} {ap.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ap.occupation}</p>
                </div>
                {/* Conflict badge */}
                {conflicts > 0 && (
                  <div className="flex items-center gap-1 bg-destructive/10 text-destructive rounded-lg px-2 py-1 shrink-0">
                    <HugeiconsIcon icon={Alert01Icon} size={11} />
                    <span className="text-[10px] font-bold">{conflicts}</span>
                  </div>
                )}
              </div>

              {hasBlocks ? (
                <>
                  {/* Hours vs target */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Wochenstunden</span>
                      <span className={cn('font-bold tabular-nums', overTarget ? 'text-yellow-400' : '')}
                        style={!overTarget ? { color } : {}}>
                        {fmtH(hours)} / {fmtH(target)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: overTarget ? '#F59E0B' : color }} />
                    </div>
                  </div>

                  {/* Day coverage dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Tage:</span>
                    {covered.map((has, i) => (
                      <div key={i} title={DAY_LABELS[i]}
                        className={cn('size-5 rounded-md flex items-center justify-center text-[9px] font-bold transition-colors',
                          has ? 'text-white' : 'bg-muted/30 text-muted-foreground/50')}
                        style={has ? { backgroundColor: `${color}cc` } : {}}>
                        {DAY_LABELS[i]}
                      </div>
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-auto">{coveredCount}/7</span>
                  </div>

                  {/* Category breakdown */}
                  {catList.length > 0 && (
                    <div className="space-y-1">
                      {catList.slice(0, 3).map(([cat, h]) => {
                        const meta = CAT_META[cat]
                        const p = hours > 0 ? (h / hours) * 100 : 0
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                            <span className="text-[10px] text-muted-foreground w-[72px] truncate">{meta.label}</span>
                            <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: meta.color }} />
                            </div>
                            <span className="text-[10px] font-semibold w-8 text-right tabular-nums"
                              style={{ color: meta.color }}>{fmtH(h)}</span>
                          </div>
                        )
                      })}
                      {catList.length > 3 && (
                        <p className="text-[10px] text-muted-foreground/50 text-right">
                          +{catList.length - 3} weitere
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-muted/20 px-3 py-2.5">
                  <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground/70 italic">Noch kein Zeitplan angelegt</p>
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full h-8 text-xs mt-auto"
                onClick={() => { setSheetTab('plan'); setSheetProfile(ap) }}>
                <HugeiconsIcon icon={CalendarIcon} size={13} className="mr-1.5" />
                Zeitplan ansehen
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  /* ──────────────────────────────────────────
     TAB: GRUPPENPLAN
  ────────────────────────────────────────── */
  function GroupTab() {
    const visibleStats = catFilter
      ? filtered.map(s => ({ ...s, visBlocks: blocks.filter(b => b.profile_id === s.ap.id && b.category === catFilter) }))
      : filtered.map(s => ({ ...s, visBlocks: blocks.filter(b => b.profile_id === s.ap.id) }))

    if (filtered.length === 0) return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-sm text-muted-foreground">Noch keine Auszubildenden vorhanden.</p>
      </div>
    )

    return (
      <div className="space-y-3">
        {/* Category filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          <button onClick={() => setCatFilter(null)}
            className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              !catFilter ? 'bg-primary/10 text-primary' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>
            Alle
          </button>
          {CAT_KEYS.map(k => (
            <button key={k} onClick={() => setCatFilter(catFilter === k ? null : k)}
              className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                catFilter === k ? 'text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}
              style={catFilter === k ? { backgroundColor: CAT_META[k].color } : {}}>
              <div className="size-1.5 rounded-full" style={{ backgroundColor: CAT_META[k].color }} />
              {CAT_META[k].label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border/40 overflow-hidden">
          {/* Header */}
          <div className="flex border-b border-border/30 bg-muted/20">
            <div className="w-36 shrink-0 border-r border-border/20 px-3 py-2">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Azubi</span>
            </div>
            {weekDates.map((date, i) => (
              <div key={i} className={cn(
                'flex-1 border-r border-border/20 last:border-r-0 px-2 py-2 text-center',
                isToday(date) && 'bg-primary/5'
              )} style={{ minWidth: 80 }}>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider block',
                  isToday(date) ? 'text-primary' : 'text-muted-foreground/60')}>{DAY_LABELS[i]}</span>
                <span className={cn('text-xs font-black',
                  isToday(date) ? 'text-primary' : 'text-foreground/60')}>{format(date, 'd')}</span>
              </div>
            ))}
          </div>

          {/* Time ruler */}
          <div className="flex border-b border-border/[0.08]">
            <div className="w-36 shrink-0 border-r border-border/10" />
            {weekDates.map((_, i) => (
              <div key={i} className="flex-1 border-r border-border/10 last:border-r-0 px-1.5 py-0.5 flex justify-between" style={{ minWidth: 80 }}>
                <span className="text-[8px] text-muted-foreground/30 font-mono">06</span>
                <span className="text-[8px] text-muted-foreground/30 font-mono">14</span>
                <span className="text-[8px] text-muted-foreground/30 font-mono">22</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {visibleStats.map(({ ap, color, conflicts, visBlocks }) => (
            <div key={ap.id} className="flex border-b border-border/20 last:border-b-0 hover:bg-white/[0.01]">
              <div className="w-36 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border/20">
                <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ backgroundColor: color }}>
                  {ap.first_name[0]}{ap.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{ap.first_name} {ap.last_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{ap.occupation}</p>
                </div>
                {conflicts > 0 && (
                  <div className="size-4 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-[8px] text-destructive font-bold">{conflicts}</span>
                  </div>
                )}
              </div>
              {weekDates.map((date, dayIdx) => {
                const dayBlocks = visBlocks.filter(b => {
                  if (b.is_recurring) return b.day_of_week === dayIdx
                  if (b.specific_date) return isSameDay(parseISO(b.specific_date), date)
                  return false
                })
                return (
                  <div key={dayIdx}
                    className={cn('flex-1 relative border-r border-border/20 last:border-r-0', isToday(date) && 'bg-primary/[0.025]')}
                    style={{ minWidth: 80, height: 52 }}>
                    {dayBlocks.map(b => {
                      const startMin = timeToMin(b.start_time)
                      const endMin   = timeToMin(b.end_time)
                      const left  = Math.max(0, (startMin - HOUR_START * 60) / RANGE_MIN * 100)
                      const width = Math.max(1, (endMin - startMin) / RANGE_MIN * 100)
                      const cat   = CAT_META[b.category]
                      return (
                        <div key={b.id}
                          title={`${b.title} · ${b.start_time}–${b.end_time}`}
                          style={{
                            position: 'absolute', left: `${left}%`, width: `${width}%`,
                            top: 6, bottom: 6,
                            backgroundColor: `${cat.color}25`,
                            borderLeft: `3px solid ${cat.color}`,
                          }}
                          className="rounded-r-sm overflow-hidden flex items-center cursor-default">
                          <span className="text-[9px] font-semibold px-1 truncate" style={{ color: cat.color }}>
                            {b.title}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="px-4 py-2 border-t border-border/20 bg-muted/10 flex items-center gap-3 flex-wrap">
            {CAT_KEYS.map(k => (
              <div key={k} className="flex items-center gap-1">
                <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: CAT_META[k].color }} />
                <span className="text-[10px] text-muted-foreground">{CAT_META[k].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────
     TAB: STUNDEN
  ────────────────────────────────────────── */
  function HoursTab() {
    if (filtered.length === 0) return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-sm text-muted-foreground">Noch keine Auszubildenden vorhanden.</p>
      </div>
    )

    const maxHours = Math.max(...filtered.map(s => s.hours), 1)

    return (
      <div className="rounded-2xl border border-border/40 overflow-auto">
        {/* Header */}
        <div className="grid bg-muted/20 border-b border-border/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sticky top-0"
          style={{ gridTemplateColumns: '180px repeat(6,1fr) 100px 90px' }}>
          <div className="px-4 py-2.5">Auszubildende/r</div>
          {CAT_KEYS.map(k => (
            <div key={k} className="px-2 py-2.5 text-center" style={{ color: CAT_META[k].color }}>
              {CAT_META[k].label}
            </div>
          ))}
          <div className="px-3 py-2.5 text-right">Gesamt</div>
          <div className="px-3 py-2.5 text-right">Ziel</div>
        </div>

        {filtered.map(({ ap, color, hours, cats, conflicts }) => {
          const target = ap.weekly_hours || 40
          const diff   = hours - target
          const pct    = Math.min((hours / target) * 100, 100)
          return (
            <div key={ap.id}
              className="grid items-center border-b border-border/20 last:border-b-0 hover:bg-white/[0.015] transition-colors"
              style={{ gridTemplateColumns: '180px repeat(6,1fr) 100px 90px' }}>
              {/* Name */}
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ backgroundColor: color }}>
                  {ap.first_name[0]}{ap.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{ap.first_name} {ap.last_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] text-muted-foreground truncate">{ap.occupation}</p>
                    {conflicts > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-destructive font-semibold">
                        <HugeiconsIcon icon={Alert01Icon} size={9} />
                        {conflicts}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Category cells */}
              {CAT_KEYS.map(k => {
                const h = cats[k] ?? 0
                return (
                  <div key={k} className="px-2 py-3 text-center">
                    {h > 0
                      ? <span className="text-xs font-bold tabular-nums" style={{ color: CAT_META[k].color }}>{fmtH(h)}</span>
                      : <span className="text-xs text-muted-foreground/25">—</span>}
                  </div>
                )
              })}

              {/* Total + bar */}
              <div className="px-3 py-3">
                <div className="text-xs font-bold text-right mb-1.5 tabular-nums" style={{ color }}>
                  {hours > 0 ? fmtH(hours) : '—'}
                </div>
                {hours > 0 && (
                  <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(hours / maxHours) * 100}%`, backgroundColor: color }} />
                  </div>
                )}
              </div>

              {/* Target comparison */}
              <div className="px-3 py-3 text-right">
                <p className="text-[10px] text-muted-foreground tabular-nums">{fmtH(target)}</p>
                {hours > 0 && (
                  <p className={cn('text-[10px] font-bold tabular-nums mt-0.5',
                    Math.abs(diff) < 1 ? 'text-green-400' : diff > 0 ? 'text-yellow-400' : 'text-muted-foreground')}>
                    {diff > 0 ? '+' : ''}{fmtH(Math.abs(diff))} {diff > 0 ? '↑' : diff < 0 ? '↓' : '✓'}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Footer averages */}
        <div className="grid bg-muted/10 border-t border-border/30 text-[10px] font-bold"
          style={{ gridTemplateColumns: '180px repeat(6,1fr) 100px 90px' }}>
          <div className="px-4 py-2.5 text-muted-foreground">Ø Durchschnitt</div>
          {CAT_KEYS.map(k => {
            const avg = filtered.length ? filtered.reduce((a, s) => a + (s.cats[k] ?? 0), 0) / filtered.length : 0
            return (
              <div key={k} className="px-2 py-2.5 text-center" style={{ color: CAT_META[k].color }}>
                {avg > 0 ? fmtH(avg) : '—'}
              </div>
            )
          })}
          <div className="px-3 py-2.5 text-right text-foreground">
            {fmtH(filtered.length ? filtered.reduce((a, s) => a + s.hours, 0) / filtered.length : 0)}
          </div>
          <div className="px-3 py-2.5 text-right text-muted-foreground">—</div>
        </div>
      </div>
    )
  }

  /* ── Guard ── */
  if (!profileLoading && trainerProfile?.role !== 'trainer') return null

  /* ── Render ── */
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={UserMultiple02Icon} size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Ausbilder-Bereich</h1>
            <p className="text-xs text-muted-foreground">Stunden- &amp; Blockpläne aller Auszubildenden</p>
          </div>
        </div>
        {/* Week navigation */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => setWeekStart(d => addDays(d, -7))}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          </Button>
          <span className="text-xs font-semibold min-w-[160px] text-center tabular-nums text-muted-foreground">
            {format(weekStart, 'dd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
          </span>
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => setWeekStart(d => addDays(d, 7))}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Button>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Heute
            </Button>
          )}
        </div>
      </div>

      {/* ── Quick stats ── */}
      {!loading && !error && (
        <div className="grid grid-cols-4 gap-px border-b border-border/40 bg-border/20 shrink-0">
          {[
            { label: 'Auszubildende', value: headerStats.total, icon: UserMultiple02Icon, color: 'text-foreground' },
            { label: 'Mit Zeitplan', value: headerStats.withPlan, icon: CheckmarkCircle01Icon, color: 'text-green-400' },
            { label: 'Ohne Zeitplan', value: headerStats.total - headerStats.withPlan, icon: FilterHorizontalIcon, color: 'text-muted-foreground' },
            { label: 'Ø Wochenstunden', value: fmtH(headerStats.avgHours), icon: Time01Icon, color: 'text-primary' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-[hsl(var(--background))]">
              <HugeiconsIcon icon={s.icon} size={14} className={s.color} />
              <div>
                <p className={cn('text-sm font-bold tabular-nums', s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs + search/sort ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}>
              <HugeiconsIcon icon={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
            <Input
              placeholder="Suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs pl-7 w-36 bg-muted/20"
            />
          </div>
          {/* Sort */}
          {activeTab === 'overview' && (
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="h-7 text-xs rounded-lg border border-border/50 bg-muted/20 px-2 text-muted-foreground focus:outline-none focus:border-primary/40">
              <option value="name">Name A–Z</option>
              <option value="hours_desc">Stunden ↓</option>
              <option value="hours_asc">Stunden ↑</option>
              <option value="conflicts">Konflikte ↓</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="size-7 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'group'    && <GroupTab />}
            {activeTab === 'hours'    && <HoursTab />}
          </>
        )}
      </div>

      {/* ── Individual schedule sheet ── */}
      <Sheet open={!!sheetProfile} onOpenChange={v => !v && setSheetProfile(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40 shrink-0">
            <SheetTitle className="flex items-center gap-3">
              {sheetProfile && (() => {
                const idx   = apprentices.findIndex(a => a.id === sheetProfile.id)
                const color = PERSON_COLORS[idx % PERSON_COLORS.length]
                return (
                  <>
                    <div className="size-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                      style={{ backgroundColor: color }}>
                      {sheetProfile.first_name[0]}{sheetProfile.last_name[0]}
                    </div>
                    <div>
                      <p className="font-bold">{sheetProfile.first_name} {sheetProfile.last_name}</p>
                      <p className="text-xs text-muted-foreground font-normal">{sheetProfile.occupation}</p>
                    </div>
                  </>
                )
              })()}
            </SheetTitle>
            {/* Sheet tabs */}
            <div className="flex gap-1 mt-2">
              {(['plan', 'analyse'] as const).map(t => (
                <button key={t} onClick={() => setSheetTab(t)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    sheetTab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/40')}>
                  {t === 'plan' ? 'Zeitplan' : 'Analyse'}
                </button>
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {sheetProfile && sheetTab === 'plan' && (
              <ReadonlyGrid blocks={blocks} profileId={sheetProfile.id} weekDates={weekDates} />
            )}

            {sheetProfile && sheetTab === 'analyse' && sheetStats && (
              <div className="space-y-5">
                {/* Hours target */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wochenstunden</p>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-foreground tabular-nums">{fmtH(sheetStats.hours)}</span>
                    <span className="text-sm text-muted-foreground mb-1">
                      / {fmtH(sheetProfile.weekly_hours || 40)} Ziel
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(sheetStats.hours / (sheetProfile.weekly_hours || 40) * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Hours per day (bar chart) */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stunden pro Tag</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {sheetStats.hoursPerDay.map((h, i) => {
                      const maxH = Math.max(...sheetStats.hoursPerDay, 1)
                      const pct  = (h / maxH) * 100
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-muted-foreground tabular-nums">{h > 0 ? fmtH(h) : ''}</span>
                          <div className="w-full bg-muted/30 rounded-sm overflow-hidden flex-1 flex flex-col justify-end">
                            <div className="rounded-sm bg-primary/70 transition-all"
                              style={{ height: `${pct}%` }} />
                          </div>
                          <span className={cn('text-[10px] font-semibold',
                            isToday(weekDates[i]) ? 'text-primary' : 'text-muted-foreground/60')}>
                            {DAY_LABELS[i]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kategorien</p>
                  {Object.entries(sheetStats.cats).length > 0 ? (
                    <div className="space-y-2">
                      {(Object.entries(sheetStats.cats) as [ScheduleCategory, number][]).map(([cat, h]) => {
                        const meta = CAT_META[cat]
                        const pct  = sheetStats.hours > 0 ? (h / sheetStats.hours) * 100 : 0
                        return (
                          <div key={cat} className="flex items-center gap-3">
                            <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                            <span className="text-xs text-muted-foreground w-24">{meta.label}</span>
                            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                            </div>
                            <span className="text-xs font-bold w-10 text-right tabular-nums" style={{ color: meta.color }}>
                              {fmtH(h)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">Keine Blöcke in dieser Woche.</p>
                  )}
                </div>

                {/* Conflicts */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Überschneidungen</p>
                    {sheetStats.conflicts.length === 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={11} /> Keine
                      </span>
                    )}
                  </div>
                  {sheetStats.conflicts.length > 0 ? (
                    <div className="space-y-2">
                      {sheetStats.conflicts.map((c, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2">
                          <HugeiconsIcon icon={Alert01Icon} size={13} className="text-destructive mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-semibold text-destructive">{c.day}: </span>
                            <span className="text-muted-foreground">
                              „{c.a.title}" ({c.a.start_time}–{c.a.end_time}) überschneidet
                              sich mit „{c.b.title}" ({c.b.start_time}–{c.b.end_time})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">Keine Überschneidungen gefunden.</p>
                  )}
                </div>

                {/* Uncovered days */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tagesabdeckung</p>
                  <div className="flex gap-1.5">
                    {sheetStats.covered.map((has, i) => (
                      <div key={i} className={cn(
                        'flex-1 py-2 rounded-xl flex flex-col items-center gap-1 text-xs font-bold',
                        has ? 'bg-primary/10 text-primary' : 'bg-muted/20 text-muted-foreground/40'
                      )}>
                        {DAY_LABELS[i]}
                        <div className={cn('size-1.5 rounded-full', has ? 'bg-primary' : 'bg-muted-foreground/20')} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
