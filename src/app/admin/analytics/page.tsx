'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Analytics01Icon, UserGroup02Icon, File01Icon, CheckmarkCircle01Icon,
  Alert01Icon, ArrowLeft01Icon, UserCircleIcon, CheckmarkBadge01Icon,
  Shield01Icon, Clock01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  roles: { apprentice: number; trainer: number; admin: number }
  reports: { total: number; byStatus: Record<string, number> }
  weeklyTrend: { label: string; count: number }[]
  monthlyUsers: { label: string; count: number }[]
  topUsers: { id: string; count: number }[]
  totalAuthUsers: number
  totalProfiles: number
  approvalRate: number
  thisWeekSubmissions: number
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

function StatCard({ icon, label, value, sub, color }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <Card className="border rounded-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HugeiconsIcon icon={icon} size={22} style={{ color }} />
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.6875rem', color, marginTop: 1, fontWeight: 500 }}>{sub}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function BarChart({ data, color, label }: { data: { label: string; count: number }[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))' }}>{d.count || ''}</span>
              <div style={{
                width: '100%', background: color, borderRadius: '4px 4px 0 0',
                height: `${Math.max(pct, d.count > 0 ? 4 : 0)}%`,
                minHeight: d.count > 0 ? 4 : 0,
                opacity: 0.85, transition: 'height 500ms ease',
              }} />
              <span style={{ fontSize: '0.5625rem', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profileLoading) return
    if (profile?.role !== 'admin') return
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [profile, profileLoading])

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="flex items-center gap-2 text-destructive text-sm">
          <HugeiconsIcon icon={Alert01Icon} size={16} />
          {error}
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Erneut laden</Button>
      </div>
    )
  }

  if (!data) return null

  const totalRoles = data.roles.apprentice + data.roles.trainer + data.roles.admin
  const statusEntries = Object.entries(data.reports.byStatus)
  const totalNonDraft = statusEntries.filter(([s]) => s !== 'draft').reduce((s, [, c]) => s + c, 0)

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(52,168,83,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={Analytics01Icon} size={20} style={{ color: '#34a853' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Nutzungsstatistiken der gesamten Plattform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Hero stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={UserGroup02Icon} label="Nutzer gesamt" value={data.totalProfiles} color="#4285f4" />
            <StatCard icon={File01Icon} label="Berichte gesamt" value={data.reports.total} color="#8b5cf6" />
            <StatCard icon={Clock01Icon} label="Diese Woche" value={data.thisWeekSubmissions} sub="Eingereicht" color="#fbbc04" />
            <StatCard icon={CheckmarkCircle01Icon} label="Freigabequote" value={`${data.approvalRate}%`} sub="aller Berichte" color="#34a853" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weekly trend */}
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <BarChart data={data.weeklyTrend} color="#4285f4" label="Einreichungen (letzte 8 Wochen)" />
              </CardContent>
            </Card>

            {/* Monthly users */}
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <BarChart data={data.monthlyUsers} color="#34a853" label="Neue Nutzer (letzte 6 Monate)" />
              </CardContent>
            </Card>
          </div>

          {/* Role distribution + Report status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role distribution */}
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rollenverteilung</p>
                <div className="space-y-3">
                  {[
                    { label: 'Auszubildende', count: data.roles.apprentice, color: '#fbbc04', icon: UserCircleIcon },
                    { label: 'Ausbilder', count: data.roles.trainer, color: '#34a853', icon: CheckmarkBadge01Icon },
                    { label: 'Administratoren', count: data.roles.admin, color: '#4285f4', icon: Shield01Icon },
                  ].map(item => {
                    const pct = totalRoles > 0 ? (item.count / totalRoles) * 100 : 0
                    return (
                      <div key={item.label}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HugeiconsIcon icon={item.icon} size={13} style={{ color: item.color }} />
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))' }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{item.count}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'hsl(var(--muted))', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 3, transition: 'width 500ms ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Report status breakdown */}
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bericht-Status</p>
                <div className="space-y-3">
                  {statusEntries.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Noch keine Berichte.</p>
                  ) : statusEntries.map(([status, count]) => {
                    const color = STATUS_COLORS[status] ?? '#9aa0a6'
                    const pct = data.reports.total > 0 ? (count / data.reports.total) * 100 : 0
                    return (
                      <div key={status}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))' }}>{STATUS_LABELS[status] ?? status}</span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{count}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'hsl(var(--muted))', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 500ms ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auth info */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registrierungsübersicht</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4285f4' }}>{data.totalAuthUsers}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Auth-Konten</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{data.totalProfiles}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Profile eingerichtet</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: data.totalAuthUsers > data.totalProfiles ? '#ea4335' : '#34a853' }}>
                    {data.totalAuthUsers - data.totalProfiles}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Ohne Profil</div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
