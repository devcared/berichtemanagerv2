'use client'

import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import type { AppModule } from '@/types'
import {
  BookOpenIcon, CheckListIcon, CalendarIcon, GridViewIcon, Logout01Icon,
  SparklesIcon, CheckmarkBadge01Icon, ArrowRight01Icon,
  Shield01Icon, StarIcon, QuoteUpIcon, CheckmarkCircle01Icon,
  Add01Icon, MinusSignIcon,
  Mail01Icon, Github01Icon, LockPasswordIcon,
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
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">A</span>
              </div>
              <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">AzubiHub</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-foreground gap-2">
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-4">{greeting}</h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Module</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((mod) => {
              const I = moduleIconMap[mod.icon]
              return (
                <Card key={mod.id} onClick={() => mod.isEnabled && router.push(mod.routePath)}
                  className={cn('relative overflow-hidden border border-border bg-card transition-all duration-200',
                    mod.isEnabled ? 'cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5' : 'opacity-60 cursor-not-allowed')}
                  style={{ borderTop: `3px solid ${mod.accentColor}` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${mod.accentColor}20` }}>
                        {I && <HugeiconsIcon icon={I} size={22} style={{ color: mod.accentColor }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-base">{mod.title}</h3>
                          {!mod.isEnabled && <Badge variant="secondary" className="text-[10px] shrink-0">Bald verfügbar</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                        {mod.isEnabled && mod.lastUsed && <p className="text-xs text-muted-foreground/60 mt-2">Zuletzt genutzt heute</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">AzubiHub · Dein persönlicher Ausbildungsassistent</p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   DESIGN SYSTEM  — Google Antigravity exact
═══════════════════════════════════════ */

/* Exact Google brand palette */
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
  shadowSm:    '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
  shadowMd:    '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
}

/* Dark-mode overrides */
function dk(dark: boolean) {
  return {
    textPrimary: dark ? '#e8eaed'                  : C.textPrimary,
    textSec:     dark ? '#9aa0a6'                  : C.textSec,
    textLight:   dark ? '#5f6368'                  : C.textLight,
    bg:          dark ? '#0d0f14'                  : C.bgPrimary,
    surface:     dark ? '#161b22'                  : C.bgSecondary,
    surface2:    dark ? '#1c2333'                  : '#f1f3f4',
    border:      dark ? 'rgba(255,255,255,0.1)'    : C.border,
    heroBg:      dark
      ? 'linear-gradient(135deg,#0d0f14 0%,#1c2333 100%)'
      : 'linear-gradient(135deg,#f8f9fa 0%,#e8f0fe 100%)',
    aboutBg:     dark
      ? 'linear-gradient(135deg,#161b22 0%,#1c2333 100%)'
      : 'linear-gradient(135deg,#e8f0fe 0%,#f8f9fa 100%)',
    cardBg:      dark ? '#1c2333'                  : '#ffffff',
    shadowSm:    dark ? '0 1px 4px rgba(0,0,0,0.5)' : C.shadowSm,
    shadowMd:    dark ? '0 4px 16px rgba(0,0,0,0.6)': C.shadowMd,
  }
}

/* Theme context */
const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} })

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

function SunSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}
function MoonSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/* ═══════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════ */

/* Google Antigravity ring particles */
function OrbitalRings({ dark }: { dark: boolean }) {
  const o = dark ? 1 : 2
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute rounded-full" style={{ width: 860, height: 860, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.08' : '0.07'}) 0%, transparent 65%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      {/* Ring 1 CW */}
      <div className="absolute rounded-full" style={{ width: 680, height: 680, border: `1px solid rgba(66,133,244,${0.14 * o})`, animation: 'orbit-cw 30s linear infinite' }}>
        <span className="absolute rounded-full" style={{ width: 13, height: 13, background: C.blue, top: -6, left: '50%', marginLeft: -6, boxShadow: `0 0 18px ${C.blue}, 0 0 36px rgba(66,133,244,0.4)` }} />
        <span className="absolute rounded-full" style={{ width: 6, height: 6, background: `rgba(66,133,244,0.5)`, bottom: -3, right: '28%' }} />
      </div>

      {/* Ring 2 CCW */}
      <div className="absolute rounded-full" style={{ width: 490, height: 490, border: `1px solid rgba(234,67,53,${0.13 * o})`, animation: 'orbit-ccw 21s linear infinite 1s' }}>
        <span className="absolute rounded-full" style={{ width: 10, height: 10, background: C.red, bottom: -5, left: '50%', marginLeft: -5, boxShadow: `0 0 14px ${C.red}, 0 0 28px rgba(234,67,53,0.35)` }} />
        <span className="absolute rounded-full" style={{ width: 5, height: 5, background: `rgba(234,67,53,0.5)`, top: '22%', right: -2 }} />
      </div>

      {/* Ring 3 dashed CW */}
      <div className="absolute rounded-full" style={{ width: 320, height: 320, border: `1px dashed rgba(52,168,83,${0.16 * o})`, animation: 'orbit-cw 13s linear infinite 0.5s' }}>
        <span className="absolute rounded-full" style={{ width: 8, height: 8, background: C.green, top: -4, right: '22%', boxShadow: `0 0 12px ${C.green}` }} />
      </div>

      {/* Ring 4 CCW */}
      <div className="absolute rounded-full" style={{ width: 170, height: 170, border: `1px solid rgba(251,188,4,${0.2 * o})`, animation: 'orbit-ccw 8s linear infinite 0.3s' }}>
        <span className="absolute rounded-full" style={{ width: 7, height: 7, background: C.yellow, top: -3, left: '50%', marginLeft: -3, boxShadow: `0 0 10px ${C.yellow}` }} />
      </div>

      {/* Center orb */}
      <div className="absolute rounded-full" style={{ width: 52, height: 52, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.85' : '0.5'}) 0%, transparent 70%)`, animation: 'goog-glow-pulse 3.5s ease-in-out infinite', boxShadow: '0 0 40px rgba(66,133,244,0.5)' }} />
    </div>
  )
}

/* Sticky nav — exact antigravity.google style */
function Nav({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const G = dk(dark)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: scrolled
      ? (dark ? 'rgba(13,15,20,0.97)' : 'rgba(255,255,255,0.97)')
      : 'transparent',
    backdropFilter: scrolled ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none',
    borderBottom: scrolled ? `1px solid ${G.border}` : '1px solid transparent',
    transition: 'all 250ms ease-in-out',
  }

  const linkStyle: React.CSSProperties = { color: G.textSec, fontWeight: 500, fontSize: '0.9375rem', padding: '0.5rem 0.75rem', borderRadius: '4px', cursor: 'pointer', transition: 'color 150ms ease' }

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>A</span>
          </div>
          <span style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: '1.125rem', color: G.textPrimary }}>AzubiHub</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="hidden md:flex">
          {[['#features', 'Features'], ['#how-it-works', 'So funktioniert\'s'], ['#pricing', 'Preise'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = C.blue)}
              onMouseLeave={e => (e.currentTarget.style.color = G.textSec)}>
              {label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/auth/login" style={{ ...linkStyle, display: 'none' }} className="hidden sm:block"
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = C.blue)}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.textSec)}>
            Anmelden
          </Link>

          {/* Theme toggle */}
          <button onClick={toggle}
            title={dark ? 'Light Mode' : 'Dark Mode'}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${G.border}`, background: 'transparent', color: G.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = dark ? 'rgba(255,255,255,0.1)' : C.bgSecondary }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
            {dark ? <SunSVG /> : <MoonSVG />}
          </button>

          {/* CTA */}
          <Link href="/auth/register">
            <span style={{ background: C.blue, color: 'white', padding: '0.5rem 1.25rem', borderRadius: 9999, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 150ms ease', display: 'inline-block' }}
              onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = C.blueDark; (e.currentTarget as HTMLSpanElement).style.boxShadow = C.shadowSm }}
              onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = C.blue; (e.currentTarget as HTMLSpanElement).style.boxShadow = 'none' }}>
              Kostenlos starten
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* FAQ item — Material accordion card */
function FaqItem({ q, a, dark }: { q: string; a: string; dark: boolean }) {
  const G = dk(dark)
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: G.cardBg, border: `1px solid ${G.border}`, borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 250ms ease', boxShadow: open ? G.shadowMd : 'none' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', fontFamily: '"Google Sans","Segoe UI",sans-serif', fontSize: '1rem', fontWeight: 600, color: G.textPrimary, transition: 'color 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.color = C.blue)}
        onMouseLeave={e => (e.currentTarget.style.color = G.textPrimary)}>
        <span style={{ flex: 1 }}>{q}</span>
        <span style={{ width: 24, height: 24, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 250ms ease', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={18} />
        </span>
      </button>
      <div style={{ maxHeight: open ? '300px' : '0', overflow: 'hidden', transition: 'max-height 350ms ease-out, padding 350ms ease-out', padding: open ? '0 1.5rem 1.25rem' : '0 1.5rem 0' }}>
        <p style={{ color: G.textSec, lineHeight: 1.8, margin: 0, fontSize: '0.9375rem' }}>{a}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
function LandingPage() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('azubihub-theme') === 'dark'
    return false
  })
  const toggle = () => {
    const next = !dark; setDark(next)
    localStorage.setItem('azubihub-theme', next ? 'dark' : 'light')
  }
  useScrollReveal()
  const G = dk(dark)

  /* Gradient text style — exact antigravity.google blue→green */
  const gradText: React.CSSProperties = {
    background: dark
      ? 'linear-gradient(135deg, #8ab4f8 0%, #81c995 100%)'
      : `linear-gradient(135deg, ${C.blue} 0%, ${C.green} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline',
  }

  /* Feature icon gradient — exact match */
  const featureIconBg = `linear-gradient(135deg, ${C.blue} 0%, ${C.green} 100%)`

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      <div style={{ fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif', color: G.textPrimary, background: G.bg, WebkitFontSmoothing: 'antialiased', transition: 'background 0.3s, color 0.3s' }}>
        <Nav dark={dark} toggle={toggle} />

        {/* ══ 1. HERO ══ */}
        <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(6rem + 64px) 0 6rem', background: G.heroBg, position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <OrbitalRings dark={dark} />

          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
            {/* Badge */}
            <div className="g-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.5rem 1.25rem', background: dark ? 'rgba(255,255,255,0.08)' : 'white', borderRadius: 9999, boxShadow: dark ? 'none' : C.shadowSm, border: dark ? `1px solid rgba(255,255,255,0.12)` : 'none', marginBottom: '1.75rem', fontSize: '0.875rem', fontWeight: 500, color: G.textSec, animation: 'fadeInUp 0.8s ease-out' }}>
              <HugeiconsIcon icon={SparklesIcon} size={16} style={{ color: C.yellow }} />
              Für Betriebe · Ausbilder · Auszubildende
            </div>

            {/* H1 */}
            <h1 className="g-reveal" style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, lineHeight: 1.15, marginBottom: '1.25rem', color: G.textPrimary, transitionDelay: '0.1s', fontSize: 'clamp(2.5rem,5.5vw,4.5rem)' }}>
              Deine Ausbildung,{' '}
              <span style={gradText}>neu gedacht.</span>
            </h1>

            {/* Subtitle */}
            <p className="g-reveal" style={{ fontSize: '1.25rem', lineHeight: 1.8, color: G.textSec, maxWidth: 700, margin: '0 auto 2.5rem', transitionDelay: '0.15s' }}>
              AzubiHub digitalisiert Berichtshefte, Ausbilder-Freigaben und die gesamte
              Ausbildungsdokumentation. KI-gestützt, IHK-konform und dauerhaft kostenlos.
            </p>

            {/* CTA buttons */}
            <div className="g-reveal" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem', transitionDelay: '0.2s' }}>
              <Link href="/auth/register">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '1rem 2.25rem', background: C.blue, color: 'white', borderRadius: 9999, fontWeight: 500, fontSize: '1rem', cursor: 'pointer', boxShadow: C.shadowSm, transition: 'all 250ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.blueDark; el.style.boxShadow = C.shadowMd; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.blue; el.style.boxShadow = C.shadowSm; el.style.transform = '' }}>
                  Kostenlos starten
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </span>
              </Link>
              <a href="#features">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '1rem 2.25rem', background: 'transparent', color: C.blue, border: `2px solid ${C.blue}`, borderRadius: 9999, fontWeight: 500, fontSize: '1rem', cursor: 'pointer', transition: 'all 250ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.blue; el.style.color = 'white' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'transparent'; el.style.color = C.blue }}>
                  Demo ansehen
                </span>
              </a>
            </div>

            {/* Feature pills below CTAs */}
            <div className="g-reveal" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', transitionDelay: '0.25s' }}>
              {[
                { icon: Shield01Icon,         label: 'DSGVO-konform' },
                { icon: CheckmarkBadge01Icon, label: 'IHK-konform'   },
                { icon: SparklesIcon,         label: 'KI-gestützt'   },
              ].map(t => (
                <span key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', background: dark ? 'rgba(255,255,255,0.08)' : 'white', borderRadius: 9999, boxShadow: dark ? 'none' : C.shadowSm, border: dark ? '1px solid rgba(255,255,255,0.12)' : 'none', color: G.textSec, fontWeight: 500, fontSize: '0.875rem', transition: 'all 250ms ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.boxShadow = dark ? 'none' : C.shadowMd; el.style.transform = 'translateY(-2px)'; el.style.color = C.blue }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.boxShadow = dark ? 'none' : C.shadowSm; el.style.transform = ''; el.style.color = G.textSec }}>
                  <HugeiconsIcon icon={t.icon} size={20} style={{ color: C.blue }} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 2. STATS ══ */}
        <section style={{ padding: '5rem 0', background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '2.5rem' }}>
            {STATS.map((s, i) => (
              <div key={s.label} className="g-reveal" style={{ textAlign: 'center', transitionDelay: `${i * 0.08}s` }}>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: s.color, marginBottom: '0.375rem', fontFamily: '"Google Sans","Segoe UI",sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: '1rem', color: G.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 3. FEATURES ══ */}
        <section id="features" style={{ padding: '6rem 0', background: G.surface }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
            <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: G.textPrimary, marginBottom: '1rem', lineHeight: 1.2 }}>
                Agent-First Ausbildung
              </h2>
              <p style={{ fontSize: '1.25rem', color: G.textSec, maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                Revolutionäre Funktionen, die deine Ausbildungsdokumentation transformieren.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.75rem' }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} className="g-reveal"
                  style={{ padding: '2rem', background: G.cardBg, borderRadius: 12, boxShadow: G.shadowSm, transition: 'all 250ms ease', transitionDelay: `${i * 0.07}s` }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.boxShadow = G.shadowMd; el.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.boxShadow = G.shadowSm; el.style.transform = '' }}>
                  <div style={{ width: 64, height: 64, background: featureIconBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <HugeiconsIcon icon={f.icon} size={30} style={{ color: 'white' }} />
                  </div>
                  <h3 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontSize: '1.25rem', fontWeight: 700, color: G.textPrimary, marginBottom: '0.625rem', lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ color: G.textSec, lineHeight: 1.7, margin: 0, fontSize: '0.9375rem' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 4. ABOUT / HOW IT WORKS ══ */}
        <section id="how-it-works" style={{ padding: '6rem 0', background: G.aboutBg }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
            <div className="g-reveal">
              <h2 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: G.textPrimary, marginBottom: '1.5rem', lineHeight: 1.2 }}>
                Die Zukunft der Ausbildung ist da.
              </h2>
              <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: G.textSec, marginBottom: '1.25rem' }}>
                Schluss mit Papierstapeln, verlorenen Dokumenten und unübersichtlichen E-Mail-Threads.
                AzubiHub digitalisiert jeden Schritt deiner Ausbildungsdokumentation —
                vom ersten Stichpunkt bis zum fertig signierten IHK-Bericht.
              </p>
              <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: G.textSec, marginBottom: '3rem' }}>
                Mit der integrierten Claude-KI formulierst du professionelle Wochenberichte in Minuten statt Stunden.
                Ausbilder erhalten sofortige Übersicht über alle Auszubildenden — und freigeben war noch nie so einfach.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '2.5rem', marginTop: '3rem' }}>
              {[
                { value: '10×',     label: 'Schneller als Papier' },
                { value: 'IHK',     label: 'Konform & Exportierbar' },
                { value: '99,9 %',  label: 'Uptime-Garantie' },
              ].map((s, i) => (
                <div key={s.label} className="g-reveal" style={{ textAlign: 'center', transitionDelay: `${i * 0.1}s` }}>
                  <div style={{ fontSize: '3rem', fontWeight: 700, color: C.blue, marginBottom: '0.375rem', fontFamily: '"Google Sans","Segoe UI",sans-serif' }}>{s.value}</div>
                  <div style={{ fontSize: '1rem', color: G.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 5. TESTIMONIALS ══ */}
        <section style={{ padding: '6rem 0', background: G.bg }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
            <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: G.textPrimary, marginBottom: '1rem', lineHeight: 1.2 }}>Was andere sagen.</h2>
              <p style={{ fontSize: '1.25rem', color: G.textSec, maxWidth: 700, margin: '0 auto' }}>Echte Meinungen von Auszubildenden und Ausbildern.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name} className="g-reveal"
                  style={{ padding: '1.75rem', background: G.cardBg, borderRadius: 12, boxShadow: G.shadowSm, display: 'flex', flexDirection: 'column', transition: 'all 250ms ease', transitionDelay: `${i * 0.07}s` }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.boxShadow = G.shadowMd; el.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.boxShadow = G.shadowSm; el.style.transform = '' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: '0.875rem' }}>
                    {[...Array(5)].map((_, j) => <HugeiconsIcon key={j} icon={StarIcon} size={14} style={{ color: C.yellow }} />)}
                  </div>
                  <HugeiconsIcon icon={QuoteUpIcon} size={22} style={{ color: `${t.color}50`, marginBottom: 10 }} />
                  <p style={{ color: G.textSec, lineHeight: 1.7, flex: 1, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>{t.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: '1rem', borderTop: `1px solid ${G.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0 }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: G.textPrimary }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: G.textLight }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 6. PRICING ══ */}
        <section id="pricing" style={{ padding: '6rem 0', background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem' }}>
            <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: G.textPrimary, marginBottom: '1rem', lineHeight: 1.2 }}>Einfach. Kostenlos.</h2>
              <p style={{ fontSize: '1.25rem', color: G.textSec, maxWidth: 600, margin: '0 auto' }}>Kein Abo. Keine Kreditkarte. Keine versteckten Kosten.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
              {/* Free */}
              <div className="g-reveal" style={{ padding: '2rem', background: G.cardBg, borderRadius: 12, boxShadow: G.shadowSm, transition: 'all 250ms ease' }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.boxShadow = G.shadowMd; el.style.transform = 'translateY(-4px)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.boxShadow = G.shadowSm; el.style.transform = '' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: G.textLight, marginBottom: '1rem' }}>Kostenlos</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 700, color: G.textPrimary, lineHeight: 1, fontFamily: '"Google Sans","Segoe UI",sans-serif' }}>0€</span>
                  <span style={{ fontSize: '0.875rem', color: G.textSec, marginBottom: 8 }}>/ für immer</span>
                </div>
                <p style={{ fontSize: '0.9375rem', color: G.textSec, marginBottom: '1.5rem', lineHeight: 1.6 }}>Alles für eine vollständige Ausbildungsdokumentation.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe','PDF-Export','Kalender & Fristen','Cloud-Sync'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: G.textPrimary }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: C.green, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" style={{ display: 'block' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.875rem', borderRadius: 9999, border: `2px solid ${C.blue}`, color: C.blue, fontWeight: 500, fontSize: '1rem', cursor: 'pointer', transition: 'all 250ms ease' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.blue; el.style.color = 'white' }}
                    onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'transparent'; el.style.color = C.blue }}>
                    Jetzt registrieren
                  </span>
                </Link>
              </div>

              {/* Pro */}
              <div className="g-reveal" style={{ borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, padding: 2, transitionDelay: '0.1s' }}>
                <div style={{ padding: '2rem', background: dark ? G.surface2 : 'white', borderRadius: 12, height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.blue, margin: 0 }}>Pro</p>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: 9999, background: C.blue, color: 'white' }}>Demnächst</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: 700, color: G.textPrimary, lineHeight: 1, fontFamily: '"Google Sans","Segoe UI",sans-serif' }}>4,99€</span>
                    <span style={{ fontSize: '0.875rem', color: G.textSec, marginBottom: 8 }}>/ Monat</span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', color: G.textSec, marginBottom: '1.5rem', lineHeight: 1.6 }}>Für Betriebe mit mehreren Auszubildenden.</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {['Alles aus Kostenlos','Unbegrenzte KI-Nutzung','Team-Verwaltung (20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App'].map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9375rem', color: G.textPrimary }}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: C.blue, flexShrink: 0 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button disabled style={{ width: '100%', padding: '0.875rem', borderRadius: 9999, background: C.blue, color: 'white', border: 'none', fontWeight: 500, fontSize: '1rem', opacity: 0.45, cursor: 'not-allowed' }}>
                    Benachrichtigen wenn verfügbar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 7. FAQ ══ */}
        <section id="faq" style={{ padding: '6rem 0', background: G.bg }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem' }}>
            <div className="g-reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: G.textPrimary, marginBottom: '1rem', lineHeight: 1.2 }}>Häufige Fragen</h2>
              <p style={{ fontSize: '1.25rem', color: G.textSec, maxWidth: 600, margin: '0 auto' }}>Alles, was du über AzubiHub wissen musst.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} dark={dark} />)}
            </div>
            <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9375rem', color: G.textSec }}>
              Noch Fragen?{' '}
              <a href="mailto:kontakt@azubihub.app" style={{ color: C.blue, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.textDecoration = 'none')}>
                Schreib uns direkt.
              </a>
            </p>
          </div>
        </section>

        {/* ══ 8. CTA ══ — exact antigravity.google blue gradient */}
        <section style={{ padding: '6rem 0', background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueDark} 100%)`, textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem' }}>
            <div className="g-reveal">
              <h2 style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: 'white', marginBottom: '1rem', lineHeight: 1.2 }}>
                Bereit, deine Ausbildung zu transformieren?
              </h2>
              <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                Hunderte Betriebe haben bereits gewechselt.<br />
                Der erste Bericht ist in unter 15 Minuten fertig.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/auth/register">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '1rem 2.25rem', background: 'white', color: C.blue, borderRadius: 9999, fontWeight: 500, fontSize: '1rem', cursor: 'pointer', boxShadow: C.shadowSm, transition: 'all 250ms ease' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = C.bgSecondary; el.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'white'; el.style.transform = '' }}>
                    Jetzt kostenlos starten
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                  </span>
                </Link>
                <a href="mailto:kontakt@azubihub.app">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '1rem 2.25rem', background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 9999, fontWeight: 500, fontSize: '1rem', cursor: 'pointer', transition: 'all 250ms ease' }}
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

        {/* ══ FOOTER ══ — exact antigravity.google dark footer */}
        <footer style={{ padding: '4rem 0 1.75rem', background: C.bgDark, color: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4rem', marginBottom: '2.5rem' }} className="footer-grid">
              {/* Col 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>A</span>
                  </div>
                  <span style={{ fontFamily: '"Google Sans","Segoe UI",sans-serif', fontWeight: 700, fontSize: '1.125rem' }}>AzubiHub</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
                  Die digitale Ausbildungsplattform für moderne Betriebe. KI-gestützt, IHK-konform, kostenlos.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ href: 'mailto:kontakt@azubihub.app', icon: Mail01Icon, label: 'E-Mail' }, { href: 'https://github.com', icon: Github01Icon, label: 'GitHub' }].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', transition: 'all 150ms ease' }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.blue; e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
                      <HugeiconsIcon icon={s.icon} size={15} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Col 2 */}
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Produkt</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[['#features','Features'],['#pricing','Preise'],['#faq','FAQ'],['/auth/register','Registrieren'],['/auth/login','Anmelden']].map(([href, label]) => (
                    <li key={label}>
                      <a href={href} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', transition: 'color 150ms ease', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = C.blue)}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3 */}
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Rechtliches</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[{ href: '/impressum', label: 'Impressum' }, { href: '/datenschutz', label: 'Datenschutz' }, { href: 'mailto:kontakt@azubihub.app', label: 'Kontakt' }].map(({ href, label }) => (
                    <li key={label}>
                      <Link href={href} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', transition: 'color 150ms ease', textDecoration: 'none' }}
                        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = C.blue)}
                        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              © {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.
            </div>
          </div>
        </footer>
      </div>
    </ThemeCtx.Provider>
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
