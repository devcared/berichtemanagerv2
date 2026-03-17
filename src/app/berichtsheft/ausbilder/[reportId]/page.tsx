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
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  BubbleChatAddIcon,
  ClockIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons'
import type { ReportStatus, ActivityCategory } from '@/types'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  company: 'Betrieb',
  vocationalSchool: 'Berufsschule',
  interCompany: 'Überbetrieblich',
  vacation: 'Urlaub',
  sick: 'Krank',
  holiday: 'Feiertag',
}

interface ReportDetail {
  id: string
  calendarWeek: number
  year: number
  weekStart: string
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
}

export default function AusbilderReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const router = useRouter()
  const { profile } = useProfile()
  const supabase = createClient()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isActioning, setIsActioning] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentSection, setCommentSection] = useState('general')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rData, error: rError } = await supabase
        .from('weekly_reports')
        .select(`
          id, calendar_week, year, week_start, status, submitted_at, total_hours,
          profile:profiles(first_name, last_name, occupation, company_name, training_start, current_year)
        `)
        .eq('id', reportId)
        .single()

      if (rError) throw rError

      const { data: eData, error: eError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('report_id', reportId)
        .order('date', { ascending: true })

      if (eError) throw eError

      const p = Array.isArray(rData.profile) ? rData.profile[0] : rData.profile

      setReport({
        id: rData.id,
        calendarWeek: rData.calendar_week,
        year: rData.year,
        weekStart: rData.week_start,
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
      console.error('Fehler beim Laden des Berichts:', err)
    } finally {
      setLoading(false)
    }
  }, [reportId, supabase])

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('report_comments')
      .select('id, section, content, created_at, author_id, profile:profiles(first_name, last_name)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })

    if (error) { console.error(error); return }

    setComments((data ?? []).map(c => {
      const p = Array.isArray(c.profile) ? c.profile[0] : c.profile
      return {
        id: c.id,
        section: c.section,
        content: c.content,
        authorName: p ? `${p.first_name} ${p.last_name}` : 'Unbekannt',
        createdAt: c.created_at,
        isOwn: c.author_id === profile?.id,
      }
    }))
  }, [reportId, supabase, profile?.id])

  useEffect(() => {
    loadReport()
    loadComments()
  }, [loadReport, loadComments])

  async function handleStatusChange(newStatus: ReportStatus, note?: string) {
    if (!report) return
    setIsActioning(true)
    setActionError('')
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }
      if (newStatus === 'in_review') updateData.status = 'in_review'

      const { error } = await supabase
        .from('weekly_reports')
        .update(updateData)
        .eq('id', report.id)

      if (error) throw error

      // Log to status history
      await supabase.from('report_status_history').insert({
        report_id: report.id,
        changed_by: profile?.id,
        old_status: report.status,
        new_status: newStatus,
        comment: note ?? null,
      })

      // If approving, create approval record
      if (newStatus === 'approved') {
        await supabase.from('report_approvals').insert({
          report_id: report.id,
          trainer_id: profile?.id,
          trainer_name: `${profile?.firstName} ${profile?.lastName}`,
          notes: note ?? null,
        })
      }

      // If needs_revision, add a comment with the note
      if (newStatus === 'needs_revision' && note?.trim()) {
        await supabase.from('report_comments').insert({
          report_id: report.id,
          author_id: profile?.id,
          section: 'general',
          content: `Überarbeitung erforderlich: ${note}`,
        })
        await loadComments()
      }

      setReport(prev => prev ? { ...prev, status: newStatus } : null)
      setShowRevisionInput(false)
      setRevisionNote('')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Fehler bei der Aktion.')
    } finally {
      setIsActioning(false)
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !profile) return
    setIsAddingComment(true)
    try {
      const { error } = await supabase.from('report_comments').insert({
        report_id: reportId,
        author_id: profile.id,
        section: commentSection,
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
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
        Lädt…
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
        <p className="text-muted-foreground">Bericht nicht gefunden.</p>
        <Button variant="outline" onClick={() => router.push('/berichtsheft/ausbilder')}>
          Zurück
        </Button>
      </div>
    )
  }

  const canAct = report.status === 'submitted' || report.status === 'in_review'

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => router.push('/berichtsheft/ausbilder')}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Übersicht
          </Button>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {/* Azubi Info */}
      <Card className="border-border overflow-hidden">
        <div className="flex">
          <div className="w-1.5 bg-primary/80 shrink-0" />
          <div className="flex-1 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                {report.apprentice.firstName[0]}{report.apprentice.lastName[0]}
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {report.apprentice.firstName} {report.apprentice.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{report.apprentice.occupation}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Kalenderwoche</p>
                <p className="font-semibold">KW {report.calendarWeek} / {report.year}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Wochenstunden</p>
                <p className="font-semibold">{report.totalHours} Std.</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Ausbildungsjahr</p>
                <p className="font-semibold">{report.apprentice.currentYear}. Jahr</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Eingereicht</p>
                <p className="font-semibold">
                  {report.submittedAt
                    ? format(new Date(report.submittedAt), 'dd. MMM yyyy', { locale: de })
                    : '–'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Entries */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Tätigkeiten der Woche</h3>
        {report.entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Tageseinträge vorhanden.</p>
        ) : (
          report.entries.map((entry, i) => {
            const dayName = DAY_NAMES[i] ?? `Tag ${i + 1}`
            const dayComments = comments.filter(c => c.section === dayName.toLowerCase())
            return (
              <Card key={entry.id} className="border-border overflow-hidden">
                <div className="flex">
                  <div className="w-1.5 bg-muted shrink-0" />
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{dayName}</span>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                          {format(new Date(entry.date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-full">
                          {CATEGORY_LABELS[entry.category]}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{entry.hours} Std.</span>
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      !entry.activities && "text-muted-foreground italic"
                    )}>
                      {entry.activities || 'Kein Eintrag'}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2">
                        Notiz: {entry.notes}
                      </p>
                    )}
                    {dayComments.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
                        {dayComments.map(c => (
                          <div key={c.id} className={cn(
                            "text-xs rounded-lg px-3 py-2",
                            c.isOwn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <span className="font-semibold">{c.authorName}:</span> {c.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* General Comments */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Kommentare</h3>

        {comments.filter(c => c.section === 'general').length > 0 && (
          <div className="space-y-2">
            {comments.filter(c => c.section === 'general').map(c => (
              <div key={c.id} className={cn(
                "rounded-xl px-4 py-3 text-sm",
                c.isOwn ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), 'dd. MMM, HH:mm', { locale: de })}
                  </span>
                </div>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Kommentar schreiben…"
            className="min-h-[80px] text-sm bg-background border-border resize-none"
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={handleAddComment}
            disabled={isAddingComment || !newComment.trim()}
          >
            {isAddingComment
              ? <span className="size-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              : <HugeiconsIcon icon={BubbleChatAddIcon} size={13} />
            }
            Kommentar senden
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      {profile?.role === 'trainer' && (
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm -mx-6 px-6 py-4">
          {actionError && (
            <p className="text-xs text-destructive mb-3">{actionError}</p>
          )}

          {report.status === 'submitted' && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                onClick={() => handleStatusChange('in_review')}
                disabled={isActioning}
              >
                <HugeiconsIcon icon={ClockIcon} size={13} />
                In Prüfung nehmen
              </Button>
            </div>
          )}

          {showRevisionInput && (
            <div className="space-y-2 mb-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
              <Label className="text-xs text-muted-foreground">Hinweis zur Überarbeitung (optional)</Label>
              <Textarea
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                placeholder="Was soll der Azubi überarbeiten?"
                className="min-h-[60px] text-sm bg-background resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleStatusChange('needs_revision', revisionNote)}
                  disabled={isActioning}
                >
                  {isActioning
                    ? <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <HugeiconsIcon icon={Alert01Icon} size={13} />
                  }
                  Zurück zur Überarbeitung
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setShowRevisionInput(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {profile.firstName} {profile.lastName} · Ausbilder
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canAct && !showRevisionInput && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => setShowRevisionInput(true)}
                  disabled={isActioning}
                >
                  <HugeiconsIcon icon={Alert01Icon} size={14} />
                  Überarbeitung
                </Button>
              )}
              {canAct && (
                <Button
                  size="sm"
                  className="h-9 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                  onClick={() => handleStatusChange('approved')}
                  disabled={isActioning}
                >
                  {isActioning
                    ? <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                  }
                  Bericht freigeben
                </Button>
              )}
              {report.status === 'approved' && (
                <div className="flex items-center gap-1.5 text-xs text-green-500 font-semibold">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                  Freigegeben
                </div>
              )}
              {report.status === 'needs_revision' && (
                <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                  <HugeiconsIcon icon={Alert01Icon} size={14} />
                  Zurückgegeben
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
