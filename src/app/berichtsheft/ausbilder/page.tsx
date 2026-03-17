'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  ClockIcon,
  UserCircleIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import type { ReportStatus } from '@/types'

interface TrainerReport {
  id: string
  calendarWeek: number
  year: number
  weekStart: string
  status: ReportStatus
  submittedAt: string | null
  totalHours: number
  apprentice: {
    id: string
    firstName: string
    lastName: string
    occupation: string
  }
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle Status' },
  { value: 'submitted', label: 'Eingereicht' },
  { value: 'in_review', label: 'In Prüfung' },
  { value: 'needs_revision', label: 'Überarbeitung nötig' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'draft', label: 'Entwurf' },
]

export default function AusbilderPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()

  const [reports, setReports] = useState<TrainerReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('submitted')

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select(`
          id,
          calendar_week,
          year,
          week_start,
          status,
          submitted_at,
          total_hours,
          profile:profiles(id, first_name, last_name, occupation)
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      if (error) throw error

      const mapped: TrainerReport[] = (data ?? []).map((r) => {
        const p = Array.isArray(r.profile) ? r.profile[0] : r.profile
        return {
          id: r.id,
          calendarWeek: r.calendar_week,
          year: r.year,
          weekStart: r.week_start,
          status: r.status as ReportStatus,
          submittedAt: r.submitted_at,
          totalHours: Number(r.total_hours),
          apprentice: {
            id: p?.id ?? '',
            firstName: p?.first_name ?? 'Unbekannt',
            lastName: p?.last_name ?? '',
            occupation: p?.occupation ?? '',
          },
        }
      })
      setReports(mapped)
    } catch (err) {
      console.error('Fehler beim Laden der Berichte:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'trainer') {
      loadReports()
    }
  }, [profile, profileLoading, loadReports])

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
        Lädt…
      </div>
    )
  }

  if (profile?.role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Kein Zugriff</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Dieser Bereich ist nur für Ausbilder zugänglich. Deine Rolle ist: <strong>{profile?.role ?? 'unbekannt'}</strong>
        </p>
      </div>
    )
  }

  const filtered = statusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === statusFilter)

  const counts = {
    submitted: reports.filter(r => r.status === 'submitted').length,
    in_review: reports.filter(r => r.status === 'in_review').length,
    needs_revision: reports.filter(r => r.status === 'needs_revision').length,
    approved: reports.filter(r => r.status === 'approved').length,
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ausbilder-Bereich</h1>
          <p className="text-sm text-muted-foreground">Berichte prüfen, kommentieren und freigeben</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Eingereicht"
          value={counts.submitted}
          icon={ClockIcon}
          color="text-blue-500"
          bg="bg-blue-500/10"
          onClick={() => setStatusFilter('submitted')}
          active={statusFilter === 'submitted'}
        />
        <StatCard
          label="In Prüfung"
          value={counts.in_review}
          icon={UserCircleIcon}
          color="text-orange-500"
          bg="bg-orange-500/10"
          onClick={() => setStatusFilter('in_review')}
          active={statusFilter === 'in_review'}
        />
        <StatCard
          label="Überarbeitung"
          value={counts.needs_revision}
          icon={Alert01Icon}
          color="text-red-500"
          bg="bg-red-500/10"
          onClick={() => setStatusFilter('needs_revision')}
          active={statusFilter === 'needs_revision'}
        />
        <StatCard
          label="Freigegeben"
          value={counts.approved}
          icon={CheckmarkCircle01Icon}
          color="text-green-500"
          bg="bg-green-500/10"
          onClick={() => setStatusFilter('approved')}
          active={statusFilter === 'approved'}
        />
      </div>

      {/* Filter + List */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Berichte</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-48 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={loadReports}>
                Aktualisieren
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Lädt…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Keine Berichte mit diesem Status.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(report => (
                <button
                  key={report.id}
                  onClick={() => router.push(`/berichtsheft/ausbilder/${report.id}`)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                      {report.apprentice.firstName[0]}{report.apprentice.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {report.apprentice.firstName} {report.apprentice.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {report.apprentice.occupation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold">KW {report.calendarWeek} / {report.year}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.submittedAt
                          ? format(new Date(report.submittedAt), 'dd. MMM', { locale: de })
                          : format(new Date(report.weekStart), 'dd. MMM', { locale: de })}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label, value, icon, color, bg, onClick, active,
}: {
  label: string
  value: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  color: string
  bg: string
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${active ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/40'}`}
    >
      <div className={`size-8 rounded-lg ${bg} ${color} flex items-center justify-center mb-2`}>
        <HugeiconsIcon icon={icon} size={16} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </button>
  )
}
