'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  Shield01Icon,
  StarIcon, QuoteUpIcon, CheckmarkCircle01Icon, Cancel01Icon, Add01Icon,
  MinusSignIcon, Mail01Icon, Github01Icon, LockPasswordIcon,
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
   THEME SYSTEM
═══════════════════════════════════════ */

/* Brand colors — same in both modes */
const BRAND = {
  blue:   '#4285F4',
  red:    '#EA4335',
  yellow: '#FBBC04',
  green:  '#34A853',
  purple: '#9c27b0',
}

function makeG(dark: boolean) {
  return {
    ...BRAND,
    bg:      dark ? '#060912'                   : '#ffffff',
    surface: dark ? '#0d1117'                   : '#f8f9fa',
    surface2:dark ? '#13192b'                   : '#f1f3f4',
    border:  dark ? 'rgba(255,255,255,0.08)'    : 'rgba(0,0,0,0.07)',
    text:    dark ? '#e8eaed'                   : '#202124',
    mid:     dark ? '#9aa0a6'                   : '#5f6368',
    muted:   dark ? '#5f6368'                   : '#9aa0a6',
  }
}
function makeGlass(dark: boolean): React.CSSProperties {
  return dark
    ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
    : { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.07)',       backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }
}
function makeGradText(dark: boolean): React.CSSProperties {
  return {
    background: dark
      ? 'linear-gradient(180deg,#fff 0%,rgba(232,234,237,0.75) 100%)'
      : 'linear-gradient(180deg,#202124 0%,rgba(32,33,36,0.75) 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }
}

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} })
function useTheme()    { return useContext(ThemeCtx) }
function useG()        { const { dark } = useTheme(); return makeG(dark) }
function useGlass()    { const { dark } = useTheme(); return makeGlass(dark) }

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */

const FEATURES = [
  { icon: BookOpenIcon,         title: 'Kein Papierchaos',        desc: 'Wochenberichte digital, strukturiert und IHK-konform. Kein Drucken, Suchen oder Ablegen.', color: BRAND.blue,   glow: 'rgba(66,133,244,0.15)',  bg: 'rgba(66,133,244,0.1)',  bgLight: '#e8f0fe', colorLight: '#1a56db', stat: '0 Papier' },
  { icon: SparklesIcon,         title: '80 % weniger Aufwand',    desc: 'Stichpunkte eingeben — Claude AI formuliert in Sekunden professionellen IHK-Text.',      color: BRAND.purple, glow: 'rgba(156,39,176,0.15)',  bg: 'rgba(156,39,176,0.1)', bgLight: '#f3e5f5', colorLight: '#6a1b9a', stat: 'Ø 12 Min.' },
  { icon: CheckmarkBadge01Icon, title: 'Ausbilder-Cockpit',       desc: 'Alle Berichte, Freigaben und Azubis zentral. Kommentieren und freigeben — sofort.',        color: BRAND.green,  glow: 'rgba(52,168,83,0.15)',   bg: 'rgba(52,168,83,0.1)',  bgLight: '#e6f4ea', colorLight: '#137333', stat: 'Bis 20 Azubis' },
  { icon: Shield01Icon,         title: 'DSGVO & IHK-konform',     desc: 'Verschlüsselt auf EU-Servern. PDF-Export für die IHK mit einem Klick.',                   color: BRAND.red,    glow: 'rgba(234,67,53,0.15)',   bg: 'rgba(234,67,53,0.1)',  bgLight: '#fce8e6', colorLight: '#c5221f', stat: '100 % EU' },
]
const STATS = [
  { value: 500,   suffix: '+',  label: 'Aktive Nutzer',    color: BRAND.blue   },
  { value: 12000, suffix: '+',  label: 'Berichte erstellt', color: BRAND.red    },
  { value: 80,    suffix: '%',  label: 'Zeitersparnis',     color: BRAND.yellow },
  { value: 49,    suffix: ' ★', label: 'Nutzerbewertung',   color: BRAND.green  },
]
const STEPS = [
  { num: '01', title: 'Betrieb registrieren',  desc: 'Konto anlegen, Betrieb einrichten, Auszubildende einladen — in unter 5 Minuten.',       color: BRAND.blue  },
  { num: '02', title: 'Profile einrichten',    desc: 'Auszubildende nehmen die Einladung an und können sofort ihren ersten Bericht schreiben.', color: BRAND.red   },
  { num: '03', title: 'Digital verwalten',     desc: 'Berichte schreiben, KI nutzen, freigeben lassen — vollständig digital.',                 color: BRAND.green },
]
const TESTIMONIALS = [
  { name: 'Lena M.',    role: 'Auszubildende · Fachinformatikerin',      text: 'Ich tippe Stichpunkte ein und die KI macht den Rest. Absoluter Game Changer!',             color: BRAND.blue   },
  { name: 'Thomas K.',  role: 'Ausbilder · IT-Systemkaufmann',           text: 'Endlich alle Berichte zentral. Kein E-Mail-Chaos — alles übersichtlich an einem Ort.',      color: BRAND.red    },
  { name: 'Sara B.',    role: 'Auszubildende · Kauffrau Büromanagement', text: 'So aufgeräumt und modern. Man merkt, dass es jemand gebaut hat, der Ausbildung kennt.',      color: BRAND.green  },
  { name: 'Marcus D.',  role: 'Ausbilder · Mechatronik',                 text: 'E-Mail schicken, Azubis sind in Minuten drin. Das Einladungssystem ist wirklich genial.',   color: BRAND.yellow },
  { name: 'Jana F.',    role: 'Auszubildende · Industriekauffrau',       text: 'Direkte Kommentare am Bericht — keine E-Mail-Threads mehr. Einfach direkt im System.',      color: BRAND.blue   },
  { name: 'Florian R.', role: 'Ausbildungsleiter · Großbetrieb',         text: '12 Azubis über AzubiHub. Die Zeitersparnis verglichen mit Papier ist wirklich enorm.',       color: BRAND.purple },
]
const FAQS = [
  { q: 'Ist AzubiHub kostenlos?',                          a: 'Ja, vollständig kostenlos — für Auszubildende und Ausbilder. Der Kern bleibt dauerhaft gratis.' },
  { q: 'Welche Ausbildungsberufe werden unterstützt?',     a: 'Alle Berufe mit wöchentlichem Ausbildungsnachweis — nahezu alle IHK- und HWK-Berufe.' },
  { q: 'Wie funktioniert die KI-Formulierung?',            a: 'Stichpunkte eingeben, Länge und Stil wählen — Claude AI formuliert IHK-konformen Text in Sekunden.' },
  { q: 'Kann mein Ausbilder die Berichte kommentieren?',   a: 'Ja. Direkt am Bericht kommentieren, Revisionen anfordern oder freigeben — alles in AzubiHub.' },
  { q: 'Sind meine Daten sicher und DSGVO-konform?',       a: 'Ja. Verschlüsselt auf EU-Servern. Wir verarbeiten keine Daten außerhalb der EU.' },
  { q: 'Kann ich meine Berichte exportieren?',             a: 'Ja, als professionelles PDF — alle Jahresberichte in einem Dokument, druckfertig für die IHK.' },
  { q: 'Wie funktioniert die Ausbilder-Einladung?',        a: 'E-Mail eingeben → automatische Einladung → Auszubildende sind in Minuten aktiv.' },
  { q: 'Funktioniert AzubiHub auf dem Smartphone?',        a: 'Ja, vollständig responsive. Native App ist in Planung.' },
]

/* ═══════════════════════════════════════
   HOOKS & SMALL HELPERS
═══════════════════════════════════════ */

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<Element>('.g-reveal,.g-reveal-left,.g-reveal-right,.g-reveal-scale')
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('g-visible'); io.unobserve(e.target) } }),
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const display = target === 49 ? 4.9 : target
        const steps = 50; const stepVal = display / steps; let cur = 0
        const timer = setInterval(() => {
          cur = Math.min(cur + stepVal, display as number)
          setCount(Math.round(cur * 10) / 10)
          if (cur >= display) clearInterval(timer)
        }, 28)
      }
    }, { threshold: 0.5 })
    io.observe(el); return () => io.disconnect()
  }, [target])
  const display = target === 49 ? count.toFixed(1)
    : target > 999 ? (count >= 1000 ? (count / 1000).toFixed(0) + '.000' : Math.round(count).toString())
    : Math.round(count).toString()
  return <span ref={ref}>{display}{suffix}</span>
}

/* Inline SVG icons for theme toggle */
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
   SHARED COMPONENTS
═══════════════════════════════════════ */

function Logo() {
  const G = useG()
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: BRAND.blue }}>
        <span className="text-white font-black text-sm leading-none">A</span>
      </div>
      <span className="font-bold text-base tracking-tight" style={{ color: G.text }}>AzubiHub</span>
    </div>
  )
}

function GButton({ href, children, primary = false, className = '' }: { href: string; children: React.ReactNode; primary?: boolean; className?: string }) {
  const { dark } = useTheme()
  const base: React.CSSProperties = primary
    ? { background: BRAND.blue, color: '#fff', boxShadow: '0 0 20px rgba(66,133,244,0.4)' }
    : dark
      ? { background: 'rgba(255,255,255,0.06)', color: '#e8eaed', border: '1px solid rgba(255,255,255,0.14)' }
      : { background: 'rgba(0,0,0,0.04)', color: '#202124', border: '1px solid rgba(0,0,0,0.12)' }
  return (
    <Link href={href}>
      <span className={`inline-flex items-center gap-2 rounded-full font-semibold cursor-pointer select-none transition-all duration-200 ${className}`}
        style={{ ...base, padding: className ? undefined : '0.875rem 1.75rem', fontSize: '0.875rem' }}
        onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => {
          const el = e.currentTarget as HTMLSpanElement
          if (primary) { el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 28px rgba(66,133,244,.6)' }
          else if (dark) { el.style.background = 'rgba(255,255,255,0.1)' }
          else { el.style.background = 'rgba(0,0,0,0.07)' }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => {
          const el = e.currentTarget as HTMLSpanElement
          if (primary) { el.style.transform = ''; el.style.boxShadow = '0 0 20px rgba(66,133,244,.4)' }
          else if (dark) { el.style.background = 'rgba(255,255,255,0.06)' }
          else { el.style.background = 'rgba(0,0,0,0.04)' }
        }}>
        {children}
      </span>
    </Link>
  )
}

function OrbitalRings() {
  const { dark } = useTheme()
  const o = dark ? 1 : 1.8  // opacity multiplier — rings more visible in light mode
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 0 }}>
      <div className="absolute rounded-full" style={{ width: 800, height: 800, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.07' : '0.05'}) 0%, transparent 70%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div className="absolute rounded-full" style={{ width: 500, height: 500, background: `radial-gradient(circle, rgba(52,168,83,${dark ? '0.05' : '0.04'}) 0%, transparent 70%)`, top: '20%', right: '15%' }} />

      {/* Ring 1 — outer CW 28s */}
      <div className="absolute rounded-full" style={{ width: 660, height: 660, border: `1px solid rgba(66,133,244,${0.18 * o})`, animation: 'orbit-cw 28s linear infinite' }}>
        <span className="absolute rounded-full" style={{ width: 12, height: 12, background: BRAND.blue, top: -6, left: '50%', marginLeft: -6, boxShadow: `0 0 18px ${BRAND.blue}, 0 0 36px rgba(66,133,244,0.4)` }} />
        <span className="absolute rounded-full" style={{ width: 6, height: 6, background: `rgba(66,133,244,0.5)`, bottom: -3, right: '25%', boxShadow: `0 0 10px ${BRAND.blue}` }} />
      </div>
      {/* Ring 2 — mid CCW 20s */}
      <div className="absolute rounded-full" style={{ width: 460, height: 460, border: `1px solid rgba(234,67,53,${0.16 * o})`, animation: 'orbit-ccw 20s linear infinite 2s' }}>
        <span className="absolute rounded-full" style={{ width: 10, height: 10, background: BRAND.red, bottom: -5, left: '50%', marginLeft: -5, boxShadow: `0 0 14px ${BRAND.red}, 0 0 28px rgba(234,67,53,0.35)` }} />
        <span className="absolute rounded-full" style={{ width: 5, height: 5, background: `rgba(234,67,53,0.5)`, top: '20%', right: -2, boxShadow: `0 0 8px ${BRAND.red}` }} />
      </div>
      {/* Ring 3 — inner CW 13s */}
      <div className="absolute rounded-full" style={{ width: 290, height: 290, border: `1px dashed rgba(52,168,83,${0.22 * o})`, animation: 'orbit-cw 13s linear infinite 1s' }}>
        <span className="absolute rounded-full" style={{ width: 8, height: 8, background: BRAND.green, top: -4, right: '20%', boxShadow: `0 0 12px ${BRAND.green}, 0 0 24px rgba(52,168,83,0.3)` }} />
      </div>
      {/* Ring 4 — tiny CCW 8s */}
      <div className="absolute rounded-full" style={{ width: 150, height: 150, border: `1px solid rgba(251,188,4,${0.24 * o})`, animation: 'orbit-ccw 8s linear infinite 0.5s' }}>
        <span className="absolute rounded-full" style={{ width: 6, height: 6, background: BRAND.yellow, top: -3, left: '50%', marginLeft: -3, boxShadow: `0 0 10px ${BRAND.yellow}` }} />
      </div>
      {/* Center orb */}
      <div className="absolute rounded-full" style={{ width: 64, height: 64, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.9' : '0.5'}) 0%, rgba(66,133,244,0) 70%)`, animation: 'goog-glow-pulse 3.5s ease-in-out infinite', boxShadow: `0 0 40px rgba(66,133,244,0.5), 0 0 80px rgba(66,133,244,0.2)` }} />
    </div>
  )
}

/* ─── Nav ─── */
function LandingNav() {
  const G = useG()
  const glass = useGlass()
  const { dark, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navBg = scrolled
    ? dark ? 'rgba(6,9,18,0.88)' : 'rgba(255,255,255,0.88)'
    : 'transparent'

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background:           navBg,
        backdropFilter:       scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom:         scrolled ? `1px solid ${G.border}` : '1px solid transparent',
        boxShadow:            scrolled ? (dark ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)') : 'none',
      }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link href="/"><Logo /></Link>

        <div className="hidden md:flex items-center gap-1 text-sm">
          {[['#features','Features'],['#how-it-works','So funktioniert\'s'],['#pricing','Preise'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href}
              className="px-4 py-2 rounded-full font-medium transition-all duration-150"
              style={{ color: G.mid }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.text)}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.mid)}>
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/auth/login"
            className="hidden sm:block px-4 py-2 text-sm font-medium rounded-full transition-all duration-150"
            style={{ color: G.mid }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.text)}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.mid)}>
            Anmelden
          </Link>

          {/* ── Theme toggle ── */}
          <button
            onClick={toggle}
            title={dark ? 'Light Mode' : 'Dark Mode'}
            className="size-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ ...glass, color: G.mid }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { const el = e.currentTarget; el.style.color = G.text; el.style.transform = 'rotate(20deg) scale(1.1)' }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { const el = e.currentTarget; el.style.color = G.mid; el.style.transform = '' }}>
            {dark ? <SunSVG /> : <MoonSVG />}
          </button>

          <GButton href="/auth/register" primary className="px-5 py-2.5 text-sm">
            Kostenlos starten
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </GButton>
        </div>
      </div>
    </nav>
  )
}

/* ─── FAQ item ─── */
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const G = useG()
  const glass = useGlass()
  const [open, setOpen] = useState(false)
  const colors = [BRAND.blue, BRAND.red, BRAND.green, BRAND.yellow, BRAND.blue, BRAND.red, BRAND.green, BRAND.yellow]
  const c = colors[idx % colors.length]
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-2xl px-6 py-5 transition-all duration-200"
      style={{ ...glass, boxShadow: open ? `0 0 20px ${c}18` : 'none', borderColor: open ? `${c}40` : G.border }}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-sm leading-snug" style={{ color: G.text }}>{q}</span>
        <span className="size-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: open ? c : G.border, color: open ? '#fff' : G.mid }}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={13} />
        </span>
      </div>
      <div style={{ maxHeight: open ? '160px' : '0', overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)', marginTop: open ? '12px' : '0' }}>
        <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{a}</p>
      </div>
    </button>
  )
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return <p className="g-reveal text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color }}>{text}</p>
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
function LandingPage() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('azubihub-theme') !== 'light'
    return true
  })
  const toggle = () => {
    const next = !dark; setDark(next)
    localStorage.setItem('azubihub-theme', next ? 'dark' : 'light')
  }

  useScrollReveal()

  const G = makeG(dark)
  const glass = makeGlass(dark)
  const gradText = makeGradText(dark)

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      <div style={{ background: G.bg, color: G.text, fontFamily: '"Google Sans","Segoe UI",system-ui,sans-serif', transition: 'background 0.4s ease, color 0.3s ease' }} className="min-h-screen overflow-x-hidden">
        <LandingNav />

        {/* ════ 1. HERO ════ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 pb-24 overflow-hidden">
          <OrbitalRings />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="g-reveal inline-flex items-center gap-3 rounded-full px-5 py-2.5 mb-10 text-sm font-medium" style={{ ...glass, color: G.mid }}>
              <span className="flex gap-1.5">
                {[BRAND.blue, BRAND.red, BRAND.yellow, BRAND.green].map(c => (
                  <span key={c} className="size-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                ))}
              </span>
              Für Betriebe · Ausbilder · Auszubildende
            </div>
            {/* Headline */}
            <h1 className="g-reveal font-black tracking-tight leading-none mb-8"
              style={{ ...gradText, fontSize: 'clamp(52px, 9vw, 96px)', letterSpacing: '-3px', transitionDelay: '0.1s' }}>
              Ausbildung, neu gedacht.
            </h1>
            <p className="g-reveal text-xl leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>
              AzubiHub digitalisiert Berichtshefte, Ausbilder-Freigaben und die gesamte Ausbildungsdokumentation.
              KI-gestützt, IHK-konform und dauerhaft kostenlos.
            </p>
            <div className="g-reveal flex flex-col sm:flex-row gap-4 justify-center mb-14" style={{ transitionDelay: '0.3s' }}>
              <GButton href="/auth/register" primary className="text-base px-9 py-4">
                Kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </GButton>
              <a href="#features">
                <span className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-base font-semibold cursor-pointer transition-all duration-200"
                  style={{ ...glass, color: G.text }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)' }}>
                  Features entdecken
                </span>
              </a>
            </div>
            {/* Trust chips */}
            <div className="g-reveal flex flex-wrap items-center justify-center gap-3" style={{ transitionDelay: '0.4s' }}>
              {[
                { icon: Shield01Icon,         label: 'DSGVO-konform',  color: BRAND.blue   },
                { icon: CheckmarkBadge01Icon, label: 'IHK-konform',    color: BRAND.green  },
                { icon: SparklesIcon,         label: 'KI-gestützt',    color: BRAND.purple },
                { icon: LockPasswordIcon,     label: 'EU-Datenschutz', color: BRAND.red    },
              ].map(t => (
                <span key={t.label} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium" style={{ ...glass, color: G.mid }}>
                  <HugeiconsIcon icon={t.icon} size={13} style={{ color: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          {/* Scroll cue */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ color: G.muted, opacity: 0.4, animation: 'goog-float4 2.8s ease-in-out infinite' }}>
            <div className="size-6 rounded-full border border-current flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-current" />
            </div>
          </div>
        </section>

        {/* ════ 2. STATS ════ */}
        <section className="py-20 px-6" style={{ background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className="g-reveal text-center" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="size-2 rounded-full mx-auto mb-4" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }} />
                <div className="text-5xl sm:text-6xl font-black mb-2 tabular-nums" style={{ color: s.color, filter: `drop-shadow(0 0 16px ${s.color}60)` }}>
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-sm font-medium" style={{ color: G.mid }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════ 3. FEATURES ════ */}
        <section id="features" className="py-28 px-6 relative overflow-hidden" style={{ background: G.bg }}>
          <div className="absolute pointer-events-none rounded-full" style={{ width: 600, height: 600, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.06' : '0.04'}) 0%, transparent 70%)`, top: '0%', left: '-10%' }} />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <SectionLabel text="Was AzubiHub leistet" color={BRAND.blue} />
              <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-2px', transitionDelay: '0.1s' }}>
                Vier Gründe,<br />die überzeugen.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FEATURES.map((f, i) => (
                <div key={f.title}
                  className="g-reveal rounded-3xl p-8 relative overflow-hidden transition-all duration-300 cursor-default group"
                  style={{ ...glass, transitionDelay: `${i * 0.08}s` }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.98)'; el.style.borderColor = `${f.color}30`; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 20px 60px ${f.glow}` }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'; el.style.borderColor = G.border; el.style.transform = ''; el.style.boxShadow = '' }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${f.color}20 0%, transparent 70%)` }} />
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: dark ? f.bg : f.bgLight }}>
                      <HugeiconsIcon icon={f.icon} size={26} style={{ color: dark ? f.color : f.colorLight }} />
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: dark ? f.bg : f.bgLight, color: dark ? f.color : f.colorLight }}>{f.stat}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 relative z-10" style={{ color: G.text }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed relative z-10" style={{ color: G.mid }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 4. PROBLEM / LÖSUNG ════ */}
        <section className="py-28 px-6 relative overflow-hidden" style={{ background: G.surface }}>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <SectionLabel text="Die Ausgangslage" color={BRAND.red} />
              <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-2px', transitionDelay: '0.1s' }}>
                So war es bisher.<br /><span style={{ color: BRAND.green }}>So geht es besser.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="g-reveal-left rounded-3xl p-8" style={{ ...glass, borderColor: `rgba(234,67,53,${dark ? '0.15' : '0.25'})` }}>
                <div className="flex items-center gap-3 mb-7">
                  <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: dark ? 'rgba(234,67,53,0.15)' : '#fce8e6' }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} style={{ color: BRAND.red }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: G.text }}>Ohne AzubiHub</p>
                    <p className="text-xs" style={{ color: G.mid }}>Der Ausbildungsalltag heute</p>
                  </div>
                </div>
                <ul className="space-y-5">
                  {[
                    { t: '3+ Stunden Schreibaufwand/Woche',  d: 'Für Berichte, die nur der Ausbilder liest.' },
                    { t: 'Papierdokumente gehen verloren',    d: 'Kein Ablagesystem, kein Backup, alles im Ordner.' },
                    { t: 'Freigabe per E-Mail & Telefon',     d: 'Hin- und herschicken, Korrekturen, erneut senden.' },
                    { t: 'IHK-Fristen werden übersehen',      d: 'Kein Überblick, keine automatischen Erinnerungen.' },
                  ].map(item => (
                    <li key={item.t} className="flex items-start gap-3.5">
                      <div className="size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: dark ? 'rgba(234,67,53,0.15)' : '#fce8e6' }}>
                        <HugeiconsIcon icon={Cancel01Icon} size={9} style={{ color: BRAND.red }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: dark ? '#f28b82' : '#c5221f' }}>{item.t}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: G.mid }}>{item.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="g-reveal-right rounded-3xl p-8 relative overflow-hidden" style={{ ...glass, borderColor: `rgba(52,168,83,${dark ? '0.2' : '0.35'})` }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(52,168,83,${dark ? '0.08' : '0.05'}) 0%, transparent 70%)` }} />
                <div className="flex items-center gap-3 mb-7 relative z-10">
                  <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: dark ? 'rgba(52,168,83,0.15)' : '#e6f4ea' }}>
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} style={{ color: BRAND.green }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: G.text }}>Mit AzubiHub</p>
                    <p className="text-xs" style={{ color: G.mid }}>Digitaler Workflow der funktioniert</p>
                  </div>
                </div>
                <ul className="space-y-5 relative z-10">
                  {[
                    { t: '15 Minuten statt 3 Stunden',  d: 'KI formuliert IHK-Text aus Stichpunkten — in Sekunden.' },
                    { t: 'Alles zentral in der Cloud',   d: 'Sicheres Ablagesystem, Backup, auf allen Geräten.' },
                    { t: 'Digitaler Freigabe-Workflow',  d: 'Einreichen, kommentieren, freigeben — ein Klick.' },
                    { t: 'Keine Frist mehr verpassen',   d: 'Erinnerungen und Live-Statusübersicht für Ausbilder.' },
                  ].map(item => (
                    <li key={item.t} className="flex items-start gap-3.5">
                      <div className="size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: dark ? 'rgba(52,168,83,0.15)' : '#e6f4ea' }}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={9} style={{ color: BRAND.green }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: dark ? '#81c995' : '#137333' }}>{item.t}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: G.mid }}>{item.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ════ 5. TESTIMONIALS ════ */}
        <section className="py-28 px-6 relative overflow-hidden" style={{ background: G.bg }}>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <SectionLabel text="Echte Meinungen" color={BRAND.yellow} />
              <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-2px', transitionDelay: '0.1s' }}>Was andere sagen.</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name}
                  className="g-reveal rounded-3xl p-6 flex flex-col transition-all duration-300"
                  style={{ ...glass, transitionDelay: `${i * 0.07}s` }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.98)'; el.style.borderColor = `${t.color}25`; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 20px 50px rgba(0,0,0,${dark ? '0.3' : '0.1'})` }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'; el.style.borderColor = G.border; el.style.transform = ''; el.style.boxShadow = '' }}>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <HugeiconsIcon key={j} icon={StarIcon} size={13} style={{ color: BRAND.yellow }} />)}
                  </div>
                  <HugeiconsIcon icon={QuoteUpIcon} size={20} style={{ color: `${t.color}${dark ? '35' : '50'}`, marginBottom: 10 }} />
                  <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: G.mid }}>{t.text}</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${G.border}` }}>
                    <div className="size-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ background: t.color }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: G.text }}>{t.name}</p>
                      <p className="text-[10px]" style={{ color: G.muted }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 6. HOW IT WORKS ════ */}
        <section id="how-it-works" className="py-28 px-6 relative overflow-hidden" style={{ background: G.surface }}>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <SectionLabel text="Der Einstieg" color={BRAND.green} />
              <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-2px', transitionDelay: '0.1s' }}>In 3 Schritten startklar.</h2>
              <p className="g-reveal text-lg mt-5 max-w-lg mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>Kein Onboarding-Aufwand. Kein IT-Projekt. Einfach loslegen.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
              <div className="absolute top-10 hidden sm:block" style={{ left: 'calc(16.7% + 2.5rem)', right: 'calc(16.7% + 2.5rem)', height: 1, background: `linear-gradient(90deg, ${BRAND.blue}50, ${BRAND.red}50, ${BRAND.green}50)` }} />
              {STEPS.map((s, i) => (
                <div key={s.num} className="g-reveal flex flex-col items-center text-center" style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="size-20 rounded-3xl flex items-center justify-center mb-6 text-3xl font-black text-white relative z-10"
                    style={{ background: s.color, boxShadow: `0 0 30px ${s.color}40, 0 8px 24px rgba(0,0,0,0.2)` }}>
                    {s.num}
                    <div className="absolute inset-0 rounded-3xl" style={{ border: `1px solid ${s.color}`, animation: 'goog-pulse-ring 3s ease-out infinite', animationDelay: `${i * 0.8}s` }} />
                  </div>
                  <h3 className="font-bold text-lg mb-3" style={{ color: G.text }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <GButton href="/auth/register" primary className="text-base px-9 py-4">
                Jetzt kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </GButton>
            </div>
          </div>
        </section>

        {/* ════ 7. PRICING ════ */}
        <section id="pricing" className="py-28 px-6 relative overflow-hidden" style={{ background: G.bg }}>
          <div className="absolute pointer-events-none rounded-full" style={{ width: 600, height: 600, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.06' : '0.03'}) 0%, transparent 70%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <SectionLabel text="Preise" color={BRAND.blue} />
              <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-2px', transitionDelay: '0.1s' }}>Einfach. Kostenlos.</h2>
              <p className="g-reveal text-lg mt-5 max-w-lg mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>Kein Abo. Keine Kreditkarte. Keine versteckten Kosten.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div className="g-reveal rounded-3xl p-8 transition-all duration-300" style={{ ...glass }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.98)'; el.style.transform = 'translateY(-4px)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'; el.style.transform = '' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: G.muted }}>Kostenlos</p>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-6xl font-black" style={{ color: G.text }}>0€</span>
                  <span className="mb-2 text-sm" style={{ color: G.mid }}>/ für immer</span>
                </div>
                <p className="text-sm mb-7 leading-relaxed" style={{ color: G.mid }}>Alles für eine vollständige Ausbildungsdokumentation.</p>
                <ul className="space-y-3 mb-8">
                  {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe','PDF-Export','Kalender & Statistiken','Cloud-Sync'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: G.text }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: BRAND.green, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block">
                  <span className="flex items-center justify-center w-full py-3.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200"
                    style={{ border: `1px solid ${G.border}`, color: G.text }}
                    onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => (e.currentTarget as HTMLSpanElement).style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                    onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => (e.currentTarget as HTMLSpanElement).style.background = ''}>
                    Jetzt registrieren
                  </span>
                </Link>
              </div>
              <div className="g-reveal rounded-3xl p-[1px]" style={{ background: `linear-gradient(135deg,${BRAND.blue},${BRAND.green})`, transitionDelay: '0.1s' }}>
                <div className="rounded-[23px] p-8 h-full" style={{ background: G.surface2 }}>
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.blue }}>Pro</p>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: BRAND.blue, color: '#fff' }}>Demnächst</span>
                  </div>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-6xl font-black" style={{ color: G.text }}>4,99€</span>
                    <span className="mb-2 text-sm" style={{ color: G.mid }}>/ Monat</span>
                  </div>
                  <p className="text-sm mb-7 leading-relaxed" style={{ color: G.mid }}>Für Betriebe mit mehreren Auszubildenden.</p>
                  <ul className="space-y-3 mb-8">
                    {['Alles aus Kostenlos','Unbegrenzte KI-Nutzung','Team-Verwaltung (20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App'].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm" style={{ color: G.text }}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: BRAND.blue, flexShrink: 0 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button disabled className="w-full py-3.5 rounded-full text-sm font-semibold opacity-40 cursor-not-allowed" style={{ background: BRAND.blue, color: '#fff' }}>
                    Benachrichtigen wenn verfügbar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ 8. FAQ ════ */}
        <section id="faq" className="py-28 px-6 relative overflow-hidden" style={{ background: G.surface }}>
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <SectionLabel text="FAQ" color={BRAND.red} />
              <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-2px', transitionDelay: '0.1s' }}>Häufige Fragen.</h2>
            </div>
            <div className="space-y-2">
              {FAQS.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} idx={i} />)}
            </div>
            <p className="text-center text-sm mt-10" style={{ color: G.muted }}>
              Noch Fragen?{' '}
              <a href="mailto:kontakt@azubihub.app" className="font-semibold transition-colors" style={{ color: BRAND.blue }}>Schreib uns direkt.</a>
            </p>
          </div>
        </section>

        {/* ════ 9. CTA ════ */}
        <section className="relative py-40 px-6 overflow-hidden" style={{ background: G.bg }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute rounded-full" style={{ width: 700, height: 700, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.08' : '0.05'}) 0%, transparent 65%)` }} />
            <div className="absolute rounded-full" style={{ width: 480, height: 480, border: `1px solid rgba(66,133,244,${dark ? '0.12' : '0.2'})`, animation: 'orbit-cw 22s linear infinite' }}>
              <span className="absolute rounded-full" style={{ width: 10, height: 10, background: BRAND.blue, top: -5, left: '50%', marginLeft: -5, boxShadow: `0 0 16px ${BRAND.blue}` }} />
            </div>
            <div className="absolute rounded-full" style={{ width: 320, height: 320, border: `1px solid rgba(52,168,83,${dark ? '0.14' : '0.22'})`, animation: 'orbit-ccw 16s linear infinite 1s' }}>
              <span className="absolute rounded-full" style={{ width: 8, height: 8, background: BRAND.green, bottom: -4, right: '30%', boxShadow: `0 0 12px ${BRAND.green}` }} />
            </div>
          </div>
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="g-reveal inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold mb-10" style={{ ...glass, color: G.mid }}>
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} style={{ color: BRAND.green }} />
              Kostenlos · Keine Kreditkarte · Sofort startklar
            </div>
            <h2 className="g-reveal font-black tracking-tight leading-none mb-6"
              style={{ ...gradText, fontSize: 'clamp(48px, 8vw, 88px)', letterSpacing: '-2px', transitionDelay: '0.1s' }}>
              Bereit?
            </h2>
            <p className="g-reveal text-xl mb-12 leading-relaxed" style={{ color: G.mid, transitionDelay: '0.2s' }}>
              Hunderte Betriebe haben bereits gewechselt.<br />Der erste Bericht ist in unter 15 Minuten fertig.
            </p>
            <div className="g-reveal flex flex-col sm:flex-row gap-4 justify-center" style={{ transitionDelay: '0.3s' }}>
              <GButton href="/auth/register" primary className="text-base px-10 py-4">
                Kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </GButton>
              <a href="mailto:kontakt@azubihub.app">
                <span className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-semibold cursor-pointer transition-all duration-200"
                  style={{ ...glass, color: G.text }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => (e.currentTarget as HTMLSpanElement).style.background = dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => (e.currentTarget as HTMLSpanElement).style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'}>
                  <HugeiconsIcon icon={Mail01Icon} size={16} />Kontakt aufnehmen
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ════ FOOTER ════ */}
        <footer className="py-14 px-6" style={{ background: G.surface, borderTop: `1px solid ${G.border}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 mb-12">
              <div className="sm:col-span-5">
                <Logo />
                <p className="text-sm leading-relaxed mt-4 max-w-xs" style={{ color: G.mid }}>
                  Die digitale Ausbildungsplattform für moderne Betriebe. KI-gestützt, IHK-konform, kostenlos.
                </p>
                <div className="flex gap-2 mt-5 flex-wrap">
                  {[{ label: 'DSGVO', c: BRAND.blue }, { label: 'IHK-konform', c: BRAND.green }, { label: 'KI-gestützt', c: BRAND.purple }].map(b => (
                    <span key={b.label} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ border: `1px solid ${b.c}30`, color: b.c, background: `${b.c}12` }}>{b.label}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-5">
                  {[{ href: 'mailto:kontakt@azubihub.app', icon: Mail01Icon, label: 'E-Mail' }, { href: 'https://github.com', icon: Github01Icon, label: 'GitHub' }].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`AzubiHub auf ${s.label}`}
                      className="size-10 rounded-xl flex items-center justify-center transition-all duration-150"
                      style={{ ...glass, color: G.muted }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'; el.style.color = G.text }}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'; el.style.color = G.muted }}>
                      <HugeiconsIcon icon={s.icon} size={16} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-3">
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: G.muted }}>Produkt</p>
                <nav className="space-y-3">
                  {[['#features','Features'],['#pricing','Preise'],['#faq','FAQ'],['/auth/register','Registrieren'],['/auth/login','Anmelden']].map(([href, label]) => (
                    <a key={label} href={href} className="block text-sm transition-colors duration-150" style={{ color: G.mid }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.text)}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.mid)}>
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="sm:col-span-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: G.muted }}>Rechtliches</p>
                <nav className="space-y-3">
                  {[{ href: '/impressum', label: 'Impressum' }, { href: '/datenschutz', label: 'Datenschutzerklärung' }, { href: 'mailto:kontakt@azubihub.app', label: 'kontakt@azubihub.app' }].map(({ href, label }) => (
                    <Link key={label} href={href} className="block text-sm transition-colors duration-150" style={{ color: G.mid }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.text)}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.mid)}>
                      {label}
                    </Link>
                  ))}
                  <span className="block text-sm" style={{ color: G.muted }}>AGB (in Vorbereitung)</span>
                </nav>
              </div>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${G.border}` }}>
              <span className="text-xs" style={{ color: G.muted }}>© {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.</span>
              <span className="text-xs" style={{ color: G.muted }}>Gebaut für Auszubildende und Ausbilder in Deutschland</span>
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
