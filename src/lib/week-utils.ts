import { startOfISOWeek, getISOWeek as fnsGetISOWeek, getISOWeekYear } from 'date-fns'
import { de } from 'date-fns/locale'
import { format } from 'date-fns'

export function getISOWeek(date: Date): number {
  return fnsGetISOWeek(date)
}

export function getWeekStart(year: number, week: number): Date {
  // Find a date in that ISO week
  const jan4 = new Date(year, 0, 4) // Jan 4 is always in week 1
  const startOfWeek1 = startOfISOWeek(jan4)
  const targetMonday = new Date(startOfWeek1)
  targetMonday.setDate(startOfWeek1.getDate() + (week - 1) * 7)
  return targetMonday
}

export function getWeekEnd(year: number, week: number): Date {
  const start = getWeekStart(year, week)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

export function formatWeekId(year: number, week: number): string {
  const paddedWeek = week.toString().padStart(2, '0')
  return `${year}-KW${paddedWeek}`
}

export function parseWeekId(weekId: string): { year: number; week: number } {
  const match = weekId.match(/^(\d{4})-KW(\d{1,2})$/)
  if (!match) {
    const now = new Date()
    return { year: getISOWeekYear(now), week: getISOWeek(now) }
  }
  return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) }
}

export function getCalendarWeekLabel(week: number, year: number): string {
  return `KW ${week} / ${year}`
}

export function getCurrentWeekId(): string {
  const now = new Date()
  const week = getISOWeek(now)
  const year = getISOWeekYear(now)
  return formatWeekId(year, week)
}

export function getWeekDateRangeLabel(year: number, week: number): string {
  const start = getWeekStart(year, week)
  const end = getWeekEnd(year, week)
  const startStr = format(start, 'd. MMM', { locale: de })
  const endStr = format(end, 'd. MMM', { locale: de })
  return `${startStr} – ${endStr}`
}
