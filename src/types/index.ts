export type UserRole = 'apprentice' | 'trainer'

export type ReportStatus =
  | 'draft'           // Azubi schreibt noch
  | 'submitted'       // Eingereicht zur Prüfung (ehem. 'completed')
  | 'in_review'       // Ausbilder prüft gerade
  | 'approved'        // Freigegeben (ehem. 'exported')
  | 'needs_revision'  // Ausbilder schickt zurück
export type ActivityCategory = 'company' | 'vocationalSchool' | 'interCompany' | 'vacation' | 'sick' | 'holiday'
export type ReportType = 'daily' | 'weekly'

export interface TrainingProfile {
  id: string
  firstName: string
  lastName: string
  birthDate: string // ISO string
  occupation: string
  companyName: string
  trainerName: string
  department?: string
  trainingStart: string
  trainingEnd: string
  currentYear: number
  reportType: ReportType
  weeklyHours: number
  schoolDays: number[] // 1=Mo..5=Fr
  schoolHoursPerDay: number
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface DailyEntry {
  id: string
  reportId: string
  date: string
  category: ActivityCategory
  activities: string
  schoolContent?: string
  hours: number
  notes?: string
}

export interface WeeklyReport {
  id: string
  calendarWeek: number
  year: number
  weekStart: string
  weekEnd: string
  trainingYear: number
  status: ReportStatus
  entries: DailyEntry[]
  totalHours: number
  isPdfReport?: boolean
  pdfData?: string
  createdAt: string
  updatedAt: string
  exportedAt?: string
}

export interface ActivityTemplate {
  id: string
  profileId: string
  title: string
  content: string
  category: ActivityCategory
  isFavorite: boolean
  usageCount: number
  createdAt: string
}

export interface AppModule {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  routePath: string
  isEnabled: boolean
  lastUsed?: string
}

/* ─── STUNDENPLAN ─── */

export type ScheduleCategory = 'arbeit' | 'schule' | 'lernen' | 'sport' | 'freizeit' | 'sonstiges'

export interface ScheduleBlock {
  id: string
  profileId: string
  title: string
  description?: string
  category: ScheduleCategory
  color: string
  /** 0 = Mon … 6 = Sun — only set when isRecurring = true */
  dayOfWeek?: number
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  isRecurring: boolean
  /** ISO date string — only set when isRecurring = false */
  specificDate?: string
  createdAt: string
  updatedAt: string
}
