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

/* Google brand colors — identical in both modes */
const BRAND = {
  blue:   '#4285f4',
  red:    '#ea4335',
  yellow: '#fbbc04',
  green:  '#34a853',
  purple: '#9c27b0',
}

/* Google Antigravity exact color palette */
function makeG(dark: boolean) {
  return {
    ...BRAND,
    bg:      dark ? '#0d0f14'                  : '#ffffff',
    surface: dark ? '#161b22'                  : '#f8f9fa',
    surface2:dark ? '#1c2333'                  : '#f1f3f4',
    border:  dark ? 'rgba(255,255,255,0.1)'    : '#dadce0',
    text:    dark ? '#e8eaed'                  : '#202124',
    mid:     dark ? '#9aa0a6'                  : '#5f6368',
    muted:   dark ? '#5f6368'                  : '#80868b',
    link:    dark ? '#8ab4f8'                  : '#1a73e8',
  }
}

/* Google Material card style (light) / Glassmorphism (dark) */
function makeGlass(dark: boolean): React.CSSProperties {
  return dark
    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
    : { background: '#ffffff', border: '1px solid #dadce0', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' }
}

/* Google Antigravity gradient — blue→green (light) / blue→green soft (dark) */
function makeGradText(dark: boolean): React.CSSProperties {
  return {
    background: dark
      ? 'linear-gradient(135deg, #8ab4f8 0%, #81c995 100%)'
      : `linear-gradient(90deg, #1a73e8 0%, #34a853 100%)`,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }
}

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} })
function useTheme()    { return useContext(ThemeCtx) }
function useG()        { const { dark } = useTheme(); return makeG(dark) }

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */

const FEATURES = [
  { icon: BookOpenIcon,         title: 'Kein Papierchaos',        desc: 'Wochenberichte digital, strukturiert und IHK-konform. Kein Drucken, Suchen oder Ablegen.', color: BRAND.blue,   glow: 'rgba(66,133,244,0.2)',   bg: 'rgba(66,133,244,0.12)', bgLight: '#e8f0fe', colorLight: '#1967d2', stat: '0 Papier' },
  { icon: SparklesIcon,         title: '80 % weniger Aufwand',    desc: 'Stichpunkte eingeben — Claude AI formuliert in Sekunden professionellen IHK-Text.',      color: BRAND.purple, glow: 'rgba(156,39,176,0.2)',   bg: 'rgba(156,39,176,0.12)',bgLight: '#f3e5f5', colorLight: '#6a1b9a', stat: 'Ø 12 Min.' },
  { icon: CheckmarkBadge01Icon, title: 'Ausbilder-Cockpit',       desc: 'Alle Berichte, Freigaben und Azubis zentral. Kommentieren und freigeben — sofort.',        color: BRAND.green,  glow: 'rgba(52,168,83,0.2)',    bg: 'rgba(52,168,83,0.12)',  bgLight: '#e6f4ea', colorLight: '#137333', stat: 'Bis 20 Azubis' },
  { icon: Shield01Icon,         title: 'DSGVO & IHK-konform',     desc: 'Verschlüsselt auf EU-Servern. PDF-Export für die IHK mit einem Klick.',                   color: BRAND.red,    glow: 'rgba(234,67,53,0.2)',    bg: 'rgba(234,67,53,0.12)',  bgLight: '#fce8e6', colorLight: '#c5221f', stat: '100 % EU' },
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
      <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.green})` }}>
        <span className="text-white font-black text-sm leading-none">A</span>
      </div>
      <span className="font-bold text-base tracking-tight" style={{ color: G.text }}>AzubiHub</span>
    </div>
  )
}

/* Google-style pill buttons */
function GButton({
  href, children, primary = false, outline = false, className = '',
  onClick,
}: {
  href?: string
  children: React.ReactNode
  primary?: boolean
  outline?: boolean
  className?: string
  onClick?: () => void
}) {
  const { dark } = useTheme()
  const G = useG()

  const base: React.CSSProperties = primary
    ? { background: '#1a73e8', color: '#ffffff', border: '1px solid #1a73e8' }
    : outline
      ? { background: 'transparent', color: G.link, border: `1px solid ${G.border}` }
      : dark
        ? { background: 'rgba(255,255,255,0.08)', color: '#e8eaed', border: '1px solid rgba(255,255,255,0.16)' }
        : { background: '#ffffff', color: '#3c4043', border: '1px solid #dadce0' }

  const inner = (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-medium cursor-pointer select-none transition-all duration-150 ${className}`}
      style={{ ...base, padding: className ? undefined : '0 24px', height: className ? undefined : '40px', fontSize: '14px', lineHeight: '40px' }}
      onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => {
        const el = e.currentTarget as HTMLSpanElement
        if (primary) { el.style.background = '#1765cc'; el.style.boxShadow = '0 1px 3px 1px rgba(66,133,244,0.4)' }
        else if (outline) { el.style.background = `${G.link}0d`; el.style.borderColor = G.link }
        else if (dark) { el.style.background = 'rgba(255,255,255,0.14)' }
        else { el.style.background = '#f8f9fa' }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => {
        const el = e.currentTarget as HTMLSpanElement
        if (primary) { el.style.background = '#1a73e8'; el.style.boxShadow = '' }
        else if (outline) { el.style.background = 'transparent'; el.style.borderColor = G.border }
        else if (dark) { el.style.background = 'rgba(255,255,255,0.08)' }
        else { el.style.background = '#ffffff' }
      }}
      onClick={onClick}>
      {children}
    </span>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

/* Google Antigravity ring particles */
function OrbitalRings() {
  const { dark } = useTheme()
  const o = dark ? 1 : 2.2
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 0 }}>
      {/* Ambient glow */}
      <div className="absolute rounded-full" style={{ width: 900, height: 900, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.07' : '0.1'}) 0%, transparent 65%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div className="absolute rounded-full" style={{ width: 600, height: 600, background: `radial-gradient(circle, rgba(52,168,83,${dark ? '0.04' : '0.07'}) 0%, transparent 70%)`, top: '15%', right: '10%' }} />
      <div className="absolute rounded-full" style={{ width: 400, height: 400, background: `radial-gradient(circle, rgba(234,67,53,${dark ? '0.03' : '0.06'}) 0%, transparent 70%)`, bottom: '20%', left: '5%' }} />

      {/* Ring 1 — outermost CW 32s */}
      <div className="absolute rounded-full" style={{ width: 700, height: 700, border: `1px solid rgba(66,133,244,${0.15 * o})`, animation: 'orbit-cw 32s linear infinite' }}>
        <span className="absolute rounded-full" style={{ width: 14, height: 14, background: BRAND.blue, top: -7, left: '50%', marginLeft: -7, boxShadow: `0 0 20px ${BRAND.blue}, 0 0 40px rgba(66,133,244,0.4)` }} />
        <span className="absolute rounded-full" style={{ width: 7, height: 7, background: `rgba(66,133,244,0.6)`, bottom: -3, right: '25%', boxShadow: `0 0 10px ${BRAND.blue}` }} />
      </div>

      {/* Ring 2 — CCW 22s */}
      <div className="absolute rounded-full" style={{ width: 520, height: 520, border: `1px solid rgba(234,67,53,${0.14 * o})`, animation: 'orbit-ccw 22s linear infinite 1.5s' }}>
        <span className="absolute rounded-full" style={{ width: 11, height: 11, background: BRAND.red, bottom: -5, left: '50%', marginLeft: -5, boxShadow: `0 0 16px ${BRAND.red}, 0 0 32px rgba(234,67,53,0.35)` }} />
        <span className="absolute rounded-full" style={{ width: 5, height: 5, background: `rgba(234,67,53,0.5)`, top: '20%', right: -2 }} />
      </div>

      {/* Ring 3 — dashed CW 15s */}
      <div className="absolute rounded-full" style={{ width: 340, height: 340, border: `1px dashed rgba(52,168,83,${0.18 * o})`, animation: 'orbit-cw 15s linear infinite 0.8s' }}>
        <span className="absolute rounded-full" style={{ width: 9, height: 9, background: BRAND.green, top: -4, right: '20%', boxShadow: `0 0 14px ${BRAND.green}, 0 0 28px rgba(52,168,83,0.3)` }} />
      </div>

      {/* Ring 4 — innermost CCW 9s */}
      <div className="absolute rounded-full" style={{ width: 180, height: 180, border: `1px solid rgba(251,188,4,${0.22 * o})`, animation: 'orbit-ccw 9s linear infinite 0.3s' }}>
        <span className="absolute rounded-full" style={{ width: 7, height: 7, background: BRAND.yellow, top: -3, left: '50%', marginLeft: -3, boxShadow: `0 0 12px ${BRAND.yellow}` }} />
      </div>

      {/* Center orb */}
      <div className="absolute rounded-full" style={{ width: 56, height: 56, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.9' : '0.5'}) 0%, rgba(66,133,244,0) 70%)`, animation: 'goog-glow-pulse 3.5s ease-in-out infinite', boxShadow: `0 0 40px rgba(66,133,244,0.5), 0 0 80px rgba(66,133,244,0.2)` }} />
    </div>
  )
}

/* ─── Google-style Navigation ─── */
function LandingNav() {
  const G = useG()
  const { dark, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-200"
      style={{
        background:   scrolled ? (dark ? 'rgba(13,15,20,0.95)' : 'rgba(255,255,255,0.97)') : 'transparent',
        borderBottom: scrolled ? `1px solid ${G.border}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        boxShadow: scrolled && !dark ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
      }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/"><Logo /></Link>

        <div className="hidden md:flex items-center gap-1 text-sm">
          {[['#features','Features'],['#how-it-works','So funktioniert\'s'],['#pricing','Preise'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150"
              style={{ color: G.mid }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = G.text; e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f1f3f4' }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = G.mid; e.currentTarget.style.background = 'transparent' }}>
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/auth/login"
            className="hidden sm:block px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150"
            style={{ color: G.mid }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = G.text; e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f1f3f4' }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = G.mid; e.currentTarget.style.background = 'transparent' }}>
            Anmelden
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={dark ? 'Light Mode' : 'Dark Mode'}
            className="size-9 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ color: G.mid, border: `1px solid ${G.border}` }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { const el = e.currentTarget; el.style.background = dark ? 'rgba(255,255,255,0.08)' : '#f1f3f4'; el.style.color = G.text }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = G.mid }}>
            {dark ? <SunSVG /> : <MoonSVG />}
          </button>

          <GButton href="/auth/register" primary>
            Kostenlos starten
          </GButton>
        </div>
      </div>
    </nav>
  )
}

/* ─── Google Material Accordion ─── */
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const G = useG()
  const { dark } = useTheme()
  const [open, setOpen] = useState(false)
  const colors = [BRAND.blue, BRAND.red, BRAND.green, BRAND.yellow, BRAND.blue, BRAND.red, BRAND.green, BRAND.yellow]
  const c = colors[idx % colors.length]
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left px-6 py-5 transition-all duration-150"
      style={{
        background: dark ? (open ? 'rgba(255,255,255,0.05)' : 'transparent') : (open ? '#f8f9fa' : '#ffffff'),
        borderBottom: `1px solid ${G.border}`,
      }}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-sm leading-snug" style={{ color: G.text }}>{q}</span>
        <span className="size-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: open ? c : 'transparent', color: open ? '#fff' : G.muted, border: `1px solid ${open ? c : G.border}` }}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={12} />
        </span>
      </div>
      <div style={{ maxHeight: open ? '160px' : '0', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)', marginTop: open ? '10px' : '0' }}>
        <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{a}</p>
      </div>
    </button>
  )
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <div className="g-reveal flex justify-center mb-5">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full"
        style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}>
        {text}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
function LandingPage() {
  /* Default LIGHT — matching antigravity.google */
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('azubihub-theme') === 'dark'
    return false
  })
  const toggle = () => {
    const next = !dark; setDark(next)
    localStorage.setItem('azubihub-theme', next ? 'dark' : 'light')
  }

  useScrollReveal()

  const G = makeG(dark)
  const glass = makeGlass(dark)
  const gradText = makeGradText(dark)

  /* Material card hover helpers */
  const cardHoverIn = (el: HTMLElement, color?: string) => {
    el.style.boxShadow = dark
      ? `0 8px 32px rgba(0,0,0,0.5)`
      : `0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)`
    el.style.transform = 'translateY(-2px)'
    if (color && !dark) el.style.borderColor = `${color}50`
  }
  const cardHoverOut = (el: HTMLElement) => {
    el.style.boxShadow = dark
      ? 'none'
      : '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
    el.style.transform = ''
    if (!dark) el.style.borderColor = '#dadce0'
  }

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      <div style={{ background: G.bg, color: G.text, fontFamily: '"Google Sans","Roboto","Segoe UI",system-ui,sans-serif', transition: 'background 0.3s, color 0.3s' }} className="min-h-screen overflow-x-hidden">
        <LandingNav />

        {/* ════ 1. HERO ════ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-28 overflow-hidden"
          style={dark ? {} : { background: 'linear-gradient(180deg,#f8f9ff 0%,#ffffff 55%)' }}>
          <OrbitalRings />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Google-style pill badge */}
            <div className="g-reveal inline-flex items-center gap-2 rounded-full px-5 py-2 mb-10 text-sm font-medium"
              style={{
                background: dark ? 'rgba(138,180,248,0.12)' : '#e8f0fe',
                border: dark ? '1px solid rgba(138,180,248,0.25)' : '1px solid #c5d7fd',
                color: dark ? '#8ab4f8' : '#1967d2',
              }}>
              <HugeiconsIcon icon={SparklesIcon} size={13} />
              Neu · KI-Formulierung mit Claude AI
            </div>

            {/* Display headline */}
            <h1 className="g-reveal font-black tracking-tight leading-none mb-8"
              style={{ ...gradText, fontSize: 'clamp(52px,8.5vw,92px)', letterSpacing: '-3px', transitionDelay: '0.1s' }}>
              Ausbildung,<br />neu gedacht.
            </h1>

            <p className="g-reveal text-xl leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>
              AzubiHub digitalisiert Berichtshefte, Ausbilder-Freigaben und die gesamte
              Ausbildungsdokumentation — KI-gestützt, IHK-konform, kostenlos.
            </p>

            {/* CTA row */}
            <div className="g-reveal flex flex-col sm:flex-row gap-3 justify-center mb-14" style={{ transitionDelay: '0.3s' }}>
              <GButton href="/auth/register" primary className="text-[15px] px-8 py-3 h-auto leading-none">
                Kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </GButton>
              <GButton href="#features" outline className="text-[15px] px-8 py-3 h-auto leading-none">
                Features entdecken
              </GButton>
            </div>

            {/* Trust row */}
            <div className="g-reveal flex flex-wrap items-center justify-center gap-2.5" style={{ transitionDelay: '0.4s' }}>
              {[
                { icon: Shield01Icon,         label: 'DSGVO-konform',  color: BRAND.blue   },
                { icon: CheckmarkBadge01Icon, label: 'IHK-konform',    color: BRAND.green  },
                { icon: SparklesIcon,         label: 'KI-gestützt',    color: BRAND.purple },
                { icon: LockPasswordIcon,     label: 'EU-Server',      color: BRAND.red    },
              ].map(t => (
                <span key={t.label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.06)' : `${t.color}0f`,
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : `${t.color}28`}`,
                    color: dark ? G.mid : t.color,
                  }}>
                  <HugeiconsIcon icon={t.icon} size={12} style={{ color: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ opacity: 0.35 }}>
            <div className="size-6 rounded-full border flex items-center justify-center" style={{ borderColor: G.muted }}>
              <div className="size-1.5 rounded-full" style={{ background: G.muted, animation: 'goog-float4 2.5s ease-in-out infinite' }} />
            </div>
          </div>
        </section>

        {/* ════ 2. STATS ════ */}
        <section className="py-20 px-6" style={{ background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-10">
            {STATS.map((s, i) => (
              <div key={s.label} className="g-reveal text-center" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="size-2 rounded-full mx-auto mb-4" style={{ background: s.color }} />
                <div className="text-5xl sm:text-6xl font-black mb-2 tabular-nums" style={{ color: s.color }}>
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-sm font-medium" style={{ color: G.mid }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════ 3. FEATURES ════ */}
        <section id="features" className="py-28 px-6" style={{ background: G.bg }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel text="Was AzubiHub leistet" color={BRAND.blue} />
              <h2 className="g-reveal text-4xl sm:text-5xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-1.5px', transitionDelay: '0.1s' }}>
                Vier Gründe, die überzeugen.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div key={f.title}
                  className="g-reveal rounded-2xl p-7 relative overflow-hidden cursor-default"
                  style={{ ...glass, transitionDelay: `${i * 0.08}s`, transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => cardHoverIn(e.currentTarget, f.color)}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => cardHoverOut(e.currentTarget)}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="size-12 rounded-xl flex items-center justify-center" style={{ background: dark ? f.bg : f.bgLight }}>
                      <HugeiconsIcon icon={f.icon} size={24} style={{ color: dark ? f.color : f.colorLight }} />
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: dark ? f.bg : f.bgLight, color: dark ? f.color : f.colorLight }}>
                      {f.stat}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: G.text }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 4. PROBLEM / LÖSUNG ════ */}
        <section className="py-28 px-6" style={{ background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel text="Die Ausgangslage" color={BRAND.red} />
              <h2 className="g-reveal text-4xl sm:text-5xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-1.5px', transitionDelay: '0.1s' }}>
                So war es bisher.{' '}
                <span style={{ WebkitTextFillColor: BRAND.green, background: 'none' }}>So geht es besser.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* WITHOUT */}
              <div className="g-reveal-left rounded-2xl p-7" style={{ ...glass, borderColor: dark ? 'rgba(234,67,53,0.2)' : '#fad2cf' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-9 rounded-lg flex items-center justify-center" style={{ background: dark ? 'rgba(234,67,53,0.15)' : '#fce8e6' }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={17} style={{ color: BRAND.red }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: G.text }}>Ohne AzubiHub</p>
                    <p className="text-xs" style={{ color: G.mid }}>Der Ausbildungsalltag heute</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {[
                    { t: '3+ Stunden Schreibaufwand/Woche',  d: 'Für Berichte, die nur der Ausbilder liest.' },
                    { t: 'Papierdokumente gehen verloren',    d: 'Kein Ablagesystem, kein Backup, alles im Ordner.' },
                    { t: 'Freigabe per E-Mail & Telefon',     d: 'Hin- und herschicken, Korrekturen, erneut senden.' },
                    { t: 'IHK-Fristen werden übersehen',      d: 'Kein Überblick, keine automatischen Erinnerungen.' },
                  ].map(item => (
                    <li key={item.t} className="flex items-start gap-3">
                      <div className="size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: dark ? 'rgba(234,67,53,0.15)' : '#fce8e6' }}>
                        <HugeiconsIcon icon={Cancel01Icon} size={9} style={{ color: BRAND.red }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: dark ? '#f28b82' : '#c5221f' }}>{item.t}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: G.mid }}>{item.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* WITH */}
              <div className="g-reveal-right rounded-2xl p-7" style={{ ...glass, borderColor: dark ? 'rgba(52,168,83,0.25)' : '#ceead6' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-9 rounded-lg flex items-center justify-center" style={{ background: dark ? 'rgba(52,168,83,0.15)' : '#e6f4ea' }}>
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={17} style={{ color: BRAND.green }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: G.text }}>Mit AzubiHub</p>
                    <p className="text-xs" style={{ color: G.mid }}>Digitaler Workflow der funktioniert</p>
                  </div>
                </div>
                <ul className="space-y-4">
                  {[
                    { t: '15 Minuten statt 3 Stunden',  d: 'KI formuliert IHK-Text aus Stichpunkten — in Sekunden.' },
                    { t: 'Alles zentral in der Cloud',   d: 'Sicheres Ablagesystem, Backup, auf allen Geräten.' },
                    { t: 'Digitaler Freigabe-Workflow',  d: 'Einreichen, kommentieren, freigeben — ein Klick.' },
                    { t: 'Keine Frist mehr verpassen',   d: 'Erinnerungen und Live-Statusübersicht für Ausbilder.' },
                  ].map(item => (
                    <li key={item.t} className="flex items-start gap-3">
                      <div className="size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: dark ? 'rgba(52,168,83,0.15)' : '#e6f4ea' }}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={9} style={{ color: BRAND.green }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: dark ? '#81c995' : '#137333' }}>{item.t}</p>
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
        <section className="py-28 px-6" style={{ background: G.bg }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel text="Echte Meinungen" color={BRAND.yellow} />
              <h2 className="g-reveal text-4xl sm:text-5xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-1.5px', transitionDelay: '0.1s' }}>
                Was andere sagen.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name}
                  className="g-reveal rounded-2xl p-6 flex flex-col"
                  style={{ ...glass, transitionDelay: `${i * 0.07}s`, transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => cardHoverIn(e.currentTarget, t.color)}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => cardHoverOut(e.currentTarget)}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <HugeiconsIcon key={j} icon={StarIcon} size={12} style={{ color: BRAND.yellow }} />)}
                  </div>
                  <HugeiconsIcon icon={QuoteUpIcon} size={18} style={{ color: `${t.color}${dark ? '40' : '55'}`, marginBottom: 8 }} />
                  <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: G.mid }}>{t.text}</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${G.border}` }}>
                    <div className="size-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ background: t.color }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: G.text }}>{t.name}</p>
                      <p className="text-[10px]" style={{ color: G.muted }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ 6. HOW IT WORKS ════ */}
        <section id="how-it-works" className="py-28 px-6" style={{ background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel text="Der Einstieg" color={BRAND.green} />
              <h2 className="g-reveal text-4xl sm:text-5xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-1.5px', transitionDelay: '0.1s' }}>
                In 3 Schritten startklar.
              </h2>
              <p className="g-reveal text-lg mt-4 max-w-lg mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>
                Kein Onboarding-Aufwand. Kein IT-Projekt. Einfach loslegen.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
              {/* Connector line */}
              <div className="absolute top-10 hidden sm:block" style={{ left: 'calc(16.7% + 2.5rem)', right: 'calc(16.7% + 2.5rem)', height: '1px', background: `linear-gradient(90deg, ${BRAND.blue}60, ${BRAND.red}60, ${BRAND.green}60)` }} />
              {STEPS.map((s, i) => (
                <div key={s.num} className="g-reveal flex flex-col items-center text-center" style={{ transitionDelay: `${i * 0.12}s` }}>
                  <div className="size-20 rounded-2xl flex items-center justify-center mb-6 text-3xl font-black text-white relative z-10"
                    style={{ background: s.color, boxShadow: dark ? `0 0 24px ${s.color}50` : `0 4px 16px ${s.color}40` }}>
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-base mb-2.5" style={{ color: G.text }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <GButton href="/auth/register" primary className="text-[15px] px-8 py-3 h-auto leading-none">
                Jetzt kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </GButton>
            </div>
          </div>
        </section>

        {/* ════ 7. PRICING ════ */}
        <section id="pricing" className="py-28 px-6" style={{ background: G.bg }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel text="Preise" color={BRAND.blue} />
              <h2 className="g-reveal text-4xl sm:text-5xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-1.5px', transitionDelay: '0.1s' }}>
                Einfach. Kostenlos.
              </h2>
              <p className="g-reveal text-lg mt-4 max-w-lg mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>
                Kein Abo. Keine Kreditkarte. Keine versteckten Kosten.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {/* Free */}
              <div className="g-reveal rounded-2xl p-8" style={{ ...glass, transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => cardHoverIn(e.currentTarget)}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => cardHoverOut(e.currentTarget)}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: G.muted }}>Kostenlos</p>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-5xl font-black" style={{ color: G.text }}>0€</span>
                  <span className="mb-1.5 text-sm" style={{ color: G.mid }}>/ für immer</span>
                </div>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: G.mid }}>Alles für eine vollständige Ausbildungsdokumentation.</p>
                <ul className="space-y-3 mb-7">
                  {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe','PDF-Export','Kalender & Statistiken','Cloud-Sync'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: G.text }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} style={{ color: BRAND.green, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <GButton href="/auth/register" outline className="w-full justify-center text-sm px-6 py-2.5 h-auto leading-none">
                  Jetzt registrieren
                </GButton>
              </div>
              {/* Pro */}
              <div className="g-reveal rounded-2xl p-[1px]" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.green})`, transitionDelay: '0.1s' }}>
                <div className="rounded-[15px] p-8 h-full" style={{ background: dark ? G.surface2 : '#ffffff' }}>
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: BRAND.blue }}>Pro</p>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: BRAND.blue, color: '#fff' }}>Demnächst</span>
                  </div>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-5xl font-black" style={{ color: G.text }}>4,99€</span>
                    <span className="mb-1.5 text-sm" style={{ color: G.mid }}>/ Monat</span>
                  </div>
                  <p className="text-sm mb-6 leading-relaxed" style={{ color: G.mid }}>Für Betriebe mit mehreren Auszubildenden.</p>
                  <ul className="space-y-3 mb-7">
                    {['Alles aus Kostenlos','Unbegrenzte KI-Nutzung','Team-Verwaltung (20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App'].map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: G.text }}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} style={{ color: BRAND.blue, flexShrink: 0 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button disabled className="w-full py-2.5 rounded-full text-sm font-medium opacity-40 cursor-not-allowed" style={{ background: BRAND.blue, color: '#fff' }}>
                    Benachrichtigen wenn verfügbar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ 8. FAQ ════ */}
        <section id="faq" className="py-28 px-6" style={{ background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel text="FAQ" color={BRAND.red} />
              <h2 className="g-reveal text-4xl sm:text-5xl font-black tracking-tight" style={{ ...gradText, letterSpacing: '-1.5px', transitionDelay: '0.1s' }}>
                Häufige Fragen.
              </h2>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${G.border}`, background: dark ? G.surface2 : '#ffffff' }}>
              {FAQS.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} idx={i} />)}
            </div>
            <p className="text-center text-sm mt-8" style={{ color: G.muted }}>
              Noch Fragen?{' '}
              <a href="mailto:kontakt@azubihub.app" className="font-semibold transition-colors" style={{ color: G.link }}>Schreib uns direkt.</a>
            </p>
          </div>
        </section>

        {/* ════ 9. CTA ════ */}
        <section className="relative py-36 px-6 overflow-hidden" style={{ background: G.bg }}>
          {/* Background rings (CTA) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute rounded-full" style={{ width: 700, height: 700, background: `radial-gradient(circle, rgba(66,133,244,${dark ? '0.07' : '0.09'}) 0%, transparent 65%)` }} />
            <div className="absolute rounded-full" style={{ width: 500, height: 500, border: `1px solid rgba(66,133,244,${dark ? '0.12' : '0.18'})`, animation: 'orbit-cw 24s linear infinite' }}>
              <span className="absolute rounded-full" style={{ width: 10, height: 10, background: BRAND.blue, top: -5, left: '50%', marginLeft: -5, boxShadow: `0 0 16px ${BRAND.blue}` }} />
            </div>
            <div className="absolute rounded-full" style={{ width: 340, height: 340, border: `1px solid rgba(52,168,83,${dark ? '0.14' : '0.2'})`, animation: 'orbit-ccw 17s linear infinite 1s' }}>
              <span className="absolute rounded-full" style={{ width: 8, height: 8, background: BRAND.green, bottom: -4, right: '30%', boxShadow: `0 0 12px ${BRAND.green}` }} />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="g-reveal inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium mb-10"
              style={{
                background: dark ? 'rgba(52,168,83,0.12)' : '#e6f4ea',
                border: dark ? '1px solid rgba(52,168,83,0.25)' : '1px solid #ceead6',
                color: dark ? '#81c995' : '#137333',
              }}>
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} style={{ color: BRAND.green }} />
              Kostenlos · Keine Kreditkarte · Sofort startklar
            </div>
            <h2 className="g-reveal font-black tracking-tight leading-none mb-6"
              style={{ ...gradText, fontSize: 'clamp(48px,7.5vw,84px)', letterSpacing: '-2px', transitionDelay: '0.1s' }}>
              Bereit?
            </h2>
            <p className="g-reveal text-xl mb-12 leading-relaxed" style={{ color: G.mid, transitionDelay: '0.2s' }}>
              Hunderte Betriebe haben bereits gewechselt.<br />
              Der erste Bericht ist in unter 15 Minuten fertig.
            </p>
            <div className="g-reveal flex flex-col sm:flex-row gap-3 justify-center" style={{ transitionDelay: '0.3s' }}>
              <GButton href="/auth/register" primary className="text-[15px] px-9 py-3 h-auto leading-none">
                Kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </GButton>
              <GButton href="mailto:kontakt@azubihub.app" outline className="text-[15px] px-9 py-3 h-auto leading-none">
                <HugeiconsIcon icon={Mail01Icon} size={15} /> Kontakt aufnehmen
              </GButton>
            </div>
          </div>
        </section>

        {/* ════ FOOTER ════ */}
        <footer className="py-14 px-6" style={{ background: dark ? G.surface : '#202124', borderTop: `1px solid ${dark ? G.border : 'rgba(255,255,255,0.1)'}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 mb-10">
              <div className="sm:col-span-5">
                {/* Footer logo — always use white text in footer */}
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.green})` }}>
                    <span className="text-white font-black text-sm leading-none">A</span>
                  </div>
                  <span className="font-bold text-base tracking-tight text-white">AzubiHub</span>
                </div>
                <p className="text-sm leading-relaxed mt-4 max-w-xs" style={{ color: '#9aa0a6' }}>
                  Die digitale Ausbildungsplattform für moderne Betriebe. KI-gestützt, IHK-konform, kostenlos.
                </p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {[{ label: 'DSGVO', c: BRAND.blue }, { label: 'IHK-konform', c: BRAND.green }, { label: 'KI-gestützt', c: BRAND.purple }].map(b => (
                    <span key={b.label} className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ border: `1px solid ${b.c}40`, color: b.c, background: `${b.c}15` }}>
                      {b.label}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  {[{ href: 'mailto:kontakt@azubihub.app', icon: Mail01Icon, label: 'E-Mail' }, { href: 'https://github.com', icon: Github01Icon, label: 'GitHub' }].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`AzubiHub auf ${s.label}`}
                      className="size-9 rounded-lg flex items-center justify-center transition-all duration-150"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#9aa0a6', border: '1px solid rgba(255,255,255,0.1)' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.14)'; el.style.color = '#e8eaed' }}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = '#9aa0a6' }}>
                      <HugeiconsIcon icon={s.icon} size={15} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#5f6368' }}>Produkt</p>
                <nav className="space-y-3">
                  {[['#features','Features'],['#pricing','Preise'],['#faq','FAQ'],['/auth/register','Registrieren'],['/auth/login','Anmelden']].map(([href, label]) => (
                    <a key={label} href={href} className="block text-sm transition-colors duration-150" style={{ color: '#9aa0a6' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#e8eaed')}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#9aa0a6')}>
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="sm:col-span-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#5f6368' }}>Rechtliches</p>
                <nav className="space-y-3">
                  {[{ href: '/impressum', label: 'Impressum' }, { href: '/datenschutz', label: 'Datenschutzerklärung' }, { href: 'mailto:kontakt@azubihub.app', label: 'kontakt@azubihub.app' }].map(({ href, label }) => (
                    <Link key={label} href={href} className="block text-sm transition-colors duration-150" style={{ color: '#9aa0a6' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#e8eaed')}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#9aa0a6')}>
                      {label}
                    </Link>
                  ))}
                  <span className="block text-sm" style={{ color: '#5f6368' }}>AGB (in Vorbereitung)</span>
                </nav>
              </div>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs" style={{ color: '#5f6368' }}>© {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.</span>
              <span className="text-xs" style={{ color: '#5f6368' }}>Gebaut für Auszubildende und Ausbilder in Deutschland</span>
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
