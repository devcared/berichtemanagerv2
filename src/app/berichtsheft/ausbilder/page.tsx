'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  Search01Icon,
  SortByDown01Icon,
  SortByUp01Icon,
  Notification01Icon,
  FilterHorizontalIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import type { ReportStatus } from '@/types'
import { cn } from '@/lib/utils'

interface TrainerReport {
  id: string
  calendarWeek: number
  year: number
  weekStart: string
  weekEnd: string
  status: ReportStatus
  submittedAt: string | null
  updatedAt: string
  totalHours: number
  apprentice: {
    id: string
    firstName: string
    lastName: string
    occupation: string
    companyName: string
  }
}

type SortKey = 'submitted' | 'name' | 'week'
type SortDir = 'asc' | 'desc'

const STATUS_TABS = [
  { value: 'pending', label: 'Ausstehend', statuses: ['submitted', 'in_review'] },
  { value: 'submitted', label: 'Eingereicht', statuses: ['submitted'] },
  { value: 'in_review', label: 'In Prüfung', statuses: ['in_review'] },
  { value: 'needs_revision', label: 'Überarbeitung', statuses: ['needs_revision'] },
  { value: 'approved', label: 'Freigegeben', statuses: ['approved'] },
  { value: 'all', label: 'Alle', statuses: [] },
] as const

export default function AusbilderPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()

  const [reports, setReports] = useState<TrainerReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('pending')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('submitted')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select(`
          id, calendar_week, year, week_start, week_end,
          status, submitted_at, updated_at, total_hours,
          profile:profiles(id, first_name, last_name, occupation, company_name)
        `)

      if (error) throw error

      const mapped: TrainerReport[] = (data ?? []).map((r) => {
        const p = Array.isArray(r.profile) ? r.profile[0] : r.profile
        return {
          id: r.id,
          calendarWeek: r.calendar_week,
          year: r.year,
          weekStart: r.week_start,
          weekEnd: r.week_end,
          status: r.status as ReportStatus,
          submittedAt: r.submitted_at,
          updatedAt: r.updated_at,
          totalHours: Number(r.total_hours),
          apprentice: {
            id: p?.id ?? '',
            firstName: p?.first_name ?? 'Unbekannt',
            lastName: p?.last_name ?? '',
            occupation: p?.occupation ?? '',
            companyName: p?.company_name ?? '',
          },
        }
      })
      setReports(mapped)
    } catch (err) {
      console.error('Fehler:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'trainer') loadReports()
  }, [profile, profileLoading, loadReports])

  const counts = useMemo(() => ({
    pending: reports.filter(r => r.status === 'submitted' || r.status === 'in_review').length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    in_review: reports.filter(r => r.status === 'in_review').length,
    needs_revision: reports.filter(r => r.status === 'needs_revision').length,
    approved: reports.filter(r => r.status === 'approved').length,
    all: reports.length,
  }), [reports])

  const urgentCount = useMemo(() =>
    reports.filter(r =>
      r.status === 'submitted' &&
      r.submittedAt &&
      differenceInDays(new Date(), new Date(r.submittedAt)) >= 5
    ).length
  , [reports])

  const filtered = useMemo(() => {
    const tab = STATUS_TABS.find(t => t.value === activeTab)
    let list = tab && tab.statuses.length > 0
      ? reports.filter(r => (tab.statuses as readonly string[]).includes(r.status))
      : reports

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        `${r.apprentice.firstName} ${r.apprentice.lastName}`.toLowerCase().includes(q) ||
        r.apprentice.occupation.toLowerCase().includes(q) ||
        r.apprentice.companyName.toLowerCase().includes(q)
      )
    }

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'submitted') {
        const da = a.submittedAt ?? a.updatedAt
        const db = b.submittedAt ?? b.updatedAt
        cmp = new Date(da).getTime() - new Date(db).getTime()
      } else if (sortKey === 'name') {
        cmp = `${a.apprentice.lastName}${a.apprentice.firstName}`.localeCompare(
          `${b.apprentice.lastName}${b.apprentice.firstName}`
        )
      } else if (sortKey === 'week') {
        cmp = a.year !== b.year ? a.year - b.year : a.calendarWeek - b.calendarWeek
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [reports, activeTab, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = sortDir === 'asc' ? SortByUp01Icon : SortByDown01Icon

  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">Lädt…</div>
  }

  if (profile?.role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Kein Zugriff</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Dieser Bereich ist nur für Ausbilder zugänglich.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Hero Header */}
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={24} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Willkommen zurück,</p>
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })} · Ausbilder-Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => router.push('/berichtsheft/ausbilder/verwaltung')}>
                <HugeiconsIcon icon={UserMultiple02Icon} size={14} />
                Verwaltung
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0" onClick={loadReports}>
                Aktualisieren
              </Button>
            </div>
          </div>

          {/* Urgent Banner */}
          {urgentCount > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/8 px-4 py-3">
              <div className="size-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Notification01Icon} size={14} className="text-orange-500" />
              </div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                <strong>{urgentCount} {urgentCount === 1 ? 'Bericht wartet' : 'Berichte warten'}</strong> seit über 5 Tagen auf deine Prüfung.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 text-xs border-orange-500/30 text-orange-500 hover:bg-orange-500/10 shrink-0"
                onClick={() => setActiveTab('submitted')}
              >
                Jetzt prüfen
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              key: 'submitted', label: 'Warten auf Prüfung',
              value: counts.submitted, icon: Clock01Icon,
              color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
            },
            {
              key: 'in_review', label: 'In Prüfung',
              value: counts.in_review, icon: FilterHorizontalIcon,
              color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
            },
            {
              key: 'needs_revision', label: 'Überarbeitung nötig',
              value: counts.needs_revision, icon: Alert01Icon,
              color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20',
            },
            {
              key: 'approved', label: 'Freigegeben',
              value: counts.approved, icon: CheckmarkCircle01Icon,
              color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20',
            },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all hover:scale-[1.02]',
                activeTab === s.key
                  ? `${s.border} ${s.bg}`
                  : 'border-border bg-card hover:border-border/80'
              )}
            >
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

        {/* Search + Tabs */}
        <Card className="border-border overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-border px-4 py-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Azubi suchen…"
                className="h-8 pl-8 text-xs bg-background border-border"
              />
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {([
                { key: 'submitted' as SortKey, label: 'Datum' },
                { key: 'name' as SortKey, label: 'Name' },
                { key: 'week' as SortKey, label: 'KW' },
              ] as const).map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    sortKey === s.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {s.label}
                  {sortKey === s.key && <HugeiconsIcon icon={SortIcon} size={11} />}
                </button>
              ))}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {STATUS_TABS.map(tab => {
              const count = counts[tab.value as keyof typeof counts]
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                    activeTab === tab.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center',
                      activeTab === tab.value
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Report List */}
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center">
                <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Berichte werden geladen…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {search ? 'Kein Azubi gefunden' : 'Keine Berichte'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search
                    ? `Keine Ergebnisse für „${search}"`
                    : 'In dieser Kategorie gibt es aktuell nichts zu tun.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(report => {
                  const isUrgent = report.status === 'submitted' &&
                    report.submittedAt &&
                    differenceInDays(new Date(), new Date(report.submittedAt)) >= 5

                  const dateRef = report.submittedAt ?? report.updatedAt
                  const daysAgo = differenceInDays(new Date(), new Date(dateRef))

                  return (
                    <button
                      key={report.id}
                      onClick={() => router.push(`/berichtsheft/ausbilder/${report.id}`)}
                      className={cn(
                        'w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left group',
                        isUrgent && 'border-l-2 border-orange-500'
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        'size-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold',
                        report.status === 'approved' ? 'bg-green-500/15 text-green-600' :
                        report.status === 'needs_revision' ? 'bg-red-500/15 text-red-600' :
                        report.status === 'in_review' ? 'bg-orange-500/15 text-orange-600' :
                        'bg-primary/10 text-primary'
                      )}>
                        {report.apprentice.firstName[0]}{report.apprentice.lastName[0]}
                      </div>

                      {/* Name + Occupation */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight">
                          {report.apprentice.firstName} {report.apprentice.lastName}
                          {isUrgent && (
                            <span className="ml-2 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                              DRINGEND
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {report.apprentice.occupation} · {report.apprentice.companyName}
                        </p>
                      </div>

                      {/* Week + Date */}
                      <div className="text-right hidden sm:block shrink-0">
                        <p className="text-sm font-semibold">KW {report.calendarWeek} / {report.year}</p>
                        <p className="text-xs text-muted-foreground">
                          {daysAgo === 0 ? 'Heute' : daysAgo === 1 ? 'Gestern' : `vor ${daysAgo} Tagen`}
                        </p>
                      </div>

                      {/* Hours */}
                      <div className="text-right hidden md:block shrink-0 w-16">
                        <p className="text-sm font-semibold">{report.totalHours}h</p>
                        <p className="text-xs text-muted-foreground">Stunden</p>
                      </div>

                      {/* Status + Arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={report.status} />
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={16}
                          className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
