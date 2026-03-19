'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Crown02Icon, Alert01Icon, ArrowLeft01Icon, CheckmarkCircle01Icon,
  Cancel01Icon, Shield01Icon, CheckmarkBadge01Icon, UserCircleIcon,
  UserGroup02Icon,
} from '@hugeicons/core-free-icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProfileWithStats {
  id: string
  firstName: string
  lastName: string
  occupation: string
  companyName: string
  role: 'apprentice' | 'trainer' | 'admin'
  email: string
  createdAt: string
  stats: { total: number; approved: number; submitted: number; needsRevision: number; lastSubmissionAt: string | null }
}

const ROLE_CONFIG = {
  admin: { label: 'Administrator', color: '#4285f4', icon: Shield01Icon, bg: '#4285f418', border: '#4285f430' },
  trainer: { label: 'Ausbilder', color: '#34a853', icon: CheckmarkBadge01Icon, bg: '#34a85318', border: '#34a85330' },
  apprentice: { label: 'Auszubildender', color: '#fbbc04', icon: UserCircleIcon, bg: '#fbbc0418', border: '#fbbc0430' },
}

const PERMISSIONS: { label: string; apprentice: boolean; trainer: boolean; admin: boolean }[] = [
  { label: 'Eigene Berichte verwalten', apprentice: true, trainer: true, admin: true },
  { label: 'Berichte einreichen', apprentice: true, trainer: true, admin: true },
  { label: 'Alle Berichte einsehen', apprentice: false, trainer: true, admin: true },
  { label: 'Berichte freigeben/ablehnen', apprentice: false, trainer: true, admin: true },
  { label: 'Nutzer einladen', apprentice: false, trainer: true, admin: true },
  { label: 'Stundenplan-Dokumente hochladen', apprentice: false, trainer: true, admin: true },
  { label: 'Nutzer verwalten', apprentice: false, trainer: false, admin: true },
  { label: 'Rollen vergeben', apprentice: false, trainer: false, admin: true },
  { label: 'Analytics einsehen', apprentice: false, trainer: false, admin: true },
  { label: 'Audit-Log einsehen', apprentice: false, trainer: false, admin: true },
  { label: 'System-Einstellungen', apprentice: false, trainer: false, admin: true },
  { label: 'Datenbankübersicht', apprentice: false, trainer: false, admin: true },
  { label: 'Admin-Panel', apprentice: false, trainer: false, admin: true },
]

export default function AdminRolesPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [profiles, setProfiles] = useState<ProfileWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/profiles')
      const json = await res.json()
      if (res.ok) setProfiles(json.profiles ?? [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'admin') loadProfiles()
  }, [profile, profileLoading, loadProfiles])

  async function handleRoleChange(userId: string, newRole: 'apprentice' | 'trainer' | 'admin') {
    if (userId === profile?.id) return
    setChangingId(userId)
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (res.ok) {
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
        setSuccessId(userId)
        setTimeout(() => setSuccessId(null), 2000)
      }
    } catch { /* ignore */ } finally { setChangingId(null) }
  }

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

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(60,64,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={Crown02Icon} size={20} style={{ color: '#3c4043' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Rollen & Rechte</h1>
            <p className="text-xs text-muted-foreground">Rollenkonzepte und Berechtigungsmatrix</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Role overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const count = profiles.filter(p => p.role === role).length
              return (
                <Card key={role} className="border rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${config.border}` }}>
                        <HugeiconsIcon icon={config.icon} size={18} style={{ color: config.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{config.label}</div>
                        <div style={{ fontSize: '0.75rem', color: config.color, fontWeight: 500 }}>{loading ? '…' : count} Nutzer</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                      {role === 'admin' && 'Vollzugriff auf alle Funktionen, Nutzerverwaltung und Systemeinstellungen.'}
                      {role === 'trainer' && 'Kann Berichte einsehen, freigeben, Dokumente hochladen und Nutzer einladen.'}
                      {role === 'apprentice' && 'Kann eigene Berichte erstellen, einreichen und den Stundenplan einsehen.'}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Permission matrix */}
          <Card className="border rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Berechtigungsmatrix</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Übersicht aller Funktionen und wer darauf zugreifen kann</p>
              </div>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: 'hsl(var(--muted)/0.5)' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: '0.75rem' }}>Funktion</th>
                      {(['apprentice', 'trainer', 'admin'] as const).map(role => (
                        <th key={role} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: ROLE_CONFIG[role].color, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {ROLE_CONFIG[role].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((perm, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))', background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted)/0.2)' }}>
                        <td style={{ padding: '8px 16px', color: 'hsl(var(--foreground))' }}>{perm.label}</td>
                        {(['apprentice', 'trainer', 'admin'] as const).map(role => (
                          <td key={role} style={{ padding: '8px 16px', textAlign: 'center' }}>
                            {perm[role] ? (
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: '#34a853', display: 'inline-block' }} />
                            ) : (
                              <HugeiconsIcon icon={Cancel01Icon} size={16} style={{ color: '#ea435530', display: 'inline-block' }} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick role change per user */}
          <Card className="border rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <HugeiconsIcon icon={UserGroup02Icon} size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Nutzerrollen verwalten</h2>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {profiles.map(p => {
                    const config = ROLE_CONFIG[p.role]
                    const isSelf = p.id === profile?.id
                    const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase()
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.firstName} {p.lastName}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>(Du)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                        </div>
                        {successId === p.id && (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: '#34a853', flexShrink: 0 }} />
                        )}
                        <Select
                          value={p.role}
                          onValueChange={v => handleRoleChange(p.id, v as 'apprentice' | 'trainer' | 'admin')}
                          disabled={isSelf || changingId === p.id}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apprentice">Auszubildender</SelectItem>
                            <SelectItem value="trainer">Ausbilder</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
