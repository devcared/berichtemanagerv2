'use client'

import { useEffect, useState } from 'react'
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
   LANDING PAGE  DATA
═══════════════════════════════════════ */

const FEATURES = [
  {
    icon: BookOpenIcon,
    title: 'Kein Papierchaos mehr',
    desc: 'Auszubildende erfassen Wochenberichte digital, strukturiert und IHK-konform. Kein Drucken, kein Suchen, kein Ablegen.',
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'group-hover:border-blue-200',
    stat: '0 Blatt Papier',
  },
  {
    icon: SparklesIcon,
    title: '80 % weniger Schreibaufwand',
    desc: 'Stichpunkte eingeben, KI-Text generieren, fertig. Claude AI formuliert professionellen IHK-konformen Fließtext in Sekunden.',
    color: 'text-violet-600', bg: 'bg-violet-50', border: 'group-hover:border-violet-200',
    stat: 'Ø 12 Min. pro Bericht',
  },
  {
    icon: CheckmarkBadge01Icon,
    title: 'Ausbilder-Cockpit für den Überblick',
    desc: 'Alle Berichte, Freigaben und Auszubildenden in einer Ansicht. Kommentieren, korrigieren und freigeben in Sekunden.',
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'group-hover:border-emerald-200',
    stat: 'Bis zu 20 Azubis',
  },
  {
    icon: Shield01Icon,
    title: 'DSGVO-sicher & IHK-konform',
    desc: 'Alle Daten verschlüsselt in EU-Rechenzentren gespeichert. PDF-Export für die IHK mit einem Klick — kein Compliance-Risiko.',
    color: 'text-teal-600', bg: 'bg-teal-50', border: 'group-hover:border-teal-200',
    stat: '100 % EU-Server',
  },
]

const STATS = [
  { value: '500+',    label: 'Aktive Nutzer',    icon: UserMultiple02Icon },
  { value: '12.000+', label: 'Berichte erstellt', icon: BookOpenIcon },
  { value: '80%',     label: 'Zeitersparnis',     icon: Time01Icon },
  { value: '4.9 ★',   label: 'Nutzerbewertung',   icon: StarIcon },
]

const STEPS = [
  { num: '01', title: 'Betrieb registrieren',   desc: 'Konto erstellen, Ausbildungsbetrieb einrichten und Auszubildende per E-Mail einladen. In unter 5 Minuten startklar.' },
  { num: '02', title: 'Profile einrichten',     desc: 'Auszubildende nehmen die Einladung an, geben Beruf und Betrieb an — und können sofort loslegen.' },
  { num: '03', title: 'Digital verwalten',      desc: 'Berichte schreiben, KI nutzen, Ausbilder freigeben lassen — der gesamte Workflow läuft digital und ohne Mehraufwand.' },
]

const TESTIMONIALS = [
  { name: 'Lena M.',    role: 'Auszubildende · Fachinformatikerin',         text: 'Früher hat das Berichtsheft ewig gedauert. Ich tippe meine Stichpunkte ein und die KI macht den Rest. Absoluter Game Changer!' },
  { name: 'Thomas K.',  role: 'Ausbilder · IT-Systemkaufmann',              text: 'Endlich kann ich alle Berichte zentral prüfen. Kein E-Mail-Chaos mehr, alles an einem Ort und der Überblick ist perfekt.' },
  { name: 'Sara B.',    role: 'Auszubildende · Kauffrau für Büromanagement', text: 'Das Design ist so aufgeräumt und modern. Man merkt, dass es von jemandem gebaut wurde, der die Ausbildung wirklich kennt.' },
  { name: 'Marcus D.',  role: 'Ausbilder · Mechatronik',                    text: 'Das Einladungssystem ist super. Ich schicke die E-Mail und meine Azubis sind in Minuten registriert. Spart enorm Zeit.' },
  { name: 'Jana F.',    role: 'Auszubildende · Industriekauffrau',          text: 'Direkte Kommentare am Bericht sind Gold wert. Keine langen E-Mail-Threads mehr — einfach Feedback direkt im Bericht.' },
  { name: 'Florian R.', role: 'Ausbildungsleiter · Großbetrieb',            text: 'Wir verwalten 12 Auszubildende über AzubiHub. Die Zeitersparnis gegenüber dem alten Papier-System ist enorm.' },
]

const FAQS = [
  { q: 'Ist AzubiHub kostenlos?',                          a: 'Ja, AzubiHub ist vollständig kostenlos nutzbar — für Auszubildende und Ausbilder. Optionale Premium-Features sind geplant, der Kern bleibt dauerhaft gratis.' },
  { q: 'Welche Ausbildungsberufe werden unterstützt?',     a: 'AzubiHub eignet sich für alle Berufe, bei denen ein wöchentlicher Ausbildungsnachweis geführt werden muss — also nahezu alle IHK- und HWK-Berufe.' },
  { q: 'Wie funktioniert die KI-Formulierung?',            a: 'Du gibst Stichpunkte ein, wählst Länge und Stil. Die KI (Claude von Anthropic) formuliert daraus einen professionellen, IHK-konformen Fließtext — in Sekunden.' },
  { q: 'Kann mein Ausbilder die Berichte kommentieren?',   a: 'Ja. Ausbilder können direkt am Bericht kommentieren, Revisionen anfordern oder freigeben. Die gesamte Kommunikation läuft innerhalb von AzubiHub.' },
  { q: 'Sind meine Daten sicher und DSGVO-konform?',       a: 'Ja. Alle Daten werden verschlüsselt in EU-Rechenzentren gespeichert. Wir verarbeiten keine Daten außerhalb der EU und halten uns vollständig an die DSGVO.' },
  { q: 'Kann ich meine Berichte exportieren?',             a: 'Ja, jederzeit als professionelles PDF — alle Wochenberichte eines Jahres in einem Dokument, druckfertig für die IHK.' },
  { q: 'Wie funktioniert die Ausbilder-Einladung?',        a: 'Als Ausbilder gibst du im Verwaltungsbereich die E-Mail-Adresse ein. Die Auszubildenden erhalten automatisch eine Einladung und sind in Minuten aktiv.' },
  { q: 'Funktioniert AzubiHub auf dem Smartphone?',        a: 'Ja, vollständig responsive auf Smartphone, Tablet und Desktop. Eine native App ist in Planung.' },
]

/* ─── SHARED COMPONENTS ─── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center">
        <span className="text-white font-black text-sm leading-none">A</span>
      </div>
      <span className="font-bold text-base tracking-tight text-slate-900">AzubiHub</span>
    </div>
  )
}

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className={cn(
      'fixed top-0 inset-x-0 z-50 bg-white transition-all duration-200',
      scrolled ? 'border-b border-slate-200 shadow-sm' : 'border-b border-slate-100'
    )}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-0.5 text-sm">
          {[['#features','Features'],['#how-it-works','So funktionierts'],['#pricing','Preise'],['#faq','FAQ']].map(([href,label]) => (
            <a key={href} href={href}
              className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150 font-medium">
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/auth/login" className="hidden sm:block">
            <span className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-all cursor-pointer select-none">
              Anmelden
            </span>
          </Link>
          <Link href="/auth/register">
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer select-none shadow-sm">
              Kostenlos starten
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </span>
          </Link>
        </div>

      </div>
    </nav>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-xl border border-slate-200 bg-white px-6 py-5 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-slate-900 text-sm leading-snug">{q}</span>
        <span className={cn(
          'size-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200',
          open ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-500'
        )}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={12} />
        </span>
      </div>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-40 mt-4' : 'max-h-0')}>
        <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <LandingNav />

      {/* ══════════════════════════════════════
          1. HERO
      ══════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 px-6 bg-white overflow-hidden">
        {/* Subtle dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Fade out dot grid at bottom */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white to-transparent" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — Text */}
            <div className="order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-8">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                Für Ausbildungsbetriebe · Auszubildende · Ausbilder
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.06] text-slate-900 mb-6">
                Ausbildungsverwaltung,{' '}
                <span className="text-blue-600">die wirklich</span>
                {' '}funktioniert.
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                AzubiHub digitalisiert Berichtshefte, Ausbilder-Freigaben und die gesamte Ausbildungsdokumentation — für Betriebe jeder Größe. Kostenlos, IHK-konform, KI-gestützt.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 px-8 text-base gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
                    Kostenlos starten
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base w-full sm:w-auto border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                    So funktioniert's
                  </Button>
                </a>
              </div>

              {/* Trust strip */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['LM','TK','SB','MD','JF'].map((init, i) => (
                    <div key={init} className="size-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444'][i], zIndex: 5 - i }}>
                      {init}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">500+ Betriebe & Auszubildende</span>
                  {' '}vertrauen AzubiHub
                </div>
              </div>
            </div>

            {/* Right — App mockup */}
            <div className="order-1 lg:order-2 relative">

              {/* Floating badges */}
              <div className="absolute -left-4 top-12 z-20 hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 px-3 py-2">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">IHK-konform</span>
              </div>
              <div className="absolute -right-4 top-1/3 z-20 hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 px-3 py-2">
                <HugeiconsIcon icon={SparklesIcon} size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-slate-700">KI-gestützt</span>
              </div>
              <div className="absolute -right-2 bottom-16 z-20 hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 px-3 py-2">
                <HugeiconsIcon icon={Shield01Icon} size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-slate-700">DSGVO</span>
              </div>

              {/* Browser frame */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
                {/* Title bar */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-slate-300" />
                    <div className="size-2.5 rounded-full bg-slate-300" />
                    <div className="size-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="max-w-[200px] mx-auto h-5 rounded-md bg-slate-200 flex items-center gap-1.5 px-2">
                      <HugeiconsIcon icon={LockPasswordIcon} size={9} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">azubihub.app/berichtsheft</span>
                    </div>
                  </div>
                </div>

                <div className="flex" style={{ height: '400px' }}>
                  {/* Sidebar */}
                  <div className="w-14 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-4 gap-3 shrink-0">
                    <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-black text-xs">A</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200 my-1" />
                    {[BookOpenIcon, BarChartIcon, CalendarIcon, UserMultiple02Icon].map((Ic, i) => (
                      <div key={i} className={cn('size-9 rounded-xl flex items-center justify-center transition-colors',
                        i === 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600')}>
                        <HugeiconsIcon icon={Ic} size={16} />
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 overflow-hidden p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Wochenberichte</div>
                        <div className="font-bold text-sm text-slate-900">KW 13 · 2025</div>
                      </div>
                      <div className="h-7 px-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center text-[11px] text-blue-700 font-medium gap-1.5">
                        <HugeiconsIcon icon={Add01Icon} size={11} />Neuer Bericht
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {v:'18',l:'Freigegeben',c:'text-emerald-600',bg:'bg-emerald-50',border:'border-emerald-100'},
                        {v:'3', l:'Ausstehend', c:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-100'},
                        {v:'24',l:'Gesamt',     c:'text-blue-600',   bg:'bg-blue-50',   border:'border-blue-100'},
                      ].map(s => (
                        <div key={s.l} className={cn('rounded-xl p-2.5 border', s.bg, s.border)}>
                          <div className={cn('text-lg font-black tabular-nums', s.c)}>{s.v}</div>
                          <div className="text-[9px] text-slate-500">{s.l}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { kw:'KW 11',s:'Freigegeben',sc:'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { kw:'KW 12',s:'In Prüfung', sc:'bg-amber-50 text-amber-700 border-amber-200' },
                        { kw:'KW 13',s:'Entwurf',    sc:'bg-slate-100 text-slate-500 border-slate-200' },
                      ].map(r => (
                        <div key={r.kw} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                          <div className="text-[11px] font-semibold text-slate-700 w-12 shrink-0">{r.kw}</div>
                          <div className="flex gap-1 flex-1">
                            {['Mo','Di','Mi','Do','Fr'].map(d => (
                              <div key={d} className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">{d}</div>
                            ))}
                          </div>
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0', r.sc)}>{r.s}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="size-5 rounded-md bg-violet-100 flex items-center justify-center">
                          <HugeiconsIcon icon={SparklesIcon} size={11} className="text-violet-600" />
                        </div>
                        <span className="text-[11px] font-bold text-violet-700">KI-Formulierung</span>
                        <span className="ml-auto text-[9px] text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded">Ctrl+Enter</span>
                      </div>
                      <div className="text-[10px] text-slate-500 italic mb-2">„API-Fehler behoben, Datenbank-Migration, Teammeeting..."</div>
                      <div className="h-1 w-full rounded-full bg-violet-100 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500 animate-pulse" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. STATS BAR
      ══════════════════════════════════════ */}
      <section className="py-14 px-6 border-y border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="size-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3">
                <HugeiconsIcon icon={s.icon} size={18} className="text-blue-600" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. PROBLEM / LÖSUNG
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Die Ausgangslage</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Ausbildungsdokumentation kostet Zeit.
              <br />
              <span className="text-slate-400 font-normal">Das muss nicht so sein.</span>
            </h2>
            <p className="text-slate-500 mt-5 max-w-xl mx-auto text-base leading-relaxed">
              Jedes Unternehmen mit Auszubildenden kennt die Herausforderung. AzubiHub löst sie — ohne Mehraufwand für Betriebe oder Azubis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Problem column */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="size-9 rounded-xl bg-slate-200 flex items-center justify-center">
                  <HugeiconsIcon icon={Cancel01Icon} size={15} className="text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Ohne AzubiHub</p>
                  <p className="text-[11px] text-slate-500">Der typische Ausbildungsalltag</p>
                </div>
              </div>
              <ul className="space-y-5">
                {[
                  { t: '3+ Stunden Schreibaufwand pro Woche', d: 'Pro Auszubildendem — für Berichte, die nur der Ausbilder liest.' },
                  { t: 'Papierdokumente gehen verloren', d: 'Kein zentrales Ablagesystem, kein Backup — alles im Aktenordner.' },
                  { t: 'Freigabe per E-Mail und Telefon', d: 'Berichte hin- und herschicken, Korrekturen einbauen, erneut senden.' },
                  { t: 'IHK-Fristen werden übersehen', d: 'Kein Überblick über offene Berichte, keine automatischen Erinnerungen.' },
                ].map(item => (
                  <li key={item.t} className="flex items-start gap-3.5">
                    <div className="size-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <HugeiconsIcon icon={Cancel01Icon} size={9} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 leading-snug">{item.t}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution column */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Mit AzubiHub</p>
                  <p className="text-[11px] text-slate-500">Digitaler Workflow, der funktioniert</p>
                </div>
              </div>
              <ul className="space-y-5">
                {[
                  { t: '15 Minuten statt 3 Stunden', d: 'KI formuliert professionellen IHK-Text aus Stichpunkten — in Sekunden.' },
                  { t: 'Alles zentral in der Cloud', d: 'Sicheres Ablagesystem, automatisches Backup, auf allen Geräten verfügbar.' },
                  { t: 'Digitaler Freigabe-Workflow', d: 'Einreichen, kommentieren und freigeben — mit einem Klick im Browser.' },
                  { t: 'Keine Frist mehr verpassen', d: 'Automatische Erinnerungen und Live-Statusübersicht für Ausbilder.' },
                ].map(item => (
                  <li key={item.t} className="flex items-start gap-3.5">
                    <div className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={9} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{item.t}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Was AzubiHub leistet</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Vier Gründe, die überzeugen.
            </h2>
            <p className="text-slate-500 mt-5 max-w-xl mx-auto text-base leading-relaxed">
              Kein generisches Tool — AzubiHub ist speziell für die duale Ausbildung gebaut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className={cn(
                'group relative rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden',
                f.border
              )}>
                <div className="flex items-start justify-between mb-5">
                  <div className={cn('size-12 rounded-2xl flex items-center justify-center', f.bg)}>
                    <HugeiconsIcon icon={f.icon} size={22} className={f.color} />
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', f.bg, f.color)}>
                    {f.stat}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. SOCIAL PROOF
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Echte Meinungen</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Was andere sagen.</h2>
            <p className="text-slate-500 mt-4 text-base max-w-md mx-auto">Von Auszubildenden und Ausbildern, die täglich mit AzubiHub arbeiten.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <HugeiconsIcon key={j} icon={StarIcon} size={12} className="text-amber-400" />)}
                </div>
                <HugeiconsIcon icon={QuoteUpIcon} size={18} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">{t.text}</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-auto">
                  <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. WIE ES FUNKTIONIERT
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Der Einstieg</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">In 3 Schritten startklar.</h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-base">Kein aufwändiges Onboarding. Kein IT-Projekt. Einfach registrieren und loslegen.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="absolute top-10 left-[calc(16.7%+2rem)] right-[calc(16.7%+2rem)] h-px border-t border-dashed border-slate-300 hidden sm:block" />

            {STEPS.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center">
                <div className="size-20 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center mb-6 text-2xl font-black text-blue-600 shadow-sm relative z-10">
                  {s.num}
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-3">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
                Jetzt kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">Preise</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Einfach. Kostenlos.</h2>
            <p className="text-slate-500 mt-5 max-w-lg mx-auto text-base">Kein Abo. Keine Kreditkarte. Keine versteckten Kosten. Für Ausbildungsbetriebe jeder Größe.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-md transition-all duration-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Kostenlos</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-6xl font-black text-slate-900">0€</span>
                <span className="text-slate-400 mb-2 text-sm">/ für immer</span>
              </div>
              <p className="text-sm text-slate-500 mb-7">Alles, was du für eine vollständige Ausbildungsdokumentation brauchst.</p>
              <ul className="space-y-3 mb-8">
                {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe Workflow','PDF-Export für die IHK','Kalender & Statistiken','Cloud-Sync auf allen Geräten'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="block">
                <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">Jetzt registrieren</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-blue-600 bg-white p-8 relative shadow-lg shadow-blue-600/10">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em]">Pro</p>
                <span className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full">Demnächst</span>
              </div>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-6xl font-black text-slate-900">4,99€</span>
                <span className="text-slate-400 mb-2 text-sm">/ Monat</span>
              </div>
              <p className="text-sm text-slate-500 mb-7">Für Betriebe mit mehreren Auszubildenden und erweiterten Anforderungen.</p>
              <ul className="space-y-3 mb-8">
                {['Alles aus Kostenlos','Unbegrenzte KI-Nutzung','Team-Verwaltung (bis 20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App (iOS & Android)'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-blue-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-11 opacity-50 cursor-not-allowed bg-blue-600 text-white" disabled>Benachrichtigen wenn verfügbar</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section id="faq" className="py-28 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Häufige Fragen.</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
          <p className="text-center text-sm text-slate-500 mt-10">
            Noch Fragen?{' '}
            <a href="mailto:kontakt@azubihub.app" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Schreib uns direkt.
            </a>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. CTA-SEKTION
      ══════════════════════════════════════ */}
      <section className="py-32 px-6 bg-slate-900 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white/80 mb-10">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
            Kostenlos · Keine Kreditkarte · Sofort startklar
          </div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6 text-white">
            Bereit, die Ausbildung
            <span className="text-blue-400"> endlich digital</span>
            {' '}zu machen?
          </h2>
          <p className="text-white/60 text-lg mb-12 leading-relaxed max-w-lg mx-auto">
            Hunderte Betriebe und Auszubildende haben schon gewechselt.
            Der erste Bericht ist in unter 15 Minuten fertig.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-12 text-lg gap-2 w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-xl shadow-blue-500/30">
                Jetzt kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Button>
            </Link>
            <a href="mailto:kontakt@azubihub.app">
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg w-full sm:w-auto border-white/20 text-white hover:bg-white/10 hover:border-white/30 gap-2">
                <HugeiconsIcon icon={Mail01Icon} size={16} />
                Kontakt aufnehmen
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-slate-950 pt-14 pb-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 mb-12">

            {/* Brand */}
            <div className="sm:col-span-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-black text-sm leading-none">A</span>
                </div>
                <span className="font-bold text-base tracking-tight text-white">AzubiHub</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Die digitale Ausbildungsplattform für moderne Betriebe. KI-gestützt, IHK-konform, kostenlos.
              </p>
              {/* Trust badges */}
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                {[
                  { label: 'DSGVO', icon: Shield01Icon, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { label: 'IHK-konform', icon: CheckmarkBadge01Icon, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'KI-gestützt', icon: SparklesIcon, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                ].map(b => (
                  <span key={b.label}
                    className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', b.bg, b.color)}>
                    <HugeiconsIcon icon={b.icon} size={11} />
                    {b.label}
                  </span>
                ))}
              </div>
              {/* Social links */}
              <div className="flex items-center gap-2 mt-5">
                <a href="mailto:kontakt@azubihub.app"
                  className="size-9 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                  aria-label="E-Mail an AzubiHub">
                  <HugeiconsIcon icon={Mail01Icon} size={16} />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                  aria-label="AzubiHub auf GitHub">
                  <HugeiconsIcon icon={Github01Icon} size={16} />
                </a>
              </div>
            </div>

            {/* Produkt */}
            <div className="sm:col-span-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-5">Produkt</p>
              <nav className="space-y-3">
                {[
                  { href: '#features',      label: 'Features' },
                  { href: '#pricing',       label: 'Preise' },
                  { href: '#faq',           label: 'FAQ' },
                  { href: '/auth/register', label: 'Registrieren' },
                  { href: '/auth/login',    label: 'Anmelden' },
                ].map(({ href, label }) => (
                  <a key={label} href={href}
                    className="block text-sm text-slate-500 hover:text-white transition-colors">
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Rechtliches */}
            <div className="sm:col-span-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-5">Rechtliches & Kontakt</p>
              <nav className="space-y-3">
                <Link href="/impressum"   className="block text-sm text-slate-500 hover:text-white transition-colors">Impressum</Link>
                <Link href="/datenschutz" className="block text-sm text-slate-500 hover:text-white transition-colors">Datenschutzerklärung</Link>
                <span className="block text-sm text-slate-700 cursor-default">AGB (in Vorbereitung)</span>
                <a href="mailto:kontakt@azubihub.app" className="block text-sm text-slate-500 hover:text-white transition-colors">kontakt@azubihub.app</a>
              </nav>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-600">© {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.</span>
            <span className="text-xs text-slate-600">Gebaut für Auszubildende und Ausbilder in Deutschland</span>
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
