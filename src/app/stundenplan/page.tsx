'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { addDays, startOfWeek, format, isToday, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/hooks/use-schedule'
import type { ScheduleBlock, ScheduleCategory } from '@/types'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon,
  Delete02Icon, Time01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── CONSTANTS ─── */

const HOUR_START = 6
const HOUR_END   = 22
const SLOTS      = (HOUR_END - HOUR_START) * 2  // 32 half-hour slots
const SLOT_H     = 44                             // px per 30-min slot
const TOTAL_H    = SLOTS * SLOT_H                 // 1408 px

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

interface CategoryMeta {
  id: ScheduleCategory
  label: string
  color: string
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'arbeit',    label: 'Arbeit',       color: '#3B82F6' },
  { id: 'schule',    label: 'Berufsschule', color: '#8B5CF6' },
  { id: 'lernen',    label: 'Lernen',       color: '#F59E0B' },
  { id: 'sport',     label: 'Sport',        color: '#10B981' },
  { id: 'freizeit',  label: 'Freizeit',     color: '#EC4899' },
  { id: 'sonstiges', label: 'Sonstiges',    color: '#6B7280' },
]

/* ─── HELPERS ─── */

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function blockTop(startTime: string) {
  return ((timeToMin(startTime) - HOUR_START * 60) / 30) * SLOT_H
}

function blockH(startTime: string, endTime: string) {
  return ((timeToMin(endTime) - timeToMin(startTime)) / 30) * SLOT_H
}

function slotToTime(slotIdx: number) {
  const m = HOUR_START * 60 + slotIdx * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function nowPx() {
  const n = new Date()
  return ((n.getHours() * 60 + n.getMinutes() - HOUR_START * 60) / 30) * SLOT_H
}

function getCat(id: ScheduleCategory): CategoryMeta {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[5]
}

function blocksForDay(all: ScheduleBlock[], dayIdx: number, weekDates: Date[]) {
  const date = weekDates[dayIdx]
  return all.filter(b => {
    if (b.isRecurring) return b.dayOfWeek === dayIdx
    if (b.specificDate) return isSameDay(parseISO(b.specificDate), date)
    return false
  })
}

/* ─── BLOCK FORM ─── */

interface BlockForm {
  title: string
  description: string
  category: ScheduleCategory
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  specificDate: string
}

function emptyForm(overrides?: Partial<BlockForm>): BlockForm {
  return {
    title: '',
    description: '',
    category: 'arbeit',
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '09:00',
    isRecurring: true,
    specificDate: format(new Date(), 'yyyy-MM-dd'),
    ...overrides,
  }
}

/* ─── BLOCK CARD ─── */

function BlockCard({ block, onClick }: { block: ScheduleBlock; onClick: () => void }) {
  const cat   = getCat(block.category)
  const top   = blockTop(block.startTime)
  const h     = Math.max(blockH(block.startTime, block.endTime) - 2, 20)
  const small = h < 36

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        position: 'absolute',
        top: top + 1,
        left: 3,
        right: 3,
        height: h,
        backgroundColor: `${cat.color}1a`,
        borderLeft: `3px solid ${cat.color}`,
      }}
      className="rounded-r-md text-left overflow-hidden z-10 hover:brightness-125 transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="px-2 py-1 h-full flex flex-col justify-start gap-0.5">
        <p
          className={cn('font-semibold leading-tight truncate', small ? 'text-[10px]' : 'text-xs')}
          style={{ color: cat.color }}
        >
          {block.title}
        </p>
        {!small && h >= 60 && (
          <p className="text-[10px] text-muted-foreground/70 leading-none">
            {block.startTime} – {block.endTime}
          </p>
        )}
      </div>
    </button>
  )
}

/* ─── STATS BAR ─── */

function StatsBar({ blocks, weekDates }: { blocks: ScheduleBlock[]; weekDates: Date[] }) {
  const visible = blocks.filter(b =>
    b.isRecurring || (b.specificDate && weekDates.some(d => isSameDay(parseISO(b.specificDate!), d)))
  )

  const stats = CATEGORIES.map(cat => {
    const mins = visible
      .filter(b => b.category === cat.id)
      .reduce((acc, b) => acc + timeToMin(b.endTime) - timeToMin(b.startTime), 0)
    return { ...cat, hours: mins / 60 }
  }).filter(s => s.hours > 0)

  const total = stats.reduce((a, s) => a + s.hours, 0)
  if (stats.length === 0) return null

  return (
    <div className="shrink-0 border-t border-border/40 bg-card/20 px-4 py-2.5">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Woche:
        </span>
        {stats.map(s => (
          <div key={s.id} className="flex items-center gap-1.5">
            <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
            <span className="text-[11px] font-bold" style={{ color: s.color }}>
              {s.hours % 1 === 0 ? `${s.hours}h` : `${s.hours.toFixed(1)}h`}
            </span>
          </div>
        ))}
        <span className="text-[11px] text-muted-foreground ml-auto">
          Gesamt: <strong className="text-foreground">{total % 1 === 0 ? `${total}h` : `${total.toFixed(1)}h`}</strong>
        </span>
      </div>
    </div>
  )
}

/* ─── BLOCK DIALOG ─── */

function BlockDialog({
  open, title, form, onChange, onSave, onDelete, onClose, isSaving,
}: {
  open: boolean
  title: string
  form: BlockForm
  onChange: (f: BlockForm) => void
  onSave: () => void
  onDelete?: () => void
  onClose: () => void
  isSaving: boolean
}) {
  // Conflict hint: times swapped
  const conflict = form.startTime >= form.endTime

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="block-title">Titel *</Label>
            <Input
              id="block-title"
              placeholder="z. B. Berufsschule, Arbeit, Sport …"
              value={form.title}
              onChange={e => onChange({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange({ ...form, category: cat.id })}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                    form.category === cat.id
                      ? 'border-transparent'
                      : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                  style={form.category === cat.id ? {
                    borderColor: cat.color,
                    backgroundColor: `${cat.color}18`,
                    color: cat.color,
                  } : {}}
                >
                  <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-start">Von</Label>
              <Input id="t-start" type="time" value={form.startTime}
                onChange={e => onChange({ ...form, startTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-end">Bis</Label>
              <Input id="t-end" type="time" value={form.endTime}
                onChange={e => onChange({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          {conflict && (
            <p className="text-xs text-destructive -mt-2">Endzeit muss nach der Startzeit liegen.</p>
          )}

          {/* Recurring toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...form, isRecurring: !form.isRecurring })}
            className="w-full flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-border transition-colors text-left"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">Wöchentlich wiederholen</p>
              <p className="text-xs text-muted-foreground">
                {form.isRecurring
                  ? `Jeden ${DAY_LABELS[form.dayOfWeek]}, ${form.startTime}–${form.endTime}`
                  : 'Einmaliger Termin'}
              </p>
            </div>
            <div className={cn('w-10 h-6 rounded-full transition-colors relative shrink-0',
              form.isRecurring ? 'bg-primary' : 'bg-muted')}>
              <span className={cn('absolute top-1 size-4 rounded-full bg-white shadow transition-transform',
                form.isRecurring ? 'translate-x-5' : 'translate-x-1')} />
            </div>
          </button>

          {/* Day picker (recurring) or date picker (one-off) */}
          {form.isRecurring ? (
            <div className="space-y-1.5">
              <Label>Wochentag</Label>
              <div className="flex gap-1">
                {DAY_LABELS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChange({ ...form, dayOfWeek: i })}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-semibold transition-all',
                      form.dayOfWeek === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="t-date">Datum</Label>
              <Input id="t-date" type="date" value={form.specificDate}
                onChange={e => onChange({ ...form, specificDate: e.target.value })} />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="block-desc">
              Beschreibung <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="block-desc"
              placeholder="Notizen zum Block …"
              rows={2}
              value={form.description}
              onChange={e => onChange({ ...form, description: e.target.value })}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="mr-auto gap-1.5">
              <HugeiconsIcon icon={Delete02Icon} size={13} />
              Löschen
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onSave} disabled={!form.title.trim() || conflict || isSaving}>
            {isSaving ? 'Speichern …' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── MAIN PAGE ─── */

export default function StundenplanPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [nowY, setNowY] = useState(nowPx)
  const [createOpen, setCreateOpen]   = useState(false)
  const [editBlock, setEditBlock]     = useState<ScheduleBlock | null>(null)
  const [form, setForm]               = useState<BlockForm>(emptyForm())
  const [isSaving, setIsSaving]       = useState(false)
  const { blocks, createBlock, updateBlock, deleteBlock, isLoading } = useSchedule()

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const isCurrentWeek = weekDates.some(d => isToday(d))

  // Refresh now-indicator every minute
  useEffect(() => {
    const id = setInterval(() => setNowY(nowPx()), 60_000)
    return () => clearInterval(id)
  }, [])

  /* ── Handlers ── */

  function openCreate(dayIdx: number, slotIdx: number) {
    const start = slotToTime(slotIdx)
    const end   = slotToTime(Math.min(slotIdx + 2, SLOTS))
    setForm(emptyForm({
      dayOfWeek: dayIdx,
      startTime: start,
      endTime: end,
      specificDate: format(weekDates[dayIdx], 'yyyy-MM-dd'),
    }))
    setCreateOpen(true)
  }

  function openEdit(block: ScheduleBlock) {
    setForm({
      title:        block.title,
      description:  block.description ?? '',
      category:     block.category,
      dayOfWeek:    block.dayOfWeek ?? 0,
      startTime:    block.startTime,
      endTime:      block.endTime,
      isRecurring:  block.isRecurring,
      specificDate: block.specificDate ?? format(new Date(), 'yyyy-MM-dd'),
    })
    setEditBlock(block)
  }

  async function handleCreate() {
    if (!form.title.trim() || form.startTime >= form.endTime) return
    setIsSaving(true)
    await createBlock({
      title:        form.title.trim(),
      description:  form.description || undefined,
      category:     form.category,
      color:        getCat(form.category).color,
      dayOfWeek:    form.isRecurring ? form.dayOfWeek : undefined,
      startTime:    form.startTime,
      endTime:      form.endTime,
      isRecurring:  form.isRecurring,
      specificDate: form.isRecurring ? undefined : form.specificDate,
    })
    setIsSaving(false)
    setCreateOpen(false)
  }

  async function handleUpdate() {
    if (!editBlock || !form.title.trim() || form.startTime >= form.endTime) return
    setIsSaving(true)
    await updateBlock(editBlock.id, {
      title:        form.title.trim(),
      description:  form.description || undefined,
      category:     form.category,
      color:        getCat(form.category).color,
      dayOfWeek:    form.isRecurring ? form.dayOfWeek : undefined,
      startTime:    form.startTime,
      endTime:      form.endTime,
      isRecurring:  form.isRecurring,
      specificDate: form.isRecurring ? undefined : form.specificDate,
    })
    setIsSaving(false)
    setEditBlock(null)
  }

  async function handleDelete() {
    if (!editBlock) return
    await deleteBlock(editBlock.id)
    setEditBlock(null)
  }

  /* ── Render ── */

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => setWeekStart(d => addDays(d, -7))}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          </Button>
          <span className="text-sm font-semibold min-w-[200px] text-center tabular-nums">
            {format(weekStart, 'dd. MMM', { locale: de })}
            {' – '}
            {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
          </span>
          <Button variant="ghost" size="icon" className="size-8"
            onClick={() => setWeekStart(d => addDays(d, 7))}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Button>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" className="h-7 text-xs ml-1"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Heute
            </Button>
          )}
        </div>

        <Button size="sm" className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => { setForm(emptyForm()); setCreateOpen(true) }}>
          <HugeiconsIcon icon={Add01Icon} size={13} />
          Neuer Block
        </Button>
      </div>

      {/* ── Grid ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Time labels */}
        <div className="w-[52px] shrink-0 border-r border-border/40 relative overflow-hidden">
          {/* Spacer for day-header row */}
          <div className="h-10 border-b border-border/30" />
          <div style={{ height: TOTAL_H, position: 'relative' }}>
            {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
              const hour = HOUR_START + i
              return (
                <div
                  key={hour}
                  style={{ position: 'absolute', top: i * SLOT_H * 2 - 8, right: 6 }}
                  className="text-right"
                >
                  <span className="text-[10px] leading-none font-mono text-muted-foreground/50">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable calendar area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">

          {/* Day headers (sticky) */}
          <div
            className="sticky top-0 z-20 grid border-b border-border/30 bg-[hsl(var(--background))]"
            style={{ gridTemplateColumns: `repeat(7, minmax(90px, 1fr))` }}
          >
            {weekDates.map((date, i) => {
              const today = isToday(date)
              return (
                <div key={i} className={cn(
                  'h-10 flex flex-col items-center justify-center border-r border-border/20 last:border-r-0',
                  today && 'bg-primary/5'
                )}>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-widest',
                    today ? 'text-primary' : 'text-muted-foreground/60'
                  )}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={cn(
                    'text-sm font-black leading-none mt-0.5',
                    today ? 'text-primary' : 'text-foreground/70'
                  )}>
                    {format(date, 'd')}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Grid columns */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(7, minmax(90px, 1fr))`, height: TOTAL_H }}
          >
            {weekDates.map((date, dayIdx) => {
              const dayBlocks = blocksForDay(blocks, dayIdx, weekDates)
              const todayCol  = isToday(date)
              const inRange   = nowY >= 0 && nowY <= TOTAL_H

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    'relative border-r border-border/20 last:border-r-0',
                    todayCol && 'bg-primary/[0.018]'
                  )}
                  style={{ height: TOTAL_H }}
                >
                  {/* Slot cells — background grid + click-to-create */}
                  {Array.from({ length: SLOTS }, (_, si) => (
                    <div
                      key={si}
                      style={{ position: 'absolute', top: si * SLOT_H, height: SLOT_H, width: '100%' }}
                      className={cn(
                        'border-b cursor-pointer transition-colors duration-75 hover:bg-white/[0.03]',
                        si % 2 === 0 ? 'border-border/20' : 'border-border/[0.08]'
                      )}
                      onClick={() => openCreate(dayIdx, si)}
                    />
                  ))}

                  {/* Blocks */}
                  {dayBlocks.map(block => (
                    <BlockCard key={block.id} block={block} onClick={() => openEdit(block)} />
                  ))}

                  {/* Now indicator */}
                  {todayCol && inRange && (
                    <div
                      style={{ position: 'absolute', top: nowY, left: 0, right: 0, zIndex: 20 }}
                      className="pointer-events-none flex items-center"
                    >
                      <div className="size-2.5 rounded-full bg-primary shadow-lg shadow-primary/50 shrink-0 -ml-1.5 z-10" />
                      <div className="flex-1 h-px bg-primary/80" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <StatsBar blocks={blocks} weekDates={weekDates} />

      {/* ── Create dialog ── */}
      <BlockDialog
        open={createOpen}
        title="Neuer Zeitblock"
        form={form}
        onChange={setForm}
        onSave={handleCreate}
        onClose={() => setCreateOpen(false)}
        isSaving={isSaving}
      />

      {/* ── Edit dialog ── */}
      <BlockDialog
        open={!!editBlock}
        title="Block bearbeiten"
        form={form}
        onChange={setForm}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onClose={() => setEditBlock(null)}
        isSaving={isSaving}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <span className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      )}
    </div>
  )
}
