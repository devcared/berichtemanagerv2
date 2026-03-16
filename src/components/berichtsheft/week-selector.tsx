'use client'

import { Button } from '@/components/ui/button'
import { getCalendarWeekLabel, getWeekDateRangeLabel } from '@/lib/week-utils'
import { ChevronLeft, ChevronRight } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface WeekSelectorProps {
  week: number
  year: number
  onChange: (week: number, year: number) => void
}

function getPrevWeek(week: number, year: number): { week: number; year: number } {
  if (week === 1) {
    // Last week of previous year
    const dec28 = new Date(year - 1, 11, 28)
    const lastWeek = getISOWeekOfDate(dec28)
    return { week: lastWeek, year: year - 1 }
  }
  return { week: week - 1, year }
}

function getNextWeek(week: number, year: number): { week: number; year: number } {
  // Check if current week is last week of year
  const dec28 = new Date(year, 11, 28)
  const lastWeekOfYear = getISOWeekOfDate(dec28)
  if (week >= lastWeekOfYear) {
    return { week: 1, year: year + 1 }
  }
  return { week: week + 1, year }
}

function getISOWeekOfDate(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function WeekSelector({ week, year, onChange }: WeekSelectorProps) {
  function handlePrev() {
    const prev = getPrevWeek(week, year)
    onChange(prev.week, prev.year)
  }

  function handleNext() {
    const next = getNextWeek(week, year)
    onChange(next.week, next.year)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handlePrev}
        aria-label="Vorherige Woche"
      >
        <HugeiconsIcon icon={ChevronLeft} size={16} />
      </Button>

      <div className="text-center min-w-[160px]">
        <div className="font-semibold text-foreground text-sm">
          {getCalendarWeekLabel(week, year)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {getWeekDateRangeLabel(year, week)}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleNext}
        aria-label="Nächste Woche"
      >
        <HugeiconsIcon icon={ChevronRight} size={16} />
      </Button>
    </div>
  )
}
