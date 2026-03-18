'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
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
function AppHome() {
  const router = useRouter()
  const { profile } = useProfile()
  const { logout } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])
  const today = isMounted ? format(new Date(), "EEEE, d. MMMM yyyy", { locale: de }) : ''
  const greeting = `${getGreeting()}${profile ? `, ${profile.firstName}` : ''}!`
  const textPrimary = '#202124'
  const textSec     = '#5f6368'
  const textLight   = '#80868b'
  const border      = '#dadce0'

  return (
    <div style={{ minHeight: '100svh', background: '#ffffff', fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif', WebkitFontSmoothing: 'antialiased', color: textPrimary }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/App Icon.png" alt="AzubiHub" width={28} height={28} style={{ borderRadius: 6, display: 'block', objectFit: 'cover' }} />
            <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em', color: textPrimary }}>
              Azubi<span style={{ color: textSec }}>Hub</span>
            </span>
          </div>
          <button
            onClick={() => logout()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', border: `1px solid ${border}`, borderRadius: 9999, background: 'none', color: textSec, fontSize: '0.875rem', cursor: 'pointer', transition: 'border-color 150ms ease', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#bdc1c6')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
          >
            <HugeiconsIcon icon={Logout01Icon} size={15} />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </header>

        {/* Greeting */}
        <div style={{ paddingTop: '3rem', paddingBottom: '2.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 450, color: textPrimary, lineHeight: 1.2, marginBottom: '0.375rem' }}>{greeting}</h1>
          <p style={{ fontSize: '0.9375rem', color: textSec }}>{today}</p>
        </div>

        {/* Module label */}
        <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: textSec, marginBottom: '1rem' }}>Module</p>

        {/* Module cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem', marginBottom: '4rem' }}>
          {modules.map(mod => {
            const I = moduleIconMap[mod.icon]
            return (
              <div
                key={mod.id}
                onClick={() => mod.isEnabled && router.push(mod.routePath)}
                style={{ border: `1px solid ${border}`, borderTop: `3px solid ${mod.isEnabled ? mod.accentColor : border}`, borderRadius: 8, padding: '1.5rem', background: '#ffffff', cursor: mod.isEnabled ? 'pointer' : 'not-allowed', opacity: mod.isEnabled ? 1 : 0.55, transition: 'transform 200ms ease, border-color 200ms ease' }}
                onMouseEnter={e => { if (mod.isEnabled) { e.currentTarget.style.transform = 'translateY(-2px)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: `${mod.accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {I && <HugeiconsIcon icon={I} size={20} style={{ color: mod.accentColor }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 500, color: textPrimary }}>{mod.title}</h3>
                      {!mod.isEnabled && (
                        <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: 9999, background: '#f1f3f4', color: textSec, fontWeight: 500, flexShrink: 0 }}>
                          Bald verfügbar
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: textSec, lineHeight: 1.6, margin: 0 }}>{mod.description}</p>
                    {mod.isEnabled && mod.lastUsed && (
                      <p style={{ fontSize: '0.75rem', color: textLight, marginTop: '0.5rem', marginBottom: 0 }}>Zuletzt genutzt heute</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer line */}
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: '1.5rem', paddingBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', color: textLight }}>AzubiHub · Dein persönlicher Ausbildungsassistent</p>
        </div>


      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   DESIGN TOKENS — exact antigravity.google
═══════════════════════════════════════ */

const C = {
  blue:        '#4285f4',
  blueDark:    '#1967d2',
  green:       '#34a853',
  yellow:      '#fbbc04',
  red:         '#ea4335',
  purple:      '#9c27b0',
  textPrimary: '#202124',
  textSec:     '#5f6368',
  textLight:   '#80868b',
  bgPrimary:   '#ffffff',
  bgSecondary: '#f8f9fa',
  bgDark:      '#202124',
  border:      '#dadce0',
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
  { value: '500+',  label: 'Aktive Nutzer',    color: C.blue   },
  { value: '12K+',  label: 'Berichte erstellt', color: C.red    },
  { value: '80 %',  label: 'Zeitersparnis',     color: C.yellow },
  { value: '4,9 ★', label: 'Nutzerbewertung',   color: C.green  },
]


const TESTIMONIALS = [
  { name: 'Lena M.',    role: 'Auszubildende · Fachinformatikerin',      text: 'Ich tippe Stichpunkte ein und die KI macht den Rest. Absoluter Game Changer!',             color: C.blue   },
  { name: 'Thomas K.',  role: 'Ausbilder · IT-Systemkaufmann',           text: 'Endlich alle Berichte zentral. Kein E-Mail-Chaos — alles übersichtlich an einem Ort.',      color: C.red    },
  { name: 'Sara B.',    role: 'Auszubildende · Kauffrau Büromanagement', text: 'So aufgeräumt und modern. Man merkt, dass es jemand gebaut hat, der Ausbildung kennt.',      color: C.green  },
  { name: 'Marcus D.',  role: 'Ausbilder · Mechatronik',                 text: 'E-Mail schicken, Azubis sind in Minuten drin. Das Einladungssystem ist wirklich genial.',   color: C.yellow },
  { name: 'Jana F.',    role: 'Auszubildende · Industriekauffrau',       text: 'Direkte Kommentare am Bericht — keine E-Mail-Threads mehr. Einfach direkt im System.',      color: C.blue   },
  { name: 'Florian R.', role: 'Ausbildungsleiter · Großbetrieb',         text: '12 Azubis über AzubiHub. Die Zeitersparnis verglichen mit Papier ist wirklich enorm.',       color: C.purple },
]

const FAQS = [
  { q: 'Was ist AzubiHub?',                                  a: 'AzubiHub ist eine digitale Ausbildungsplattform, die Wochenberichte, Ausbilder-Freigaben und die gesamte Ausbildungsdokumentation digitalisiert — KI-gestützt und kostenlos.' },
  { q: 'Wie unterscheidet sich AzubiHub von anderen Tools?', a: 'AzubiHub ist speziell für die Ausbildung in Deutschland entwickelt. IHK-konform, DSGVO-sicher und dauerhaft kostenlos — kein Abo, keine versteckten Kosten.' },
  { q: 'Ist AzubiHub wirklich kostenlos?',                   a: 'Ja, vollständig kostenlos — für Auszubildende und Ausbilder. Der Kern bleibt dauerhaft gratis. Eine Pro-Version für Großbetriebe ist in Planung.' },
  { q: 'Wie funktioniert die KI-Formulierung?',              a: 'Stichpunkte eingeben, Länge und Stil wählen — Claude AI formuliert IHK-konformen Text in Sekunden. Der fertige Bericht kann direkt eingereicht werden.' },
  { q: 'Welche Ausbildungsberufe werden unterstützt?',       a: 'Alle Berufe mit wöchentlichem Ausbildungsnachweis — nahezu alle IHK- und HWK-Berufe. Der Export entspricht den offiziellen IHK-Vorgaben.' },
  { q: 'Kann mein Ausbilder die Berichte kommentieren?',     a: 'Ja. Direkt am Bericht kommentieren, Revisionen anfordern oder freigeben — alles in AzubiHub, ohne E-Mail hin und her.' },
  { q: 'Sind meine Daten sicher und DSGVO-konform?',         a: 'Ja. Alle Daten liegen verschlüsselt auf EU-Servern. Wir verarbeiten keine Daten außerhalb der EU und halten alle DSGVO-Anforderungen ein.' },
  { q: 'Funktioniert AzubiHub auf dem Smartphone?',          a: 'Ja, vollständig responsive — läuft auf jedem Gerät im Browser. Eine native App für iOS und Android ist in Planung.' },
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
  const hubColor = dark ? 'rgba(255,255,255,0.55)' : C.textSec
  const fs = size * 0.57
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.38 }}>
      {/* App icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/App Icon.png" alt="AzubiHub" width={size} height={size} style={{ borderRadius: size * 0.22, display: 'block', objectFit: 'cover' }} />
      {/* Wordmark */}
      <span style={{ fontSize: fs, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1, userSelect: 'none', color: dark ? 'rgba(255,255,255,0.9)' : C.textPrimary }}>
        Azubi<span style={{ color: hubColor }}>Hub</span>
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
          <span style={dot(5,  'rgba(66,133,244,0.35)', { bottom: -2, right: '28%' }, '1.2s')} />
          <span style={dot(4,  'rgba(66,133,244,0.2)',  { top: '22%', right: -2 }, '2.1s')} />
        </div>

        {/* Ring 2 — red, CCW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-255px,-26vmin)', marginLeft: 'min(-255px,-26vmin)', width: 'min(510px,52vmin)', height: 'min(510px,52vmin)', borderRadius: '50%', border: '1px solid rgba(234,67,53,0.1)', animation: 'orbit-ccw 25s linear infinite 1.5s' }}>
          <span style={dot(8,  'rgba(234,67,53,0.7)',  { bottom: -4, left: '50%', marginLeft: -4 }, '0.5s')} />
          <span style={dot(4,  'rgba(234,67,53,0.3)',  { top: '18%', right: -2 }, '1.8s')} />
        </div>

        {/* Ring 3 — green, CW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-185px,-19vmin)', marginLeft: 'min(-185px,-19vmin)', width: 'min(370px,38vmin)', height: 'min(370px,38vmin)', borderRadius: '50%', border: '1px solid rgba(52,168,83,0.13)', animation: 'orbit-cw 16s linear infinite 0.7s' }}>
          <span style={dot(7,  'rgba(52,168,83,0.7)',  { top: -3, right: '24%' }, '0.3s')} />
          <span style={dot(3,  'rgba(52,168,83,0.3)',  { bottom: -1, left: '38%' }, '2.4s')} />
        </div>

        {/* Ring 4 — yellow, CCW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-115px,-12vmin)', marginLeft: 'min(-115px,-12vmin)', width: 'min(230px,24vmin)', height: 'min(230px,24vmin)', borderRadius: '50%', border: '1px solid rgba(251,188,4,0.18)', animation: 'orbit-ccw 10s linear infinite 0.2s' }}>
          <span style={dot(6,  'rgba(251,188,4,0.8)',  { top: -3, left: '50%', marginLeft: -3 }, '1s')} />
          <span style={dot(3,  'rgba(251,188,4,0.3)',  { bottom: -1, right: '32%' }, '2.7s')} />
        </div>

        {/* Ring 5 — innermost, blue, CW */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: 'min(-55px,-5.5vmin)', marginLeft: 'min(-55px,-5.5vmin)', width: 'min(110px,11vmin)', height: 'min(110px,11vmin)', borderRadius: '50%', border: '1px solid rgba(66,133,244,0.16)', animation: 'orbit-cw 6s linear infinite 0.4s' }}>
          <span style={dot(5,  'rgba(66,133,244,0.65)', { top: -2, left: '50%', marginLeft: -2 }, '0.8s')} />
        </div>

        {/* Center orb — pure gradient, no shadow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -22, marginLeft: -22, width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,0.5) 0%, rgba(66,133,244,0.15) 50%, transparent 75%)', animation: 'goog-glow-pulse 4s ease-in-out infinite' }} />
      </div>

      {/* Soft edge vignette — fades rings at viewport edges */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, rgba(255,255,255,0.75) 80%, #ffffff 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

/* Nav — exact antigravity.google: min-height 36px, #ffffffd9, blur(5px), hides on scroll-down */
function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [['#features', 'Features'], ['#pricing', 'Preise'], ['#faq', 'FAQ']] as const

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        minHeight: 36,
        background: '#ffffffd9',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
            <Logo size={26} />
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="hidden md:flex">
            {links.map(([href, label]) => (
              <a key={href} href={href} style={{ color: C.textSec, fontWeight: 450, fontSize: '0.9375rem', padding: '0.5rem 0.75rem', borderRadius: 4, cursor: 'pointer', transition: 'color 150ms ease', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.blue)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textSec)}>
                {label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/auth/login"
              style={{ color: C.textSec, fontWeight: 450, fontSize: '0.9375rem', padding: '0.5rem 0.75rem', borderRadius: 4, transition: 'color 150ms ease', textDecoration: 'none' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = C.blue)}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = C.textSec)}
              className="hidden sm:inline">
              Anmelden
            </Link>
            <Link href="/auth/register" className="hidden sm:inline">
              <span style={{ background: C.blue, color: 'white', padding: '10px 24px', borderRadius: 9999, fontWeight: 450, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 150ms ease', display: 'inline-block' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = C.blueDark }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = C.blue }}>
                Kostenlos starten
              </span>
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex md:hidden"
              style={{ width: 40, height: 40, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6 }}
              aria-label="Menü">
              <span style={{ width: 22, height: 1.5, background: C.textPrimary, borderRadius: 2, transition: 'all 250ms ease', transform: menuOpen ? 'rotate(45deg) translateY(4.5px)' : 'none' }} />
              <span style={{ width: 22, height: 1.5, background: C.textPrimary, borderRadius: 2, transition: 'all 250ms ease', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ width: 22, height: 1.5, background: C.textPrimary, borderRadius: 2, transition: 'all 250ms ease', transform: menuOpen ? 'rotate(-45deg) translateY(-4.5px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
        background: '#fffffff5',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: menuOpen ? '1.25rem 1.25rem 1.5rem' : '0 1.25rem',
        maxHeight: menuOpen ? '400px' : '0',
        overflow: 'hidden',
        transition: 'max-height 300ms ease, padding 300ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }} className="md:hidden">
        {links.map(([href, label]) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}
            style={{ color: C.textPrimary, fontWeight: 450, fontSize: '1.0625rem', padding: '0.875rem 0.5rem', borderBottom: `1px solid ${C.border}`, textDecoration: 'none', display: 'block' }}>
            {label}
          </a>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem' }}>
          <Link href="/auth/login" onClick={() => setMenuOpen(false)}
            style={{ color: C.textSec, fontWeight: 450, fontSize: '1rem', textDecoration: 'none', padding: '0.5rem 0.5rem', display: 'block' }}>
            Anmelden
          </Link>
          <Link href="/auth/register" onClick={() => setMenuOpen(false)} style={{ display: 'block' }}>
            <span style={{ display: 'block', textAlign: 'center', padding: '12px 24px', background: C.blue, color: 'white', borderRadius: 9999, fontWeight: 450, fontSize: '1rem' }}>
              Kostenlos starten
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}

/* FAQ accordion */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', fontWeight: 500, color: C.textPrimary, transition: 'color 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.color = C.blue)}
        onMouseLeave={e => (e.currentTarget.style.color = C.textPrimary)}>
        <span style={{ flex: 1 }}>{q}</span>
        <span style={{ width: 24, height: 24, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 250ms ease', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={18} />
        </span>
      </button>
      <div style={{ maxHeight: open ? '300px' : '0', overflow: 'hidden', transition: 'max-height 350ms ease-out, padding 350ms ease-out', padding: open ? '0 1.5rem 1.25rem' : '0 1.5rem 0' }}>
        <p style={{ color: C.textSec, lineHeight: 1.8, margin: 0, fontSize: '0.9375rem' }}>{a}</p>
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
    <div style={{ fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif', color: C.textPrimary, WebkitFontSmoothing: 'antialiased' }}>
      <FixedBackground />
      <Nav />

      {/* ══ 1. HERO ══ */}
      <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(3rem + 64px) 0 3rem', background: 'transparent', position: 'relative', textAlign: 'center' }}>
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
              { value: '10×',    label: 'Schneller als Papier' },
              { value: 'IHK',    label: 'Konform & Exportierbar' },
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
              style={{ padding: '2rem', background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 12, transition: 'all 250ms ease' }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)' }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.transform = '' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textLight, marginBottom: '1rem' }}>Kostenlos</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>0€</span>
                <span style={{ fontSize: '0.875rem', color: C.textSec, marginBottom: 8 }}>/ für immer</span>
              </div>
              <p style={{ fontSize: '0.9375rem', color: C.textSec, marginBottom: '1.5rem', lineHeight: 1.6 }}>Alles für eine vollständige Ausbildungsdokumentation.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe','PDF-Export','Kalender & Fristen','Cloud-Sync'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: C.textPrimary }}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: C.green, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" style={{ display: 'block' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px 24px', borderRadius: 9999, border: `2px solid ${C.blue}`, color: C.blue, fontWeight: 450, fontSize: '1rem', cursor: 'pointer', transition: 'all 250ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.blue; el.style.color = 'white' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'transparent'; el.style.color = C.blue }}>
                  Jetzt registrieren
                </span>
              </Link>
            </div>

            {/* Pro */}
            <div className="g-reveal" style={{ borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, padding: 2, transitionDelay: '0.1s' }}>
              <div style={{ padding: '2rem', background: 'white', borderRadius: 12, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.blue, margin: 0 }}>Pro</p>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: 9999, background: C.blue, color: 'white' }}>Demnächst</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>4,99€</span>
                  <span style={{ fontSize: '0.875rem', color: C.textSec, marginBottom: 8 }}>/ Monat</span>
                </div>
                <p style={{ fontSize: '0.9375rem', color: C.textSec, marginBottom: '1.5rem', lineHeight: 1.6 }}>Für Betriebe mit mehreren Auszubildenden.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['Alles aus Kostenlos','Unbegrenzte KI-Nutzung','Team-Verwaltung (20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: C.textPrimary }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: C.blue, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <button disabled style={{ width: '100%', padding: '10px 24px', borderRadius: 9999, background: C.blue, color: 'white', border: 'none', fontWeight: 450, fontSize: '1rem', opacity: 0.45, cursor: 'not-allowed' }}>
                  Benachrichtigen wenn verfügbar
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
      <section className="lp-section" style={{ background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueDark} 100%)`, textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem' }}>
          <div className="g-reveal">
            <h2 style={{ fontWeight: 450, fontSize: 'clamp(2rem,4vw,3rem)', color: 'white', marginBottom: '1rem', lineHeight: 1.2 }}>
              Bereit, deine Ausbildung zu transformieren?
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              Hunderte Betriebe haben bereits gewechselt.<br />
              Der erste Bericht ist in unter 15 Minuten fertig.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/register">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'white', color: C.blue, borderRadius: 9999, fontWeight: 450, fontSize: '1rem', cursor: 'pointer', transition: 'all 250ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.bgSecondary; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'white'; el.style.transform = '' }}>
                  Jetzt kostenlos starten
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </span>
              </Link>
              <a href="mailto:kontakt@azubihub.app">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 9999, fontWeight: 450, fontSize: '1rem', cursor: 'pointer', transition: 'all 250ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.borderColor = 'white' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(255,255,255,0.6)' }}>
                  <HugeiconsIcon icon={Mail01Icon} size={18} />
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
        <div style={{ height: 'calc(16vw + 220px)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { size: 'calc(16vw + 220px)', border: 'rgba(66,133,244,0.1)',  anim: 'orbit-cw 60s linear infinite' },
            { size: 'calc(11vw + 170px)', border: 'rgba(234,67,53,0.07)',  anim: 'orbit-ccw 44s linear infinite 2s' },
            { size: 'calc(7vw + 120px)',  border: 'rgba(52,168,83,0.09)',  anim: 'orbit-cw 28s linear infinite 1s' },
            { size: 'calc(4vw + 76px)',   border: 'rgba(251,188,4,0.11)',  anim: 'orbit-ccw 16s linear infinite 0.5s' },
          ].map((r, i) => (
            <div key={i} style={{ position: 'absolute', width: r.size, height: r.size, borderRadius: '50%', border: `1px solid ${r.border}`, animation: r.anim }} />
          ))}
          <div style={{ position: 'absolute', width: 48, height: 48, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,0.45) 0%, transparent 70%)', animation: 'goog-glow-pulse 3.5s ease-in-out infinite' }} />
        </div>

        {/* Nav */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 2rem 2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4rem', marginBottom: '2.5rem' }} className="footer-grid">

            {/* Brand */}
            <div>
              <div style={{ marginBottom: '0.875rem' }}>
                <Logo size={22} dark />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, fontSize: '0.875rem', marginBottom: '1.25rem', maxWidth: 280 }}>
                Digitale Ausbildungsplattform für Deutschland. KI-gestützt, IHK-konform, kostenlos.
              </p>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                {[{ href: 'mailto:kontakt@azubihub.app', label: 'E-Mail' }, { href: 'https://github.com', label: 'GitHub' }].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 150ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Produkt */}
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: '1rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Produkt</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[['#features','Features'],['#pricing','Preise'],['#faq','FAQ'],['/auth/register','Registrieren'],['/auth/login','Anmelden']].map(([href, label]) => (
                  <li key={label}>
                    <a href={href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', transition: 'color 150ms ease', textDecoration: 'none' }}
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
              <p style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: '1rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Rechtliches</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[{ href: '/impressum', label: 'Impressum' }, { href: '/datenschutz', label: 'Datenschutz' }, { href: 'mailto:kontakt@azubihub.app', label: 'Kontakt' }].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', transition: 'color 150ms ease', textDecoration: 'none' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}>© {new Date().getFullYear()} AzubiHub</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}>Gebaut für die Ausbildung in Deutschland.</span>
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
