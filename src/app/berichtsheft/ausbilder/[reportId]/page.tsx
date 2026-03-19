'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  BubbleChatAddIcon,
  Clock01Icon,
  UserCircleIcon,
  CheckmarkBadge01Icon,
  Edit02Icon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons'
import type { ReportStatus, ActivityCategory } from '@/types'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
const DAY_SECTIONS = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag']

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  company: 'Betrieb',
  vocationalSchool: 'Berufsschule',
  interCompany: 'Überbetrieblich',
  vacation: 'Urlaub',
  sick: 'Krank',
  holiday: 'Feiertag',
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  company: 'bg-blue-500/10 text-blue-600',
  vocationalSchool: 'bg-purple-500/10 text-purple-600',
  interCompany: 'bg-cyan-500/10 text-cyan-600',
  vacation: 'bg-green-500/10 text-green-600',
  sick: 'bg-red-500/10 text-red-600',
  holiday: 'bg-yellow-500/10 text-yellow-600',
}

interface ReportDetail {
  id: string
  calendarWeek: number
  year: number
  weekStart: string
  weekEnd: string
  status: ReportStatus
  totalHours: number
  submittedAt: string | null
  entries: Array<{
    id: string
    date: string
    category: ActivityCategory
    activities: string
    hours: number
    notes?: string
  }>
  apprentice: {
    firstName: string
    lastName: string
    occupation: string
    companyName: string
    trainingStart: string
    currentYear: number
  }
}

interface Comment {
  id: string
  section: string
  content: string
  authorName: string
  createdAt: string
  isOwn: boolean
  isTrainer: boolean
}

interface StatusHistoryEntry {
  id: string
  oldStatus: string | null
  newStatus: string
  comment: string | null
  changedAt: string
  changedByName: string
}

const STATUS_STEPS: { status: ReportStatus | 'draft'; label: string }[] = [
  { status: 'draft', label: 'Entwurf' },
  { status: 'submitted', label: 'Eingereicht' },
  { status: 'in_review', label: 'In Prüfung' },
  { status: 'approved', label: 'Freigegeben' },
]

function getStepIndex(status: ReportStatus): number {
  if (status === 'needs_revision') return 1
  const idx = STATUS_STEPS.findIndex(s => s.status === status)
  return idx === -1 ? 0 : idx
}

export default function AusbilderReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const router = useRouter()
  const { profile } = useProfile()
  const supabase = createClient()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)
  const [actionError, setActionError] = useState('')

  // Comment state
  const [newComment, setNewComment] = useState('')
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>('general')
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Revision state
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')

  // Approval confirmation
  const [showApproveDialog, setShowApproveDialog] = useState(false)

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: rData, error: rError }, { data: eData, error: eError }] = await Promise.all([
        supabase
          .from('weekly_reports')
          .select(`
            id, calendar_week, year, week_start, week_end,
            status, submitted_at, total_hours,
            profile:profiles(first_name, last_name, occupation, company_name, training_start, current_year)
          `)
          .eq('id', reportId)
          .single(),
        supabase
          .from('daily_entries')
          .select('*')
          .eq('report_id', reportId)
          .order('date', { ascending: true }),
      ])

      if (rError) throw rError
      if (eError) throw eError

      const p = Array.isArray(rData.profile) ? rData.profile[0] : rData.profile

      setReport({
        id: rData.id,
        calendarWeek: rData.calendar_week,
        year: rData.year,
        weekStart: rData.week_start,
        weekEnd: rData.week_end,
        status: rData.status as ReportStatus,
        totalHours: Number(rData.total_hours),
        submittedAt: rData.submitted_at,
        entries: (eData ?? []).map(e => ({
          id: e.id,
          date: e.date,
          category: e.category as ActivityCategory,
          activities: e.activities,
          hours: Number(e.hours),
          notes: e.notes ?? undefined,
        })),
        apprentice: {
          firstName: p?.first_name ?? '',
          lastName: p?.last_name ?? '',
          occupation: p?.occupation ?? '',
          companyName: p?.company_name ?? '',
          trainingStart: p?.training_start ?? '',
          currentYear: p?.current_year ?? 1,
        },
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [reportId, supabase])

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('report_comments')
      .select('id, section, content, created_at, author_id, profile:profiles(first_name, last_name, role)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })

    if (error) return

    setComments((data ?? []).map(c => {
      const p = Array.isArray(c.profile) ? c.profile[0] : c.profile
      return {
        id: c.id,
        section: c.section,
        content: c.content,
        authorName: p ? `${p.first_name} ${p.last_name}` : 'Unbekannt',
        createdAt: c.created_at,
        isOwn: c.author_id === profile?.id,
        isTrainer: p?.role === 'trainer' || p?.role === 'admin',
      }
    }))
  }, [reportId, supabase, profile?.id])

  const loadHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('report_status_history')
      .select('id, old_status, new_status, comment, changed_at, profile:profiles(first_name, last_name)')
      .eq('report_id', reportId)
      .order('changed_at', { ascending: true })

    if (error) return

    setStatusHistory((data ?? []).map(h => {
      const p = Array.isArray(h.profile) ? h.profile[0] : h.profile
      return {
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        comment: h.comment,
        changedAt: h.changed_at,
        changedByName: p ? `${p.first_name} ${p.last_name}` : 'System',
      }
    }))
  }, [reportId, supabase])

  useEffect(() => {
    loadReport()
    loadComments()
    loadHistory()
  }, [loadReport, loadComments, loadHistory])

  async function handleStatusChange(newStatus: ReportStatus, note?: string) {
    if (!report) return
    setIsActioning(true)
    setActionError('')
    try {
      const { error } = await supabase
        .from('weekly_reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', report.id)

      if (error) throw error

      await supabase.from('report_status_history').insert({
        report_id: report.id,
        changed_by: profile?.id,
        old_status: report.status,
        new_status: newStatus,
        comment: note ?? null,
      })

      if (newStatus === 'approved') {
        await supabase.from('report_approvals').insert({
          report_id: report.id,
          trainer_id: profile?.id,
          trainer_name: `${profile?.firstName} ${profile?.lastName}`,
          notes: note ?? null,
        })
      }

      if (newStatus === 'needs_revision' && note?.trim()) {
        await supabase.from('report_comments').insert({
          report_id: report.id,
          author_id: profile?.id,
          section: 'general',
          content: `✏️ Überarbeitung erforderlich: ${note}`,
        })
      }

      setReport(prev => prev ? { ...prev, status: newStatus } : null)
      setShowRevisionDialog(false)
      setShowApproveDialog(false)
      setRevisionNote('')
      await Promise.all([loadComments(), loadHistory()])
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Fehler.')
    } finally {
      setIsActioning(false)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !profile || !activeCommentSection) return
    setIsAddingComment(true)
    try {
      const { error } = await supabase.from('report_comments').insert({
        report_id: reportId,
        author_id: profile.id,
        section: activeCommentSection,
        content: newComment.trim(),
      })
      if (error) throw error
      setNewComment('')
      await loadComments()
    } catch (err) {
      console.error(err)
    } finally {
      setIsAddingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Bericht wird geladen…</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
        <p className="text-muted-foreground">Bericht nicht gefunden.</p>
        <Button variant="outline" onClick={() => router.push('/berichtsheft/ausbilder')}>Zurück</Button>
      </div>
    )
  }

  const canAct = report.status === 'submitted' || report.status === 'in_review'
  const currentStepIdx = getStepIndex(report.status)
  const generalComments = comments.filter(c => c.section === 'general')

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => router.push('/berichtsheft/ausbilder')}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Übersicht
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-semibold text-foreground hidden sm:block">
              {report.apprentice.firstName} {report.apprentice.lastName}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              KW {report.calendarWeek} / {report.year}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            {canAct && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => setShowRevisionDialog(true)}
                  disabled={isActioning}
                >
                  <HugeiconsIcon icon={Alert01Icon} size={13} />
                  <span className="hidden sm:inline">Überarbeitung</span>
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/30"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isActioning}
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                  <span className="hidden sm:inline">Freigeben</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-5 py-4 sm:py-6 max-w-6xl mx-auto w-full">
        {/* Azubi Hero */}
        <Card className="border-border overflow-hidden mb-6">
          <div className="p-3 sm:p-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                {report.apprentice.firstName[0]}{report.apprentice.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {report.apprentice.firstName} {report.apprentice.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{report.apprentice.occupation}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{report.apprentice.companyName}</p>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                {
                  label: 'Kalenderwoche',
                  value: `KW ${report.calendarWeek} / ${report.year}`,
                },
                {
                  label: 'Zeitraum',
                  value: `${format(new Date(report.weekStart), 'dd.MM')} – ${format(new Date(report.weekEnd), 'dd.MM.yyyy')}`,
                },
                {
                  label: 'Wochenstunden',
                  value: `${report.totalHours} Std.`,
                },
                {
                  label: 'Ausbildungsjahr',
                  value: `${report.apprentice.currentYear}. Jahr`,
                },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">{m.label}</p>
                  <p className="text-sm font-semibold">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Status Timeline */}
            <div className="relative">
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, idx) => {
                  const isPast = idx < currentStepIdx
                  const isCurrent = idx === currentStepIdx
                  const isRevision = report.status === 'needs_revision' && idx === 1

                  return (
                    <div key={step.status} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={cn(
                          'size-7 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold',
                          isPast || (isCurrent && report.status === 'approved')
                            ? 'bg-green-500 border-green-500 text-white'
                            : isCurrent && report.status === 'needs_revision'
                            ? 'bg-red-500 border-red-500 text-white'
                            : isCurrent
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground'
                        )}>
                          {isPast || (isCurrent && report.status === 'approved')
                            ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                            : isRevision
                            ? <HugeiconsIcon icon={Alert01Icon} size={12} />
                            : idx + 1
                          }
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium whitespace-nowrap',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {isRevision ? 'Überarbeitung' : step.label}
                        </span>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={cn(
                          'h-0.5 flex-1 -mt-5 mx-1',
                          idx < currentStepIdx ? 'bg-green-500' : 'bg-border'
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Daily Entries */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Tätigkeiten der Woche
            </h3>

            {report.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">Keine Tageseinträge vorhanden.</p>
            ) : report.entries.map((entry, i) => {
              const dayName = DAY_NAMES[i] ?? `Tag ${i + 1}`
              const section = DAY_SECTIONS[i] ?? `tag${i + 1}`
              const dayComments = comments.filter(c => c.section === section)
              const isCommentingHere = activeCommentSection === section

              return (
                <Card key={entry.id} className="border-border overflow-hidden group">
                  <div className="p-4">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{dayName}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {format(new Date(entry.date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          CATEGORY_COLORS[entry.category]
                        )}>
                          {CATEGORY_LABELS[entry.category]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">{entry.hours} Std.</span>
                        <button
                          onClick={() => {
                            setActiveCommentSection(isCommentingHere ? 'general' : section)
                            setNewComment('')
                          }}
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors',
                            isCommentingHere
                              ? 'bg-primary/15 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100'
                          )}
                        >
                          <HugeiconsIcon icon={BubbleChatAddIcon} size={12} />
                          {dayComments.length > 0 ? dayComments.length : 'Kommentar'}
                        </button>
                      </div>
                    </div>

                    {/* Activities */}
                    <p className={cn(
                      'text-sm leading-relaxed',
                      !entry.activities ? 'text-muted-foreground italic' : 'text-foreground'
                    )}>
                      {entry.activities || 'Kein Eintrag'}
                    </p>

                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                        💬 {entry.notes}
                      </p>
                    )}

                    {/* Day Comments */}
                    {dayComments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                        {dayComments.map(c => (
                          <div key={c.id} className={cn(
                            'flex gap-2 text-xs rounded-lg px-3 py-2',
                            c.isOwn
                              ? 'bg-primary/10 text-primary'
                              : c.isTrainer
                              ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            <span className="font-semibold shrink-0">{c.authorName}:</span>
                            <span>{c.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline comment input for this day */}
                    {isCommentingHere && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <Textarea
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder={`Kommentar zu ${dayName}…`}
                          className="min-h-[60px] text-xs bg-background border-border resize-none"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault()
                              handleAddComment()
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={handleAddComment}
                            disabled={isAddingComment || !newComment.trim()}
                          >
                            {isAddingComment
                              ? <span className="size-3 rounded-full border border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                              : <HugeiconsIcon icon={FloppyDiskIcon} size={12} />
                            }
                            Senden
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setActiveCommentSection('general'); setNewComment('') }}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Right: Comment Panel + Actions */}
          <div className="space-y-4 lg:sticky lg:top-[57px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">

            {/* Action Card */}
            {(profile?.role === 'trainer' || profile?.role === 'admin') && (
              <Card className={cn(
                'border overflow-hidden',
                report.status === 'approved' ? 'border-green-500/30 bg-green-500/5' :
                report.status === 'needs_revision' ? 'border-red-500/30 bg-red-500/5' :
                canAct ? 'border-primary/20 bg-primary/5' : 'border-border'
              )}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-foreground">Prüf-Aktion</span>
                  </div>

                  {report.status === 'approved' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                      <span className="font-semibold">Bericht freigegeben</span>
                    </div>
                  )}

                  {report.status === 'needs_revision' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <HugeiconsIcon icon={Alert01Icon} size={16} />
                      <span className="font-semibold">Zurückgegeben</span>
                    </div>
                  )}

                  {report.status === 'submitted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs gap-1.5 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                      onClick={() => handleStatusChange('in_review')}
                      disabled={isActioning}
                    >
                      <HugeiconsIcon icon={Clock01Icon} size={13} />
                      In Prüfung nehmen
                    </Button>
                  )}

                  {canAct && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full h-9 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-600/20"
                        onClick={() => setShowApproveDialog(true)}
                        disabled={isActioning}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                        Bericht freigeben
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => setShowRevisionDialog(true)}
                        disabled={isActioning}
                      >
                        <HugeiconsIcon icon={Alert01Icon} size={13} />
                        Überarbeitung anfordern
                      </Button>
                    </div>
                  )}

                  {actionError && (
                    <p className="text-xs text-destructive">{actionError}</p>
                  )}
                </div>
              </Card>
            )}

            {/* General Comments */}
            <Card className="border-border overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={BubbleChatAddIcon} size={14} className="text-muted-foreground" />
                    <span className="text-xs font-semibold">Allgemeine Kommentare</span>
                    {generalComments.length > 0 && (
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-bold">
                        {generalComments.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveCommentSection(activeCommentSection === 'general' ? null : 'general')}
                    className="text-xs text-primary hover:underline"
                  >
                    {activeCommentSection === 'general' ? 'Schließen' : 'Schreiben'}
                  </button>
                </div>

                {generalComments.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {generalComments.map(c => (
                      <div key={c.id} className={cn(
                        'rounded-xl px-3 py-2.5 text-xs',
                        c.isOwn ? 'bg-primary/10' : c.isTrainer ? 'bg-orange-500/8' : 'bg-muted'
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            'font-semibold text-[10px]',
                            c.isOwn ? 'text-primary' : c.isTrainer ? 'text-orange-600' : 'text-foreground'
                          )}>
                            {c.authorName} {c.isTrainer && '· Ausbilder'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(c.createdAt), 'dd. MMM, HH:mm', { locale: de })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeCommentSection === 'general' && (
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <Textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Allgemeiner Kommentar zum Bericht…"
                      className="min-h-[72px] text-xs bg-background border-border resize-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          handleAddComment()
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={handleAddComment}
                      disabled={isAddingComment || !newComment.trim()}
                    >
                      {isAddingComment
                        ? <span className="size-3 rounded-full border border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                        : <HugeiconsIcon icon={FloppyDiskIcon} size={12} />
                      }
                      Senden
                    </Button>
                  </div>
                )}

                {generalComments.length === 0 && activeCommentSection !== 'general' && (
                  <p className="text-xs text-muted-foreground">Noch keine Kommentare.</p>
                )}
              </div>
            </Card>

            {/* Status History */}
            {statusHistory.length > 0 && (
              <Card className="border-border overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Edit02Icon} size={14} className="text-muted-foreground" />
                    <span className="text-xs font-semibold">Verlauf</span>
                  </div>
                  <div className="space-y-2">
                    {statusHistory.map((h, idx) => (
                      <div key={h.id} className="flex gap-2.5 text-xs">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                            {idx + 1}
                          </div>
                          {idx < statusHistory.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="pb-2 flex-1">
                          <p className="font-medium text-foreground capitalize">
                            {h.newStatus.replace('_', ' ')}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {h.changedByName} · {format(new Date(h.changedAt), 'dd. MMM yyyy, HH:mm', { locale: de })}
                          </p>
                          {h.comment && (
                            <p className="mt-1 text-muted-foreground italic">{h.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Trainer Info */}
            <div className="flex items-center gap-2 px-1">
              <HugeiconsIcon icon={UserCircleIcon} size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Eingeloggt als <strong>{profile?.firstName} {profile?.lastName}</strong> · Ausbilder
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-green-500" />
              Bericht freigeben
            </AlertDialogTitle>
            <AlertDialogDescription>
              Du gibst den Wochenbericht <strong>KW {report.calendarWeek} / {report.year}</strong> von{' '}
              <strong>{report.apprentice.firstName} {report.apprentice.lastName}</strong> offiziell frei.
              Diese Aktion wird im Verlauf protokolliert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange('approved')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-1.5" />
              Jetzt freigeben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision Dialog */}
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Alert01Icon} size={18} className="text-red-500" />
              Überarbeitung anfordern
            </AlertDialogTitle>
            <AlertDialogDescription>
              Gib dem Azubi einen Hinweis, was überarbeitet werden soll. Der Kommentar wird im Bericht gespeichert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Textarea
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              placeholder="Was soll überarbeitet werden? (optional)"
              className="min-h-[80px] text-sm resize-none"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRevisionNote('')}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange('needs_revision', revisionNote)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <HugeiconsIcon icon={Alert01Icon} size={14} className="mr-1.5" />
              Zurückgeben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
