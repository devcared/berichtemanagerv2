'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building01Icon, Alert01Icon, ArrowLeft01Icon, Edit01Icon,
  Delete01Icon, Add01Icon, LinkSquare01Icon, Globe02Icon,
  Cancel01Icon, CheckmarkCircle01Icon, UserGroup02Icon, Key01Icon,
  Refresh01Icon,
} from '@hugeicons/core-free-icons'

interface CompanyData {
  id: string
  name: string
  logo_url: string | null
  accent_color: string
  website: string | null
  join_code: string | null
  user_count: number
  created_at: string
  updated_at: string
}

interface ProfileData {
  id: string
  firstName: string
  lastName: string
  occupation: string
  companyName: string
  role: string
  email: string
  companyId: string | null
  pendingCompanyId?: string | null
}

interface FormState {
  name: string
  logoUrl: string
  accentColor: string
  website: string
  joinCode: string
}

const EMPTY_FORM: FormState = {
  name: '',
  logoUrl: '',
  accentColor: '#4285f4',
  website: '',
  joinCode: '',
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AdminCompaniesPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [companiesRes, profilesRes] = await Promise.all([
        fetch('/api/admin/companies'),
        fetch('/api/admin/profiles'),
      ])
      const companiesJson = await companiesRes.json()
      const profilesJson = await profilesRes.json()
      if (companiesRes.ok) setCompanies(companiesJson.companies ?? [])
      if (profilesRes.ok) {
        setAllProfiles(
          (profilesJson.profiles ?? []).map((p: {
            id: string; firstName: string; lastName: string;
            occupation: string; companyName: string; role: string;
            email: string; companyId?: string | null; pendingCompanyId?: string | null
          }) => ({
            ...p,
            companyId: p.companyId ?? null,
            pendingCompanyId: p.pendingCompanyId ?? null,
          }))
        )
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profileLoading && profile?.role === 'admin') loadData()
  }, [profile, profileLoading, loadData])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormVisible(true)
  }

  function openEdit(c: CompanyData) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      logoUrl: c.logo_url ?? '',
      accentColor: c.accent_color ?? '#4285f4',
      website: c.website ?? '',
      joinCode: c.join_code ?? '',
    })
    setFormVisible(true)
  }

  function closeForm() {
    setFormVisible(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        logoUrl: form.logoUrl.trim() || null,
        accentColor: form.accentColor,
        website: form.website.trim() || null,
        joinCode: form.joinCode.trim().toUpperCase() || null,
      }

      let res: Response
      if (editingId) {
        res = await fetch('/api/admin/companies', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        })
      } else {
        res = await fetch('/api/admin/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (res.ok) {
        closeForm()
        await loadData()
        showSuccess(editingId ? 'Unternehmen gespeichert' : 'Unternehmen erstellt')
      }
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setDeleteId(null)
        await loadData()
        showSuccess('Unternehmen gelöscht')
      }
    } catch { /* ignore */ }
  }

  async function handleAssign(userId: string, companyId: string | null, companyName?: string | null) {
    setAssigning(userId)
    try {
      const res = await fetch('/api/admin/companies/assign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId, companyName: companyName ?? null }),
      })
      if (res.ok) {
        await loadData()
        showSuccess(companyId ? 'Einladung gesendet' : 'Zuweisung aufgehoben')
      }
    } catch { /* ignore */ } finally {
      setAssigning(null)
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
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

  const unassignedProfiles = allProfiles.filter(p => !p.companyId && !p.pendingCompanyId)

  return (
    <div className="flex flex-col min-h-full bg-background" style={{ fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif' }}>
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(66,133,244,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={Building01Icon} size={20} style={{ color: '#4285f4' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Unternehmen verwalten</h1>
              <p className="text-xs text-muted-foreground">Unternehmensprofile und Nutzerzuweisungen</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={openCreate}
            style={{ background: '#4285f4', color: 'white', border: 'none' }}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" />
            Neues Unternehmen
          </Button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#34a853', color: 'white',
          padding: '10px 16px', borderRadius: 10,
          fontSize: '0.875rem', fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.2s ease',
        }}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          {successMsg}
        </div>
      )}

      {/* Inline Form Panel */}
      {formVisible && (
        <div style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted)/0.3)', padding: '0' }}>
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form fields */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  {editingId ? 'Unternehmen bearbeiten' : 'Neues Unternehmen'}
                </h2>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="company-name" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Name <span style={{ color: '#ea4335' }}>*</span>
                    </Label>
                    <Input
                      id="company-name"
                      value={form.name}
                      onChange={e => updateForm('name', e.target.value)}
                      placeholder="z.B. Musterfirma GmbH"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-logo" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Logo-URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="company-logo"
                        value={form.logoUrl}
                        onChange={e => updateForm('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="h-9 text-sm flex-1"
                      />
                      {form.logoUrl && (
                        <div style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid hsl(var(--border))', overflow: 'hidden', flexShrink: 0, background: 'hsl(var(--muted))' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Akzentfarbe
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.accentColor}
                        onChange={e => updateForm('accentColor', e.target.value)}
                        style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid hsl(var(--border))', cursor: 'pointer', padding: 2, background: 'transparent' }}
                      />
                      <Input
                        value={form.accentColor}
                        onChange={e => updateForm('accentColor', e.target.value)}
                        placeholder="#4285f4"
                        className="h-9 text-sm w-28 font-mono"
                        maxLength={7}
                      />
                      <div style={{ flex: 1, height: 36, borderRadius: 8, background: form.accentColor, opacity: 0.2, border: '1px solid hsl(var(--border))' }} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company-website" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Website
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={Globe02Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="company-website"
                        value={form.website}
                        onChange={e => updateForm('website', e.target.value)}
                        placeholder="https://www.example.com"
                        className="h-9 text-sm pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company-join-code" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Beitrittscode <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>(Nutzer brauchen diesen Code beim Beitritt)</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <HugeiconsIcon icon={Key01Icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="company-join-code"
                          value={form.joinCode}
                          onChange={e => updateForm('joinCode', e.target.value.toUpperCase())}
                          placeholder="z.B. AZUBI2024"
                          className="h-9 text-sm pl-8 font-mono tracking-widest"
                          maxLength={20}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => updateForm('joinCode', generateJoinCode())}
                        title="Zufälligen Code generieren"
                        style={{
                          width: 36, height: 36, borderRadius: 8, border: '1px solid hsl(var(--border))',
                          background: 'transparent', cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'hsl(var(--muted-foreground))',
                        }}
                      >
                        <HugeiconsIcon icon={Refresh01Icon} size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                    style={{ background: '#4285f4', color: 'white', border: 'none' }}
                  >
                    {saving ? (
                      <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-1.5" />
                    ) : (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-1.5" />
                    )}
                    {saving ? 'Speichern…' : 'Speichern'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={closeForm}>
                    <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-1.5" />
                    Abbrechen
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-4">Vorschau — Navbar</h2>
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.logoUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'hsl(var(--muted))' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: form.accentColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.875rem',
                      }}>
                        {(form.name || 'A')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        {form.name || 'Unternehmensname'}
                      </div>
                      {form.website && (
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{form.website}</div>
                      )}
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: form.accentColor + '18', border: `1px solid ${form.accentColor}30` }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: form.accentColor }} />
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: form.accentColor }}>Aktiv</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: 8 }}>
                  So erscheint das Branding für zugewiesene Nutzer in der Navigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Companies grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <HugeiconsIcon icon={Building01Icon} size={24} className="text-muted-foreground" />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
                Noch keine Unternehmen angelegt.
              </p>
              <Button size="sm" onClick={openCreate} style={{ background: '#4285f4', color: 'white', border: 'none' }}>
                <HugeiconsIcon icon={Add01Icon} size={14} className="mr-1.5" />
                Erstes Unternehmen erstellen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(c => {
                const isExpanded = expandedCompany === c.id
                const assignedUsers = allProfiles.filter(p => p.companyId === c.id)
                const pendingUsers = allProfiles.filter(p => p.pendingCompanyId === c.id)
                return (
                  <Card
                    key={c.id}
                    className="border rounded-2xl overflow-hidden"
                    style={{ transition: 'box-shadow 0.2s' }}
                  >
                    {/* Accent bar */}
                    <div style={{ height: 4, background: c.accent_color }} />
                    <CardContent className="p-4">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                        {/* Logo or initial */}
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.logo_url}
                            alt={c.name}
                            style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: 'hsl(var(--muted))', flexShrink: 0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div style={{
                            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                            background: c.accent_color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '1rem',
                          }}>
                            {c.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name}
                          </div>
                          {c.website && (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.75rem', color: c.accent_color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}
                            >
                              <HugeiconsIcon icon={LinkSquare01Icon} size={11} />
                              {c.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* User count badge + join code */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: c.accent_color + '15', border: `1px solid ${c.accent_color}25` }}>
                          <HugeiconsIcon icon={UserGroup02Icon} size={12} style={{ color: c.accent_color }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: c.accent_color }}>
                            {c.user_count} {c.user_count === 1 ? 'Nutzer' : 'Nutzer'}
                          </span>
                        </div>
                        {c.join_code && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                            <HugeiconsIcon icon={Key01Icon} size={11} style={{ color: 'hsl(var(--muted-foreground))' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.08em', color: 'hsl(var(--foreground))' }}>
                              {c.join_code}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openEdit(c)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '6px 10px', borderRadius: 8, border: '1px solid hsl(var(--border))',
                            background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                            color: 'hsl(var(--foreground))', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={13} />
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => setExpandedCompany(isExpanded ? null : c.id)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '6px 10px', borderRadius: 8, border: `1px solid ${c.accent_color}30`,
                            background: isExpanded ? c.accent_color + '15' : 'transparent',
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                            color: c.accent_color, transition: 'background 0.15s',
                          }}
                        >
                          <HugeiconsIcon icon={UserGroup02Icon} size={13} />
                          Nutzer
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          style={{
                            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 8, border: '1px solid hsl(var(--border))',
                            background: 'transparent', cursor: 'pointer', flexShrink: 0,
                            color: '#ea4335', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#ea433510')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={14} />
                        </button>
                      </div>

                      {/* Expanded users section */}
                      {isExpanded && (
                        <div style={{ marginTop: 12, borderTop: '1px solid hsl(var(--border))', paddingTop: 12 }}>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                            Zugewiesene Nutzer
                          </p>
                          {assignedUsers.length === 0 && pendingUsers.length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                              Noch keine Nutzer zugewiesen.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                              {assignedUsers.map(p => {
                                const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase()
                                return (
                                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'hsl(var(--muted)/0.5)' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: c.accent_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                      {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.firstName} {p.lastName}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleAssign(p.id, null)}
                                      disabled={assigning === p.id}
                                      style={{ fontSize: '0.6875rem', color: '#ea4335', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}
                                    >
                                      {assigning === p.id ? '…' : 'Entfernen'}
                                    </button>
                                  </div>
                                )
                              })}
                              {pendingUsers.map(p => {
                                const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase()
                                return (
                                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'rgba(251,188,4,0.08)', border: '1px solid rgba(251,188,4,0.25)' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(251,188,4,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: '#b38600', flexShrink: 0 }}>
                                      {initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.firstName} {p.lastName}
                                      </div>
                                      <div style={{ fontSize: '0.625rem', color: '#b38600', fontWeight: 500 }}>Einladung ausstehend</div>
                                    </div>
                                    <button
                                      onClick={() => handleAssign(p.id, null)}
                                      disabled={assigning === p.id}
                                      style={{ fontSize: '0.6875rem', color: '#ea4335', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}
                                    >
                                      {assigning === p.id ? '…' : 'Zurückziehen'}
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Unassigned users to add */}
                          {unassignedProfiles.length > 0 && (
                            <>
                              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                Nutzer zuweisen
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {unassignedProfiles.map(p => {
                                  const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase()
                                  return (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, border: '1px solid hsl(var(--border))' }}>
                                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
                                        {initials}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {p.firstName} {p.lastName}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleAssign(p.id, c.id, c.name)}
                                        disabled={assigning === p.id}
                                        style={{ fontSize: '0.6875rem', color: c.accent_color, background: c.accent_color + '15', border: `1px solid ${c.accent_color}30`, cursor: 'pointer', padding: '3px 8px', borderRadius: 6, flexShrink: 0, fontWeight: 500 }}
                                      >
                                        {assigning === p.id ? '…' : 'Einladen'}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unternehmen löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du dieses Unternehmen wirklich löschen? Alle Nutzerzuweisungen werden aufgehoben. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              style={{ background: '#ea4335', color: 'white', border: 'none' }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
