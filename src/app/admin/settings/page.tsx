'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Settings01Icon, Alert01Icon, ArrowLeft01Icon, CheckmarkCircle01Icon,
  ToggleOnIcon, ToggleOffIcon, InformationCircleIcon, PaintBoardIcon,
} from '@hugeicons/core-free-icons'

interface AdminSettings {
  maintenanceMode: boolean
  allowRegistration: boolean
  maxUploadSizeMb: number
  defaultReportType: 'daily' | 'weekly'
  platformName: string
  supportEmail: string
  invitationExpiryHours: number
  requireApprovalForReports: boolean
  enablePushNotifications: boolean
  logoUrl: string
  accentColor: string
}

const DEFAULT_SETTINGS: AdminSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  maxUploadSizeMb: 10,
  defaultReportType: 'weekly',
  platformName: 'AzubiHub',
  supportEmail: 'support@azubihub.de',
  invitationExpiryHours: 72,
  requireApprovalForReports: true,
  enablePushNotifications: false,
  logoUrl: '',
  accentColor: '#4285f4',
}

const SETTINGS_KEY = 'azubihub-admin-settings'
const BRANDING_KEY = 'azubihub-global-branding'

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, border: 'none',
        background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, padding: 0, fontFamily: 'inherit',
      }}
    >
      <HugeiconsIcon
        icon={value ? ToggleOnIcon : ToggleOffIcon}
        size={28}
        style={{ color: value ? '#34a853' : 'hsl(var(--muted-foreground))' }}
      />
      <span style={{ fontSize: '0.75rem', color: value ? '#34a853' : 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
        {value ? 'Aktiv' : 'Inaktiv'}
      </span>
    </button>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid hsl(var(--border))' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{label}</div>
        {description && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
    } catch { /* ignore */ }
  }, [])

  function updateSetting<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      // Also persist branding separately
      const branding = {
        name: settings.platformName,
        logoUrl: settings.logoUrl,
        accentColor: settings.accentColor,
      }
      localStorage.setItem(BRANDING_KEY, JSON.stringify(branding))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* ignore */ }
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

  if (!isMounted) return null

  return (
    <div className="flex flex-col min-h-full bg-background" style={{ fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif' }}>
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={Settings01Icon} size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">System-Einstellungen</h1>
              <p className="text-xs text-muted-foreground">Globale Konfiguration der Plattform (lokal gespeichert)</p>
            </div>
          </div>
          <Button onClick={handleSave} size="sm">
            {saved ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-2 text-green-400" />
                Gespeichert
              </>
            ) : 'Speichern'}
          </Button>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Info notice */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#4285f408', border: '1px solid #4285f420' }}>
            <HugeiconsIcon icon={InformationCircleIcon} size={16} style={{ color: '#4285f4', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0, lineHeight: 1.5 }}>
              Diese Einstellungen werden im Browser-localStorage gespeichert. Sie sind plattformweit sichtbar nur für diese Sitzung — für persistente Einstellungen eine Datenbanktabelle verwenden.
            </p>
          </div>

          {/* === Globales Branding === */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <HugeiconsIcon icon={PaintBoardIcon} size={16} style={{ color: '#4285f4' }} />
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Globales Branding
                </h2>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>
                Erscheinungsbild für Nutzer ohne Unternehmens-Zuweisung
              </p>

              <SettingRow label="Plattformname" description="Name der Plattform in Navigation und Benachrichtigungen">
                <Input
                  value={settings.platformName}
                  onChange={e => updateSetting('platformName', e.target.value)}
                  className="w-40 h-8 text-sm"
                  placeholder="AzubiHub"
                />
              </SettingRow>

              <SettingRow label="Logo-URL" description="URL zu einem Bild, das als Plattform-Logo angezeigt wird">
                <div className="flex items-center gap-2">
                  {settings.logoUrl && (
                    <div style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', overflow: 'hidden', background: 'hsl(var(--muted))' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.logoUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  <Input
                    value={settings.logoUrl}
                    onChange={e => updateSetting('logoUrl', e.target.value)}
                    className="w-52 h-8 text-sm"
                    placeholder="https://…/logo.png"
                  />
                </div>
              </SettingRow>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>Akzentfarbe</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Primärfarbe der Plattform</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={e => updateSetting('accentColor', e.target.value)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', cursor: 'pointer', padding: 2, background: 'transparent' }}
                  />
                  <Input
                    value={settings.accentColor}
                    onChange={e => updateSetting('accentColor', e.target.value)}
                    className="w-24 h-8 text-sm font-mono"
                    maxLength={7}
                    placeholder="#4285f4"
                  />
                </div>
              </div>

              {/* Branding preview */}
              <div style={{ marginTop: 14 }}>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Vorschau — Navbar</Label>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'hsl(var(--muted)/0.4)', border: '1px solid hsl(var(--border))', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {settings.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.logoUrl}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: 'hsl(var(--muted))' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: settings.accentColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '0.75rem',
                    }}>
                      {(settings.platformName || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: settings.accentColor }}>
                    {settings.platformName || 'AzubiHub'}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: settings.accentColor + '18', border: `1px solid ${settings.accentColor}30` }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: settings.accentColor }} />
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: settings.accentColor }}>Plattform</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plattform</h2>
              <SettingRow label="Plattformname" description="Name der App in Benachrichtigungen">
                <Input
                  value={settings.platformName}
                  onChange={e => updateSetting('platformName', e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </SettingRow>
              <SettingRow label="Support-E-Mail" description="Kontaktadresse für Nutzeranfragen">
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => updateSetting('supportEmail', e.target.value)}
                  className="w-48 h-8 text-sm"
                />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Feature flags */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature-Flags</h2>
              <SettingRow label="Wartungsmodus" description="Wenn aktiv, sehen Nutzer eine Wartungsseite">
                <Toggle value={settings.maintenanceMode} onChange={v => updateSetting('maintenanceMode', v)} />
              </SettingRow>
              <SettingRow label="Registrierungen zulassen" description="Neue Nutzer können sich registrieren">
                <Toggle value={settings.allowRegistration} onChange={v => updateSetting('allowRegistration', v)} />
              </SettingRow>
              <SettingRow label="Freigabe für Berichte erforderlich" description="Berichte müssen vom Ausbilder freigegeben werden">
                <Toggle value={settings.requireApprovalForReports} onChange={v => updateSetting('requireApprovalForReports', v)} />
              </SettingRow>
              <SettingRow label="Push-Benachrichtigungen" description="Browser-Benachrichtigungen aktivieren">
                <Toggle value={settings.enablePushNotifications} onChange={v => updateSetting('enablePushNotifications', v)} />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Report settings */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Berichtsheft</h2>
              <SettingRow label="Standard-Berichtstyp" description="Vorausgewählter Typ für neue Nutzer">
                <Select value={settings.defaultReportType} onValueChange={v => updateSetting('defaultReportType', v as 'daily' | 'weekly')}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Wochenbericht</SelectItem>
                    <SelectItem value="daily">Tagesbericht</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Max. Upload-Größe (MB)" description="Maximale Dateigröße für PDF-Uploads">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.maxUploadSizeMb}
                  onChange={e => updateSetting('maxUploadSizeMb', parseInt(e.target.value) || 10)}
                  className="w-20 h-8 text-sm text-center"
                />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Invitations */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Einladungen</h2>
              <SettingRow label="Einladungs-Gültigkeit (Stunden)" description="Wie lange ein Einladungslink gültig ist">
                <Input
                  type="number"
                  min={1}
                  max={720}
                  value={settings.invitationExpiryHours}
                  onChange={e => updateSetting('invitationExpiryHours', parseInt(e.target.value) || 72)}
                  className="w-24 h-8 text-sm text-center"
                />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Platform info */}
          <Card className="border rounded-2xl">
            <CardContent className="p-4">
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plattform-Info</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Framework', value: 'Next.js 15' },
                  { label: 'Datenbank', value: 'Supabase' },
                  { label: 'Umgebung', value: process.env.NODE_ENV ?? 'production' },
                  { label: 'Auth', value: 'Supabase Auth' },
                  { label: 'Storage', value: 'Supabase Storage' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'hsl(var(--muted)/0.5)', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pb-4">
            <Button onClick={handleSave}>
              {saved ? (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-2 text-green-400" />
                  Gespeichert!
                </>
              ) : 'Einstellungen speichern'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
