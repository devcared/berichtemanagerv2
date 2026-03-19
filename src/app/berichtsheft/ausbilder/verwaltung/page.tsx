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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkBadge01Icon,
  ArrowLeft01Icon,
  UserAdd01Icon,
  UserMinus01Icon,
  UserCheck01Icon,
  Group01Icon,
  Mail01Icon,
  Crown02Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  Search01Icon,
  UserCircleIcon,
  Shield01Icon,
  MoreVerticalIcon,
  Edit01Icon,
  Delete01Icon,
  File01Icon,
  LockPasswordIcon,
  Building01Icon,
  OfficeChairIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface ProfileWithStats {
  id: string
  firstName: string
  lastName: string
  occupation: string
  companyName: string
  role: 'apprentice' | 'trainer'
  email: string
  createdAt: string
  stats: {
    total: number
    approved: number
    submitted: number
    needsRevision: number
    lastSubmissionAt: string | null
  }
}

type ActiveTab = 'apprentices' | 'trainers' | 'invite'

export default function VerwaltungPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [profiles, setProfiles] = useState<ProfileWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('apprentices')
  const [search, setSearch] = useState('')

  // Role change
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    user: ProfileWithStats
    newRole: 'apprentice' | 'trainer'
  } | null>(null)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [roleError, setRoleError] = useState('')

  // Delete
  const [confirmDelete, setConfirmDelete] = useState<ProfileWithStats | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Edit profile
  const [editUser, setEditUser] = useState<ProfileWithStats | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', occupation: '', companyName: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Password reset
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'apprentice' | 'trainer'>('apprentice')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/admin/profiles')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Laden')
      setProfiles(json.profiles)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'trainer') loadProfiles()
  }, [profile, profileLoading, loadProfiles])

  async function handleRoleChange(userId: string, newRole: 'apprentice' | 'trainer') {
    setIsChangingRole(true)
    setRoleError('')
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
      setConfirmRoleChange(null)
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
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      occupation: user.occupation,
      companyName: user.companyName,
    })
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
      setProfiles(prev => prev.map(p =>
        p.id === editUser.id
          ? { ...p, firstName: editForm.firstName, lastName: editForm.lastName, occupation: editForm.occupation, companyName: editForm.companyName }
          : p
      ))
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
      setResetSuccess(data.message)
      setTimeout(() => setResetSuccess(''), 4000)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Fehler.')
      setTimeout(() => setResetError(''), 4000)
    }
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
      setInviteSuccess(data.message)
      setInviteEmail('')
      setInviteRole('apprentice')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Fehler beim Einladen.')
    } finally {
      setIsInviting(false)
    }
  }

  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">Lädt…</div>
  }

  if (profile?.role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Kein Zugriff</h2>
        <p className="text-muted-foreground text-sm">Dieser Bereich ist nur für Ausbilder zugänglich.</p>
      </div>
    )
  }

  const apprentices = profiles.filter(p => p.role === 'apprentice')
  const trainers = profiles.filter(p => p.role === 'trainer')

  const filteredApprentices = search.trim()
    ? apprentices.filter(p =>
        `${p.firstName} ${p.lastName} ${p.occupation} ${p.companyName}`.toLowerCase().includes(search.toLowerCase())
      )
    : apprentices

  const filteredTrainers = search.trim()
    ? trainers.filter(p =>
        `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
      )
    : trainers

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* Toast notifications */}
      {(resetSuccess || resetError) && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
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

      {/* Hero Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
              onClick={() => router.push('/berichtsheft/ausbilder')}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Berichte-Übersicht
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                <HugeiconsIcon icon={Group01Icon} size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Benutzerverwaltung</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Auszubildende & Ausbilder verwalten · Einladungen versenden
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={loadProfiles}>
              Aktualisieren
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
            {[
              { label: 'Auszubildende', value: apprentices.length, icon: UserCircleIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Ausbilder', value: trainers.length, icon: CheckmarkBadge01Icon, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Berichte gesamt', value: profiles.reduce((s, p) => s + p.stats.total, 0), icon: Shield01Icon, color: 'text-green-500', bg: 'bg-green-500/10' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card/50 px-2 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0', s.bg, s.color)}>
                  <HugeiconsIcon icon={s.icon} size={16} />
                </div>
                <div>
                  <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto w-full">

        {/* Load Error */}
        {loadError && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-5">
            <HugeiconsIcon icon={Alert01Icon} size={15} className="shrink-0 mt-0.5" />
            <span><strong>Fehler beim Laden:</strong> {loadError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {([
            { key: 'apprentices', label: 'Auszubildende', icon: UserCircleIcon, count: apprentices.length },
            { key: 'trainers', label: 'Ausbilder', icon: Crown02Icon, count: trainers.length },
            { key: 'invite', label: 'Einladen', icon: UserAdd01Icon, count: null },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch('') }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <HugeiconsIcon icon={tab.icon} size={15} />
              {tab.label}
              {tab.count !== null && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center',
                  activeTab === tab.key ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {activeTab !== 'invite' && (
          <div className="relative mb-4 max-w-sm">
            <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'apprentices' ? 'Auszubildende suchen…' : 'Ausbilder suchen…'}
              className="h-9 pl-8 text-sm bg-background"
            />
          </div>
        )}

        {/* ─── TAB: AUSZUBILDENDE ─── */}
        {activeTab === 'apprentices' && (
          <div>
            {loading ? (
              <LoadingState />
            ) : filteredApprentices.length === 0 ? (
              <EmptyState
                icon={UserCircleIcon}
                title={search ? 'Niemanden gefunden' : 'Keine Auszubildenden'}
                subtitle={search ? `Keine Treffer für „${search}"` : 'Noch keine Auszubildenden registriert.'}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredApprentices.map(p => (
                  <ApprenticeCard
                    key={p.id}
                    profile={p}
                    currentUserId={profile.id}
                    onEdit={() => openEdit(p)}
                    onPromote={() => setConfirmRoleChange({ user: p, newRole: 'trainer' })}
                    onDelete={() => { setDeleteError(''); setConfirmDelete(p) }}
                    onPasswordReset={() => handlePasswordReset(p.email)}
                    onViewReports={() => router.push(`/berichtsheft/ausbilder?user=${p.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: AUSBILDER ─── */}
        {activeTab === 'trainers' && (
          <div>
            {loading ? (
              <LoadingState />
            ) : filteredTrainers.length === 0 ? (
              <EmptyState
                icon={Crown02Icon}
                title={search ? 'Niemanden gefunden' : 'Keine Ausbilder'}
                subtitle={search ? `Keine Treffer für „${search}"` : 'Noch keine Ausbilder vorhanden.'}
              />
            ) : (
              <div className="space-y-2">
                {filteredTrainers.map(p => (
                  <TrainerRow
                    key={p.id}
                    trainer={p}
                    isSelf={p.id === profile.id}
                    onEdit={() => openEdit(p)}
                    onDemote={() => setConfirmRoleChange({ user: p, newRole: 'apprentice' })}
                    onDelete={() => { setDeleteError(''); setConfirmDelete(p) }}
                    onPasswordReset={() => handlePasswordReset(p.email)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: EINLADEN ─── */}
        {activeTab === 'invite' && (
          <div className="max-w-lg space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-1">Neuen Nutzer einladen</h3>
              <p className="text-sm text-muted-foreground">
                Der Nutzer erhält eine E-Mail mit einem Einladungslink und richtet danach sein Profil ein.
              </p>
            </div>

            <Card className="border-border">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-Mail-Adresse</Label>
                  <div className="relative">
                    <HugeiconsIcon icon={Mail01Icon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="name@betrieb.de"
                      className="pl-9 bg-background"
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rolle</Label>
                  <Select value={inviteRole} onValueChange={v => setInviteRole(v as typeof inviteRole)}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apprentice">
                        <div className="flex items-center gap-2"><HugeiconsIcon icon={UserCircleIcon} size={14} />Auszubildender</div>
                      </SelectItem>
                      <SelectItem value="trainer">
                        <div className="flex items-center gap-2"><HugeiconsIcon icon={Crown02Icon} size={14} />Ausbilder</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === 'trainer'
                      ? 'Ausbilder können alle Berichte prüfen, kommentieren und freigeben.'
                      : 'Auszubildende können ihre eigenen Wochenberichte schreiben und einreichen.'}
                  </p>
                </div>

                {inviteError && (
                  <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-xs text-destructive">
                    <HugeiconsIcon icon={Alert01Icon} size={13} className="shrink-0 mt-0.5" />{inviteError}
                  </div>
                )}
                {inviteSuccess && (
                  <div className="flex items-start gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-xs text-green-600">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} className="shrink-0 mt-0.5" />{inviteSuccess}
                  </div>
                )}

                <Button className="w-full gap-2" onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                  {isInviting
                    ? <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    : <HugeiconsIcon icon={UserAdd01Icon} size={16} />}
                  {isInviting ? 'Einladung wird gesendet…' : 'Einladung senden'}
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <HugeiconsIcon icon={Shield01Icon} size={13} className="text-muted-foreground" />Hinweise
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Der Einladungslink ist 24 Stunden gültig.</li>
                <li>Existierende E-Mail-Adressen können nicht erneut eingeladen werden.</li>
                <li>Rollen können nach der Registrierung hier jederzeit geändert werden.</li>
                <li>Ausbilder haben Zugriff auf alle Berichte aller Auszubildenden.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ─── DIALOG: Rolle ändern ─── */}
      <AlertDialog open={!!confirmRoleChange} onOpenChange={o => { if (!o) { setConfirmRoleChange(null); setRoleError('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmRoleChange?.newRole === 'trainer'
                ? <><HugeiconsIcon icon={Crown02Icon} size={18} className="text-primary" /> Zum Ausbilder befördern</>
                : <><HugeiconsIcon icon={UserMinus01Icon} size={18} className="text-orange-500" /> Zur Azubi-Rolle zurückstufen</>}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRoleChange?.newRole === 'trainer'
                ? <><strong>{confirmRoleChange.user.firstName} {confirmRoleChange.user.lastName}</strong> erhält die Ausbilder-Rolle und kann alle Berichte einsehen und freigeben.</>
                : <><strong>{confirmRoleChange?.user.firstName} {confirmRoleChange?.user.lastName}</strong> verliert den Ausbilder-Zugriff und wird als Auszubildender eingestuft.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {roleError && <p className="px-6 text-xs text-destructive">{roleError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRoleChange && handleRoleChange(confirmRoleChange.user.id, confirmRoleChange.newRole)}
              className={confirmRoleChange?.newRole === 'trainer' ? 'bg-primary hover:bg-primary/90' : 'bg-orange-600 hover:bg-orange-700 text-white'}
              disabled={isChangingRole}
            >
              {isChangingRole && <span className="size-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin mr-1.5" />}
              {confirmRoleChange?.newRole === 'trainer' ? 'Ja, befördern' : 'Ja, zurückstufen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── DIALOG: Nutzer löschen ─── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={o => { if (!o) { setConfirmDelete(null); setDeleteError('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Delete01Icon} size={18} className="text-destructive" />
              Nutzer löschen
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.firstName} {confirmDelete?.lastName}</strong> ({confirmDelete?.email}) wird dauerhaft gelöscht.
              Alle Berichte und Daten dieses Nutzers bleiben erhalten, können aber nicht mehr zugeordnet werden.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="px-6 text-xs text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting && <span className="size-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin mr-1.5" />}
              Ja, dauerhaft löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── DIALOG: Profil bearbeiten ─── */}
      <AlertDialog open={!!editUser} onOpenChange={o => { if (!o) setEditUser(null) }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Edit01Icon} size={18} className="text-primary" />
              Profil bearbeiten
            </AlertDialogTitle>
            <AlertDialogDescription>
              Änderungen werden sofort gespeichert und für den Nutzer sichtbar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vorname</Label>
                <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nachname</Label>
                <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ausbildungsberuf</Label>
              <div className="relative">
                <HugeiconsIcon icon={OfficeChairIcon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={editForm.occupation} onChange={e => setEditForm(f => ({ ...f, occupation: e.target.value }))} className="h-9 text-sm pl-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Betrieb</Label>
              <div className="relative">
                <HugeiconsIcon icon={Building01Icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={editForm.companyName} onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))} className="h-9 text-sm pl-8" />
              </div>
            </div>
            {editError && <p className="text-xs text-destructive">{editError}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <span className="size-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin mr-1.5" />}
              Speichern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ─── Sub-Components ─── */

function UserActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-foreground">
          <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ApprenticeCard({
  profile, currentUserId, onEdit, onPromote, onDelete, onPasswordReset, onViewReports,
}: {
  profile: ProfileWithStats
  currentUserId: string
  onEdit: () => void
  onPromote: () => void
  onDelete: () => void
  onPasswordReset: () => void
  onViewReports: () => void
}) {
  const completionPct = profile.stats.total > 0
    ? Math.round((profile.stats.approved / profile.stats.total) * 100)
    : 0

  return (
    <Card className="border-border overflow-hidden hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{profile.firstName} {profile.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.occupation || '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
          <UserActionsMenu>
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <HugeiconsIcon icon={Edit01Icon} size={14} />Profil bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewReports} className="gap-2">
              <HugeiconsIcon icon={File01Icon} size={14} />Berichte ansehen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPasswordReset} className="gap-2">
              <HugeiconsIcon icon={LockPasswordIcon} size={14} />Passwort zurücksetzen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPromote} className="gap-2 text-primary focus:text-primary">
              <HugeiconsIcon icon={UserCheck01Icon} size={14} />Zum Ausbilder befördern
            </DropdownMenuItem>
            {profile.id !== currentUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                  <HugeiconsIcon icon={Delete01Icon} size={14} />Nutzer löschen
                </DropdownMenuItem>
              </>
            )}
          </UserActionsMenu>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Gesamt', value: profile.stats.total, color: 'text-foreground' },
            { label: 'Freigegeben', value: profile.stats.approved, color: 'text-green-500' },
            { label: 'Ausstehend', value: profile.stats.submitted, color: 'text-blue-500' },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
              <div className={cn('text-lg font-bold tabular-nums', s.color)}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        {profile.stats.total > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Fortschritt</span>
              <span className="font-semibold">{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {profile.companyName && (
            <p className="text-[10px] text-muted-foreground truncate">
              <span className="text-muted-foreground/60">Betrieb:</span> {profile.companyName}
            </p>
          )}
          {profile.stats.lastSubmissionAt && (
            <p className="text-[10px] text-muted-foreground">
              <span className="text-muted-foreground/60">Letzter Bericht:</span>{' '}
              {format(new Date(profile.stats.lastSubmissionAt), 'dd. MMM yyyy', { locale: de })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TrainerRow({
  trainer, isSelf, onEdit, onDemote, onDelete, onPasswordReset,
}: {
  trainer: ProfileWithStats
  isSelf: boolean
  onEdit: () => void
  onDemote: () => void
  onDelete: () => void
  onPasswordReset: () => void
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 sm:gap-4 rounded-2xl border px-3 sm:px-5 py-3 sm:py-4 transition-colors',
      isSelf ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
    )}>
      <div className={cn(
        'size-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
        isSelf ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
      )}>
        {trainer.firstName[0]}{trainer.lastName[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{trainer.firstName} {trainer.lastName}</p>
          {isSelf && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">Du</span>}
          <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            <HugeiconsIcon icon={Crown02Icon} size={10} />Ausbilder
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{trainer.email}</p>
      </div>

      <div className="text-right hidden sm:block shrink-0">
        <p className="text-xs font-medium">Seit</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(trainer.createdAt), 'MMM yyyy', { locale: de })}
        </p>
      </div>

      <UserActionsMenu>
        <DropdownMenuItem onClick={onEdit} className="gap-2">
          <HugeiconsIcon icon={Edit01Icon} size={14} />Profil bearbeiten
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPasswordReset} className="gap-2">
          <HugeiconsIcon icon={LockPasswordIcon} size={14} />Passwort zurücksetzen
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDemote} className="gap-2 text-orange-500 focus:text-orange-500">
              <HugeiconsIcon icon={UserMinus01Icon} size={14} />Zurückstufen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
              <HugeiconsIcon icon={Delete01Icon} size={14} />Nutzer löschen
            </DropdownMenuItem>
          </>
        )}
      </UserActionsMenu>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="py-16 text-center">
      <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Wird geladen…</p>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any, title: string, subtitle: string
}) {
  return (
    <div className="py-16 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        <HugeiconsIcon icon={icon} size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}
