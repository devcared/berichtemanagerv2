'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Database01Icon, Alert01Icon, ArrowLeft01Icon, CheckmarkCircle01Icon,
  UserGroup02Icon, File01Icon, CalendarIcon, RefreshIcon,
  Download02Icon,
} from '@hugeicons/core-free-icons'

interface TableInfo {
  name: string
  label: string
  count: number
  description: string
  category: 'auth' | 'reports' | 'schedule'
}

const CATEGORY_CONFIG = {
  auth: { color: '#4285f4', label: 'Authentifizierung' },
  reports: { color: '#8b5cf6', label: 'Berichtsheft' },
  schedule: { color: '#34a853', label: 'Stundenplan' },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATEGORY_ICONS: Record<string, any> = {
  auth: UserGroup02Icon,
  reports: File01Icon,
  schedule: CalendarIcon,
}

function TableCard({ table }: { table: TableInfo }) {
  const config = CATEGORY_CONFIG[table.category]
  const icon = CATEGORY_ICONS[table.category]
  return (
    <Card className="border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${config.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HugeiconsIcon icon={icon} size={18} style={{ color: config.color }} />
          </div>
          <div style={{
            padding: '2px 8px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600,
            background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}30`,
            whiteSpace: 'nowrap',
          }}>
            {config.label}
          </div>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1 }}>
          {table.count.toLocaleString('de-DE')}
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginTop: 4 }}>{table.label}</div>
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2, lineHeight: 1.4 }}>{table.description}</div>
        <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: 8, fontFamily: 'monospace', opacity: 0.7 }}>{table.name}</div>
      </CardContent>
    </Card>
  )
}

export default function AdminDataPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/data')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler')
      setTables(json.tables ?? [])
      setConnectionOk(true)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      setConnectionOk(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!profileLoading && profile?.role === 'admin') load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileLoading])

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

  const totalRows = tables.reduce((s, t) => s + t.count, 0)
  const grouped = {
    auth: tables.filter(t => t.category === 'auth'),
    reports: tables.filter(t => t.category === 'reports'),
    schedule: tables.filter(t => t.category === 'schedule'),
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(234,67,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={Database01Icon} size={20} style={{ color: '#ea4335' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Datenbankübersicht</h1>
              <p className="text-xs text-muted-foreground">
                {lastRefresh ? `Aktualisiert: ${lastRefresh.toLocaleTimeString('de-DE')}` : 'Lädt…'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <HugeiconsIcon icon={RefreshIcon} size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Health + summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div style={{ width: 38, height: 38, borderRadius: 10, background: connectionOk === null ? '#9aa0a618' : connectionOk ? '#34a85318' : '#ea433518', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HugeiconsIcon
                    icon={connectionOk === null ? Database01Icon : connectionOk ? CheckmarkCircle01Icon : Alert01Icon}
                    size={18}
                    style={{ color: connectionOk === null ? '#9aa0a6' : connectionOk ? '#34a853' : '#ea4335' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                    {connectionOk === null ? 'Verbinde…' : connectionOk ? 'Verbunden' : 'Fehler'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Supabase Status</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ea4335', lineHeight: 1 }}>{tables.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Tabellen überwacht</div>
              </CardContent>
            </Card>
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1 }}>
                  {loading ? '…' : totalRows.toLocaleString('de-DE')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Datensätze gesamt</div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <HugeiconsIcon icon={Alert01Icon} size={15} />
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          )}

          {!loading && Object.entries(grouped).map(([cat, catTables]) => {
            if (catTables.length === 0) return null
            const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: config.color, margin: 0 }}>
                    {config.label}
                  </p>
                  <div style={{ flex: 1, height: 1, background: `${config.color}25` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTables.map(table => (
                    <TableCard key={table.name} table={table} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Export placeholder */}
          {!loading && tables.length > 0 && (
            <Card className="border rounded-2xl">
              <CardContent className="p-4">
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Export</h2>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
                  Datenbankexporte sind über das Supabase Dashboard verfügbar. Hier als Schnelllinks:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['profiles', 'weekly_reports', 'daily_entries'].map(table => (
                    <Button key={table} variant="outline" size="sm" disabled>
                      <HugeiconsIcon icon={Download02Icon} size={13} className="mr-1.5" />
                      {table}
                    </Button>
                  ))}
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: 8, fontStyle: 'italic' }}>
                  Export-Funktion in Entwicklung
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
