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
  /** per-permission flag: true = erlaubt, false = verweigert */
  permissions: Record<string, boolean>
}

/** Built-in roles: matrix keyed by permLabel → { apprentice, trainer, admin } */
type BuiltinMatrix = Record<string, { apprentice: boolean; trainer: boolean; admin: boolean }>

const ROLE_CONFIG = {
  admin:      { label: 'Administrator',   color: '#4285f4', icon: Shield01Icon,        bg: '#4285f418', border: '#4285f430' },
  trainer:    { label: 'Ausbilder',        color: '#34a853', icon: CheckmarkBadge01Icon, bg: '#34a85318', border: '#34a85330' },
  apprentice: { label: 'Auszubildender',  color: '#fbbc04', icon: UserCircleIcon,       bg: '#fbbc0418', border: '#fbbc0430' },
}

const DEFAULT_PERMISSIONS: { label: string; group: string; apprentice: boolean; trainer: boolean; admin: boolean }[] = [
  // Berichte
  { label: 'Eigene Berichte verwalten',      group: 'Berichte',       apprentice: true,  trainer: true,  admin: true  },
  { label: 'Berichte einreichen',             group: 'Berichte',       apprentice: true,  trainer: true,  admin: true  },
  { label: 'Alle Berichte einsehen',          group: 'Berichte',       apprentice: false, trainer: true,  admin: true  },
  { label: 'Berichte freigeben/ablehnen',     group: 'Berichte',       apprentice: false, trainer: true,  admin: true  },
  // Nutzer
  { label: 'Nutzer einladen',                 group: 'Nutzer',         apprentice: false, trainer: true,  admin: true  },
  { label: 'Nutzer verwalten',                group: 'Nutzer',         apprentice: false, trainer: false, admin: true  },
  { label: 'Rollen vergeben',                 group: 'Nutzer',         apprentice: false, trainer: false, admin: true  },
  // Inhalte
  { label: 'Stundenplan-Dokumente hochladen', group: 'Inhalte',        apprentice: false, trainer: true,  admin: true  },
  // Admin
  { label: 'Analytics einsehen',              group: 'Administration', apprentice: false, trainer: false, admin: true  },
  { label: 'Audit-Log einsehen',              group: 'Administration', apprentice: false, trainer: false, admin: true  },
  { label: 'System-Einstellungen',            group: 'Administration', apprentice: false, trainer: false, admin: true  },
  { label: 'Datenbankübersicht',              group: 'Administration', apprentice: false, trainer: false, admin: true  },
  { label: 'Admin-Panel',                     group: 'Administration', apprentice: false, trainer: false, admin: true  },
]

const GROUPS = [...new Set(DEFAULT_PERMISSIONS.map(p => p.group))]

const PERMISSIONS_KEY  = 'azubihub-custom-permissions'
const CUSTOM_ROLES_KEY = 'azubihub-custom-roles'

function buildDefaultMatrix(): BuiltinMatrix {
  const m: BuiltinMatrix = {}
  for (const p of DEFAULT_PERMISSIONS) {
    m[p.label] = { apprentice: p.apprentice, trainer: p.trainer, admin: p.admin }
  }
  return m
}

function basePerms(base: 'apprentice' | 'trainer' | 'admin'): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const p of DEFAULT_PERMISSIONS) result[p.label] = p[base]
  return result
}

/** Pastel chip colour for custom role (cycles) */
const CUSTOM_COLORS = ['#a855f7', '#ec4899', '#06b6d4', '#f97316', '#14b8a6']
function customColor(index: number) { return CUSTOM_COLORS[index % CUSTOM_COLORS.length] }

export default function AdminRolesPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [profiles, setProfiles]     = useState<ProfileWithStats[]>([])
  const [loading, setLoading]       = useState(true)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [successId, setSuccessId]   = useState<string | null>(null)
  const [isMounted, setIsMounted]   = useState(false)

  // Built-in permission matrix (localStorage)
  const [builtinMatrix, setBuiltinMatrix]   = useState<BuiltinMatrix>(buildDefaultMatrix())
  const [matrixSaved, setMatrixSaved]       = useState(false)
  const [matrixEdited, setMatrixEdited]     = useState(false)

  // Custom roles (localStorage)
  const [customRoles, setCustomRoles]   = useState<CustomRole[]>([])
  const [showRoleForm, setShowRoleForm] = useState(false)

  // New role form state
  const [newRoleName, setNewRoleName]   = useState('')
  const [newRoleDesc, setNewRoleDesc]   = useState('')
  const [newRoleBase, setNewRoleBase]   = useState<'apprentice' | 'trainer' | 'admin'>('apprentice')
  const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>(() => basePerms('apprentice'))

  // ── hydrate from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true)
    try {
      const storedPerms = localStorage.getItem(PERMISSIONS_KEY)
      if (storedPerms) {
        const parsed = JSON.parse(storedPerms) as BuiltinMatrix
        setBuiltinMatrix({ ...buildDefaultMatrix(), ...parsed })
      }
      const storedRoles = localStorage.getItem(CUSTOM_ROLES_KEY)
      if (storedRoles) {
        const parsed = JSON.parse(storedRoles) as CustomRole[]
        // migrate old roles that have no permissions field
        setCustomRoles(parsed.map(cr => ({
          ...cr,
          permissions: cr.permissions ?? basePerms(cr.baseRole),
        })))
      }
    } catch { /* ignore */ }
  }, [])

  // When base role changes in the form, reset permission checkboxes
  useEffect(() => {
    setNewRolePerms(basePerms(newRoleBase))
  }, [newRoleBase])

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

  // ── Built-in matrix actions ────────────────────────────────────────────────
  function toggleBuiltin(label: string, role: 'apprentice' | 'trainer' | 'admin') {
    setBuiltinMatrix(prev => ({
      ...prev,
      [label]: { ...prev[label], [role]: !prev[label]?.[role] },
    }))
    setMatrixEdited(true)
    setMatrixSaved(false)
  }

  function saveMatrix() {
    try {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(builtinMatrix))
      setMatrixSaved(true)
      setMatrixEdited(false)
      setTimeout(() => setMatrixSaved(false), 3000)
    } catch { /* ignore */ }
  }

  function resetMatrix() {
    setBuiltinMatrix(buildDefaultMatrix())
    setMatrixEdited(true)
    setMatrixSaved(false)
  }

  // ── Custom role column toggle (in matrix) ──────────────────────────────────
  function toggleCustomRolePerm(roleId: string, label: string) {
    setCustomRoles(prev => {
      const updated = prev.map(cr =>
        cr.id !== roleId ? cr : {
          ...cr,
          permissions: { ...cr.permissions, [label]: !cr.permissions[label] },
        }
      )
      try { localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }

  // ── Custom role CRUD ───────────────────────────────────────────────────────
  function addCustomRole() {
    if (!newRoleName.trim()) return
    const newRole: CustomRole = {
      id:          `custom-${Date.now()}`,
      name:        newRoleName.trim(),
      description: newRoleDesc.trim(),
      baseRole:    newRoleBase,
      permissions: { ...newRolePerms },
    }
    const updated = [...customRoles, newRole]
    setCustomRoles(updated)
    try { localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
    setNewRoleName('')
    setNewRoleDesc('')
    setNewRoleBase('apprentice')
    setNewRolePerms(basePerms('apprentice'))
    setShowRoleForm(false)
  }

  function deleteCustomRole(id: string) {
    const updated = customRoles.filter(r => r.id !== id)
    setCustomRoles(updated)
    try { localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
  }

  // ── User role change ───────────────────────────────────────────────────────
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

  // ── Guards ─────────────────────────────────────────────────────────────────
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

  // ── Derived ────────────────────────────────────────────────────────────────
  const allRoleCards = [
    ...Object.entries(ROLE_CONFIG).map(([role, config]) => ({ role, config, isCustom: false, custom: null as CustomRole | null })),
    ...customRoles.map((cr, i) => ({
      role: cr.id,
      config: { ...ROLE_CONFIG[cr.baseRole], label: cr.name, color: customColor(i), bg: customColor(i) + '18', border: customColor(i) + '30' },
      isCustom: true,
      custom: cr,
    })),
  ]

  // All columns for the matrix
  const matrixColumns: { key: string; label: string; color: string; isCustom: boolean; customRole?: CustomRole }[] = [
    { key: 'apprentice', label: 'Auszubildender', color: '#fbbc04', isCustom: false },
    { key: 'trainer',    label: 'Ausbilder',       color: '#34a853', isCustom: false },
    { key: 'admin',      label: 'Administrator',   color: '#4285f4', isCustom: false },
    ...customRoles.map((cr, i) => ({
      key:        cr.id,
      label:      cr.name,
      color:      customColor(i),
      isCustom:   true,
      customRole: cr,
    })),
  ]

  function getCellValue(col: typeof matrixColumns[0], permLabel: string): boolean {
    if (!col.isCustom) {
      const m = builtinMatrix[permLabel]
      return m?.[col.key as 'apprentice' | 'trainer' | 'admin'] ?? false
    }
    return col.customRole?.permissions[permLabel] ?? false
  }

  function handleCellToggle(col: typeof matrixColumns[0], permLabel: string) {
    if (!col.isCustom) {
      toggleBuiltin(permLabel, col.key as 'apprentice' | 'trainer' | 'admin')
    } else {
      toggleCustomRolePerm(col.key, permLabel)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-background" style={{ fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(60,64,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HugeiconsIcon icon={Crown02Icon} size={17} style={{ color: '#3c4043' }} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">Rollen & Rechte</h1>
            <p className="text-xs text-muted-foreground">Rollenkonzepte und Berechtigungsmatrix</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* ── Role overview cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allRoleCards.map(({ role, config, isCustom, custom }) => {
              const count = isCustom ? 0 : profiles.filter(p => p.role === role).length
              const permCount = isCustom
                ? Object.values(custom!.permissions).filter(Boolean).length
                : null
              return (
                <Card key={role} className="border rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${config.border}`, flexShrink: 0 }}>
                        <HugeiconsIcon icon={config.icon} size={16} style={{ color: config.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {config.label}
                        </div>
                        {isCustom ? (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                            Basis: {ROLE_CONFIG[custom!.baseRole].label} · {permCount} Rechte
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
                          title="Rolle löschen"
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

            {/* Add-role card */}
            <Card
              className="border rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setShowRoleForm(v => !v)}
              style={{ borderStyle: 'dashed', opacity: 0.8, transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center min-h-[100px]">
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(66,133,244,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <HugeiconsIcon icon={Add01Icon} size={17} style={{ color: '#4285f4' }} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4285f4' }}>Neue Rolle erstellen</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 2 }}>
                  Mit eigenen Berechtigungen
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── New role form ────────────────────────────────────────────── */}
          {showRoleForm && (
            <Card className="border rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <HugeiconsIcon icon={Add01Icon} size={15} style={{ color: '#4285f4' }} />
                  <h2 className="text-sm font-semibold text-foreground">Neue Rolle erstellen</h2>
                </div>

                {/* Basic fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
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

                {/* Permission checklist grouped */}
                <div style={{ marginBottom: 16 }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Berechtigungen konfigurieren
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                    {GROUPS.map(group => (
                      <div key={group} style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                          {group}
                        </p>
                        {DEFAULT_PERMISSIONS.filter(p => p.group === group).map(perm => {
                          const enabled = newRolePerms[perm.label] ?? false
                          return (
                            <label
                              key={perm.label}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '5px 8px', borderRadius: 7, cursor: 'pointer',
                                transition: 'background 100ms',
                                marginBottom: 2,
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => setNewRolePerms(prev => ({ ...prev, [perm.label]: !prev[perm.label] }))}
                                style={{ width: 15, height: 15, accentColor: '#4285f4', cursor: 'pointer', flexShrink: 0 }}
                              />
                              <span style={{ fontSize: '0.8125rem', color: enabled ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                                {perm.label}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid hsl(var(--border))' }}>
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
                  <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center' }}>
                    {Object.values(newRolePerms).filter(Boolean).length} von {DEFAULT_PERMISSIONS.length} Rechten aktiv
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Permission matrix ────────────────────────────────────────── */}
          <Card className="border rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Edit01Icon} size={14} className="text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Berechtigungsmatrix</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Klicke auf ein Symbol um Berechtigungen zu togglen · Benutzerdefinierte Rollen werden automatisch eingetragen
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {matrixEdited && (
                    <button
                      onClick={resetMatrix}
                      style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', background: 'none', border: '1px solid hsl(var(--border))', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Zurücksetzen
                    </button>
                  )}
                  <Button
                    size="sm"
                    onClick={saveMatrix}
                    style={matrixSaved ? { background: '#34a853', color: 'white', border: 'none' } : {}}
                  >
                    {matrixSaved ? (
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
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: '0.75rem', minWidth: 200 }}>
                        Funktion
                      </th>
                      {matrixColumns.map(col => (
                        <th key={col.key} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: col.color, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 110 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span>{col.label}</span>
                            {col.isCustom && (
                              <span style={{ fontSize: '0.5625rem', fontWeight: 400, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                Benutzerdefiniert
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GROUPS.map(group => (
                      <>
                        {/* Group header row */}
                        <tr key={`group-${group}`} style={{ background: 'hsl(var(--muted)/0.3)' }}>
                          <td
                            colSpan={matrixColumns.length + 1}
                            style={{ padding: '5px 16px', fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.07em', textTransform: 'uppercase' }}
                          >
                            {group}
                          </td>
                        </tr>
                        {DEFAULT_PERMISSIONS.filter(p => p.group === group).map((perm, i) => (
                          <tr
                            key={perm.label}
                            style={{ borderBottom: '1px solid hsl(var(--border))', background: 'transparent' }}
                          >
                            <td style={{ padding: '7px 16px', color: 'hsl(var(--foreground))' }}>{perm.label}</td>
                            {matrixColumns.map(col => {
                              const val = getCellValue(col, perm.label)
                              return (
                                <td key={col.key} style={{ padding: '7px 12px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleCellToggle(col, perm.label)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'background 0.15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    title={`${val ? 'Deaktivieren' : 'Aktivieren'} für ${col.label}`}
                                  >
                                    {val ? (
                                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: '#34a853' }} />
                                    ) : (
                                      <HugeiconsIcon icon={Cancel01Icon} size={16} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4 }} />
                                    )}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {(matrixEdited || customRoles.length > 0) && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  {customRoles.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {customRoles.length} benutzerdefinierte {customRoles.length === 1 ? 'Rolle' : 'Rollen'} · Änderungen werden automatisch gespeichert
                    </span>
                  )}
                  {matrixEdited && (
                    <Button size="sm" onClick={saveMatrix} style={{ background: '#4285f4', color: 'white', border: 'none', marginLeft: 'auto' }}>
                      Speichern
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── User role management ─────────────────────────────────────── */}
          <Card className="border rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <HugeiconsIcon icon={UserGroup02Icon} size={15} className="text-muted-foreground" />
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
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
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
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} style={{ color: '#34a853', flexShrink: 0 }} />
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
