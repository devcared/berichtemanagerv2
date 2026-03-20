'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useBranding } from '@/hooks/use-branding'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon, ChevronLeft, ChevronRight } from '@hugeicons/core-free-icons'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface NavItem { label: string; href: string; icon: any; trainerOnly?: boolean; adminOnly?: boolean }
export interface NavSection { title?: string; items: NavItem[] }

interface Props {
  children: React.ReactNode
  sections: NavSection[]
  subtitle: string
}

const SEGMENT_LABELS: Record<string, string> = {
  berichtsheft: 'Berichtsheft',
  stundenplan:  'Stundenplan',
  kalender:     'Kalender',
  statistiken:  'Statistiken',
  profil:       'Profil',
  editor:       'Berichts-Editor',
  ausbilder:    'Ausbilder',
  verwaltung:   'Verwaltung',
  vorlagen:     'Vorlagen',
  admin:        'Admin',
  users:        'Benutzer',
  analytics:    'Analytics',
  audit:        'Audit-Log',
  roles:        'Rollen & Rechte',
  settings:     'Einstellungen',
  data:         'Datenbank',
  unternehmen:  'Unternehmen',
  chat:         'Team-Chat',
  feedback:     'Feedback',
  companies:    'Unternehmen',
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

const SIDEBAR_W = 240
const SIDEBAR_COLLAPSED = 56

export default function DashboardLayout({ children, sections, subtitle }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { profile } = useProfile()
  const { logout }  = useAuth()
  const { theme, toggleTheme } = useTheme()
  const branding = useBranding()

  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed,  setCollapsed]  = React.useState(false)

  React.useEffect(() => { setMobileOpen(false) }, [pathname])

  const isDark       = theme === 'dark'
  const primaryColor = branding.accentColor || (isDark ? '#8ab4f8' : '#4285f4')
  const activeBg     = primaryColor + '18'
  const hoverBg      = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'

  const initials  = profile ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() : 'AZ'
  const roleLabel = profile?.role === 'trainer' ? 'Ausbilder' : profile?.role === 'admin' ? 'Administrator' : 'Auszubildender'

  function filterItems(items: NavItem[]) {
    return items.filter(i => {
      if (i.adminOnly)   return profile?.role === 'admin'
      if (i.trainerOnly) return profile?.role === 'trainer' || profile?.role === 'admin'
      return true
    })
  }

  function isActive(item: NavItem): boolean {
    if (item.href === '/') return pathname === '/'
    const isExact = item.href === '/berichtsheft' || item.href === '/stundenplan'
    return isExact ? pathname === item.href : pathname.startsWith(item.href)
  }

  const segments     = pathname.split('/').filter(Boolean)
  const currentLabel = segments.length === 0
    ? 'Übersicht'
    : SEGMENT_LABELS[segments[segments.length - 1]] ?? segments[segments.length - 1]

  const mobileNavItems = filterItems(sections[0]?.items ?? []).slice(0, 4)

  /* ── Sidebar content (shared desktop + mobile) ── */
  function SidebarContent({ forMobile = false }: { forMobile?: boolean }) {
    const isCollapsed = forMobile ? false : collapsed

    return (
      <aside style={{
        width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(var(--sidebar))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
        transition: 'width 200ms ease',
        overflow: 'hidden',
        fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif',
      }}>

        {/* ── Logo row ── */}
        <div style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--sidebar-border))',
          padding: isCollapsed ? '0' : '0 8px',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: 4,
        }}>
          <button
<<<<<<< HEAD
            onClick={() => isCollapsed && !forMobile ? setCollapsed(false) : router.push('/')}
            title={isCollapsed ? 'Sidebar öffnen' : 'Zur Übersicht'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '0.25rem 0.375rem', transition: 'background 120ms', fontFamily: 'inherit', overflow: 'hidden', flex: isCollapsed ? undefined : 1, minWidth: 0 }}
=======
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderRadius: 8, padding: isCollapsed ? '6px' : '6px 8px',
              transition: 'background 150ms', fontFamily: 'inherit',
              overflow: 'hidden', flex: isCollapsed ? undefined : 1, minWidth: 0,
            }}
>>>>>>> c7e38c75d92a41da0e090cad901c0eb81b72169b
            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl || '/App Icon.png'}
              alt="AzubiHub"
              width={isCollapsed ? 30 : 26}
              height={isCollapsed ? 30 : 26}
              style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0, transition: 'width 200ms, height 200ms' }}
            />
            {!isCollapsed && (
              <div style={{ lineHeight: 1.2, overflow: 'hidden', textAlign: 'left' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', color: 'hsl(var(--sidebar-foreground))' }}>
                  {branding.name !== 'AzubiHub' ? branding.name : (
                    <><span style={{ color: primaryColor }}>Azubi</span><span style={{ fontWeight: 400, color: 'hsl(var(--sidebar-foreground) / 0.65)' }}>Hub</span></>
                  )}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                  {subtitle}
                </div>
              </div>
            )}
          </button>

<<<<<<< HEAD
          {/* Collapse toggle in logo row — Google Workspace style */}
=======
>>>>>>> c7e38c75d92a41da0e090cad901c0eb81b72169b
          {!isCollapsed && !forMobile && (
            <button
              onClick={() => setCollapsed(true)}
              title="Sidebar minimieren"
<<<<<<< HEAD
              style={iconBtn({ width: 28, height: 28, borderRadius: 6, flexShrink: 0 })}
              onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronLeft />
=======
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', flexShrink: 0, transition: 'background 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <HugeiconsIcon icon={ChevronLeft} size={15} />
>>>>>>> c7e38c75d92a41da0e090cad901c0eb81b72169b
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isCollapsed ? '8px 0' : '10px 8px 0' }}>
          {sections.map((section, si) => {
            const visible = filterItems(section.items)
            if (!visible.length) return null
            return (
              <div key={si} style={{ marginBottom: 4 }}>
                {section.title && !isCollapsed && (
                  <p style={{
                    fontSize: '0.6875rem', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'hsl(var(--muted-foreground))',
                    padding: '0 10px 4px', margin: '8px 0 2px',
                    userSelect: 'none',
                  }}>
                    {section.title}
                  </p>
                )}
                {isCollapsed && si > 0 && (
                  <div style={{ height: 1, background: 'hsl(var(--sidebar-border))', margin: '4px 12px 6px' }} />
                )}
                {visible.map(item => {
                  const active = isActive(item)
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      title={isCollapsed ? item.label : undefined}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: isCollapsed ? 0 : 10,
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        padding: isCollapsed ? '10px 0' : '9px 10px',
                        borderRadius: isCollapsed ? 0 : 8,
                        border: 'none',
                        background: active ? activeBg : 'transparent',
                        color: active ? primaryColor : 'hsl(var(--sidebar-foreground))',
                        fontSize: '0.875rem', fontWeight: active ? 500 : 400,
                        cursor: 'pointer', transition: 'background 100ms',
                        fontFamily: 'inherit', marginBottom: 2,
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <HugeiconsIcon icon={item.icon} size={isCollapsed ? 20 : 18} style={{ flexShrink: 0 }} />
                      {!isCollapsed && (
                        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{
          flexShrink: 0, borderTop: '1px solid hsl(var(--sidebar-border))',
          padding: isCollapsed ? '8px 0' : '8px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {/* Theme toggle */}
          <button
            onClick={e => toggleTheme({ x: e.clientX, y: e.clientY })}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: isCollapsed ? 0 : 10,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px 0' : '9px 10px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: 'hsl(var(--sidebar-foreground))', fontSize: '0.875rem',
              cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {!isCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title={isCollapsed ? 'Abmelden' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: isCollapsed ? 0 : 10,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px 0' : '9px 10px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: 'hsl(var(--destructive))', fontSize: '0.875rem',
              cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,67,53,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <HugeiconsIcon icon={Logout01Icon} size={isCollapsed ? 20 : 18} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>Abmelden</span>}
          </button>

          {/* User info */}
          <div style={{ paddingTop: 8, borderTop: '1px solid hsl(var(--sidebar-border))', marginTop: 4 }}>
            {isCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => router.push('/berichtsheft/profil')}
                  title={profile ? `${profile.firstName} ${profile.lastName}` : 'Profil'}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: primaryColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', transition: 'opacity 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {initials}
                </button>
                {!forMobile && (
                  <button
                    onClick={() => setCollapsed(false)}
                    title="Sidebar öffnen"
                    style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'background 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <HugeiconsIcon icon={ChevronRight} size={15} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/berichtsheft/profil')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  transition: 'background 100ms', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--sidebar-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile ? `${profile.firstName} ${profile.lastName}` : 'Kein Profil'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {roleLabel}
                  </div>
<<<<<<< HEAD
                </button>
              </div>
=======
                </div>
              </button>
>>>>>>> c7e38c75d92a41da0e090cad901c0eb81b72169b
            )}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100svh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:block" style={{ flexShrink: 0, position: 'sticky', top: 0, height: '100svh', width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W, transition: 'width 200ms ease' }}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} onClick={() => setMobileOpen(false)}>
          <div style={{ flexShrink: 0, height: '100%' }} onClick={e => e.stopPropagation()}>
            <SidebarContent forMobile />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', position: 'sticky', top: 0, zIndex: 10, padding: '0 16px' }}>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 120ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <MenuIcon />
          </button>

          {/* Current page label */}
          <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentLabel}
          </span>

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <button
            onClick={e => toggleTheme({ x: e.clientX, y: e.clientY })}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 120ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Avatar (desktop) */}
          <button
            className="hidden md:flex"
            onClick={() => router.push('/berichtsheft/profil')}
            style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, border: 'none', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', transition: 'opacity 150ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {initials}
          </button>
        </header>

        {/* Content */}
        <main className="pb-16 md:pb-0" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, height: 60, background: 'hsl(var(--background))', borderTop: '1px solid hsl(var(--border))', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {mobileNavItems.map(item => {
          const active = isActive(item)
          return (
            <button
              key={item.href}
              onClick={() => { router.push(item.href); setMobileOpen(false) }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none', cursor: 'pointer', padding: 0, background: 'transparent', color: active ? primaryColor : 'hsl(var(--muted-foreground))', transition: 'color 150ms', position: 'relative' }}
            >
              {active && (
                <span style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: primaryColor, borderRadius: '0 0 3px 3px' }} />
              )}
              <HugeiconsIcon icon={item.icon} size={20} />
              <span style={{ fontSize: '0.5625rem', fontWeight: active ? 600 : 500, letterSpacing: '0.03em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </button>
          )
        })}

        {/* Profile button */}
        <button
          onClick={() => { router.push('/berichtsheft/profil'); setMobileOpen(false) }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none', cursor: 'pointer', padding: 0, background: 'transparent', color: 'hsl(var(--muted-foreground))' }}
        >
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: 'white' }}>
            {initials}
          </div>
          <span style={{ fontSize: '0.5625rem', fontWeight: 500, letterSpacing: '0.03em', lineHeight: 1 }}>Profil</span>
        </button>
      </nav>
    </div>
  )
}
