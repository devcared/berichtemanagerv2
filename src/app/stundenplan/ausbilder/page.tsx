'use client'

import { useState, useEffect, useMemo } from 'react'
import { addDays, startOfWeek, format, isToday, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import type { ScheduleCategory } from '@/types'
import {
  ArrowLeft01Icon, ArrowRight01Icon, UserMultiple02Icon,
  CalendarIcon, AnalyticsUpIcon, Time01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── TYPES ─── */

interface ApprenticeProfile {
  id: string
  first_name: string
  last_name: string
  occupation: string
  company_name: string
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
const RANGE_MIN  = (HOUR_END - HOUR_START) * 60  // 960 min

const CAT_META: Record<ScheduleCategory, { label: string; color: string }> = {
  arbeit:    { label: 'Arbeit',       color: '#3B82F6' },
  schule:    { label: 'Berufsschule', color: '#8B5CF6' },
  lernen:    { label: 'Lernen',       color: '#F59E0B' },
  sport:     { label: 'Sport',        color: '#10B981' },
  freizeit:  { label: 'Freizeit',     color: '#EC4899' },
  sonstiges: { label: 'Sonstiges',    color: '#6B7280' },
}
const CAT_KEYS = Object.keys(CAT_META) as ScheduleCategory[]

// Consistent color per person index
const PERSON_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EC4899',
  '#8B5CF6','#06B6D4','#EF4444','#84CC16',
]

/* ─── HELPERS ─── */

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function blocksForDay(
  blocks: RawBlock[], profileId: string, dayIdx: number, weekDates: Date[]
) {
  const date = weekDates[dayIdx]
  return blocks.filter(b => {
    if (b.profile_id !== profileId) return false
    if (b.is_recurring) return b.day_of_week === dayIdx
    if (b.specific_date) return isSameDay(parseISO(b.specific_date), date)
    return false
  })
}

function weekHours(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  return blocks
    .filter(b => {
      if (b.profile_id !== profileId) return false
      if (b.is_recurring) return true
      if (b.specific_date) return weekDates.some(d => isSameDay(parseISO(b.specific_date!), d))
      return false
    })
    .reduce((acc, b) => acc + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
}

function hoursPerCat(blocks: RawBlock[], profileId: string, weekDates: Date[]) {
  const result: Partial<Record<ScheduleCategory, number>> = {}
  for (const cat of CAT_KEYS) {
    const h = blocks
      .filter(b => {
        if (b.profile_id !== profileId || b.category !== cat) return false
        if (b.is_recurring) return true
        if (b.specific_date) return weekDates.some(d => isSameDay(parseISO(b.specific_date!), d))
        return false
      })
      .reduce((acc, b) => acc + (timeToMin(b.end_time) - timeToMin(b.start_time)) / 60, 0)
    if (h > 0) result[cat] = h
  }
  return result
}

function fmtH(h: number) {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

/* ─── READ-ONLY WEEK GRID (for individual view in Sheet) ─── */

function ReadonlyGrid({
  blocks, profileId, weekDates,
}: { blocks: RawBlock[]; profileId: string; weekDates: Date[] }) {
  const nowY = useMemo(() => {
    const n = new Date()
    return ((n.getHours() * 60 + n.getMinutes() - HOUR_START * 60) / 30) * SLOT_H
  }, [])

  return (
    <div className="flex overflow-hidden border border-border/30 rounded-xl">
      {/* Time labels */}
      <div className="w-[48px] shrink-0 border-r border-border/30 relative">
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

      {/* Day columns */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid border-b border-border/20 sticky top-0 bg-[hsl(var(--background))] z-10"
          style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
          {weekDates.map((d, i) => (
            <div key={i} className={cn(
              'h-9 flex flex-col items-center justify-center border-r border-border/20 last:border-r-0',
              isToday(d) && 'bg-primary/5'
            )}>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider',
                isToday(d) ? 'text-primary' : 'text-muted-foreground/50')}>
                {DAY_LABELS[i]}
              </span>
              <span className={cn('text-xs font-black leading-none',
                isToday(d) ? 'text-primary' : 'text-foreground/60')}>
                {format(d, 'd')}
              </span>
            </div>
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns: `repeat(7, 1fr)`, height: TOTAL_H }}>
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
                      <p className="text-[10px] font-semibold px-1.5 py-1 leading-tight truncate"
                        style={{ color: cat.color }}>{b.title}</p>
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

/* ─── GANTT ROW (Gruppenplan) ─── */

function GanttRow({
  profile, blocks, weekDates, color,
}: { profile: ApprenticeProfile; blocks: RawBlock[]; weekDates: Date[]; color: string }) {
  const initials = `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex border-b border-border/20 last:border-b-0 hover:bg-white/[0.01] group">
      {/* Name cell */}
      <div className="w-32 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border/20">
        <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
          style={{ backgroundColor: color }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{profile.first_name} {profile.last_name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{profile.occupation}</p>
        </div>
      </div>

      {/* Day cells */}
      {weekDates.map((date, dayIdx) => {
        const dayBlocks = blocksForDay(blocks, profile.id, dayIdx, weekDates)
        return (
          <div key={dayIdx}
            className={cn(
              'flex-1 relative border-r border-border/20 last:border-r-0 py-1.5 px-0.5',
              isToday(date) && 'bg-primary/[0.025]'
            )}
            style={{ minWidth: 80, height: 52 }}>
            {dayBlocks.map(b => {
              const startMin = timeToMin(b.start_time)
              const endMin   = timeToMin(b.end_time)
              const left = Math.max(0, (startMin - HOUR_START * 60) / RANGE_MIN * 100)
              const width = Math.max(1, (endMin - startMin) / RANGE_MIN * 100)
              const cat = CAT_META[b.category]
              return (
                <div key={b.id}
                  title={`${b.title} · ${b.start_time}–${b.end_time}`}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 6, bottom: 6,
                    backgroundColor: `${cat.color}25`,
                    borderLeft: `3px solid ${cat.color}`,
                  }}
                  className="rounded-r-sm overflow-hidden flex items-center">
                  <span className="text-[9px] font-semibold px-1 leading-tight truncate"
                    style={{ color: cat.color }}>
                    {b.title}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ─── MAIN PAGE ─── */

type Tab = 'overview' | 'group' | 'hours'

export default function AusbilderStundenplanPage() {
  const router = useRouter()
  const { profile: trainerProfile, loading: profileLoading } = useProfile()

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [apprentices, setApprentices] = useState<ApprenticeProfile[]>([])
  const [blocks, setBlocks] = useState<RawBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetProfile, setSheetProfile] = useState<ApprenticeProfile | null>(null)

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )
  const isCurrentWeek = weekDates.some(d => isToday(d))

  useEffect(() => {
    if (profileLoading) return
    if (trainerProfile?.role !== 'trainer') {
      router.push('/stundenplan')
      return
    }
    setLoading(true)
    fetch('/api/admin/schedule')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setApprentices(data.profiles ?? [])
        setBlocks(data.blocks ?? [])
      })
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [profileLoading, trainerProfile, router])

  /* ── Tabs ── */
  const tabs: { id: Tab; label: string; icon: typeof CalendarIcon }[] = [
    { id: 'overview', label: 'Übersicht',   icon: UserMultiple02Icon },
    { id: 'group',    label: 'Gruppenplan', icon: CalendarIcon },
    { id: 'hours',    label: 'Stunden',     icon: AnalyticsUpIcon },
  ]

  /* ── Overview cards ── */
  function OverviewTab() {
    if (apprentices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <HugeiconsIcon icon={UserMultiple02Icon} size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Noch keine Auszubildenden vorhanden.</p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apprentices.map((ap, idx) => {
          const color    = PERSON_COLORS[idx % PERSON_COLORS.length]
          const total    = weekHours(blocks, ap.id, weekDates)
          const catH     = hoursPerCat(blocks, ap.id, weekDates)
          const cats     = Object.entries(catH) as [ScheduleCategory, number][]
          const initials = `${ap.first_name[0] ?? ''}${ap.last_name[0] ?? ''}`.toUpperCase()
          const hasBlocks = blocks.some(b => b.profile_id === ap.id)

          return (
            <div key={ap.id}
              className="rounded-2xl border border-border/50 bg-card/40 p-4 flex flex-col gap-3 hover:border-border transition-colors">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ backgroundColor: color }}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {ap.first_name} {ap.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{ap.occupation}</p>
                </div>
              </div>

              {/* Stats */}
              {hasBlocks ? (
                <>
                  <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
                    <HugeiconsIcon icon={Time01Icon} size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">Diese Woche</span>
                    <span className="ml-auto text-sm font-bold" style={{ color }}>
                      {fmtH(total)}
                    </span>
                  </div>

                  {cats.length > 0 && (
                    <div className="space-y-1.5">
                      {cats.slice(0, 4).map(([cat, h]) => {
                        const meta = CAT_META[cat]
                        const pct  = total > 0 ? (h / total) * 100 : 0
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                            <span className="text-[11px] text-muted-foreground w-20 truncate">{meta.label}</span>
                            <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                            </div>
                            <span className="text-[11px] font-semibold w-8 text-right tabular-nums" style={{ color: meta.color }}>
                              {fmtH(h)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic text-center py-2">
                  Noch kein Zeitplan angelegt
                </p>
              )}

              {/* Actions */}
              <Button variant="outline" size="sm" className="w-full h-8 text-xs mt-auto"
                onClick={() => setSheetProfile(ap)}>
                <HugeiconsIcon icon={CalendarIcon} size={13} className="mr-1.5" />
                Zeitplan ansehen
              </Button>
            </div>
          )
        })}
      </div>
    )
  }

  /* ── Group plan (Gantt) ── */
  function GroupTab() {
    if (apprentices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Noch keine Auszubildenden vorhanden.</p>
        </div>
      )
    }
    return (
      <div className="rounded-2xl border border-border/40 overflow-hidden">
        {/* Time ruler header */}
        <div className="flex border-b border-border/30 bg-muted/20">
          <div className="w-32 shrink-0 border-r border-border/20 px-3 py-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Azubi
            </span>
          </div>
          {weekDates.map((date, i) => (
            <div key={i} className={cn(
              'flex-1 border-r border-border/20 last:border-r-0 px-2 py-2 text-center',
              isToday(date) && 'bg-primary/5'
            )} style={{ minWidth: 80 }}>
              <span className={cn('text-[10px] font-bold uppercase tracking-wider',
                isToday(date) ? 'text-primary' : 'text-muted-foreground/60')}>
                {DAY_LABELS[i]}
              </span>
              <span className={cn('block text-xs font-black',
                isToday(date) ? 'text-primary' : 'text-foreground/60')}>
                {format(date, 'd')}
              </span>
            </div>
          ))}
        </div>

        {/* Time range hint */}
        <div className="flex border-b border-border/10">
          <div className="w-32 shrink-0 border-r border-border/10" />
          {weekDates.map((_, i) => (
            <div key={i} className="flex-1 border-r border-border/10 last:border-r-0 px-2 py-0.5 flex justify-between"
              style={{ minWidth: 80 }}>
              <span className="text-[8px] text-muted-foreground/40 font-mono">06:00</span>
              <span className="text-[8px] text-muted-foreground/40 font-mono">22:00</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {apprentices.map((ap, idx) => (
          <GanttRow
            key={ap.id}
            profile={ap}
            blocks={blocks}
            weekDates={weekDates}
            color={PERSON_COLORS[idx % PERSON_COLORS.length]}
          />
        ))}

        {/* Legend */}
        <div className="px-4 py-2.5 border-t border-border/20 bg-muted/10 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Kategorien:</span>
          {CAT_KEYS.map(k => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: CAT_META[k].color }} />
              <span className="text-[10px] text-muted-foreground">{CAT_META[k].label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Hours table ── */
  function HoursTab() {
    if (apprentices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-muted-foreground">Noch keine Auszubildenden vorhanden.</p>
        </div>
      )
    }

    const rows = apprentices.map((ap, idx) => ({
      ap,
      color: PERSON_COLORS[idx % PERSON_COLORS.length],
      cats: hoursPerCat(blocks, ap.id, weekDates),
      total: weekHours(blocks, ap.id, weekDates),
    }))

    const maxTotal = Math.max(...rows.map(r => r.total), 1)

    return (
      <div className="rounded-2xl border border-border/40 overflow-hidden">
        {/* Header */}
        <div className="grid bg-muted/20 border-b border-border/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ gridTemplateColumns: '180px repeat(6, 1fr) 80px' }}>
          <div className="px-4 py-2.5">Auszubildende/r</div>
          {CAT_KEYS.map(k => (
            <div key={k} className="px-2 py-2.5 text-center" style={{ color: CAT_META[k].color }}>
              {CAT_META[k].label}
            </div>
          ))}
          <div className="px-3 py-2.5 text-right">Gesamt</div>
        </div>

        {/* Rows */}
        {rows.map(({ ap, color, cats, total }) => (
          <div key={ap.id}
            className="grid items-center border-b border-border/20 last:border-b-0 hover:bg-white/[0.015] transition-colors"
            style={{ gridTemplateColumns: '180px repeat(6, 1fr) 80px' }}>
            {/* Name */}
            <div className="px-4 py-3 flex items-center gap-2.5">
              <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ backgroundColor: color }}>
                {ap.first_name[0]}{ap.last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{ap.first_name} {ap.last_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ap.occupation}</p>
              </div>
            </div>

            {/* Category cells */}
            {CAT_KEYS.map(k => {
              const h = cats[k] ?? 0
              return (
                <div key={k} className="px-2 py-3 text-center">
                  {h > 0 ? (
                    <span className="text-xs font-bold" style={{ color: CAT_META[k].color }}>
                      {fmtH(h)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/30">—</span>
                  )}
                </div>
              )
            })}

            {/* Total + bar */}
            <div className="px-3 py-3">
              <div className="text-xs font-bold text-right mb-1" style={{ color }}>
                {total > 0 ? fmtH(total) : '—'}
              </div>
              {total > 0 && (
                <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(total / maxTotal) * 100}%`, backgroundColor: color }} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Footer totals */}
        <div className="grid bg-muted/10 border-t border-border/30 text-[10px] font-bold text-muted-foreground"
          style={{ gridTemplateColumns: '180px repeat(6, 1fr) 80px' }}>
          <div className="px-4 py-2.5">Summe (Ø)</div>
          {CAT_KEYS.map(k => {
            const total = rows.reduce((acc, r) => acc + (r.cats[k] ?? 0), 0)
            const avg   = rows.length > 0 ? total / rows.length : 0
            return (
              <div key={k} className="px-2 py-2.5 text-center" style={{ color: CAT_META[k].color }}>
                {avg > 0 ? fmtH(avg) : '—'}
              </div>
            )
          })}
          <div className="px-3 py-2.5 text-right">
            {fmtH(rows.reduce((a, r) => a + r.total, 0) / Math.max(rows.length, 1))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Render ── */

  if (!profileLoading && trainerProfile?.role !== 'trainer') return null

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <HugeiconsIcon icon={UserMultiple02Icon} size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Ausbilder-Bereich</h1>
            <p className="text-xs text-muted-foreground">Stunden- &amp; Blockpläne aller Auszubildenden</p>
          </div>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => setWeekStart(d => addDays(d, -7))}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          </Button>
          <span className="text-xs font-semibold min-w-[160px] text-center tabular-nums text-muted-foreground">
            {format(weekStart, 'dd. MMM', { locale: de })}
            {' – '}
            {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
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

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/40 shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeTab === t.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            )}>
            <HugeiconsIcon icon={t.icon} size={13} />
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground/60">
          {apprentices.length} Auszubildende
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="size-7 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'group'    && <GroupTab />}
            {activeTab === 'hours'    && <HoursTab />}
          </>
        )}
      </div>

      {/* Individual schedule sheet */}
      <Sheet open={!!sheetProfile} onOpenChange={v => !v && setSheetProfile(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
            <SheetTitle className="flex items-center gap-3">
              {sheetProfile && (
                <>
                  <div className="size-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ backgroundColor: PERSON_COLORS[apprentices.findIndex(a => a.id === sheetProfile.id) % PERSON_COLORS.length] }}>
                    {sheetProfile.first_name[0]}{sheetProfile.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold">{sheetProfile.first_name} {sheetProfile.last_name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{sheetProfile.occupation}</p>
                  </div>
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {sheetProfile && (
              <ReadonlyGrid
                blocks={blocks}
                profileId={sheetProfile.id}
                weekDates={weekDates}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
