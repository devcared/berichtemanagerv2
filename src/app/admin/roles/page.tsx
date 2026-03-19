'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Crown02Icon, Alert01Icon, ArrowLeft01Icon, CheckmarkCircle01Icon,
  Cancel01Icon, Shield01Icon, CheckmarkBadge01Icon, UserCircleIcon,
  UserGroup02Icon, Edit01Icon, Delete01Icon, Add01Icon,
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

interface CustomRole {
  id: string
  name: string
  description: string
  baseRole: 'apprentice' | 'trainer' | 'admin'
}

type PermissionsMatrix = Record<string, { apprentice: boolean; trainer: boolean; admin: boolean }>

const ROLE_CONFIG = {
  admin: { label: 'Administrator', color: '#4285f4', icon: Shield01Icon, bg: '#4285f418', border: '#4285f430' },
  trainer: { label: 'Ausbilder', color: '#34a853', icon: CheckmarkBadge01Icon, bg: '#34a85318', border: '#34a85330' },
  apprentice: { label: 'Auszubildender', color: '#fbbc04', icon: UserCircleIcon, bg: '#fbbc0418', border: '#fbbc0430' },
}

const DEFAULT_PERMISSIONS: { label: string; apprentice: boolean; trainer: boolean; admin: boolean }[] = [
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

const PERMISSIONS_KEY = 'azubihub-custom-permissions'
const CUSTOM_ROLES_KEY = 'azubihub-custom-roles'

function buildDefaultMatrix(): PermissionsMatrix {
  const m: PermissionsMatrix = {}
  for (const perm of DEFAULT_PERMISSIONS) {
    m[perm.label] = { apprentice: perm.apprentice, trainer: perm.trainer, admin: perm.admin }
  }
  return m
}

export default function AdminRolesPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [profiles, setProfiles] = useState<ProfileWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Permission matrix state
  const [permissions, setPermissions] = useState<PermissionsMatrix>(buildDefaultMatrix())
  const [permsSaved, setPermsSaved] = useState(false)
  const [permsEdited, setPermsEdited] = useState(false)

  // Custom roles state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [newRoleBase, setNewRoleBase] = useState<'apprentice' | 'trainer' | 'admin'>('apprentice')

  useEffect(() => {
    setIsMounted(true)
    try {
      const storedPerms = localStorage.getItem(PERMISSIONS_KEY)
      if (storedPerms) {
        const parsed = JSON.parse(storedPerms) as PermissionsMatrix
        setPermissions({ ...buildDefaultMatrix(), ...parsed })
      }
      const storedRoles = localStorage.getItem(CUSTOM_ROLES_KEY)
      if (storedRoles) {
        setCustomRoles(JSON.parse(storedRoles) as CustomRole[])
      }
    } catch { /* ignore */ }
  }, [])

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

  function togglePermission(label: string, role: 'apprentice' | 'trainer' | 'admin') {
    setPermissions(prev => ({
      ...prev,
      [label]: { ...prev[label], [role]: !prev[label]?.[role] },
    }))
    setPermsEdited(true)
    setPermsSaved(false)
  }

  function savePermissions() {
    try {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
      setPermsSaved(true)
      setPermsEdited(false)
      setTimeout(() => setPermsSaved(false), 3000)
    } catch { /* ignore */ }
  }

  function resetPermissions() {
    const defaults = buildDefaultMatrix()
    setPermissions(defaults)
    setPermsEdited(true)
    setPermsSaved(false)
  }

  function addCustomRole() {
    if (!newRoleName.trim()) return
    const newRole: CustomRole = {
      id: `custom-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      baseRole: newRoleBase,
    }
    const updated = [...customRoles, newRole]
    setCustomRoles(updated)
    try { localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
    setNewRoleName('')
    setNewRoleDesc('')
    setNewRoleBase('apprentice')
    setShowRoleForm(false)
  }

  function deleteCustomRole(id: string) {
    const updated = customRoles.filter(r => r.id !== id)
    setCustomRoles(updated)
    try { localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
  }

  if (profileLoading) {
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

  if (!isMounted) return null

  const allRoleCards = [
    ...Object.entries(ROLE_CONFIG).map(([role, config]) => ({ role, config, isCustom: false, custom: null as CustomRole | null })),
    ...customRoles.map(cr => ({
      role: cr.id,
      config: { ...ROLE_CONFIG[cr.baseRole], label: cr.name },
      isCustom: true,
      custom: cr,
    })),
  ]

  return (
    <div className="flex flex-col min-h-full bg-background" style={{ fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif' }}>
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

          {/* Role overview cards (default + custom) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allRoleCards.map(({ role, config, isCustom, custom }) => {
              const count = isCustom ? 0 : profiles.filter(p => p.role === role).length
              return (
                <Card key={role} className="border rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${config.border}` }}>
                        <HugeiconsIcon icon={config.icon} size={18} style={{ color: config.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {config.label}
                        </div>
                        {isCustom ? (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>
                            Basis: {ROLE_CONFIG[custom!.baseRole].label}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: config.color, fontWeight: 500 }}>
                            {loading ? '…' : count} Nutzer
                          </div>
                        )}
                      </div>
                      {isCustom && (
                        <button
                          onClick={() => deleteCustomRole(custom!.id)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: '#ea433510', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={13} style={{ color: '#ea4335' }} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                      {isCustom
                        ? custom!.description || 'Keine Beschreibung.'
                        : role === 'admin'
                          ? 'Vollzugriff auf alle Funktionen, Nutzerverwaltung und Systemeinstellungen.'
                          : role === 'trainer'
                            ? 'Kann Berichte einsehen, freigeben, Dokumente hochladen und Nutzer einladen.'
                            : 'Kann eigene Berichte erstellen, einreichen und den Stundenplan einsehen.'}
                    </div>
                    {isCustom && (
                      <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: config.bg, border: `1px solid ${config.border}`, fontSize: '0.6875rem', fontWeight: 500, color: config.color }}>
                        Benutzerdefiniert
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Add custom role button card */}
            <Card
              className="border rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setShowRoleForm(v => !v)}
              style={{ borderStyle: 'dashed', opacity: 0.8, transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center min-h-[100px]">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(66,133,244,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <HugeiconsIcon icon={Add01Icon} size={18} style={{ color: '#4285f4' }} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4285f4' }}>Neue Rolle erstellen</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 2 }}>Benutzerdefinierte Rolle hinzufügen</div>
              </CardContent>
            </Card>
          </div>

          {/* New role form */}
          {showRoleForm && (
            <Card className="border rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <HugeiconsIcon icon={Add01Icon} size={16} style={{ color: '#4285f4' }} />
                  <h2 className="text-sm font-semibold text-foreground">Neue Rolle erstellen</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label htmlFor="role-name" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Rollenname <span style={{ color: '#ea4335' }}>*</span>
                    </Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={e => setNewRoleName(e.target.value)}
                      placeholder="z.B. Bereichsleiter"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Basis-Rolle</Label>
                    <Select value={newRoleBase} onValueChange={v => setNewRoleBase(v as 'apprentice' | 'trainer' | 'admin')}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apprentice">Auszubildender</SelectItem>
                        <SelectItem value="trainer">Ausbilder</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="role-desc" className="text-xs font-medium text-muted-foreground mb-1 block">Beschreibung</Label>
                    <Input
                      id="role-desc"
                      value={newRoleDesc}
                      onChange={e => setNewRoleDesc(e.target.value)}
                      placeholder="Kurze Beschreibung der Rolle…"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addCustomRole}
                    disabled={!newRoleName.trim()}
                    style={{ background: '#4285f4', color: 'white', border: 'none' }}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" />
                    Rolle erstellen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRoleForm(false)}>
                    <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-1.5" />
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permission matrix — editable */}
          <Card className="border rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Edit01Icon} size={14} className="text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Berechtigungsmatrix</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Klicke auf ein Symbol um Berechtigungen zu ändern (lokal gespeichert)</p>
                </div>
                <div className="flex gap-2 items-center">
                  {permsEdited && (
                    <button
                      onClick={resetPermissions}
                      style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', background: 'none', border: '1px solid hsl(var(--border))', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Zurücksetzen
                    </button>
                  )}
                  <Button size="sm" onClick={savePermissions} style={permsSaved ? { background: '#34a853', color: 'white', border: 'none' } : {}}>
                    {permsSaved ? (
                      <>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} className="mr-1.5" />
                        Gespeichert
                      </>
                    ) : 'Speichern'}
                  </Button>
                </div>
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
                    {DEFAULT_PERMISSIONS.map((perm, i) => {
                      const current = permissions[perm.label] ?? { apprentice: perm.apprentice, trainer: perm.trainer, admin: perm.admin }
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))', background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted)/0.2)' }}>
                          <td style={{ padding: '8px 16px', color: 'hsl(var(--foreground))' }}>{perm.label}</td>
                          {(['apprentice', 'trainer', 'admin'] as const).map(role => (
                            <td key={role} style={{ padding: '8px 16px', textAlign: 'center' }}>
                              <button
                                onClick={() => togglePermission(perm.label, role)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'background 0.15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                title={`${current[role] ? 'Deaktivieren' : 'Aktivieren'} für ${ROLE_CONFIG[role].label}`}
                              >
                                {current[role] ? (
                                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: '#34a853' }} />
                                ) : (
                                  <HugeiconsIcon icon={Cancel01Icon} size={16} style={{ color: '#ea435530' }} />
                                )}
                              </button>
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {permsEdited && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fbbc04', fontWeight: 500 }}>Ungespeicherte Änderungen</span>
                  <Button size="sm" onClick={savePermissions} style={{ background: '#4285f4', color: 'white', border: 'none' }}>
                    Speichern
                  </Button>
                </div>
              )}
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
