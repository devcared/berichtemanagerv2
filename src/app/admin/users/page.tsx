'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  UserGroup02Icon, UserCircleIcon, Crown02Icon, CheckmarkBadge01Icon,
  Shield01Icon, Mail01Icon, Edit01Icon, Delete01Icon, LockPasswordIcon,
  UserAdd01Icon, UserCheck01Icon, CheckmarkCircle01Icon,
  Alert01Icon, Search01Icon, File01Icon, MoreVerticalIcon, Building01Icon,
  OfficeChairIcon, ArrowLeft01Icon, Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

// ── Shared types ─────────────────────────────────────────────────────────────

interface ProfileWithStats {
  id: string
  firstName: string
  lastName: string
  occupation: string
  companyName: string
  role: 'apprentice' | 'trainer' | 'admin'
  email: string
  createdAt: string
  companyId?: string | null
  pendingCompanyId?: string | null
  stats: {
    total: number
    approved: number
    submitted: number
    needsRevision: number
    lastSubmissionAt: string | null
  }
}

interface CompanyOption {
  id: string
  name: string
  accent_color: string
}

/** Mirrors the CustomRole shape from the roles page */
interface CustomRole {
  id: string
  name: string
  description: string
  baseRole: 'apprentice' | 'trainer' | 'admin'
  permissions: Record<string, boolean>
}

type ActiveTab = 'apprentices' | 'trainers' | 'admins' | 'invite'

// ── localStorage keys ────────────────────────────────────────────────────────
const CUSTOM_ROLES_KEY       = 'azubihub-custom-roles'
const CUSTOM_ASSIGNMENTS_KEY = 'azubihub-custom-role-assignments' // Record<userId, customRoleId>

// ── Colours per built-in role ────────────────────────────────────────────────
const BUILTIN_COLOR: Record<string, string> = {
  admin:      '#4285f4',
  trainer:    '#34a853',
  apprentice: '#fbbc04',
}
const CUSTOM_COLORS = ['#a855f7', '#ec4899', '#06b6d4', '#f97316', '#14b8a6']
function customColor(index: number) { return CUSTOM_COLORS[index % CUSTOM_COLORS.length] }

// ── RoleBadge ────────────────────────────────────────────────────────────────
function RoleBadge({ role, customLabel, customColor: cc }: {
  role: string
  customLabel?: string
  customColor?: string
}) {
  if (customLabel && cc) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600, background: cc + '18', color: cc, border: `1px solid ${cc}30` }}>
        <HugeiconsIcon icon={Crown02Icon} size={10} />
        {customLabel}
      </span>
    )
  }
  if (role === 'admin') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(66,133,244,0.12)', color: '#4285f4', border: '1px solid rgba(66,133,244,0.25)' }}>
      <HugeiconsIcon icon={Shield01Icon} size={10} />
      Admin
    </span>
  )
  if (role === 'trainer') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(52,168,83,0.12)', color: '#34a853', border: '1px solid rgba(52,168,83,0.25)' }}>
      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={10} />
      Ausbilder
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(251,188,4,0.12)', color: '#b38600', border: '1px solid rgba(251,188,4,0.25)' }}>
      <HugeiconsIcon icon={UserCircleIcon} size={10} />
      Auszubildender
    </span>
  )
}

// ── UserCard ─────────────────────────────────────────────────────────────────
function UserCard({
  user,
  currentUserId,
  customRoleName,
  customRoleColor,
  onEdit,
  onChangeRole,
  onDelete,
  onResetPassword,
  onAssignCompany,
  onUnassignCompany,
}: {
  user: ProfileWithStats
  currentUserId: string
  customRoleName?: string
  customRoleColor?: string
  onEdit: (u: ProfileWithStats) => void
  onChangeRole: (u: ProfileWithStats) => void
  onDelete: (u: ProfileWithStats) => void
  onResetPassword: (email: string) => void
  onAssignCompany: (u: ProfileWithStats) => void
  onUnassignCompany: (u: ProfileWithStats) => void
}) {
  const isSelf      = user.id === currentUserId
  const avatarColor = customRoleColor ?? BUILTIN_COLOR[user.role] ?? '#fbbc04'
  const initials    = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <Card className="border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8125rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground truncate">
                  {user.firstName} {user.lastName}
                  {isSelf && <span className="ml-1 text-xs text-muted-foreground font-normal">(Du)</span>}
                </span>
                <RoleBadge role={user.role} customLabel={customRoleName} customColor={customRoleColor} />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <HugeiconsIcon icon={Mail01Icon} size={11} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{user.email || '—'}</span>
              </div>
              {user.occupation && (
                <div className="flex items-center gap-1 mt-0.5">
                  <HugeiconsIcon icon={OfficeChairIcon} size={11} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{user.occupation}</span>
                </div>
              )}
              {user.companyName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <HugeiconsIcon icon={Building01Icon} size={11} className="text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{user.companyName}</span>
                </div>
              )}
              {user.pendingCompanyId && !user.companyId && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbc04', flexShrink: 0 }} />
                  <span className="text-xs truncate" style={{ color: '#b38600' }}>Einladung ausstehend</span>
                </div>
              )}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <HugeiconsIcon icon={MoreVerticalIcon} size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <HugeiconsIcon icon={Edit01Icon} size={14} className="mr-2" />
                  Profil bearbeiten
                </DropdownMenuItem>
                {user.email && (
                  <DropdownMenuItem onClick={() => onResetPassword(user.email)}>
                    <HugeiconsIcon icon={LockPasswordIcon} size={14} className="mr-2" />
                    Passwort zurücksetzen
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {/* Company assignment */}
                <DropdownMenuItem onClick={() => onAssignCompany(user)}>
                  <HugeiconsIcon icon={Building01Icon} size={14} className="mr-2" />
                  Unternehmen zuweisen
                </DropdownMenuItem>
                {(user.companyId || user.pendingCompanyId) && (
                  <DropdownMenuItem onClick={() => onUnassignCompany(user)} className="text-destructive focus:text-destructive">
                    <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-2" />
                    Zuweisung aufheben
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {/* Single role-change action */}
                {!isSelf && (
                  <DropdownMenuItem onClick={() => onChangeRole(user)}>
                    <HugeiconsIcon icon={UserCheck01Icon} size={14} className="mr-2" />
                    Rolle ändern
                  </DropdownMenuItem>
                )}
                {!isSelf && <DropdownMenuSeparator />}
                {!isSelf && (
                  <DropdownMenuItem
                    onClick={() => onDelete(user)}
                    className="text-destructive focus:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={14} className="mr-2" />
                    Nutzer löschen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats row */}
          {user.role === 'apprentice' && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={File01Icon} size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{user.stats.total} Berichte</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-green-500" />
                <span className="text-xs text-muted-foreground">{user.stats.approved} freigegeben</span>
              </div>
              {user.stats.submitted > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-orange-400" />
                  <span className="text-xs text-muted-foreground">{user.stats.submitted} in Prüfung</span>
                </div>
              )}
              {user.stats.lastSubmissionAt && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Zuletzt: {format(new Date(user.stats.lastSubmissionAt), 'd. MMM', { locale: de })}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── AdminUsersPage ────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [profiles, setProfiles] = useState<ProfileWithStats[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('apprentices')
  const [search, setSearch]     = useState('')
  const [isMounted, setIsMounted] = useState(false)

  // Custom roles (from localStorage — read-only here, managed in roles page)
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  /** userId → customRoleId */
  const [customAssignments, setCustomAssignments] = useState<Record<string, string>>({})

  // Role change dialog
  const [roleChangeUser, setRoleChangeUser]   = useState<ProfileWithStats | null>(null)
  const [selectedNewRole, setSelectedNewRole] = useState<string>('')
  const [isChangingRole, setIsChangingRole]   = useState(false)
  const [roleError, setRoleError]             = useState('')

  // Delete dialog
  const [confirmDelete, setConfirmDelete] = useState<ProfileWithStats | null>(null)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [deleteError, setDeleteError]     = useState('')

  // Edit profile
  const [editUser, setEditUser]   = useState<ProfileWithStats | null>(null)
  const [editForm, setEditForm]   = useState({ firstName: '', lastName: '', occupation: '', companyName: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Password reset
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError]     = useState('')

  // Company assignment
  const [companies, setCompanies]               = useState<CompanyOption[]>([])
  const [assignCompanyUser, setAssignCompanyUser] = useState<ProfileWithStats | null>(null)
  const [assignCompanyId, setAssignCompanyId]     = useState<string>('')
  const [isAssigningCompany, setIsAssigningCompany] = useState(false)
  const [assignCompanyError, setAssignCompanyError] = useState('')

  // Invite
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteRole, setInviteRole]     = useState<'apprentice' | 'trainer' | 'admin'>('apprentice')
  const [isInviting, setIsInviting]     = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError]   = useState('')

  // ── localStorage hydration ──────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true)
    try {
      const storedRoles = localStorage.getItem(CUSTOM_ROLES_KEY)
      if (storedRoles) setCustomRoles(JSON.parse(storedRoles) as CustomRole[])
      const storedAssignments = localStorage.getItem(CUSTOM_ASSIGNMENTS_KEY)
      if (storedAssignments) setCustomAssignments(JSON.parse(storedAssignments) as Record<string, string>)
    } catch { /* ignore */ }
  }, [])

  // ── Data loading ────────────────────────────────────────────────────────
  const loadProfiles = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [profilesRes, companiesRes] = await Promise.all([
        fetch('/api/admin/profiles'),
        fetch('/api/admin/companies'),
      ])
      const profilesJson  = await profilesRes.json()
      const companiesJson = await companiesRes.json()
      if (!profilesRes.ok) throw new Error(profilesJson.error ?? 'Fehler beim Laden')
      setProfiles(profilesJson.profiles)
      if (companiesRes.ok) {
        setCompanies((companiesJson.companies ?? []).map((c: { id: string; name: string; accent_color: string }) => ({
          id: c.id, name: c.name, accent_color: c.accent_color,
        })))
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'admin') loadProfiles()
  }, [profile, profileLoading, loadProfiles])

  // ── Helpers ─────────────────────────────────────────────────────────────
  /** Returns { customRoleName, customRoleColor } for a user, or undefined */
  function getCustomRoleInfo(userId: string): { name: string; color: string } | undefined {
    const cid = customAssignments[userId]
    if (!cid) return undefined
    const idx = customRoles.findIndex(cr => cr.id === cid)
    if (idx === -1) return undefined
    return { name: customRoles[idx].name, color: customColor(idx) }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openRoleChange(user: ProfileWithStats) {
    // Pre-select current custom role or built-in role
    const current = customAssignments[user.id] ?? user.role
    setRoleChangeUser(user)
    setSelectedNewRole(current)
    setRoleError('')
  }

  async function handleRoleChange() {
    if (!roleChangeUser || !selectedNewRole) return
    setIsChangingRole(true)
    setRoleError('')
    try {
      // Resolve the DB role (custom roles map to their baseRole)
      const customRole = customRoles.find(cr => cr.id === selectedNewRole)
      const dbRole = customRole
        ? customRole.baseRole
        : (selectedNewRole as 'apprentice' | 'trainer' | 'admin')

      const res = await fetch('/api/admin/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: roleChangeUser.id, role: dbRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Update profiles in memory
      setProfiles(prev => prev.map(p =>
        p.id === roleChangeUser.id ? { ...p, role: dbRole } : p
      ))

      // Update custom assignment in localStorage
      setCustomAssignments(prev => {
        const next = { ...prev }
        if (customRole) {
          next[roleChangeUser.id] = customRole.id
        } else {
          delete next[roleChangeUser.id]
        }
        try { localStorage.setItem(CUSTOM_ASSIGNMENTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
        return next
      })

      setRoleChangeUser(null)
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Fehler.')
    } finally {
      setIsChangingRole(false)
    }
  }

  async function handleDelete(userId: string) {
    setIsDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfiles(prev => prev.filter(p => p.id !== userId))
      setConfirmDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Fehler.')
    } finally {
      setIsDeleting(false)
    }
  }

  function openEdit(user: ProfileWithStats) {
    setEditUser(user)
    setEditForm({ firstName: user.firstName, lastName: user.lastName, occupation: user.occupation, companyName: user.companyName })
    setEditError('')
  }

  async function handleSaveEdit() {
    if (!editUser) return
    setIsSavingEdit(true)
    setEditError('')
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUser.id, profileUpdate: editForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfiles(prev => prev.map(p => p.id === editUser.id ? { ...p, ...editForm } : p))
      setEditUser(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Fehler.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handlePasswordReset(email: string) {
    setResetSuccess('')
    setResetError('')
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResetSuccess(data.message ?? 'Passwort-Reset-E-Mail gesendet.')
      setTimeout(() => setResetSuccess(''), 5000)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Fehler.')
      setTimeout(() => setResetError(''), 5000)
    }
  }

  function openAssignCompany(user: ProfileWithStats) {
    setAssignCompanyUser(user)
    setAssignCompanyId(companies[0]?.id ?? '')
    setAssignCompanyError('')
  }

  async function handleAssignCompany() {
    if (!assignCompanyUser || !assignCompanyId) return
    setIsAssigningCompany(true)
    setAssignCompanyError('')
    const company = companies.find(c => c.id === assignCompanyId)
    try {
      const res = await fetch('/api/admin/companies/assign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignCompanyUser.id, companyId: assignCompanyId, companyName: company?.name ?? null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfiles(prev => prev.map(p =>
        p.id === assignCompanyUser.id ? { ...p, pendingCompanyId: assignCompanyId } : p
      ))
      setAssignCompanyUser(null)
    } catch (err) {
      setAssignCompanyError(err instanceof Error ? err.message : 'Fehler.')
    } finally {
      setIsAssigningCompany(false)
    }
  }

  async function handleUnassignCompany(user: ProfileWithStats) {
    try {
      await fetch('/api/admin/companies/assign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, companyId: null }),
      })
      setProfiles(prev => prev.map(p =>
        p.id === user.id ? { ...p, companyId: null, pendingCompanyId: null } : p
      ))
    } catch { /* ignore */ }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteSuccess(data.message ?? 'Einladung gesendet.')
      setInviteEmail('')
      setInviteRole('apprentice')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Fehler beim Einladen.')
    } finally {
      setIsInviting(false)
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────
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
        <p className="text-muted-foreground text-sm max-w-sm">
          Dieser Bereich ist nur für Administratoren zugänglich.
        </p>
        <Button variant="outline" onClick={() => router.push('/')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="mr-2" />
          Zur Übersicht
        </Button>
      </div>
    )
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const apprentices = profiles.filter(p => p.role === 'apprentice')
  const trainers    = profiles.filter(p => p.role === 'trainer')
  const admins      = profiles.filter(p => p.role === 'admin')

  function filterList(list: ProfileWithStats[]) {
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(p =>
      `${p.firstName} ${p.lastName} ${p.email} ${p.occupation} ${p.companyName}`.toLowerCase().includes(q)
    )
  }

  const currentList = activeTab === 'apprentices' ? filterList(apprentices)
    : activeTab === 'trainers'   ? filterList(trainers)
    : activeTab === 'admins'     ? filterList(admins)
    : []

  const tabs: { id: ActiveTab; label: string; count: number }[] = [
    { id: 'apprentices', label: 'Auszubildende', count: apprentices.length },
    { id: 'trainers',    label: 'Ausbilder',      count: trainers.length },
    { id: 'admins',      label: 'Admins',          count: admins.length },
    { id: 'invite',      label: 'Einladen',        count: 0 },
  ]

  // Label for the role change dialog description
  function roleLabel(roleId: string): string {
    const cr = customRoles.find(c => c.id === roleId)
    if (cr) return cr.name
    if (roleId === 'admin')      return 'Administrator'
    if (roleId === 'trainer')    return 'Ausbilder'
    if (roleId === 'apprentice') return 'Auszubildender'
    return roleId
  }

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* Toast */}
      {(resetSuccess || resetError) && (
        <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
          {resetSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 shadow-lg">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} className="shrink-0" />
              {resetSuccess}
            </div>
          )}
          {resetError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive shadow-lg">
              <HugeiconsIcon icon={Alert01Icon} size={15} className="shrink-0" />
              {resetError}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(66,133,244,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HugeiconsIcon icon={UserGroup02Icon} size={17} style={{ color: '#4285f4' }} />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground leading-tight">Benutzerverwaltung</h1>
                <p className="text-xs text-muted-foreground">Nutzer, Rollen und Berechtigungen</p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="rounded-xl border border-border bg-background grid grid-cols-4 divide-x divide-border">
            {[
              { label: 'Gesamt',        value: profiles.length,    color: '#4285f4' },
              { label: 'Auszubildende', value: apprentices.length, color: '#fbbc04' },
              { label: 'Ausbilder',     value: trainers.length,    color: '#34a853' },
              { label: 'Admins',        value: admins.length,      color: '#4285f4' },
            ].map(stat => (
              <div key={stat.label} className="px-3 py-2 text-center">
                <div className="text-base font-bold leading-none" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background px-3 sm:px-6 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: '0.625rem', fontWeight: 700, padding: '1px 5px',
                    borderRadius: 9999, background: activeTab === tab.id ? '#4285f4' : 'hsl(var(--muted))',
                    color: activeTab === tab.id ? 'white' : 'hsl(var(--muted-foreground))',
                  }}>
                    {tab.count}
                  </span>
                )}
                {tab.id === 'invite' && (
                  <HugeiconsIcon icon={UserAdd01Icon} size={13} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {activeTab !== 'invite' && (
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suche nach Name, E-Mail, Beruf…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          )}

          {loadError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <HugeiconsIcon icon={Alert01Icon} size={15} />
              {loadError}
              <button onClick={loadProfiles} className="ml-auto text-xs underline">Erneut versuchen</button>
            </div>
          )}

          {!loading && activeTab !== 'invite' && (
            <>
              {currentList.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  {search ? 'Keine Ergebnisse für diese Suche.' : 'Keine Nutzer in dieser Kategorie.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {currentList.map(user => {
                    const crInfo = isMounted ? getCustomRoleInfo(user.id) : undefined
                    return (
                      <UserCard
                        key={user.id}
                        user={user}
                        currentUserId={profile?.id ?? ''}
                        customRoleName={crInfo?.name}
                        customRoleColor={crInfo?.color}
                        onEdit={openEdit}
                        onChangeRole={openRoleChange}
                        onDelete={u => setConfirmDelete(u)}
                        onResetPassword={handlePasswordReset}
                        onAssignCompany={openAssignCompany}
                        onUnassignCompany={handleUnassignCompany}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Invite tab */}
          {activeTab === 'invite' && (
            <Card className="border rounded-2xl max-w-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <HugeiconsIcon icon={UserAdd01Icon} size={18} className="text-primary" />
                  <h2 className="text-sm font-semibold">Neuen Nutzer einladen</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">E-Mail-Adresse</Label>
                    <Input
                      type="email"
                      placeholder="name@firma.de"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Rolle</Label>
                    <Select value={inviteRole} onValueChange={v => setInviteRole(v as typeof inviteRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apprentice">Auszubildender</SelectItem>
                        <SelectItem value="trainer">Ausbilder</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {inviteError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                      <HugeiconsIcon icon={Alert01Icon} size={13} />
                      {inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-600">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                      {inviteSuccess}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleInvite}
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? (
                      <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                    ) : (
                      <HugeiconsIcon icon={Mail01Icon} size={14} className="mr-2" />
                    )}
                    Einladung senden
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Role change dialog ────────────────────────────────────────────── */}
      <AlertDialog open={!!roleChangeUser} onOpenChange={open => !open && setRoleChangeUser(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Rolle ändern</AlertDialogTitle>
            <AlertDialogDescription>
              Wähle eine neue Rolle für{' '}
              <strong>{roleChangeUser?.firstName} {roleChangeUser?.lastName}</strong>.
              {customRoles.length > 0 && ' Benutzerdefinierte Rollen sind ebenfalls verfügbar.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2 space-y-3">
            <Select value={selectedNewRole} onValueChange={setSelectedNewRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rolle wählen…" />
              </SelectTrigger>
              <SelectContent>
                {/* ── Built-in roles ── */}
                <div style={{ padding: '4px 8px 2px', fontSize: '0.625rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Standard-Rollen
                </div>
                {[
                  { value: 'apprentice', label: 'Auszubildender', color: '#fbbc04', Icon: UserCircleIcon },
                  { value: 'trainer',    label: 'Ausbilder',       color: '#34a853', Icon: CheckmarkBadge01Icon },
                  { value: 'admin',      label: 'Administrator',   color: '#4285f4', Icon: Shield01Icon },
                ].map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={r.Icon} size={13} style={{ color: r.color, flexShrink: 0 }} />
                      {r.label}
                    </div>
                  </SelectItem>
                ))}

                {/* ── Custom roles ── */}
                {customRoles.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'hsl(var(--border))', margin: '4px 8px' }} />
                    <div style={{ padding: '4px 8px 2px', fontSize: '0.625rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Benutzerdefiniert
                    </div>
                    {customRoles.map((cr, i) => {
                      const cc = customColor(i)
                      return (
                        <SelectItem key={cr.id} value={cr.id}>
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={Crown02Icon} size={13} style={{ color: cc, flexShrink: 0 }} />
                            <span>{cr.name}</span>
                            <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                              ({ROLE_CONFIG_LABEL[cr.baseRole]})
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Preview badge */}
            {selectedNewRole && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'hsl(var(--muted)/0.5)', border: '1px solid hsl(var(--border))' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Neue Rolle:</span>
                {(() => {
                  const cr = customRoles.find(c => c.id === selectedNewRole)
                  const idx = customRoles.findIndex(c => c.id === selectedNewRole)
                  if (cr) return <RoleBadge role={cr.baseRole} customLabel={cr.name} customColor={customColor(idx)} />
                  return <RoleBadge role={selectedNewRole} />
                })()}
              </div>
            )}

            {roleError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                <HugeiconsIcon icon={Alert01Icon} size={13} />
                {roleError}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingRole}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={isChangingRole || !selectedNewRole}
            >
              {isChangingRole && <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Rolle setzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit profile dialog */}
      <AlertDialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Profil bearbeiten</AlertDialogTitle>
            <AlertDialogDescription>
              Ändere die Profildaten von {editUser?.firstName} {editUser?.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs mb-1 block">Vorname</Label>
                <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Nachname</Label>
                <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Ausbildungsberuf</Label>
              <Input value={editForm.occupation} onChange={e => setEditForm(f => ({ ...f, occupation: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Unternehmen</Label>
              <Input value={editForm.companyName} onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))} />
            </div>
            {editError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                <HugeiconsIcon icon={Alert01Icon} size={13} />
                {editError}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingEdit}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Speichern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company assignment dialog */}
      <AlertDialog open={!!assignCompanyUser} onOpenChange={open => !open && setAssignCompanyUser(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Unternehmen zuweisen</AlertDialogTitle>
            <AlertDialogDescription>
              {assignCompanyUser && (
                <>Wähle ein Unternehmen für <strong>{assignCompanyUser.firstName} {assignCompanyUser.lastName}</strong>. Der Nutzer erhält eine Einladung und muss diese bestätigen.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Unternehmen vorhanden.</p>
            ) : (
              <Select value={assignCompanyId} onValueChange={setAssignCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unternehmen wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: c.accent_color, flexShrink: 0 }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {assignCompanyError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive mt-3">
                <HugeiconsIcon icon={Alert01Icon} size={13} />
                {assignCompanyError}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigningCompany}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignCompany}
              disabled={isAssigningCompany || companies.length === 0 || !assignCompanyId}
            >
              {isAssigningCompany && <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Einladung senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nutzer löschen</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && (
                <>Soll <strong>{confirmDelete.firstName} {confirmDelete.lastName}</strong> unwiderruflich gelöscht werden? Alle Daten dieses Nutzers gehen verloren.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive mx-6">
              <HugeiconsIcon icon={Alert01Icon} size={13} />
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting && <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Used in select item labels (needs to be module-level for TSC)
const ROLE_CONFIG_LABEL: Record<string, string> = {
  apprentice: 'Azubi',
  trainer:    'Ausbilder',
  admin:      'Admin',
}
