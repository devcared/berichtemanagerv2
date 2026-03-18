'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import type { AppModule } from '@/types'
import {
  BookOpenIcon, CheckListIcon, CalendarIcon, GridViewIcon, Logout01Icon,
  SparklesIcon, CheckmarkBadge01Icon, ArrowRight01Icon,
  Shield01Icon, CheckmarkCircle01Icon,
  Add01Icon, MinusSignIcon,
  Mail01Icon, LockPasswordIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ═══════════════════════════════════════
   APP HOME  (nach Login — unverändert)
═══════════════════════════════════════ */

const modules: AppModule[] = [
  { id: 'berichtsheft', title: 'Berichtsheft-Manager', description: 'Verwalte und exportiere deine Ausbildungsnachweise', icon: 'BookOpenIcon', accentColor: '#3B82F6', routePath: '/berichtsheft', isEnabled: true, lastUsed: new Date().toISOString() },
  { id: 'lernfeld', title: 'Lernfeld-Tracker', description: 'Behalte den Überblick über deine Lernfelder', icon: 'CheckListIcon', accentColor: '#10B981', routePath: '/lernfeld', isEnabled: false },
  { id: 'pruefung', title: 'Prüfungsvorbereitung', description: 'Bereite dich auf deine Prüfungen vor', icon: 'GridViewIcon', accentColor: '#F59E0B', routePath: '/pruefung', isEnabled: false },
  { id: 'stundenplan', title: 'Stunden- / Blockplan', description: 'Plane deine Woche in Stunden und Blöcken', icon: 'CalendarIcon', accentColor: '#8B5CF6', routePath: '/stundenplan', isEnabled: true },
]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moduleIconMap: Record<string, any> = { BookOpenIcon, CheckListIcon, GridViewIcon, CalendarIcon }
function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend'
}
function SunIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg> }
function MoonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg> }

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
    </svg>
  )
}

function AppHome() {
  const router = useRouter()
  const { profile } = useProfile()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const enabledIds = modules.filter(m => m.isEnabled).map(m => m.id)
  const [order, setOrder] = useState<string[]>(enabledIds)
  const draggedId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  useEffect(() => {
    const saved = localStorage.getItem('azubihub-module-order')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[]
        const valid = parsed.filter(id => enabledIds.includes(id))
        const missing = enabledIds.filter(id => !parsed.includes(id))
        setOrder([...valid, ...missing])
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const today = isMounted ? format(new Date(), "EEEE, d. MMMM yyyy", { locale: de }) : ''
  const greeting = `${getGreeting()}${profile ? `, ${profile.firstName}` : ''}!`
  const isDark = theme === 'dark'

  const fg = 'hsl(var(--foreground))'
  const fgMuted = 'hsl(var(--muted-foreground))'
  const bg = 'hsl(var(--background))'
  const cardBg = 'hsl(var(--card))'
  const borderC = 'hsl(var(--border))'
  const primary = isDark ? '#8ab4f8' : '#4285f4'

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : 'AZ'

  const enabledModules = order.map(id => modules.find(m => m.id === id)!).filter(Boolean)
  const comingModules = modules.filter(m => !m.isEnabled)

  function handleDragStart(id: string) { draggedId.current = id }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (draggedId.current && draggedId.current !== id) setDragOverId(id)
  }
  function handleDrop(targetId: string) {
    const fromId = draggedId.current
    if (!fromId || fromId === targetId) { draggedId.current = null; setDragOverId(null); return }
    setOrder(prev => {
      const next = [...prev]
      const fi = next.indexOf(fromId), ti = next.indexOf(targetId)
      next.splice(fi, 1); next.splice(ti, 0, fromId)
      localStorage.setItem('azubihub-module-order', JSON.stringify(next))
      return next
    })
    draggedId.current = null
    setDragOverId(null)
  }
  function handleDragEnd() { draggedId.current = null; setDragOverId(null) }

  const sharedCardProps = { isDark, cardBg, borderC, fg, fgMuted, primary }

  const navBg = isDark
    ? 'rgba(30,31,36,0.82)'
    : 'rgba(255,255,255,0.82)'

  return (
    <div style={{ minHeight: '100svh', background: bg, fontFamily: 'var(--font-outfit), sans-serif', WebkitFontSmoothing: 'antialiased', color: fg, transition: 'background 200ms, color 200ms' }}>

      {/* ══ Sticky Topbar ══ */}
      <header style={{
        position: 'sticky', top: scrolled ? 16 : 0, zIndex: 100,
        height: scrolled ? 56 : 64,
        maxWidth: scrolled ? 'min(960px, calc(100% - 2rem))' : '100%',
        margin: '0 auto',
        display: 'flex', alignItems: 'center',
        padding: scrolled ? '0 1.25rem' : '0 1.5rem',
        background: scrolled ? (isDark ? 'rgba(30,31,36,0.85)' : 'rgba(255,255,255,0.85)') : 'transparent',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: !scrolled ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` : undefined,
        borderRadius: scrolled ? 9999 : 0,
        boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.03)' : 'none',
        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{ flex: 1 }}>
          <Logo size={scrolled ? 24 : 28} />
        </div>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Theme */}
          <button
            onClick={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'}
            style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: fgMuted, transition: 'background 120ms, color 120ms', fontFamily: 'inherit', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = fg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = fgMuted }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: borderC, flexShrink: 0 }} />

          {/* Avatar pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.3125rem 0.625rem 0.3125rem 0.375rem',
            borderRadius: 9999,
            border: `1px solid ${borderC}`,
            background: 'transparent',
            cursor: 'default',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.625rem', fontWeight: 700,
              color: isDark ? '#1a1b1f' : '#fff',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <span className="hidden sm:block" style={{ fontSize: '0.8125rem', fontWeight: 500, color: fg, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Profil'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout} title="Abmelden"
            style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: fgMuted, transition: 'background 120ms, color 120ms', fontFamily: 'inherit', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,67,53,0.09)'; e.currentTarget.style.color = '#ea4335' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = fgMuted }}
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* ── Greeting ── */}
        <div style={{ paddingTop: '3rem', paddingBottom: '2.75rem' }}>
          <h1 style={{ fontSize: 'clamp(1.625rem,4vw,2.375rem)', fontWeight: 400, color: fg, lineHeight: 1.2, marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>{greeting}</h1>
          <p style={{ fontSize: '0.9375rem', color: fgMuted }}>{today}</p>
        </div>

        {/* ── Active modules ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: fgMuted, margin: 0 }}>Deine Module</p>
          <p style={{ fontSize: '0.6875rem', color: fgMuted, margin: 0 }}>Ziehen zum Anordnen</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {enabledModules.map(mod => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              icon={moduleIconMap[mod.icon]}
              {...sharedCardProps}
              draggable
              isDragOver={dragOverId === mod.id}
              onOpen={() => router.push(mod.routePath)}
              onDragStart={() => handleDragStart(mod.id)}
              onDragOver={e => handleDragOver(e, mod.id)}
              onDrop={() => handleDrop(mod.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        {/* ── Coming soon ── */}
        {comingModules.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: fgMuted, margin: 0, whiteSpace: 'nowrap' }}>Demnächst verfügbar</p>
              <div style={{ flex: 1, height: 1, background: borderC }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '4rem' }}>
              {comingModules.map(mod => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  icon={moduleIconMap[mod.icon]}
                  {...sharedCardProps}
                  draggable={false}
                  isDragOver={false}
                  onOpen={() => { }}
                  onDragStart={() => { }}
                  onDragOver={() => { }}
                  onDrop={() => { }}
                  onDragEnd={() => { }}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div style={{ borderTop: `1px solid ${borderC}`, paddingTop: '1.25rem', paddingBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: fgMuted }}>AzubiHub · Dein persönlicher Ausbildungsassistent</p>
        </div>

      </div>
    </div>
  )
}

/* ── Module card ── */
function ModuleCard({ mod, icon: I, isDark, cardBg, borderC, fg, fgMuted, primary, draggable, isDragOver, onOpen, onDragStart, onDragOver, onDrop, onDragEnd }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mod: AppModule; icon: any; isDark: boolean; cardBg: string; borderC: string
  fg: string; fgMuted: string; primary: string
  draggable: boolean; isDragOver: boolean
  onOpen: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const enabled = mod.isEnabled

  const cardShadow = isDragOver
    ? `0 0 0 2px ${primary}`
    : hovered && enabled
      ? '0 1px 2px rgba(0,0,0,0.05)'
      : 'none'

  return (
    <div
      draggable={draggable}
      onClick={() => enabled && !dragging && onOpen()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragging(true); onDragStart() }}
      onDragOver={onDragOver}
      onDrop={e => { e.preventDefault(); setDragging(false); onDrop() }}
      onDragEnd={() => { setDragging(false); onDragEnd() }}
      style={{
        border: `1px solid ${isDragOver ? primary : hovered && enabled ? primary : borderC}`,
        borderRadius: 24,
        padding: '1.75rem',
        background: isDragOver
          ? (isDark ? 'rgba(138,180,248,0.08)' : 'rgba(66,133,244,0.05)')
          : hovered && enabled
            ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.01)')
            : cardBg,
        cursor: draggable ? 'grab' : enabled ? 'pointer' : 'default',
        opacity: dragging ? 0.4 : enabled ? 1 : 0.6,
        transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: cardShadow,
        transform: hovered && enabled && !dragging ? 'translateY(-1px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >

      {/* Header row: icon + drag handle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${mod.accentColor}${isDark ? '22' : '15'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {I && <HugeiconsIcon icon={I} size={22} style={{ color: mod.accentColor }} />}
        </div>
        {draggable && (
          <div style={{
            color: hovered ? fgMuted : 'transparent',
            transition: 'color 160ms',
            cursor: 'grab', padding: '2px 0',
          }}>
            <GripIcon />
          </div>
        )}
        {!enabled && (
          <span style={{
            fontSize: '0.625rem', padding: '0.2rem 0.5625rem', borderRadius: 9999,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: fgMuted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            border: `1px solid ${borderC}`,
          }}>
            Bald
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 500, color: fg, lineHeight: 1.3, margin: '0 0 0.375rem' }}>{mod.title}</h3>
        <p style={{ fontSize: '0.8125rem', color: fgMuted, lineHeight: 1.6, margin: 0 }}>{mod.description}</p>
      </div>

      {/* CTA */}
      {enabled && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '0.75rem', borderTop: `1px solid ${borderC}`,
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: primary }}>Öffnen</span>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: hovered ? primary : `${primary}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 180ms',
          }}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} style={{ color: hovered ? (isDark ? '#202124' : '#fff') : primary }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   DESIGN TOKENS — exact antigravity.google
═══════════════════════════════════════ */

const C = {
  blue: '#4285f4',
  blueDark: '#1967d2',
  green: '#34a853',
  yellow: '#fbbc04',
  red: '#ea4335',
  purple: '#9c27b0',
  textPrimary: '#202124',
  textSec: '#5f6368',
  textLight: '#80868b',
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgDark: '#202124',
  border: '#dadce0',
}

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */

const FEATURES = [
  {
    icon: BookOpenIcon,
    title: 'Kein Papierchaos',
    desc: 'Wochenberichte digital, strukturiert und IHK-konform. Kein Drucken, kein Suchen, kein Ablegen.',
    color: C.blue,
  },
  {
    icon: SparklesIcon,
    title: '80 % weniger Aufwand',
    desc: 'Stichpunkte eingeben — Claude AI formuliert in Sekunden professionellen IHK-Text.',
    color: C.purple,
  },
  {
    icon: CheckmarkBadge01Icon,
    title: 'Ausbilder-Cockpit',
    desc: 'Alle Berichte, Freigaben und Azubis zentral. Kommentieren und freigeben — sofort.',
    color: C.green,
  },
  {
    icon: Shield01Icon,
    title: 'DSGVO & IHK-konform',
    desc: 'Verschlüsselt auf EU-Servern. PDF-Export für die IHK mit einem Klick, druckfertig.',
    color: C.red,
  },
  {
    icon: LockPasswordIcon,
    title: 'EU-Datenschutz',
    desc: 'Alle Daten bleiben auf europäischen Servern. Volle DSGVO-Compliance ohne Kompromisse.',
    color: C.yellow,
  },
  {
    icon: CalendarIcon,
    title: 'Kalender & Fristen',
    desc: 'Automatische Erinnerungen für IHK-Fristen. Kein Termin geht mehr vergessen.',
    color: C.blue,
  },
]

const STATS = [
  { value: '500+', label: 'Aktive Nutzer', color: C.blue },
  { value: '12K+', label: 'Berichte erstellt', color: C.red },
  { value: '80 %', label: 'Zeitersparnis', color: C.yellow },
  { value: '4,9 ★', label: 'Nutzerbewertung', color: C.green },
]


const TESTIMONIALS = [
  { name: 'Lena M.', role: 'Auszubildende · Fachinformatikerin', text: 'Ich tippe Stichpunkte ein und die KI macht den Rest. Absoluter Game Changer!', color: C.blue },
  { name: 'Thomas K.', role: 'Ausbilder · IT-Systemkaufmann', text: 'Endlich alle Berichte zentral. Kein E-Mail-Chaos — alles übersichtlich an einem Ort.', color: C.red },
  { name: 'Sara B.', role: 'Auszubildende · Kauffrau Büromanagement', text: 'So aufgeräumt und modern. Man merkt, dass es jemand gebaut hat, der Ausbildung kennt.', color: C.green },
  { name: 'Marcus D.', role: 'Ausbilder · Mechatronik', text: 'E-Mail schicken, Azubis sind in Minuten drin. Das Einladungssystem ist wirklich genial.', color: C.yellow },
  { name: 'Jana F.', role: 'Auszubildende · Industriekauffrau', text: 'Direkte Kommentare am Bericht — keine E-Mail-Threads mehr. Einfach direkt im System.', color: C.blue },
  { name: 'Florian R.', role: 'Ausbildungsleiter · Großbetrieb', text: '12 Azubis über AzubiHub. Die Zeitersparnis verglichen mit Papier ist wirklich enorm.', color: C.purple },
]

const FAQS = [
  { q: 'Was ist AzubiHub?', a: 'AzubiHub ist eine digitale Ausbildungsplattform, die Wochenberichte, Ausbilder-Freigaben und die gesamte Ausbildungsdokumentation digitalisiert — KI-gestützt und kostenlos.' },
  { q: 'Wie unterscheidet sich AzubiHub von anderen Tools?', a: 'AzubiHub ist speziell für die Ausbildung in Deutschland entwickelt. IHK-konform, DSGVO-sicher und dauerhaft kostenlos — kein Abo, keine versteckten Kosten.' },
  { q: 'Ist AzubiHub wirklich kostenlos?', a: 'Ja, vollständig kostenlos — für Auszubildende und Ausbilder. Der Kern bleibt dauerhaft gratis. Eine Pro-Version für Großbetriebe ist in Planung.' },
  { q: 'Wie funktioniert die KI-Formulierung?', a: 'Stichpunkte eingeben, Länge und Stil wählen — Claude AI formuliert IHK-konformen Text in Sekunden. Der fertige Bericht kann direkt eingereicht werden.' },
  { q: 'Welche Ausbildungsberufe werden unterstützt?', a: 'Alle Berufe mit wöchentlichem Ausbildungsnachweis — nahezu alle IHK- und HWK-Berufe. Der Export entspricht den offiziellen IHK-Vorgaben.' },
  { q: 'Kann mein Ausbilder die Berichte kommentieren?', a: 'Ja. Direkt am Bericht kommentieren, Revisionen anfordern oder freigeben — alles in AzubiHub, ohne E-Mail hin und her.' },
  { q: 'Sind meine Daten sicher und DSGVO-konform?', a: 'Ja. Alle Daten liegen verschlüsselt auf EU-Servern. Wir verarbeiten keine Daten außerhalb der EU und halten alle DSGVO-Anforderungen ein.' },
  { q: 'Funktioniert AzubiHub auf dem Smartphone?', a: 'Ja, vollständig responsive — läuft auf jedem Gerät im Browser. Eine native App für iOS und Android ist in Planung.' },
]

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<Element>('.g-reveal,.g-reveal-left,.g-reveal-right,.g-reveal-scale')
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('g-visible'); io.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ═══════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════ */

/* Logo — App Icon.png + wordmark */
function Logo({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  const fs = size * 0.54
  const c1 = '#4285f4'
  const c2 = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)'

  return (
    <div className="flex items-center gap-2 select-none group cursor-pointer">
      <div className="relative">
        <img src="/App Icon.png" alt="" width={size} height={size} className="rounded-xl object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none" />
      </div>
      <span className="tracking-tight font-medium transition-colors" style={{ fontSize: fs, fontFamily: 'var(--font-outfit), sans-serif', letterSpacing: '-0.025em' }}>
        <span style={{ color: c1 }}>Azubi</span>
        <span style={{ color: c2, fontWeight: 400 }}>Hub</span>
      </span>
    </div>
  )
}

/* Fixed full-screen animated background */
function FixedBackground() {
  // Dot helper — no shadows, just opacity + breathe animation
  const dot = (size: number, color: string, pos: React.CSSProperties, delay = '0s'): React.CSSProperties => ({
    position: 'absolute', width: size, height: size, borderRadius: '50%',
    background: color, animation: `dot-breathe 3s ease-in-out infinite ${delay}`,
    ...pos,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background: '#ffffff' }}>

      {/* Multi-layer center glow — no shadow, pure gradient */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80vmin', height: '80vmin', borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,0.06) 0%, rgba(52,168,83,0.025) 45%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-52%,-48%)', width: '50vmin', height: '50vmin', borderRadius: '50%', background: 'radial-gradient(circle, rgba(156,39,176,0.03) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Ring system — gentle drift wraps all rings */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'ring-drift 22s ease-in-out infinite', willChange: 'transform' }}>

        {/* Ring 1 — outermost, blue, CW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-340px,-35vmin)', marginLeft: 'min(-340px,-35vmin)', width: 'min(680px,70vmin)', height: 'min(680px,70vmin)', borderRadius: '50%', border: '1px solid rgba(66,133,244,0.13)', animation: 'orbit-cw 38s linear infinite' }}>
          <span style={dot(10, 'rgba(66,133,244,0.75)', { top: -5, left: '50%', marginLeft: -5 }, '0s')} />
          <span style={dot(5, 'rgba(66,133,244,0.35)', { bottom: -2, right: '28%' }, '1.2s')} />
          <span style={dot(4, 'rgba(66,133,244,0.2)', { top: '22%', right: -2 }, '2.1s')} />
        </div>

        {/* Ring 2 — red, CCW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-255px,-26vmin)', marginLeft: 'min(-255px,-26vmin)', width: 'min(510px,52vmin)', height: 'min(510px,52vmin)', borderRadius: '50%', border: '1px solid rgba(234,67,53,0.1)', animation: 'orbit-ccw 25s linear infinite 1.5s' }}>
          <span style={dot(8, 'rgba(234,67,53,0.7)', { bottom: -4, left: '50%', marginLeft: -4 }, '0.5s')} />
          <span style={dot(4, 'rgba(234,67,53,0.3)', { top: '18%', right: -2 }, '1.8s')} />
        </div>

        {/* Ring 3 — green, CW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-185px,-19vmin)', marginLeft: 'min(-185px,-19vmin)', width: 'min(370px,38vmin)', height: 'min(370px,38vmin)', borderRadius: '50%', border: '1px solid rgba(52,168,83,0.13)', animation: 'orbit-cw 16s linear infinite 0.7s' }}>
          <span style={dot(7, 'rgba(52,168,83,0.7)', { top: -3, right: '24%' }, '0.3s')} />
          <span style={dot(3, 'rgba(52,168,83,0.3)', { bottom: -1, left: '38%' }, '2.4s')} />
        </div>

        {/* Ring 4 — yellow, CCW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-115px,-12vmin)', marginLeft: 'min(-115px,-12vmin)', width: 'min(230px,24vmin)', height: 'min(230px,24vmin)', borderRadius: '50%', border: '1px solid rgba(251,188,4,0.18)', animation: 'orbit-ccw 10s linear infinite 0.2s' }}>
          <span style={dot(6, 'rgba(251,188,4,0.8)', { top: -3, left: '50%', marginLeft: -3 }, '1s')} />
          <span style={dot(3, 'rgba(251,188,4,0.3)', { bottom: -1, right: '32%' }, '2.7s')} />
        </div>

        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -22, marginLeft: -22, width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,0.5) 0%, rgba(66,133,244,0.15) 50%, transparent 75%)', animation: 'goog-glow-pulse 4s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, rgba(255,255,255,0.75) 80%, #ffffff 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const links = [['#features', 'Features'], ['#pricing', 'Preise'], ['#faq', 'FAQ']] as const

  useEffect(() => {
    const handleS = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleS)
    return () => window.removeEventListener('scroll', handleS)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${scrolled ? 'top-4 inset-x-4 max-w-5xl mx-auto h-14 bg-white/70 backdrop-blur-2xl border border-gray-200/20 rounded-full shadow-xl shadow-gray-200/10' : 'h-20 bg-transparent'}`}>
        <div className={`h-full flex items-center justify-between relative ${scrolled ? 'px-4' : 'max-w-7xl mx-auto px-6'}`}>

          <div className="flex-1 flex justify-start">
            <Link href="/" className="no-underline active:scale-95 transition-transform" onClick={() => setMenuOpen(false)}>
              <Logo size={scrolled ? 24 : 28} />
            </Link>
          </div>

          <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 transition-all duration-500 ${scrolled ? 'bg-white/40 p-0.5' : 'bg-transparent p-0'} rounded-full`}>
            {links.map(([href, label]) => (
              <a key={href} href={href} className={`text-[0.8125rem] font-medium text-gray-600 px-5 py-2 rounded-full hover:text-blue-600 hover:bg-white transition-all duration-300 no-underline ${scrolled ? 'text-gray-800' : 'text-gray-600'}`}>
                {label}
              </a>
            ))}
          </div>

          <div className="flex-1 flex justify-end items-center gap-2">
            {!scrolled && (
              <Link href="/auth/login" className="hidden sm:inline-flex text-[0.875rem] font-medium text-gray-500 px-4 py-2 hover:text-gray-900 transition-colors no-underline">
                Anmelden
              </Link>
            )}
            <Link href="/auth/register" className="no-underline">
              <span className={`bg-[#4285f4] hover:bg-[#1a73e8] text-white px-6 py-2 rounded-full text-[0.8125rem] font-semibold transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md ${scrolled ? 'h-10 flex items-center' : 'h-11 flex items-center'}`}>
                {scrolled ? 'Starten' : 'Loslegen'}
              </span>
            </Link>

            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className={`w-5 h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1' : ''}`} />
              <div className={`w-5 h-0.5 bg-gray-900 rounded-full mt-1.5 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <div className={`w-5 h-0.5 bg-gray-900 rounded-full mt-1.5 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-x-0 top-0 bg-white/98 backdrop-blur-2xl z-[99] md:hidden transition-all duration-500 ease-in-out border-b border-gray-200 ${menuOpen ? 'h-[100dvh] opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full pt-24 px-8 pb-12">
          <div className="flex flex-col gap-2">
            {links.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="text-4xl font-semibold text-gray-900 py-4 no-underline tracking-tight active:text-blue-600 transition-colors">
                {label}
              </a>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-4">
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-xl font-medium text-gray-500 no-underline py-4 border-t border-gray-100 text-center">
              Anmelden
            </Link>
            <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="no-underline">
              <span className="block text-center py-5 bg-[#4285f4] text-white rounded-3xl font-semibold text-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform">
                Kostenlos starten
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}


/* FAQ accordion */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', transition: 'all 200ms ease' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '1.5rem 2rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', fontSize: '1.0625rem', fontWeight: 500, color: C.textPrimary, transition: 'all 200ms ease' }}>
        <span style={{ flex: 1 }}>{q}</span>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: open ? C.blue : 'rgba(0,0,0,0.03)', color: open ? 'white' : C.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={16} />
        </span>
      </button>
      <div style={{ maxHeight: open ? '400px' : '0', opacity: open ? 1 : 0, overflow: 'hidden', transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)', padding: open ? '0 2rem 1.5rem' : '0 2rem 0' }}>
        <p style={{ color: C.textSec, lineHeight: 1.8, margin: 0, fontSize: '1rem' }}>{a}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE — exact antigravity
═══════════════════════════════════════ */
function LandingPage() {
  useScrollReveal()

  return (
    <div style={{ fontFamily: 'var(--font-outfit), sans-serif', color: C.textPrimary, WebkitFontSmoothing: 'antialiased' }}>
      <FixedBackground />
      <Nav />

      {/* ══ 1. HERO ══ */}
      <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0 80px', background: 'transparent', position: 'relative', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Eyebrow chip */}
          <div className="g-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: `1px solid ${C.border}`, borderRadius: 9999, marginBottom: '2.25rem', fontSize: '0.8125rem', fontWeight: 500, color: C.textSec, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue, display: 'inline-block', flexShrink: 0 }} />
            Ausbildungsplattform für Deutschland
          </div>

          {/* H1 */}
          <h1 className="g-reveal" style={{ fontWeight: 450, lineHeight: 1.08, marginBottom: '1.75rem', transitionDelay: '0.08s' }}>
            <span style={{ display: 'block', fontSize: 'clamp(2.75rem,5.5vw,5rem)', color: C.textPrimary, letterSpacing: '-0.01em' }}>
              Deine Ausbildung,
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', fontSize: 'clamp(2rem,4vw,3.75rem)', color: C.textSec, letterSpacing: '-0.01em' }}>
              neu gedacht.
              <span style={{ marginLeft: '0.1em', animation: 'ag-blink 1.1s step-end infinite', color: C.blue, fontWeight: 200, lineHeight: 1 }}>|</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="g-reveal" style={{ fontSize: '1.125rem', lineHeight: 1.75, color: C.textSec, maxWidth: 560, margin: '0 auto 2.75rem', transitionDelay: '0.14s' }}>
            Wochenberichte, KI-Formulierung und Ausbilder-Freigabe —
            digital, IHK-konform und dauerhaft kostenlos.
          </p>

          {/* CTAs */}
          <div className="g-reveal" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', transitionDelay: '0.2s' }}>
            <Link href="/auth/register">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: C.blue, color: 'white', borderRadius: 9999, fontWeight: 450, fontSize: '0.9375rem', cursor: 'pointer', transition: 'background 150ms ease' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = C.blueDark }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = C.blue }}>
                Kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </span>
            </Link>
            <a href="#features" style={{ textDecoration: 'none' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(8px)', color: C.textPrimary, border: `1px solid ${C.border}`, borderRadius: 9999, fontWeight: 450, fontSize: '0.9375rem', cursor: 'pointer', transition: 'border-color 150ms ease' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.borderColor = '#bdc1c6' }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.borderColor = C.border }}>
                Mehr erfahren
              </span>
            </a>
          </div>

          {/* Subtle trust line */}
          <p className="g-reveal" style={{ marginTop: '3rem', fontSize: '0.8125rem', color: C.textLight, transitionDelay: '0.26s' }}>
            DSGVO-konform &nbsp;·&nbsp; IHK-konform &nbsp;·&nbsp; KI-gestützt &nbsp;·&nbsp; 100 % kostenlos
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="g-reveal" style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transitionDelay: '0.35s' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textLight }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'goog-float4 2s ease-in-out infinite' }}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ══ 2. STATS — solid bg covers fixed animation ══ */}
      <section className="lp-section" style={{ background: C.bgSecondary, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '2.5rem' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="g-reveal" style={{ textAlign: 'center', transitionDelay: `${i * 0.08}s` }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: s.color, marginBottom: '0.375rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.9375rem', color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 3. FEATURES ══ */}
      <section id="features" className="lp-section" style={{ background: '#ffffff', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem' }}>
          <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.blue, marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>Features</p>
            <h2 style={{ fontWeight: 450, fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: C.textPrimary, marginBottom: '0.875rem', lineHeight: 1.2 }}>
              Alles, was moderne Ausbildung braucht.
            </h2>
            <p style={{ fontSize: '1.0625rem', color: C.textSec, maxWidth: 540, margin: '0 auto', lineHeight: 1.75 }}>
              Von der KI-Formulierung bis zur Ausbilder-Freigabe — in einem System.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '0' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="g-reveal"
                style={{ padding: '2.25rem 2rem', borderRadius: 8, transition: 'background 180ms ease', transitionDelay: `${i * 0.06}s`, cursor: 'default' }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = C.bgSecondary }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent' }}>
                <HugeiconsIcon icon={f.icon} size={26} style={{ color: C.blue, marginBottom: '1rem', display: 'block' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 500, color: C.textPrimary, marginBottom: '0.4rem', lineHeight: 1.4 }}>{f.title}</h3>
                <p style={{ color: C.textSec, lineHeight: 1.7, margin: 0, fontSize: '0.9375rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. ABOUT ══ */}
      <section id="how-it-works" className="lp-section" style={{ background: '#ffffff', position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <div className="g-reveal">
            <h2 style={{ fontWeight: 450, fontSize: 'clamp(2rem,4vw,3rem)', color: C.textPrimary, marginBottom: '1.5rem', lineHeight: 1.2 }}>
              Die Zukunft der Ausbildung ist da.
            </h2>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: C.textSec, marginBottom: '1.25rem' }}>
              Schluss mit Papierstapeln, verlorenen Dokumenten und unübersichtlichen E-Mail-Threads.
              AzubiHub digitalisiert jeden Schritt deiner Ausbildungsdokumentation —
              vom ersten Stichpunkt bis zum fertig signierten IHK-Bericht.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: C.textSec, marginBottom: '3rem' }}>
              Mit der integrierten Claude-KI formulierst du professionelle Wochenberichte in Minuten statt Stunden.
              Ausbilder erhalten sofortige Übersicht über alle Auszubildenden — freigeben war noch nie so einfach.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '2.5rem' }}>
            {[
              { value: '10×', label: 'Schneller als Papier' },
              { value: 'IHK', label: 'Konform & Exportierbar' },
              { value: '99,9 %', label: 'Uptime-Garantie' },
            ].map((s, i) => (
              <div key={s.label} className="g-reveal" style={{ textAlign: 'center', transitionDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: C.blue, marginBottom: '0.375rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.9375rem', color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. TESTIMONIALS ══ */}
      <section className="lp-section" style={{ background: '#ffffff', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem' }}>
          <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.blue, margin: '0 0 0.75rem' }}>Stimmen</p>
            <h2 style={{ fontWeight: 450, fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: C.textPrimary, lineHeight: 1.2 }}>Was andere sagen.</h2>
          </div>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1px', background: C.border }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="g-reveal"
                style={{ padding: '2rem', background: '#ffffff', display: 'flex', flexDirection: 'column', transition: 'background 180ms ease', transitionDelay: `${i * 0.06}s` }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = C.bgSecondary }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = '#ffffff' }}>
                <span style={{ fontSize: '3rem', lineHeight: 1, color: t.color, opacity: 0.25, marginBottom: '0.5rem', fontFamily: 'Georgia, serif', display: 'block' }}>"</span>
                <p style={{ color: C.textSec, lineHeight: 1.7, flex: 1, marginBottom: '1.5rem', fontSize: '0.9375rem' }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'white', flexShrink: 0, letterSpacing: '0.02em' }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: C.textPrimary }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: C.textLight }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. PRICING ══ */}
      <section id="pricing" className="lp-section" style={{ background: '#ffffff', borderTop: `1px solid ${C.border}`, position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem' }}>
          <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontWeight: 450, fontSize: 'clamp(2rem,4vw,3rem)', color: C.textPrimary, marginBottom: '1rem', lineHeight: 1.2 }}>Einfach. Kostenlos.</h2>
            <p style={{ fontSize: '1.125rem', color: C.textSec, maxWidth: 600, margin: '0 auto' }}>Kein Abo. Keine Kreditkarte. Keine versteckten Kosten.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
            {/* Free */}
            <div className="g-reveal"
              style={{ padding: '2.5rem', background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 24, transition: 'all 250ms ease' }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.borderColor = C.blue; el.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.borderColor = C.border; el.style.transform = '' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textLight, marginBottom: '1.25rem' }}>Basis</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 500, color: C.textPrimary, lineHeight: 1 }}>0€</span>
                <span style={{ fontSize: '0.9375rem', color: C.textSec, marginBottom: 10 }}>/ für immer</span>
              </div>
              <p style={{ fontSize: '1rem', color: C.textSec, marginBottom: '2rem', lineHeight: 1.6 }}>Alles für eine vollständige Ausbildungsdokumentation.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {['Unbegrenzte Wochenberichte', 'KI-Formulierung', 'Ausbilder-Freigabe', 'PDF-Export', 'Kalender & Fristen', 'Cloud-Sync'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9375rem', color: C.textPrimary }}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} style={{ color: C.green, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" style={{ display: 'block' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px 24px', borderRadius: 9999, border: `1.5px solid ${C.blue}`, color: C.blue, fontWeight: 500, fontSize: '1rem', cursor: 'pointer', transition: 'all 200ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.blue; el.style.color = 'white' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'transparent'; el.style.color = C.blue }}>
                  Jetzt registrieren
                </span>
              </Link>
            </div>

            {/* Pro */}
            <div className="g-reveal" style={{ borderRadius: 28, background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, padding: 2, transitionDelay: '0.1s' }}>
              <div style={{ padding: '2.5rem', background: 'white', borderRadius: 26, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.blue, margin: 0 }}>Pro</p>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: 9999, background: C.blue, color: 'white' }}>Demnächst</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 500, color: C.textPrimary, lineHeight: 1 }}>4,99€</span>
                  <span style={{ fontSize: '0.9375rem', color: C.textSec, marginBottom: 10 }}>/ Monat</span>
                </div>
                <p style={{ fontSize: '1rem', color: C.textSec, marginBottom: '2rem', lineHeight: 1.6 }}>Für Betriebe mit mehreren Auszubildenden.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {['Alles aus Kostenlos', 'Unbegrenzte KI-Nutzung', 'Team-Verwaltung (20 Azubis)', 'Vorlagen-Bibliothek', 'Prioritäts-Support', 'Native App'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9375rem', color: C.textPrimary }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} style={{ color: C.blue, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <button disabled style={{ width: '100%', padding: '14px 24px', borderRadius: 9999, background: 'rgba(0,0,0,0.04)', color: C.textLight, border: 'none', fontWeight: 500, fontSize: '1rem', cursor: 'not-allowed' }}>
                  Demnächst verfügbar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. FAQ ══ */}
      <section id="faq" className="lp-section" style={{ background: C.bgSecondary, position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem' }}>
          <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontWeight: 450, fontSize: 'clamp(2rem,4vw,3rem)', color: C.textPrimary, marginBottom: '1rem', lineHeight: 1.2 }}>Häufige Fragen</h2>
            <p style={{ fontSize: '1.125rem', color: C.textSec, maxWidth: 600, margin: '0 auto' }}>Alles, was du über AzubiHub wissen musst.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
          <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9375rem', color: C.textSec }}>
            Noch Fragen?{' '}
            <a href="mailto:kontakt@azubihub.app" style={{ color: C.blue, fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.textDecoration = 'none')}>
              Schreib uns direkt.
            </a>
          </p>
        </div>
      </section>

      {/* ══ 8. CTA ══ */}
      <section className="lp-section" style={{ background: `linear-gradient(165deg, ${C.blue} 0%, ${C.blueDark} 100%)`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative CTA background elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '120%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', transform: 'rotate(-15deg)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60%', height: '140%', background: 'radial-gradient(circle, rgba(52,168,83,0.08) 0%, transparent 60%)' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
          <div className="g-reveal">
            <h2 style={{ fontWeight: 500, fontSize: 'clamp(2.25rem,5vw,3.5rem)', color: 'white', marginBottom: '1.25rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Bereit, deine Ausbildung zu transformieren?
            </h2>
            <p style={{ fontSize: '1.1875rem', color: 'rgba(255,255,255,0.85)', marginBottom: '3rem', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 3rem' }}>
              Hunderte Betriebe haben bereits gewechselt. Der erste Bericht ist in unter 15 Minuten fertig.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/register" className="no-underline">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: 'white', color: C.blue, borderRadius: 9999, fontWeight: 600, fontSize: '1.0625rem', cursor: 'pointer', transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = 'translateY(-2px) scale(1.02)'; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = ''; el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)' }}>
                  Kostenlos registrieren
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </span>
              </Link>
              <a href="mailto:kontakt@azubihub.app" className="no-underline">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', borderRadius: 9999, fontWeight: 500, fontSize: '1.0625rem', cursor: 'pointer', transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'rgba(255,255,255,0.2)'; el.style.borderColor = 'white' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.borderColor = 'rgba(255,255,255,0.3)' }}>
                  <HugeiconsIcon icon={Mail01Icon} size={20} />
                  Kontakt aufnehmen
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: C.bgDark, color: 'white', position: 'relative' }}>

        {/* Ring animation — antigravity.google signature */}
        <div style={{ height: 'calc(14vw + 200px)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { size: 'calc(14vw + 200px)', border: 'rgba(66,133,244,0.08)', anim: 'orbit-cw 70s linear infinite' },
            { size: 'calc(10vw + 160px)', border: 'rgba(234,67,53,0.05)', anim: 'orbit-ccw 50s linear infinite 2s' },
            { size: 'calc(6vw + 110px)', border: 'rgba(52,168,83,0.07)', anim: 'orbit-cw 32s linear infinite 1s' },
            { size: 'calc(3vw + 70px)', border: 'rgba(251,188,4,0.09)', anim: 'orbit-ccw 18s linear infinite 0.5s' },
          ].map((r, i) => (
            <div key={i} style={{ position: 'absolute', width: r.size, height: r.size, borderRadius: '50%', border: `1px solid ${r.border}`, animation: r.anim }} />
          ))}
          <div style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,0.3) 0%, transparent 70%)', animation: 'goog-glow-pulse 4s ease-in-out infinite' }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem 3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '3.5rem' }} className="footer-grid">

            {/* Brand */}
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <Logo size={24} dark />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '0.9375rem', marginBottom: '1.5rem', maxWidth: 300 }}>
                Digitale Ausbildungsplattform für Deutschland. KI-gestützt, IHK-konform, kostenlos und sicher.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {[{ href: 'mailto:kontakt@azubihub.app', label: 'E-Mail' }, { href: 'https://github.com', label: 'GitHub' }].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 200ms ease', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Produkt */}
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Produkt</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[['#features', 'Features'], ['#pricing', 'Preise'], ['#faq', 'FAQ'], ['/auth/register', 'Registrieren'], ['/auth/login', 'Anmelden']].map(([href, label]) => (
                  <li key={label}>
                    <a href={href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9375rem', transition: 'color 200ms ease', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rechtliches */}
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rechtliches</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[{ href: '/impressum', label: 'Impressum' }, { href: '/datenschutz', label: 'Datenschutz' }, { href: 'mailto:kontakt@azubihub.app', label: 'Kontakt' }].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9375rem', transition: 'color 200ms ease', textDecoration: 'none' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8125rem', fontWeight: 400 }}>© {new Date().getFullYear()} AzubiHub — Digitalisierung für Auszubildende.</span>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8125rem' }}>System Status: Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════
   ROOT  (auth-aware)
═══════════════════════════════════════ */
export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <AppHome /> : <LandingPage />
}
