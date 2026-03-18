'use client'

import { useEffect, useRef, useState } from 'react'
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
  SparklesIcon, CheckmarkBadge01Icon, ArrowRight01Icon, BarChartIcon,
  UserMultiple02Icon, Shield01Icon, Time01Icon,
  StarIcon, QuoteUpIcon, CheckmarkCircle01Icon, Cancel01Icon, Add01Icon,
  MinusSignIcon, Mail01Icon, Github01Icon, LockPasswordIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ═══════════════════════════════════════
   APP HOME  (nach Login)
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
   LANDING DATA
═══════════════════════════════════════ */

const G = {
  blue:   '#4285F4',
  red:    '#EA4335',
  yellow: '#FBBC04',
  green:  '#34A853',
  dark:   '#202124',
  mid:    '#5f6368',
  light:  '#f8f9fa',
  border: '#e8eaed',
}

const FEATURES = [
  { icon: BookOpenIcon,        title: 'Kein Papierchaos mehr',              desc: 'Wochenberichte digital erfassen — IHK-konform, strukturiert, ohne Drucken oder Ablegen.',                                              color: G.blue,   bg: '#e8f0fe', stat: '0 Blatt Papier' },
  { icon: SparklesIcon,        title: '80 % weniger Schreibaufwand',         desc: 'Stichpunkte eingeben — KI formuliert professionellen IHK-Text in Sekunden.',                                                            color: '#9c27b0', bg: '#f3e5f5', stat: 'Ø 12 Min.' },
  { icon: CheckmarkBadge01Icon, title: 'Ausbilder-Cockpit',                  desc: 'Alle Berichte, Freigaben und Auszubildenden zentral in einer Ansicht.',                                                                  color: G.green,  bg: '#e6f4ea', stat: 'Bis 20 Azubis' },
  { icon: Shield01Icon,        title: 'DSGVO-sicher & IHK-konform',          desc: 'Verschlüsselt auf EU-Servern. PDF-Export für die IHK mit einem Klick.',                                                                  color: G.red,    bg: '#fce8e6', stat: '100 % EU' },
]

const STATS = [
  { value: '500+',    label: 'Aktive Nutzer',    color: G.blue   },
  { value: '12.000+', label: 'Berichte erstellt', color: G.red    },
  { value: '80%',     label: 'Zeitersparnis',     color: G.yellow },
  { value: '4.9 ★',   label: 'Bewertung',         color: G.green  },
]

const STEPS = [
  { num: 1, title: 'Betrieb registrieren',  desc: 'Konto anlegen, Betrieb einrichten, Auszubildende per E-Mail einladen — in unter 5 Minuten.',   color: G.blue   },
  { num: 2, title: 'Profile einrichten',    desc: 'Auszubildende nehmen die Einladung an und können sofort loslegen.',                              color: G.red    },
  { num: 3, title: 'Digital verwalten',     desc: 'Berichte schreiben, KI nutzen, Ausbilder freigeben — vollständig digital ohne Mehraufwand.',     color: G.green  },
]

const TESTIMONIALS = [
  { name: 'Lena M.',    role: 'Auszubildende · Fachinformatikerin',         text: 'Früher hat das Berichtsheft ewig gedauert. Ich tippe meine Stichpunkte ein und die KI macht den Rest. Absoluter Game Changer!', color: G.blue   },
  { name: 'Thomas K.',  role: 'Ausbilder · IT-Systemkaufmann',              text: 'Endlich kann ich alle Berichte zentral prüfen. Kein E-Mail-Chaos mehr, alles an einem Ort.',                                   color: G.red    },
  { name: 'Sara B.',    role: 'Auszubildende · Kauffrau Büromanagement',    text: 'Das Design ist so aufgeräumt. Man merkt, dass es von jemandem gebaut wurde, der Ausbildung wirklich kennt.',                    color: G.green  },
  { name: 'Marcus D.',  role: 'Ausbilder · Mechatronik',                    text: 'Das Einladungssystem ist super. Ich schicke eine E-Mail und meine Azubis sind in Minuten registriert.',                        color: G.yellow },
  { name: 'Jana F.',    role: 'Auszubildende · Industriekauffrau',          text: 'Direkte Kommentare am Bericht sind Gold wert. Keine langen E-Mail-Threads mehr.',                                              color: G.blue   },
  { name: 'Florian R.', role: 'Ausbildungsleiter · Großbetrieb',            text: 'Wir verwalten 12 Auszubildende über AzubiHub. Die Zeitersparnis gegenüber Papier ist enorm.',                                  color: G.red    },
]

const FAQS = [
  { q: 'Ist AzubiHub kostenlos?',                          a: 'Ja, vollständig kostenlos — für Auszubildende und Ausbilder. Der Kern bleibt dauerhaft gratis.' },
  { q: 'Welche Ausbildungsberufe werden unterstützt?',     a: 'Alle Berufe mit wöchentlichem Ausbildungsnachweis — nahezu alle IHK- und HWK-Berufe.' },
  { q: 'Wie funktioniert die KI-Formulierung?',            a: 'Stichpunkte eingeben → Länge und Stil wählen → Claude AI formuliert IHK-konformen Text in Sekunden.' },
  { q: 'Kann mein Ausbilder die Berichte kommentieren?',   a: 'Ja. Direkt am Bericht kommentieren, Revisionen anfordern oder freigeben — alles in AzubiHub.' },
  { q: 'Sind meine Daten sicher und DSGVO-konform?',       a: 'Ja. Verschlüsselt auf EU-Servern. Wir verarbeiten keine Daten außerhalb der EU.' },
  { q: 'Kann ich meine Berichte exportieren?',             a: 'Ja, als professionelles PDF — alle Jahresberichte in einem Dokument, druckfertig für die IHK.' },
  { q: 'Wie funktioniert die Ausbilder-Einladung?',        a: 'E-Mail-Adresse eingeben → Auszubildende erhalten automatisch eine Einladung und sind in Minuten aktiv.' },
  { q: 'Funktioniert AzubiHub auf dem Smartphone?',        a: 'Ja, vollständig responsive auf Smartphone, Tablet und Desktop. Native App ist in Planung.' },
]

/* ─── Scroll reveal hook ─── */
function useScrollReveal() {
  useEffect(() => {
    const selectors = '.g-reveal, .g-reveal-left, .g-reveal-right, .g-reveal-scale'
    const els = document.querySelectorAll<Element>(selectors)
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('g-visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let start = 0
        const step = Math.ceil(target / 50)
        const timer = setInterval(() => {
          start = Math.min(start + step, target)
          setCount(start)
          if (start >= target) clearInterval(timer)
        }, 30)
      }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString('de-DE')}{suffix}</span>
}

/* ─── Logo ─── */
function Logo({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: G.blue }}>
        <span className="text-white font-black text-sm leading-none">A</span>
      </div>
      <span className="font-bold text-base tracking-tight" style={{ color: light ? G.dark : '#fff' }}>AzubiHub</span>
    </div>
  )
}

/* ─── Nav ─── */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{ background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? `1px solid ${G.border}` : '1px solid transparent', boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none' }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link href="/"><Logo /></Link>
        <div className="hidden md:flex items-center gap-1 text-sm">
          {[['#features','Features'],['#how-it-works','Wie es funktioniert'],['#pricing','Preise'],['#faq','FAQ']].map(([href,label]) => (
            <a key={href} href={href} className="px-3.5 py-2 rounded-full font-medium transition-colors duration-150"
              style={{ color: G.mid }} onMouseEnter={e => (e.currentTarget.style.color = G.dark)} onMouseLeave={e => (e.currentTarget.style.color = G.mid)}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden sm:block px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150"
            style={{ color: G.mid }} onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.dark)} onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = G.mid)}>
            Anmelden
          </Link>
          <Link href="/auth/register">
            <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer select-none"
              style={{ background: G.blue, boxShadow: '0 2px 8px rgba(66,133,244,0.35)' }}
              onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.boxShadow = '0 4px 16px rgba(66,133,244,0.5)'; (e.currentTarget as HTMLSpanElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.boxShadow = '0 2px 8px rgba(66,133,244,0.35)'; (e.currentTarget as HTMLSpanElement).style.transform = '' }}>
              Kostenlos starten
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── FAQ accordion ─── */
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  const colors = [G.blue, G.red, G.green, G.yellow, G.blue, G.red, G.green, G.yellow]
  const c = colors[index % colors.length]
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-2xl px-6 py-5 transition-all duration-200"
      style={{ background: '#fff', border: `1px solid ${open ? c : G.border}`, boxShadow: open ? `0 4px 20px ${c}18` : 'none' }}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-sm leading-snug" style={{ color: G.dark }}>{q}</span>
        <span className="size-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: open ? c : G.border, color: open ? '#fff' : G.mid }}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={13} />
        </span>
      </div>
      <div style={{ maxHeight: open ? '120px' : '0', overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)', marginTop: open ? '12px' : '0' }}>
        <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{a}</p>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */

/* 3-D sphere helper */
function Sphere({ size, grad, style, anim }: { size: number; grad: string; style?: React.CSSProperties; anim: string }) {
  return (
    <div className="absolute pointer-events-none" style={{
      width: size, height: size, borderRadius: '50%',
      background: grad,
      animation: anim,
      ...style,
    }} />
  )
}

function LandingPage() {
  useScrollReveal()

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#fff', color: G.dark, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
      <LandingNav />

      {/* ══════════════════════════════════════
          1. HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-16 px-6 overflow-hidden">

        {/* Floating 3-D objects */}
        <Sphere size={180} anim="goog-float 8s ease-in-out infinite"
          grad="radial-gradient(circle at 35% 30%, #8ab4f8 0%, #4285F4 55%, #1a56db 100%)"
          style={{ top: '8%', right: '5%', filter: 'drop-shadow(0 28px 56px rgba(66,133,244,.4))' }} />
        <Sphere size={120} anim="goog-float2 10s ease-in-out infinite 0.5s"
          grad="radial-gradient(circle at 35% 30%, #f28b82 0%, #EA4335 55%, #b31412 100%)"
          style={{ bottom: '18%', left: '3%', borderRadius: '32px', transform: 'rotate(-12deg)', filter: 'drop-shadow(0 20px 40px rgba(234,67,53,.38))' }} />
        <Sphere size={100} anim="goog-float3 6s ease-in-out infinite 1s"
          grad="radial-gradient(circle at 35% 30%, #81c995 0%, #34A853 55%, #137333 100%)"
          style={{ top: '22%', left: '6%', borderRadius: '24px', filter: 'drop-shadow(0 16px 32px rgba(52,168,83,.38))' }} />
        {/* Yellow ring */}
        <div className="absolute pointer-events-none" style={{
          width: 96, height: 96,
          border: '20px solid #FBBC04',
          borderRadius: '50%',
          top: '14%', left: '14%',
          animation: 'goog-float4 7s ease-in-out infinite 2s',
          filter: 'drop-shadow(0 12px 24px rgba(251,188,4,.45))',
        }} />
        {/* Small accent dots */}
        <Sphere size={52} anim="goog-float2 5s ease-in-out infinite 0.8s"
          grad="radial-gradient(circle at 35% 30%, #8ab4f8 0%, #4285F4 100%)"
          style={{ top: '52%', right: '18%', opacity: 0.7, filter: 'drop-shadow(0 8px 16px rgba(66,133,244,.3))' }} />
        <Sphere size={38} anim="goog-float 6s ease-in-out infinite 1.5s"
          grad="radial-gradient(circle at 35% 30%, #f28b82 0%, #EA4335 100%)"
          style={{ bottom: '38%', right: '28%', opacity: 0.65 }} />
        <Sphere size={64} anim="goog-float3 9s ease-in-out infinite 0.3s"
          grad="radial-gradient(circle at 35% 30%, #fde293 0%, #FBBC04 100%)"
          style={{ bottom: '28%', right: '7%', borderRadius: '20px', opacity: 0.8, filter: 'drop-shadow(0 10px 20px rgba(251,188,4,.35))' }} />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Google dots badge */}
          <div className="g-reveal inline-flex items-center gap-3 rounded-full px-5 py-2.5 mb-10"
            style={{ background: G.light, border: `1px solid ${G.border}`, color: G.mid, fontSize: 13, fontWeight: 500 }}>
            <span className="flex gap-1.5">
              {[G.blue, G.red, G.yellow, G.green].map(c => (
                <span key={c} className="size-2.5 rounded-full inline-block" style={{ background: c }} />
              ))}
            </span>
            Für Ausbildungsbetriebe · Ausbilder · Auszubildende
          </div>

          {/* Headline */}
          <h1 className="g-reveal font-black tracking-tight leading-none mb-8"
            style={{ fontSize: 'clamp(52px, 9vw, 96px)', letterSpacing: '-3px', transitionDelay: '0.1s' }}>
            Ausbildung,{' '}
            <span style={{ color: G.blue }}>neu</span>{' '}
            <span style={{ color: G.red }}>ge</span><span style={{ color: G.yellow }}>dacht</span>
            <span style={{ color: G.green }}>.</span>
          </h1>

          <p className="g-reveal text-xl leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>
            AzubiHub digitalisiert Berichtshefte, Ausbilder-Freigaben und die gesamte Ausbildungsdokumentation.
            KI-gestützt, IHK-konform und dauerhaft kostenlos.
          </p>

          {/* CTA buttons — Google pill style */}
          <div className="g-reveal flex flex-col sm:flex-row gap-4 justify-center mb-14" style={{ transitionDelay: '0.3s' }}>
            <Link href="/auth/register">
              <span className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white cursor-pointer select-none transition-all duration-200"
                style={{ background: G.blue, boxShadow: '0 4px 18px rgba(66,133,244,.4)' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 28px rgba(66,133,244,.5)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = ''; el.style.boxShadow = '0 4px 18px rgba(66,133,244,.4)' }}>
                Kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </span>
            </Link>
            <a href="#features">
              <span className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold cursor-pointer select-none transition-all duration-200"
                style={{ color: G.dark, border: `2px solid ${G.border}`, background: '#fff' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = G.light; el.style.borderColor = '#bdc1c6' }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = '#fff'; el.style.borderColor = G.border }}>
                Features entdecken
              </span>
            </a>
          </div>

          {/* Trust chips */}
          <div className="g-reveal flex flex-wrap items-center justify-center gap-3" style={{ transitionDelay: '0.4s' }}>
            {[
              { icon: Shield01Icon,          label: 'DSGVO-konform',   color: G.blue  },
              { icon: CheckmarkBadge01Icon,  label: 'IHK-konform',     color: G.green },
              { icon: SparklesIcon,          label: 'KI-gestützt',     color: '#9c27b0' },
              { icon: LockPasswordIcon,      label: 'EU-Datenschutz',  color: G.red   },
            ].map(t => (
              <span key={t.label} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: G.light, border: `1px solid ${G.border}`, color: G.mid }}>
                <HugeiconsIcon icon={t.icon} size={14} style={{ color: t.color }} />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: '#bdc1c6', animation: 'goog-float4 2.5s ease-in-out infinite' }}>
          <div className="size-6 rounded-full border-2 border-current flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-current" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. APP MOCKUP SHOWCASE
      ══════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: G.light }}>
        <div className="max-w-5xl mx-auto">
          <div className="g-reveal-scale rounded-3xl overflow-hidden border shadow-2xl" style={{ borderColor: G.border, boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)' }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: '#f1f3f4', borderBottom: `1px solid ${G.border}` }}>
              <div className="flex gap-1.5">
                {[G.red, G.yellow, G.green].map(c => (
                  <div key={c} className="size-3 rounded-full" style={{ background: c, opacity: 0.8 }} />
                ))}
              </div>
              <div className="flex-1 mx-3">
                <div className="max-w-xs mx-auto h-6 rounded-full flex items-center gap-2 px-3" style={{ background: '#fff', border: `1px solid ${G.border}` }}>
                  <HugeiconsIcon icon={LockPasswordIcon} size={10} style={{ color: '#5f6368' }} />
                  <span className="text-[11px]" style={{ color: '#5f6368' }}>azubihub.app/berichtsheft</span>
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="flex" style={{ height: 420 }}>
              {/* Sidebar */}
              <div className="w-16 flex flex-col items-center py-5 gap-4 shrink-0" style={{ background: '#fff', borderRight: `1px solid ${G.border}` }}>
                <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: G.blue }}>
                  <span className="text-white font-black text-xs">A</span>
                </div>
                <div className="h-px w-10 my-1" style={{ background: G.border }} />
                {[BookOpenIcon, BarChartIcon, CalendarIcon, UserMultiple02Icon].map((Ic, i) => (
                  <div key={i} className="size-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: i === 0 ? '#e8f0fe' : 'transparent', color: i === 0 ? G.blue : '#9aa0a6' }}>
                    <HugeiconsIcon icon={Ic} size={18} />
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5 space-y-4 overflow-hidden" style={{ background: '#fff' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: G.mid }}>Wochenberichte</p>
                    <p className="text-sm font-bold" style={{ color: G.dark }}>KW 13 · 2025</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer"
                    style={{ background: '#e8f0fe', color: G.blue }}>
                    <HugeiconsIcon icon={Add01Icon} size={13} />
                    Neuer Bericht
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: '18', l: 'Freigegeben', bg: '#e6f4ea', c: G.green  },
                    { v: '3',  l: 'Ausstehend',  bg: '#fef9e7', c: '#f9ab00' },
                    { v: '24', l: 'Gesamt',       bg: '#e8f0fe', c: G.blue   },
                  ].map(s => (
                    <div key={s.l} className="rounded-2xl p-3" style={{ background: s.bg }}>
                      <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: G.mid }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {[
                    { kw: 'KW 11', s: 'Freigegeben', bg: '#e6f4ea', c: G.green   },
                    { kw: 'KW 12', s: 'In Prüfung',  bg: '#fef9e7', c: '#f9ab00' },
                    { kw: 'KW 13', s: 'Entwurf',     bg: G.light,   c: G.mid     },
                  ].map(r => (
                    <div key={r.kw} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${G.border}` }}>
                      <span className="text-xs font-semibold w-12 shrink-0" style={{ color: G.dark }}>{r.kw}</span>
                      <div className="flex gap-1 flex-1">
                        {['Mo','Di','Mi','Do','Fr'].map(d => (
                          <span key={d} className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: '#e8f0fe', color: G.blue }}>{d}</span>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: r.bg, color: r.c }}>{r.s}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl p-3.5" style={{ background: '#f3e5f5', border: '1px solid #e1bee7' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: '#ce93d8' }}>
                      <HugeiconsIcon icon={SparklesIcon} size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#6a1b9a' }}>KI-Formulierung</span>
                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#fff', color: G.mid }}>Ctrl+Enter</span>
                  </div>
                  <p className="text-[10px] italic mb-2" style={{ color: '#7b1fa2' }}>„API-Fehler behoben, Datenbank-Migration, Teammeeting..."</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e1bee7' }}>
                    <div className="h-full rounded-full" style={{ width: '70%', background: '#ab47bc', animation: 'goog-float4 2s ease-in-out infinite' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. STATS
      ══════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={s.label} className="g-reveal text-center" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="text-5xl sm:text-6xl font-black mb-2 tabular-nums" style={{ color: s.color }}>
                {s.value.includes('+') ? <><AnimatedNumber target={parseInt(s.value)} />+</> :
                 s.value.includes('%') ? <><AnimatedNumber target={parseInt(s.value)} />%</> :
                 s.value}
              </div>
              <p className="text-sm font-medium" style={{ color: G.mid }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-28 px-6" style={{ background: G.light }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="g-reveal text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: G.blue }}>Was AzubiHub leistet</p>
            <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>
              Vier Gründe,<br />
              <span style={{ color: G.blue }}>die überzeugen.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="g-reveal rounded-3xl p-8 transition-all duration-300 cursor-default"
                style={{ background: '#fff', border: `1px solid ${G.border}`, transitionDelay: `${i * 0.08}s` }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 12px 40px ${f.color}20`; el.style.borderColor = `${f.color}60` }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = G.border }}>
                <div className="flex items-start justify-between mb-6">
                  <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: f.bg }}>
                    <HugeiconsIcon icon={f.icon} size={26} style={{ color: f.color }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: f.bg, color: f.color }}>{f.stat}</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: G.dark }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. PROBLEM / LÖSUNG
      ══════════════════════════════════════ */}
      <section className="py-28 px-6" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="g-reveal text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: G.red }}>Die Ausgangslage</p>
            <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>
              So war es bisher.<br />
              <span style={{ color: G.green }}>So geht es besser.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem */}
            <div className="g-reveal-left rounded-3xl p-8" style={{ background: '#fce8e6', border: `1px solid #f5c6c2` }}>
              <div className="flex items-center gap-3 mb-7">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: '#f5c6c2' }}>
                  <HugeiconsIcon icon={Cancel01Icon} size={18} style={{ color: G.red }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: G.dark }}>Ohne AzubiHub</p>
                  <p className="text-xs" style={{ color: G.mid }}>Der Ausbildungsalltag heute</p>
                </div>
              </div>
              <ul className="space-y-5">
                {[
                  { t: '3+ Stunden Schreibaufwand pro Woche', d: 'Für Berichte, die nur der Ausbilder liest.' },
                  { t: 'Papierdokumente gehen verloren',       d: 'Kein Ablagesystem, kein Backup, alles im Ordner.' },
                  { t: 'Freigabe per E-Mail und Telefon',      d: 'Hin- und herschicken, Korrekturen, erneut senden.' },
                  { t: 'IHK-Fristen werden übersehen',         d: 'Kein Überblick, keine automatischen Erinnerungen.' },
                ].map(item => (
                  <li key={item.t} className="flex items-start gap-3.5">
                    <div className="size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#f5c6c2' }}>
                      <HugeiconsIcon icon={Cancel01Icon} size={9} style={{ color: G.red }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#c5221f' }}>{item.t}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: G.mid }}>{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="g-reveal-right rounded-3xl p-8" style={{ background: '#e6f4ea', border: `1px solid #a8d5b5` }}>
              <div className="flex items-center gap-3 mb-7">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: '#a8d5b5' }}>
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} style={{ color: G.green }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: G.dark }}>Mit AzubiHub</p>
                  <p className="text-xs" style={{ color: G.mid }}>Digitaler Workflow der wirklich funktioniert</p>
                </div>
              </div>
              <ul className="space-y-5">
                {[
                  { t: '15 Minuten statt 3 Stunden', d: 'KI formuliert IHK-Text aus Stichpunkten — in Sekunden.' },
                  { t: 'Alles zentral in der Cloud', d: 'Sicheres Ablagesystem, Backup, auf allen Geräten.' },
                  { t: 'Digitaler Freigabe-Workflow', d: 'Einreichen, kommentieren, freigeben — ein Klick.' },
                  { t: 'Keine Frist mehr verpassen', d: 'Erinnerungen und Live-Statusübersicht für Ausbilder.' },
                ].map(item => (
                  <li key={item.t} className="flex items-start gap-3.5">
                    <div className="size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#a8d5b5' }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={9} style={{ color: G.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#137333' }}>{item.t}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: G.mid }}>{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="py-28 px-6" style={{ background: G.light }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="g-reveal text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: G.yellow }}>Echte Meinungen</p>
            <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>
              Was andere sagen.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name}
                className="g-reveal rounded-3xl p-6 flex flex-col transition-all duration-300"
                style={{ background: '#fff', border: `1px solid ${G.border}`, transitionDelay: `${i * 0.07}s` }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 12px 40px ${t.color}18`; el.style.borderColor = `${t.color}50` }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = G.border }}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <HugeiconsIcon key={j} icon={StarIcon} size={13} style={{ color: G.yellow }} />)}
                </div>
                <HugeiconsIcon icon={QuoteUpIcon} size={20} style={{ color: `${t.color}40`, marginBottom: 10 }} />
                <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: G.mid }}>{t.text}</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${G.border}` }}>
                  <div className="size-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0"
                    style={{ background: t.color }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: G.dark }}>{t.name}</p>
                    <p className="text-[10px]" style={{ color: G.mid }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-6" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="g-reveal text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: G.green }}>Der Einstieg</p>
            <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>
              In 3 Schritten startklar.
            </h2>
            <p className="g-reveal text-lg mt-4 max-w-lg mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>
              Kein Onboarding-Aufwand. Kein IT-Projekt. Einfach registrieren und loslegen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="absolute top-9 hidden sm:block" style={{ left: 'calc(16.7% + 2.5rem)', right: 'calc(16.7% + 2.5rem)', height: 2, background: `linear-gradient(90deg, ${G.blue}60, ${G.red}60, ${G.green}60)`, borderRadius: 2 }} />
            {STEPS.map((s, i) => (
              <div key={s.num} className="g-reveal flex flex-col items-center text-center" style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="size-20 rounded-3xl flex items-center justify-center mb-6 text-3xl font-black text-white relative z-10"
                  style={{ background: s.color, boxShadow: `0 8px 24px ${s.color}40` }}>
                  {String(s.num).padStart(2, '0')}
                </div>
                <h3 className="font-bold text-lg mb-3" style={{ color: G.dark }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: G.mid }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/auth/register">
              <span className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white cursor-pointer select-none transition-all duration-200"
                style={{ background: G.blue, boxShadow: '0 4px 18px rgba(66,133,244,.4)' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 28px rgba(66,133,244,.5)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = ''; el.style.boxShadow = '0 4px 18px rgba(66,133,244,.4)' }}>
                Jetzt kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          8. PRICING
      ══════════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6" style={{ background: G.light }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="g-reveal text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: G.blue }}>Preise</p>
            <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>Einfach. Kostenlos.</h2>
            <p className="g-reveal text-lg mt-4 max-w-lg mx-auto" style={{ color: G.mid, transitionDelay: '0.2s' }}>Kein Abo. Keine Kreditkarte. Keine versteckten Kosten.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="g-reveal rounded-3xl p-8" style={{ background: '#fff', border: `1px solid ${G.border}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: G.mid }}>Kostenlos</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-6xl font-black" style={{ color: G.dark }}>0€</span>
                <span className="mb-2 text-sm" style={{ color: G.mid }}>/ für immer</span>
              </div>
              <p className="text-sm mb-7 leading-relaxed" style={{ color: G.mid }}>Alles für eine vollständige Ausbildungsdokumentation.</p>
              <ul className="space-y-3 mb-8">
                {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe','PDF-Export','Kalender & Statistiken','Cloud-Sync'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: G.dark }}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: G.green, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="block">
                <span className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200"
                  style={{ border: `2px solid ${G.border}`, color: G.dark }}
                  onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = G.light; el.style.borderColor = '#bdc1c6' }}
                  onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.background = ''; el.style.borderColor = G.border }}>
                  Jetzt registrieren
                </span>
              </Link>
            </div>

            {/* Pro */}
            <div className="g-reveal rounded-3xl p-[2px] relative" style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.green})`, transitionDelay: '0.1s' }}>
              <div className="rounded-[22px] p-8 h-full" style={{ background: '#fff' }}>
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>Pro</p>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: G.blue }}>Demnächst</span>
                </div>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-6xl font-black" style={{ color: G.dark }}>4,99€</span>
                  <span className="mb-2 text-sm" style={{ color: G.mid }}>/ Monat</span>
                </div>
                <p className="text-sm mb-7 leading-relaxed" style={{ color: G.mid }}>Für Betriebe mit mehreren Auszubildenden.</p>
                <ul className="space-y-3 mb-8">
                  {['Alles aus Kostenlos','Unbegrenzte KI','Team-Verwaltung (20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: G.dark }}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} style={{ color: G.blue, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full py-3 rounded-full text-sm font-semibold opacity-50 cursor-not-allowed text-white" style={{ background: G.blue }}>
                  Benachrichtigen wenn verfügbar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          9. FAQ
      ══════════════════════════════════════ */}
      <section id="faq" className="py-28 px-6" style={{ background: '#fff' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="g-reveal text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: G.red }}>FAQ</p>
            <h2 className="g-reveal text-5xl sm:text-6xl font-black tracking-tight" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>Häufige Fragen.</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} index={i} />)}
          </div>
          <p className="text-center text-sm mt-10" style={{ color: G.mid }}>
            Noch Fragen?{' '}
            <a href="mailto:kontakt@azubihub.app" className="font-semibold transition-colors duration-150" style={{ color: G.blue }}>
              Schreib uns direkt.
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          10. CTA
      ══════════════════════════════════════ */}
      <section className="relative py-36 px-6 overflow-hidden" style={{ background: G.blue }}>
        {/* Floating shapes on blue bg */}
        <Sphere size={200} anim="goog-float 9s ease-in-out infinite"
          grad="radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 100%)"
          style={{ top: '-10%', right: '-4%' }} />
        <Sphere size={140} anim="goog-float2 7s ease-in-out infinite 1s"
          grad="radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 100%)"
          style={{ bottom: '-5%', left: '5%' }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="g-reveal inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white/80 mb-10"
            style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}>
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
            Kostenlos · Keine Kreditkarte · Sofort startklar
          </div>
          <h2 className="g-reveal text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.02] mb-6" style={{ letterSpacing: '-2px', transitionDelay: '0.1s' }}>
            Bereit?
          </h2>
          <p className="g-reveal text-xl text-white/70 mb-12 leading-relaxed" style={{ transitionDelay: '0.2s' }}>
            Hunderte Betriebe haben schon gewechselt.<br />
            Der erste Bericht ist in unter 15 Minuten fertig.
          </p>
          <div className="g-reveal flex flex-col sm:flex-row gap-4 justify-center" style={{ transitionDelay: '0.3s' }}>
            <Link href="/auth/register">
              <span className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-semibold cursor-pointer select-none transition-all duration-200"
                style={{ background: '#fff', color: G.blue, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { const el = e.currentTarget as HTMLSpanElement; el.style.transform = ''; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)' }}>
                Kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </span>
            </Link>
            <a href="mailto:kontakt@azubihub.app">
              <span className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-base font-semibold text-white cursor-pointer select-none transition-all duration-200"
                style={{ border: '2px solid rgba(255,255,255,0.4)' }}
                onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { (e.currentTarget as HTMLSpanElement).style.background = '' }}>
                <HugeiconsIcon icon={Mail01Icon} size={16} />
                Kontakt aufnehmen
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="py-14 px-6" style={{ background: G.dark }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 mb-12">
            <div className="sm:col-span-5">
              <Logo light={false} />
              <p className="text-sm leading-relaxed mt-4 max-w-xs" style={{ color: '#9aa0a6' }}>
                Die digitale Ausbildungsplattform für moderne Betriebe. KI-gestützt, IHK-konform, kostenlos.
              </p>
              <div className="flex gap-2 mt-5 flex-wrap">
                {[
                  { label: 'DSGVO',      c: G.blue  },
                  { label: 'IHK-konform', c: G.green },
                  { label: 'KI-gestützt', c: '#ab47bc' },
                ].map(b => (
                  <span key={b.label} className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ border: `1px solid ${b.c}40`, color: b.c, background: `${b.c}15` }}>
                    {b.label}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                {[
                  { href: 'mailto:kontakt@azubihub.app', icon: Mail01Icon,   label: 'E-Mail' },
                  { href: 'https://github.com',          icon: Github01Icon,  label: 'GitHub' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    aria-label={`AzubiHub auf ${s.label}`}
                    className="size-10 rounded-xl flex items-center justify-center transition-all duration-150"
                    style={{ border: '1px solid #3c4043', color: '#9aa0a6' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget; el.style.background = '#3c4043'; el.style.color = '#fff' }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { const el = e.currentTarget; el.style.background = ''; el.style.color = '#9aa0a6' }}>
                    <HugeiconsIcon icon={s.icon} size={16} />
                  </a>
                ))}
              </div>
            </div>

            <div className="sm:col-span-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#5f6368' }}>Produkt</p>
              <nav className="space-y-3">
                {[['#features','Features'],['#pricing','Preise'],['#faq','FAQ'],['/auth/register','Registrieren'],['/auth/login','Anmelden']].map(([href,label]) => (
                  <a key={label} href={href} className="block text-sm transition-colors duration-150" style={{ color: '#9aa0a6' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#9aa0a6')}>
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="sm:col-span-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#5f6368' }}>Rechtliches</p>
              <nav className="space-y-3">
                <Link href="/impressum" className="block text-sm transition-colors duration-150" style={{ color: '#9aa0a6' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#9aa0a6')}>Impressum</Link>
                <Link href="/datenschutz" className="block text-sm transition-colors duration-150" style={{ color: '#9aa0a6' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#9aa0a6')}>Datenschutzerklärung</Link>
                <span className="block text-sm" style={{ color: '#5f6368' }}>AGB (in Vorbereitung)</span>
                <a href="mailto:kontakt@azubihub.app" className="block text-sm transition-colors duration-150" style={{ color: '#9aa0a6' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#9aa0a6')}>kontakt@azubihub.app</a>
              </nav>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid #3c4043' }}>
            <span className="text-xs" style={{ color: '#5f6368' }}>© {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.</span>
            <span className="text-xs" style={{ color: '#5f6368' }}>Gebaut für Auszubildende und Ausbilder in Deutschland</span>
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
