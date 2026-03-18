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

/* ── SVG icons ── */
function SunIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> }
function MoonIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> }
function MenuIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function CloseIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function ChevronLeft()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function ChevronRight() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }

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
  editor:       'Editor',
  ausbilder:    'Ausbilder',
  verwaltung:   'Verwaltung',
  vorlagen:     'Vorlagen',
}

function Breadcrumb({ pathname, onNavigate }: { pathname: string; onNavigate: (href: string) => void }) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg,
    href:  '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && (
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8125rem', userSelect: 'none', flexShrink: 0 }}>›</span>
          )}
          {crumb.isLast ? (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(crumb.href)}
              style={{ fontSize: '0.875rem', fontWeight: 400, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, transition: 'color 120ms, background 120ms', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--foreground))'; e.currentTarget.style.background = 'hsl(var(--accent))' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.background = 'transparent' }}
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

const SIDEBAR_FULL      = 256
const SIDEBAR_COLLAPSED = 60

export default function DashboardLayout({ children, sections, subtitle }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { profile } = useProfile()
  const { logout }  = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed,  setCollapsed]  = React.useState(false)

  React.useEffect(() => { setMobileOpen(false) }, [pathname])

  const initials     = profile ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() : 'AZ'
  const isDark       = theme === 'dark'
  const primaryColor = isDark ? '#8ab4f8' : '#4285f4'
  const activeBg     = isDark ? 'rgba(138,180,248,0.14)' : 'rgba(66,133,244,0.10)'
  const hoverBg      = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'

  function isActive(item: NavItem): boolean {
    if (item.href === '/') return false
    const isExact = item.href === '/berichtsheft' || item.href === '/stundenplan'
    return isExact ? pathname === item.href : pathname.startsWith(item.href)
  }

  /* ── Shared icon-button style ── */
  const iconBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 8, border: 'none',
    background: 'transparent', cursor: 'pointer', transition: 'background 120ms',
    color: 'hsl(var(--sidebar-foreground))', flexShrink: 0, fontFamily: 'inherit',
    ...extra,
  })

  /* ── Sidebar inner content (shared between desktop + mobile) ── */
  function SidebarInner({ forMobile = false }: { forMobile?: boolean }) {
    const isCollapsed = forMobile ? false : collapsed

    return (
      <aside style={{
        width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL,
        height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'hsl(var(--sidebar))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif',
      }}>

        {/* ── Logo row ── */}
        <div style={{
          padding: isCollapsed ? '0.875rem 0' : '0.875rem 0.75rem',
          borderBottom: '1px solid hsl(var(--sidebar-border))',
          display: 'flex', alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: 6, minHeight: 56,
        }}>
          <button
            onClick={() => router.push('/')}
            title="Zur Übersicht"
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '0.25rem 0.375rem', transition: 'background 120ms', fontFamily: 'inherit', overflow: 'hidden', flex: isCollapsed ? undefined : 1, minWidth: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/App Icon.png" alt="AzubiHub"
              width={isCollapsed ? 36 : 28}
              height={isCollapsed ? 36 : 28}
              style={{ borderRadius: isCollapsed ? 10 : 6, objectFit: 'cover', flexShrink: 0, transition: 'width 220ms, height 220ms, border-radius 220ms' }}
            />
            {!isCollapsed && (
              <div style={{ textAlign: 'left', lineHeight: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--sidebar-foreground))', whiteSpace: 'nowrap' }}>AzubiHub</div>
                <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>{subtitle}</div>
              </div>
            )}
          </button>
        </div>

        {/* ── Navigation ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isCollapsed ? '0.625rem 0' : '0.75rem 0.75rem 0' }}>
          {sections.map((section, si) => {
            const visible = section.items.filter(i => !i.trainerOnly || profile?.role === 'trainer')
            if (!visible.length) return null
            return (
              <div key={si} style={{ marginBottom: '0.75rem' }}>
                {section.title && !isCollapsed && (
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', padding: '0 0.625rem 0.375rem', margin: 0, whiteSpace: 'nowrap' }}>
                    {section.title}
                  </p>
                )}
                {isCollapsed && si > 0 && (
                  <div style={{ height: 1, background: 'hsl(var(--sidebar-border))', margin: '0.375rem 10px 0.625rem' }} />
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
                        padding: isCollapsed ? '0.625rem 0' : '0.5625rem 0.75rem',
                        borderRadius: isCollapsed ? 0 : 8,
                        border: 'none',
                        background: active ? activeBg : 'transparent',
                        color: active ? primaryColor : 'hsl(var(--sidebar-foreground))',
                        fontSize: '0.875rem', fontWeight: active ? 500 : 400,
                        cursor: 'pointer', transition: 'background 100ms',
                        fontFamily: 'inherit', marginBottom: isCollapsed ? 0 : 2,
                        overflow: 'hidden',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? activeBg : 'transparent' }}
                    >
                      <HugeiconsIcon icon={item.icon} size={isCollapsed ? 19 : 17} style={{ flexShrink: 0 }} />
                      {!isCollapsed && (
                        <>
                          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                          {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />}
                        </>
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
          padding: isCollapsed ? '0.625rem 0' : '0.75rem',
          borderTop: '1px solid hsl(var(--sidebar-border))',
          display: 'flex', flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'stretch',
          gap: isCollapsed ? 4 : 2,
        }}>
          {/* Theme */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            style={isCollapsed
              ? iconBtn({ width: 36, height: 36 })
              : { display: 'flex', alignItems: 'center', gap: 10, padding: '0.5625rem 0.75rem', borderRadius: 8, border: 'none', background: 'transparent', color: 'hsl(var(--sidebar-foreground))', fontSize: '0.875rem', cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit', width: '100%' }
            }
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
            style={isCollapsed
              ? iconBtn({ width: 36, height: 36, color: 'hsl(var(--destructive))' })
              : { display: 'flex', alignItems: 'center', gap: 10, padding: '0.5625rem 0.75rem', borderRadius: 8, border: 'none', background: 'transparent', color: 'hsl(var(--destructive))', fontSize: '0.875rem', cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit', width: '100%' }
            }
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,67,53,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <HugeiconsIcon icon={Logout01Icon} size={isCollapsed ? 19 : 17} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>Abmelden</span>}
          </button>

          {/* User + Collapse toggle */}
          <div style={{ marginTop: 4, borderTop: '1px solid hsl(var(--sidebar-border))', paddingTop: '0.625rem' }}>
            {isCollapsed ? (
              /* ── Collapsed: avatar centered, toggle below ── */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => router.push('/berichtsheft/profil')}
                  title={profile ? `${profile.firstName} ${profile.lastName}` : 'Profil'}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: primaryColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', transition: 'opacity 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {initials}
                </button>
                {!forMobile && (
                  <button
                    onClick={() => setCollapsed(false)}
                    title="Sidebar öffnen"
                    style={iconBtn({ width: 30, height: 30, borderRadius: 6 })}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ChevronRight />
                  </button>
                )}
              </div>
            ) : (
              /* ── Expanded: avatar + info + collapse arrow ── */
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => router.push('/berichtsheft/profil')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.625rem', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 100ms', fontFamily: 'inherit', flex: 1, minWidth: 0 }}
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
                      {profile?.occupation ?? 'Profil einrichten'}
                    </div>
                  </div>
                </button>
                {!forMobile && (
                  <button
                    onClick={() => setCollapsed(true)}
                    title="Sidebar minimieren"
                    style={iconBtn({ width: 28, height: 28, borderRadius: 6, flexShrink: 0 })}
                    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ChevronLeft />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: 'hsl(var(--background))', fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif', WebkitFontSmoothing: 'antialiased', color: 'hsl(var(--foreground))' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:block" style={{ flexShrink: 0, position: 'sticky', top: 0, height: '100svh', width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL, transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)' }}>
        <SidebarInner />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} onClick={() => setMobileOpen(false)}>
          <div style={{ flexShrink: 0, height: '100%' }} onClick={e => e.stopPropagation()}>
            <SidebarInner forMobile />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }} />
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 1.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', position: 'sticky', top: 0, zIndex: 10 }}>

          {/* Hamburger — mobile only (no inline display to avoid override) */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 120ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Breadcrumb — always visible */}
          <Breadcrumb pathname={pathname} onNavigate={href => router.push(href)} />

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--foreground))', transition: 'background 120ms', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User avatar desktop */}
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

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
