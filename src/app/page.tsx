'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useBranding } from '@/hooks/use-branding'
import { useAchievements } from '@/hooks/use-achievements'
import type { AppModule } from '@/types'
import {
  BookOpenIcon, CheckListIcon, CalendarIcon, GridViewIcon, Logout01Icon,
  MessageMultiple01Icon, StarAward01Icon, InboxIcon,
  FolderLockedIcon, CalendarCheckIn01Icon, Award01Icon,
  Analytics01Icon, Settings01Icon,
  Database01Icon, Crown02Icon, UserGroup02Icon, Building01Icon,
  Audit01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ── Module definitions ── */
const modules: AppModule[] = [
  { id: 'berichtsheft', title: 'Berichtsheft-Manager', description: 'Verwalte und exportiere deine Ausbildungsnachweise', icon: 'BookOpenIcon', accentColor: '#3B82F6', routePath: '/berichtsheft', isEnabled: true },
  { id: 'stundenplan', title: 'Stunden- / Blockplan', description: 'Plane deine Woche in Stunden und Blöcken', icon: 'CalendarIcon', accentColor: '#8B5CF6', routePath: '/stundenplan', isEnabled: true },
  { id: 'lernfeld', title: 'Lernfeld-Tracker', description: 'Behalte den Überblick über deine Lernfelder', icon: 'CheckListIcon', accentColor: '#10B981', routePath: '/lernfeld', isEnabled: false },
  { id: 'pruefung', title: 'Prüfungsvorbereitung', description: 'Bereite dich auf deine Prüfungen vor', icon: 'GridViewIcon', accentColor: '#F59E0B', routePath: '/pruefung', isEnabled: false },
  { id: 'forum', title: 'Forum', description: 'Stell Fragen und tausch dich mit anderen Azubis aus', icon: 'MessageMultiple01Icon', accentColor: '#06B6D4', routePath: '/forum', isEnabled: false },
  { id: 'feedback', title: 'Ausbilder-Feedback', description: 'Erhalte und verwalte Feedback von deinem Ausbilder', icon: 'StarAward01Icon', accentColor: '#F59E0B', routePath: '/feedback', isEnabled: false },
  { id: 'nachrichten', title: 'Nachrichten-Center', description: 'Alle Nachrichten und Benachrichtigungen auf einen Blick', icon: 'InboxIcon', accentColor: '#3B82F6', routePath: '/nachrichten', isEnabled: false },
  { id: 'dokumente', title: 'Dokumenten-Tresor', description: 'Sichere Ablage für wichtige Ausbildungsunterlagen', icon: 'FolderLockedIcon', accentColor: '#8B5CF6', routePath: '/dokumente', isEnabled: false },
  { id: 'termine', title: 'Termine & Fristen', description: 'Behalte Abgaben, Prüfungen und wichtige Daten im Blick', icon: 'CalendarCheckIn01Icon', accentColor: '#EA4335', routePath: '/termine', isEnabled: false },
  { id: 'achievements', title: 'Achievements & Badges', description: 'Sammle Auszeichnungen für deinen Ausbildungsfortschritt', icon: 'Award01Icon', accentColor: '#10B981', routePath: '/achievements', isEnabled: true },
  // Admin modules
  { id: 'admin-users',     title: 'Benutzerverwaltung',    description: 'Alle Nutzer, Rollen und Berechtigungen zentral verwalten',   icon: 'UserGroup02Icon', accentColor: '#4285f4', routePath: '/admin/users',     isEnabled: false, isAdmin: true },
  { id: 'admin-companies', title: 'Unternehmen verwalten', description: 'Unternehmen anlegen und Branding pro Firma konfigurieren',     icon: 'Building01Icon',  accentColor: '#0f9d58', routePath: '/admin/companies', isEnabled: false, isAdmin: true },
  { id: 'admin-roles',     title: 'Rollen & Rechte',       description: 'Zugriffsebenen und Rollenkonzepte plattformweit konfigurieren', icon: 'Crown02Icon',     accentColor: '#3c4043', routePath: '/admin/roles',     isEnabled: false, isAdmin: true },
  { id: 'admin-analytics', title: 'Plattform-Analytics',   description: 'Nutzungsstatistiken und Aktivitäten der gesamten Plattform',   icon: 'Analytics01Icon', accentColor: '#10B981', routePath: '/admin/analytics', isEnabled: false, isAdmin: true },
  { id: 'admin-audit',     title: 'Audit-Log',             description: 'Lückenlose Protokollierung aller sicherheitsrelevanten Aktionen', icon: 'Audit01Icon',   accentColor: '#F59E0B', routePath: '/admin/audit',     isEnabled: false, isAdmin: true },
  { id: 'admin-settings',  title: 'System-Einstellungen',  description: 'Globale Konfiguration, Feature-Flags und Plattform-Parameter', icon: 'Settings01Icon',  accentColor: '#8B5CF6', routePath: '/admin/settings',  isEnabled: false, isAdmin: true },
  { id: 'admin-data',      title: 'Datenbankmanager',      description: 'Datenbankstrukturen einsehen, exportieren und warten',         icon: 'Database01Icon',  accentColor: '#EA4335', routePath: '/admin/data',      isEnabled: false, isAdmin: true },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  BookOpenIcon, CheckListIcon, GridViewIcon, CalendarIcon,
  MessageMultiple01Icon, StarAward01Icon, InboxIcon,
  FolderLockedIcon, CalendarCheckIn01Icon, Award01Icon,
  Analytics01Icon, Audit01Icon, Settings01Icon,
  Database01Icon, Crown02Icon, UserGroup02Icon, Building01Icon,
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend'
}

function SunIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
}
function MoonIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
}

export default function AppHome() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const branding = useBranding()
  const { newCount: newAchievements } = useAchievements()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const isDark       = theme === 'dark'
  const primaryColor = branding.accentColor || (isDark ? '#8ab4f8' : '#4285f4')
  const isAdmin      = profile?.role === 'admin'
  const initials     = profile ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() : 'AZ'
  const greeting     = `${getGreeting()}${profile ? `, ${profile.firstName}` : ''}!`
  const todayLabel   = isMounted ? format(new Date(), "EEEE, d. MMMM yyyy", { locale: de }) : ''

  const enabledModules  = modules.filter(m => m.isEnabled && !m.isAdmin)
  const disabledModules = modules.filter(m => !m.isEnabled && !m.isAdmin)
  const adminModules    = isAdmin ? modules.filter(m => m.isAdmin) : []

  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'

  return (
    <div style={{ minHeight: '100svh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Topbar ── */}
      <header style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 clamp(1rem, 4vw, 1.5rem)', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', position: 'sticky', top: 0, zIndex: 10 }}>
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, transition: 'background 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branding.logoUrl || '/App Icon.png'} alt="AzubiHub" width={24} height={24} style={{ borderRadius: 5, objectFit: 'cover' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {branding.name !== 'AzubiHub' ? branding.name : (
              <><span style={{ color: primaryColor }}>Azubi</span><span style={{ fontWeight: 400, opacity: 0.65 }}>Hub</span></>
            )}
          </span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <button
          onClick={e => toggleTheme({ x: e.clientX, y: e.clientY })}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'background 120ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* User pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 6px', borderRadius: 9999, border: '1px solid hsl(var(--border))' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5625rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {initials}
          </div>
          <span className="hidden sm:block" style={{ fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile ? `${profile.firstName} ${profile.lastName}` : 'Profil'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Abmelden"
          style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'background 120ms, color 120ms' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,67,53,0.08)'; e.currentTarget.style.color = '#ea4335' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))' }}
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} />
        </button>
      </header>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 clamp(1rem, 4vw, 1.5rem)' }}>

        {/* No-profile banner */}
        {!profileLoading && !profile && (
          <div style={{ marginTop: '1.5rem', padding: '0.875rem 1.125rem', borderRadius: 10, background: 'rgba(234,67,53,0.08)', border: '1px solid rgba(234,67,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: '#ea4335', fontWeight: 500 }}>
              Dein Profil ist noch nicht eingerichtet.
            </span>
            <button
              onClick={() => router.push('/setup')}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#ea4335', color: 'white', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Profil einrichten
            </button>
          </div>
        )}

        {/* Greeting */}
        <div style={{ paddingTop: '1.25rem', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', fontWeight: 400, lineHeight: 1.2, marginBottom: '0.2rem', letterSpacing: '-0.01em', color: 'hsl(var(--foreground))' }}>
            {greeting}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>{todayLabel}</p>
        </div>

        {/* ── Enabled modules ── */}
        <section style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>
            Deine Module
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
            {enabledModules.map(m => {
              const Icon = iconMap[m.icon]
              const badge = isMounted && m.id === 'achievements' && newAchievements > 0 ? newAchievements : 0
              return (
                <button
                  key={m.id}
                  onClick={() => router.push(m.routePath)}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '0.75rem 1rem', borderRadius: 10,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 150ms, border-color 150ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--accent))'; e.currentTarget.style.borderColor = 'hsl(var(--border))' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--card))'; e.currentTarget.style.borderColor = 'hsl(var(--border))' }}
                >
                  {badge > 0 && (
                    <div style={{
                      position: 'absolute', top: -6, right: -6,
                      minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9999,
                      background: '#ea4335', border: '2px solid hsl(var(--background))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.5625rem', fontWeight: 800, color: 'white', lineHeight: 1,
                    }}>{badge}</div>
                  )}
                  {Icon && (
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: m.accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HugeiconsIcon icon={Icon} size={19} style={{ color: m.accentColor }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '0.15rem' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Admin modules ── */}
        {adminModules.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>
              Administration
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
              {adminModules.map(m => {
                const Icon = iconMap[m.icon]
                return (
                  <button
                    key={m.id}
                    onClick={() => router.push(m.routePath)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '0.75rem 1rem', borderRadius: 10,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 150ms',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--card))')}
                  >
                    {Icon && (
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: m.accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HugeiconsIcon icon={Icon} size={19} style={{ color: m.accentColor }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', marginBottom: '0.15rem' }}>{m.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Coming soon modules ── */}
        {disabledModules.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.625rem' }}>
              Bald verfügbar
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {disabledModules.map(m => {
                const Icon = iconMap[m.icon]
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 9999,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      opacity: 0.55,
                    }}
                  >
                    {Icon && <HugeiconsIcon icon={Icon} size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />}
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>{m.title}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
