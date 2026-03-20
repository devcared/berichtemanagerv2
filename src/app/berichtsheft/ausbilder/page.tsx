'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { StatusBadge } from '@/components/berichtsheft/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkBadge01Icon, Alert01Icon,
  Search01Icon, Notification01Icon, UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import type { ReportStatus } from '@/types'

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
  { value: 'pending',        label: 'Ausstehend',   statuses: ['submitted', 'in_review'] },
  { value: 'needs_revision', label: 'Überarbeitung', statuses: ['needs_revision'] },
  { value: 'approved',       label: 'Freigegeben',  statuses: ['approved'] },
  { value: 'all',            label: 'Alle',          statuses: [] },
] as const

export default function AusbilderPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const supabase = createClient()

  const [reports, setReports]   = useState<TrainerReport[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<string>('pending')
  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState<SortKey>('submitted')
  const [sortDir, setSortDir]   = useState<SortDir>('desc')

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

      const mapped: TrainerReport[] = (data ?? []).map(r => {
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
      console.error('Fehler beim Laden:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!profileLoading && (profile?.role === 'trainer' || profile?.role === 'admin')) {
      loadReports()
    }
  }, [profile, profileLoading, loadReports])

  const counts = useMemo(() => ({
    pending:        reports.filter(r => r.status === 'submitted' || r.status === 'in_review').length,
    needs_revision: reports.filter(r => r.status === 'needs_revision').length,
    approved:       reports.filter(r => r.status === 'approved').length,
    all:            reports.length,
  }), [reports])

  const urgentCount = useMemo(() =>
    reports.filter(r =>
      r.status === 'submitted' && r.submittedAt &&
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
        cmp = new Date(a.submittedAt ?? a.updatedAt).getTime() - new Date(b.submittedAt ?? b.updatedAt).getTime()
      } else if (sortKey === 'name') {
        cmp = `${a.apprentice.lastName}${a.apprentice.firstName}`.localeCompare(`${b.apprentice.lastName}${b.apprentice.firstName}`)
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

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.875rem',
  }

  const card: React.CSSProperties = {
    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
    borderRadius: 12, padding: '1.125rem',
  }

  if (profileLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Lädt…</div>
  }

  if (profile?.role !== 'trainer' && profile?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16, textAlign: 'center', padding: '1.5rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'hsl(var(--destructive) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HugeiconsIcon icon={Alert01Icon} size={28} style={{ color: 'hsl(var(--destructive))' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Kein Zugriff</h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', maxWidth: 320 }}>
            Dieser Bereich ist nur für Ausbilder und Administratoren zugänglich.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(0.875rem, 2.5vw, 1.25rem)', display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: 2 }}>Ausbilder-Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => router.push('/berichtsheft/ausbilder/verwaltung')}>
            <HugeiconsIcon icon={UserMultiple02Icon} size={14} style={{ marginRight: 6 }} />
            Verwaltung
          </Button>
          <Button variant="outline" size="sm" onClick={loadReports}>
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* ── Overview stat strip ── */}
      <div style={{ ...card, padding: '0.625rem 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { value: counts.pending,        label: 'Offen',        color: '#3b82f6' },
          { value: counts.needs_revision, label: 'Überarbeitung', color: '#ef4444' },
          { value: counts.approved,       label: 'Freigegeben',  color: '#22c55e' },
          { value: counts.all,            label: 'Gesamt',       color: 'hsl(var(--foreground))' },
        ].map(({ value, label, color }, i, arr) => (
          <div key={label} style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderRight: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', flexWrap: 'wrap' }}>
          <HugeiconsIcon icon={Notification01Icon} size={16} style={{ color: '#f97316', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', color: '#f97316', fontWeight: 500, flex: 1 }}>
            <strong>{urgentCount} {urgentCount === 1 ? 'Bericht wartet' : 'Berichte warten'}</strong> seit über 5 Tagen auf Prüfung.
          </span>
          <button
            onClick={() => setActiveTab('pending')}
            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(249,115,22,0.3)', background: 'transparent', color: '#f97316', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
          >
            Jetzt prüfen
          </button>
        </div>
      )}

      {/* ── Report list ── */}
      <div style={card}>
        <p style={sectionLabel}>Berichte</p>

        {/* Filter tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1 }}>
            {STATUS_TABS.map(tab => {
              const count = counts[tab.value as keyof typeof counts] ?? 0
              const active = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none',
                    background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    fontSize: '0.8125rem', fontWeight: active ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 100ms',
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: 10, background: active ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))', color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ position: 'relative' }}>
            <HugeiconsIcon icon={Search01Icon} size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
            <Input
              placeholder="Suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, height: 32, fontSize: '0.8125rem', width: 180 }}
            />
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', gap: 8, padding: '6px 8px', borderBottom: '1px solid hsl(var(--border))', marginBottom: 2 }}>
          {[
            { label: 'Azubi',   key: 'name'      },
            { label: 'KW',      key: 'week'      },
            { label: 'Status',  key: null         },
            { label: 'Eingereicht', key: 'submitted' },
          ].map(({ label, key }) => (
            <button
              key={label}
              onClick={() => key && toggleSort(key as SortKey)}
              style={{
                textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                color: sortKey === key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                background: 'transparent', border: 'none', cursor: key ? 'pointer' : 'default',
                fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {label}
              {key && sortKey === key && (
                <span style={{ fontSize: '0.625rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            Laden…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem 0', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            Keine Berichte in dieser Kategorie
          </div>
        ) : (
          filtered.map((r, i) => {
            const isUrgent = r.status === 'submitted' && r.submittedAt && differenceInDays(new Date(), new Date(r.submittedAt)) >= 5
            return (
              <button
                key={r.id}
                onClick={() => router.push(`/berichtsheft/ausbilder/${r.id}`)}
                style={{
                  width: '100%', display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px',
                  gap: 8, padding: '10px 8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', textAlign: 'left', fontFamily: 'inherit',
                  borderRadius: 8, transition: 'background 100ms',
                  borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                  alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Name + occupation */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.apprentice.firstName} {r.apprentice.lastName}
                    </span>
                    {isUrgent && (
                      <span style={{ fontSize: '0.625rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(249,115,22,0.12)', color: '#f97316', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        5+ Tage
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.apprentice.occupation}
                  </div>
                </div>

                {/* KW */}
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
                  KW {r.calendarWeek} / {r.year}
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={r.status} />
                </div>

                {/* Date */}
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  {r.submittedAt
                    ? format(new Date(r.submittedAt), 'dd.MM.yyyy', { locale: de })
                    : '—'
                  }
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
