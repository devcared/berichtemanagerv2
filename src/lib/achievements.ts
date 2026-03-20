import type { TrainingProfile, WeeklyReport } from '@/types'
import { eachWeekOfInterval, getISOWeekYear } from 'date-fns'
import { getISOWeek, formatWeekId } from './week-utils'

// ── Types ────────────────────────────────────────────────────────────────────

export type AchievementCategory =
  | 'start'
  | 'reports'
  | 'hours'
  | 'training'
  | 'consistency'
  | 'categories'

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface AchievementDef {
  id: string
  title: string
  description: string
  emoji: string
  category: AchievementCategory
  categoryLabel: string
  rarity: AchievementRarity
  points: number
  check: (ctx: AchievementContext) => boolean
  /** Optional progress towards unlock (value / max) */
  progress?: (ctx: AchievementContext) => { value: number; max: number }
}

export interface AchievementContext {
  profile: TrainingProfile | null
  reports: WeeklyReport[]
  totalReports: number
  approvedReports: number
  submittedOrBetter: number
  totalHours: number
  companyHours: number
  schoolHours: number
  interHours: number
  vacDays: number
  sickDays: number
  trainingPct: number
  currentYear: number
  longestStreak: number
  hasAllCategories: boolean
}

// ── Context builder ──────────────────────────────────────────────────────────

export function buildContext(
  profile: TrainingProfile | null,
  reports: WeeklyReport[],
): AchievementContext {
  let totalHours = 0, companyHours = 0, schoolHours = 0, interHours = 0
  let vacDays = 0, sickDays = 0

  reports.forEach(r => {
    totalHours += r.totalHours
    r.entries.forEach(e => {
      if (e.category === 'company')              companyHours += e.hours
      else if (e.category === 'vocationalSchool') schoolHours += e.hours
      else if (e.category === 'interCompany')    interHours  += e.hours
      else if (e.category === 'vacation')        vacDays++
      else if (e.category === 'sick')            sickDays++
    })
  })

  const trainingStart = profile?.trainingStart ? new Date(profile.trainingStart) : null
  const trainingEnd   = profile?.trainingEnd   ? new Date(profile.trainingEnd)   : null
  const trainingPct   = trainingStart && trainingEnd
    ? Math.min(100, Math.max(0, Math.round(
        (Date.now() - trainingStart.getTime()) /
        (trainingEnd.getTime() - trainingStart.getTime()) * 100
      )))
    : 0

  // Week IDs with at least submitted status
  const goodStatuses = new Set(['submitted', 'in_review', 'approved'])
  const goodWeekSet = new Set(
    reports
      .filter(r => goodStatuses.has(r.status))
      .map(r => formatWeekId(r.year, r.calendarWeek))
  )

  // Longest consecutive streak (weeks with good-status report)
  let longestStreak = 0
  if (trainingStart) {
    const now = new Date()
    const end = now < trainingStart ? trainingStart : now
    try {
      const allWeeks = eachWeekOfInterval({ start: trainingStart, end }, { weekStartsOn: 1 })
        .map(w => formatWeekId(getISOWeekYear(w), getISOWeek(w)))
      let streak = 0
      for (const wid of allWeeks) {
        if (goodWeekSet.has(wid)) { streak++; if (streak > longestStreak) longestStreak = streak }
        else { streak = 0 }
      }
    } catch { /* date-fns throws if start > end */ }
  }

  return {
    profile,
    reports,
    totalReports:       reports.length,
    approvedReports:    reports.filter(r => r.status === 'approved').length,
    submittedOrBetter:  reports.filter(r => goodStatuses.has(r.status)).length,
    totalHours,
    companyHours,
    schoolHours,
    interHours,
    vacDays,
    sickDays,
    trainingPct,
    currentYear:        profile?.currentYear ?? 1,
    longestStreak,
    hasAllCategories:   companyHours > 0 && schoolHours > 0 && interHours > 0,
  }
}

// ── Rarity helpers ───────────────────────────────────────────────────────────

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common:    'Gewöhnlich',
  uncommon:  'Ungewöhnlich',
  rare:      'Selten',
  epic:      'Episch',
  legendary: 'Legendär',
}

export const RARITY_COLOR: Record<AchievementRarity, string> = {
  common:    '#6b7280',
  uncommon:  '#22c55e',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  legendary: '#f59e0b',
}

// ── Achievement definitions ──────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [

  // ── Erste Schritte ───────────────────────────────────────────────────────
  {
    id: 'profile_set',
    title: 'Bereit!',
    description: 'Profil vollständig eingerichtet.',
    emoji: '🎯',
    category: 'start', categoryLabel: 'Erste Schritte',
    rarity: 'common', points: 10,
    check: ctx => !!(ctx.profile?.occupation && ctx.profile?.companyName && ctx.profile?.trainingStart),
  },
  {
    id: 'first_report',
    title: 'Erster Schritt',
    description: 'Den ersten Wochenbericht angelegt.',
    emoji: '📝',
    category: 'start', categoryLabel: 'Erste Schritte',
    rarity: 'common', points: 10,
    check: ctx => ctx.totalReports >= 1,
  },
  {
    id: 'first_submit',
    title: 'Eingereicht!',
    description: 'Den ersten Bericht eingereicht.',
    emoji: '📬',
    category: 'start', categoryLabel: 'Erste Schritte',
    rarity: 'common', points: 15,
    check: ctx => ctx.submittedOrBetter >= 1,
  },
  {
    id: 'first_approved',
    title: 'Erste Freigabe',
    description: 'Den ersten Bericht genehmigt bekommen.',
    emoji: '✅',
    category: 'start', categoryLabel: 'Erste Schritte',
    rarity: 'uncommon', points: 25,
    check: ctx => ctx.approvedReports >= 1,
  },

  // ── Berichte ─────────────────────────────────────────────────────────────
  {
    id: 'reports_5',
    title: '5 Berichte',
    description: '5 Wochenberichte erstellt.',
    emoji: '📋',
    category: 'reports', categoryLabel: 'Berichte',
    rarity: 'common', points: 20,
    check: ctx => ctx.totalReports >= 5,
    progress: ctx => ({ value: Math.min(ctx.totalReports, 5), max: 5 }),
  },
  {
    id: 'reports_10',
    title: '10 Berichte',
    description: '10 Wochenberichte erstellt.',
    emoji: '📚',
    category: 'reports', categoryLabel: 'Berichte',
    rarity: 'common', points: 30,
    check: ctx => ctx.totalReports >= 10,
    progress: ctx => ({ value: Math.min(ctx.totalReports, 10), max: 10 }),
  },
  {
    id: 'reports_25',
    title: 'Vierteljahres-Rekord',
    description: '25 Wochenberichte erstellt.',
    emoji: '🗓️',
    category: 'reports', categoryLabel: 'Berichte',
    rarity: 'uncommon', points: 50,
    check: ctx => ctx.totalReports >= 25,
    progress: ctx => ({ value: Math.min(ctx.totalReports, 25), max: 25 }),
  },
  {
    id: 'reports_50',
    title: 'Halbjahres-Rekord',
    description: '50 Wochenberichte erstellt.',
    emoji: '🏆',
    category: 'reports', categoryLabel: 'Berichte',
    rarity: 'rare', points: 100,
    check: ctx => ctx.totalReports >= 50,
    progress: ctx => ({ value: Math.min(ctx.totalReports, 50), max: 50 }),
  },
  {
    id: 'approved_10',
    title: '10 Freigaben',
    description: '10 Berichte genehmigt bekommen.',
    emoji: '🌟',
    category: 'reports', categoryLabel: 'Berichte',
    rarity: 'uncommon', points: 50,
    check: ctx => ctx.approvedReports >= 10,
    progress: ctx => ({ value: Math.min(ctx.approvedReports, 10), max: 10 }),
  },
  {
    id: 'approved_25',
    title: '25 Freigaben',
    description: '25 Berichte genehmigt — du bist ein Profi!',
    emoji: '⭐',
    category: 'reports', categoryLabel: 'Berichte',
    rarity: 'rare', points: 100,
    check: ctx => ctx.approvedReports >= 25,
    progress: ctx => ({ value: Math.min(ctx.approvedReports, 25), max: 25 }),
  },

  // ── Stunden ──────────────────────────────────────────────────────────────
  {
    id: 'hours_50',
    title: '50 Stunden',
    description: '50 Ausbildungsstunden dokumentiert.',
    emoji: '⏰',
    category: 'hours', categoryLabel: 'Stunden',
    rarity: 'common', points: 20,
    check: ctx => ctx.totalHours >= 50,
    progress: ctx => ({ value: Math.min(ctx.totalHours, 50), max: 50 }),
  },
  {
    id: 'hours_100',
    title: '100 Stunden',
    description: '100 Ausbildungsstunden dokumentiert.',
    emoji: '💯',
    category: 'hours', categoryLabel: 'Stunden',
    rarity: 'common', points: 40,
    check: ctx => ctx.totalHours >= 100,
    progress: ctx => ({ value: Math.min(ctx.totalHours, 100), max: 100 }),
  },
  {
    id: 'hours_250',
    title: '250 Stunden',
    description: '250 Stunden — ein Viertel Jahr Vollzeit!',
    emoji: '🔥',
    category: 'hours', categoryLabel: 'Stunden',
    rarity: 'uncommon', points: 75,
    check: ctx => ctx.totalHours >= 250,
    progress: ctx => ({ value: Math.min(ctx.totalHours, 250), max: 250 }),
  },
  {
    id: 'hours_500',
    title: '500 Stunden',
    description: '500 Stunden Ausbildung absolviert.',
    emoji: '🚀',
    category: 'hours', categoryLabel: 'Stunden',
    rarity: 'rare', points: 150,
    check: ctx => ctx.totalHours >= 500,
    progress: ctx => ({ value: Math.min(ctx.totalHours, 500), max: 500 }),
  },
  {
    id: 'hours_1000',
    title: '1000 Stunden',
    description: '1000 Stunden Ausbildung — legendär!',
    emoji: '💎',
    category: 'hours', categoryLabel: 'Stunden',
    rarity: 'legendary', points: 500,
    check: ctx => ctx.totalHours >= 1000,
    progress: ctx => ({ value: Math.min(ctx.totalHours, 1000), max: 1000 }),
  },

  // ── Ausbildungsfortschritt ────────────────────────────────────────────────
  {
    id: 'training_year2',
    title: '2. Ausbildungsjahr',
    description: 'Das zweite Ausbildungsjahr begonnen.',
    emoji: '📅',
    category: 'training', categoryLabel: 'Ausbildung',
    rarity: 'uncommon', points: 75,
    check: ctx => ctx.currentYear >= 2,
  },
  {
    id: 'training_year3',
    title: '3. Ausbildungsjahr',
    description: 'Das dritte Ausbildungsjahr begonnen.',
    emoji: '🎓',
    category: 'training', categoryLabel: 'Ausbildung',
    rarity: 'rare', points: 150,
    check: ctx => ctx.currentYear >= 3,
  },
  {
    id: 'training_halfway',
    title: 'Halbzeit!',
    description: '50 % der Ausbildungszeit absolviert.',
    emoji: '🏁',
    category: 'training', categoryLabel: 'Ausbildung',
    rarity: 'rare', points: 100,
    check: ctx => ctx.trainingPct >= 50,
    progress: ctx => ({ value: Math.min(ctx.trainingPct, 100), max: 100 }),
  },
  {
    id: 'training_stretch',
    title: 'Zielgerade!',
    description: '75 % der Ausbildungszeit hinter dir.',
    emoji: '🎯',
    category: 'training', categoryLabel: 'Ausbildung',
    rarity: 'epic', points: 200,
    check: ctx => ctx.trainingPct >= 75,
    progress: ctx => ({ value: Math.min(ctx.trainingPct, 100), max: 100 }),
  },

  // ── Konsistenz ───────────────────────────────────────────────────────────
  {
    id: 'streak_4',
    title: '4 Wochen am Stück',
    description: '4 aufeinanderfolgende Wochen mit Bericht.',
    emoji: '📆',
    category: 'consistency', categoryLabel: 'Konsistenz',
    rarity: 'uncommon', points: 40,
    check: ctx => ctx.longestStreak >= 4,
    progress: ctx => ({ value: Math.min(ctx.longestStreak, 4), max: 4 }),
  },
  {
    id: 'streak_8',
    title: '8 Wochen Streak',
    description: '8 Wochen in Folge Berichte eingereicht.',
    emoji: '⚡',
    category: 'consistency', categoryLabel: 'Konsistenz',
    rarity: 'rare', points: 80,
    check: ctx => ctx.longestStreak >= 8,
    progress: ctx => ({ value: Math.min(ctx.longestStreak, 8), max: 8 }),
  },
  {
    id: 'streak_12',
    title: '12 Wochen Streak',
    description: '12 Wochen am Stück — eiserne Disziplin!',
    emoji: '🔥',
    category: 'consistency', categoryLabel: 'Konsistenz',
    rarity: 'epic', points: 150,
    check: ctx => ctx.longestStreak >= 12,
    progress: ctx => ({ value: Math.min(ctx.longestStreak, 12), max: 12 }),
  },

  // ── Kategorien ───────────────────────────────────────────────────────────
  {
    id: 'inter_any',
    title: 'Überbetrieblich',
    description: 'Erste überbetriebliche Ausbildungsstunden eingetragen.',
    emoji: '🌐',
    category: 'categories', categoryLabel: 'Kategorien',
    rarity: 'common', points: 20,
    check: ctx => ctx.interHours > 0,
  },
  {
    id: 'company_100h',
    title: 'Betriebsprofi',
    description: '100 Stunden Betriebsarbeit dokumentiert.',
    emoji: '🏢',
    category: 'categories', categoryLabel: 'Kategorien',
    rarity: 'uncommon', points: 60,
    check: ctx => ctx.companyHours >= 100,
    progress: ctx => ({ value: Math.min(ctx.companyHours, 100), max: 100 }),
  },
  {
    id: 'school_50h',
    title: 'Schulexperte',
    description: '50 Stunden Berufsschule dokumentiert.',
    emoji: '📖',
    category: 'categories', categoryLabel: 'Kategorien',
    rarity: 'uncommon', points: 50,
    check: ctx => ctx.schoolHours >= 50,
    progress: ctx => ({ value: Math.min(ctx.schoolHours, 50), max: 50 }),
  },
  {
    id: 'all_categories',
    title: 'Allrounder',
    description: 'Stunden in Betrieb, Schule und überbetrieblicher Ausbildung eingetragen.',
    emoji: '🎪',
    category: 'categories', categoryLabel: 'Kategorien',
    rarity: 'rare', points: 80,
    check: ctx => ctx.hasAllCategories,
  },
]

export function getUnlockedIds(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter(a => a.check(ctx)).map(a => a.id)
}

export const TOTAL_POINTS = ACHIEVEMENTS.reduce((s, a) => s + a.points, 0)
