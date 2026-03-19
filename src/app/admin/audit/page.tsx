'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Audit01Icon, Alert01Icon, ArrowLeft01Icon, CheckmarkCircle01Icon,
  Search01Icon, ArrowRight01Icon, UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: string
  old_status: string | null
  new_status: string
  comment: string | null
  changed_at: string
  changed_by: string
  profile: { first_name: string; last_name: string } | null
  report: {
    calendar_week: number
    year: number
    profile_id: string
    apprentice: { first_name: string; last_name: string } | null
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#9aa0a6',
  submitted: '#fbbc04',
  in_review: '#ff6d00',
  approved: '#34a853',
  needs_revision: '#ea4335',
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  submitted: 'Eingereicht',
  in_review: 'In Prüfung',
  approved: 'Freigegeben',
  needs_revision: 'Überarbeitung',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#9aa0a6'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 9999,
      fontSize: '0.6875rem', fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export default function AdminAuditPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const load = useCallback(async (pageNum: number, status: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pageNum * PAGE_SIZE),
      })
      if (status !== 'all') params.set('status', status)
      const res = await fetch(`/api/admin/audit?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler')
      setEntries(json.entries ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'admin') {
      load(page, statusFilter)
    }
  }, [profile, profileLoading, page, statusFilter, load])

  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Kein Zugriff</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Dieser Bereich ist nur für Administratoren zugänglich.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="mr-2" />
          Zur Übersicht
        </Button>
      </div>
    )
  }

  const filtered = search.trim()
    ? entries.filter(e => {
        const changer = e.profile ? `${e.profile.first_name} ${e.profile.last_name}`.toLowerCase() : ''
        const apprentice = e.report?.apprentice ? `${e.report.apprentice.first_name} ${e.report.apprentice.last_name}`.toLowerCase() : ''
        const q = search.toLowerCase()
        return changer.includes(q) || apprentice.includes(q)
      })
    : entries

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(251,188,4,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={Audit01Icon} size={20} style={{ color: '#fbbc04' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Audit-Log</h1>
            <p className="text-xs text-muted-foreground">{total} Einträge insgesamt</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-background px-3 sm:px-6 py-3 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suche nach Nutzer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0) }}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="submitted">Eingereicht</SelectItem>
              <SelectItem value="in_review">In Prüfung</SelectItem>
              <SelectItem value="approved">Freigegeben</SelectItem>
              <SelectItem value="needs_revision">Überarbeitung</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
              <HugeiconsIcon icon={Alert01Icon} size={15} />
              {error}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">Keine Audit-Einträge gefunden.</div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map(entry => {
                const changerName = entry.profile
                  ? `${entry.profile.first_name} ${entry.profile.last_name}`
                  : 'System'
                const apprenticeName = entry.report?.apprentice
                  ? `${entry.report.apprentice.first_name} ${entry.report.apprentice.last_name}`
                  : 'Unbekannt'
                const changedAt = new Date(entry.changed_at)

                return (
                  <Card key={entry.id} className="border rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-3 flex items-start gap-3">
                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', background: '#4285f418',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                        }}>
                          <HugeiconsIcon icon={UserCircleIcon} size={18} style={{ color: '#4285f4' }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{changerName}</span>
                            <span className="text-xs text-muted-foreground">hat Status von</span>
                            <span className="text-xs font-medium text-foreground">{apprenticeName}</span>
                            <span className="text-xs text-muted-foreground">geändert</span>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {entry.old_status && (
                              <>
                                <StatusBadge status={entry.old_status} />
                                <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-muted-foreground shrink-0" />
                              </>
                            )}
                            <StatusBadge status={entry.new_status} />
                            {entry.report && (
                              <span className="text-xs text-muted-foreground">
                                KW {entry.report.calendar_week}/{entry.report.year}
                              </span>
                            )}
                          </div>

                          {entry.comment && (
                            <p className="text-xs text-muted-foreground mt-1.5 bg-muted/40 rounded-lg px-2.5 py-1.5 italic">
                              &ldquo;{entry.comment}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground shrink-0 text-right">
                          <div>{format(changedAt, 'd. MMM', { locale: de })}</div>
                          <div>{format(changedAt, 'HH:mm')}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Seite {page + 1} von {totalPages} ({total} Einträge)
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Zurück
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
