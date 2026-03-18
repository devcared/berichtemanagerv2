'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface NavItem { label: string; href: string; icon: any; trainerOnly?: boolean }
export interface NavSection { title?: string; items: NavItem[] }

/* ── Inline SVG icons ── */
function SunIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> }
function MoonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> }
function MenuIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function CloseIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

interface Props {
  children: React.ReactNode
  sections: NavSection[]
  subtitle: string
}

export default function DashboardLayout({ children, sections, subtitle }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { profile } = useProfile()
  const { logout }  = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Close mobile menu on route change
  React.useEffect(() => { setMobileOpen(false) }, [pathname])

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : 'AZ'

  const isDark       = theme === 'dark'
  const primaryColor = isDark ? '#8ab4f8' : '#4285f4'
  const activeBg     = isDark ? 'rgba(138,180,248,0.14)' : 'rgba(66,133,244,0.10)'
  const hoverBg      = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'

  function isActive(item: NavItem): boolean {
    const isRoot = item.href === '/berichtsheft' || item.href === '/stundenplan'
    return isRoot ? pathname === item.href : pathname.startsWith(item.href)
  }

  /* ── Sidebar JSX (reused for desktop + mobile overlay) ── */
  const sidebarJSX = (
    <aside
      style={{
        width: 256,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(var(--sidebar))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
        fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif',
      }}
    >
      {/* Logo / App title */}
      <div style={{ padding: '1rem 0.875rem 0.875rem', borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <button
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '0.375rem 0.5rem', width: '100%', transition: 'background 120ms', fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/App Icon.png" alt="AzubiHub" width={30} height={30} style={{ borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ textAlign: 'left', lineHeight: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--sidebar-foreground))', marginBottom: 2 }}>AzubiHub</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{subtitle}</div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem 0' }}>
        {sections.map((section, si) => {
          const visible = section.items.filter(i => !i.trainerOnly || profile?.role === 'trainer')
          if (!visible.length) return null
          return (
            <div key={si} style={{ marginBottom: '0.875rem' }}>
              {section.title && (
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', padding: '0 0.625rem 0.375rem', margin: 0 }}>
                  {section.title}
                </p>
              )}
              {visible.map(item => {
                const active = isActive(item)
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '0.5625rem 0.75rem', borderRadius: 8, border: 'none',
                      background: active ? activeBg : 'transparent',
                      color: active ? primaryColor : 'hsl(var(--sidebar-foreground))',
                      fontSize: '0.875rem', fontWeight: active ? 500 : 400,
                      cursor: 'pointer', transition: 'background 100ms', textAlign: 'left',
                      fontFamily: 'inherit', marginBottom: 2,
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? activeBg : 'transparent' }}
                  >
                    <HugeiconsIcon icon={item.icon} size={17} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer — user, theme, logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid hsl(var(--sidebar-border))', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5625rem 0.75rem', borderRadius: 8, border: 'none', background: 'transparent', color: 'hsl(var(--sidebar-foreground))', fontSize: '0.875rem', cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit', width: '100%' }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5625rem 0.75rem', borderRadius: 8, border: 'none', background: 'transparent', color: 'hsl(var(--destructive))', fontSize: '0.875rem', cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit', width: '100%' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,67,53,0.09)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <HugeiconsIcon icon={Logout01Icon} size={17} style={{ flexShrink: 0 }} />
          <span>Abmelden</span>
        </button>

        {/* User profile */}
        <button
          onClick={() => router.push('/berichtsheft/profil')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5625rem 0.75rem', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit', width: '100%', marginTop: 4, borderTop: '1px solid hsl(var(--sidebar-border))', paddingTop: '0.875rem' }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', flexShrink: 0, letterSpacing: '0.03em' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--sidebar-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Kein Profil'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.occupation ?? 'Profil einrichten'}
            </div>
          </div>
        </button>
      </div>
    </aside>
  )

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100svh',
        background: 'hsl(var(--background))',
        fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif',
        WebkitFontSmoothing: 'antialiased',
        color: 'hsl(var(--foreground))',
      }}
    >
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:block" style={{ width: 256, flexShrink: 0, position: 'sticky', top: 0, height: '100svh' }}>
        {sidebarJSX}
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
          onClick={() => setMobileOpen(false)}
        >
          <div style={{ width: 256, height: '100%', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {sidebarJSX}
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }} />
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top header */}
        <header
          style={{
            height: 56, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 1.5rem',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
            position: 'sticky', top: 0, zIndex: 10,
          }}
        >
          {/* Mobile: hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 120ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Mobile: logo */}
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/App Icon.png" alt="" width={22} height={22} style={{ borderRadius: 5, objectFit: 'cover' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>AzubiHub</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme toggle — always visible in header */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 120ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User avatar (desktop only) */}
          <button
            className="hidden md:flex"
            onClick={() => router.push('/berichtsheft/profil')}
            style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, border: 'none', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', transition: 'opacity 150ms', letterSpacing: '0.03em', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {initials}
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
