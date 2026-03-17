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
  Notification01Icon, UserMultiple02Icon, PdfIcon, Shield01Icon, Time01Icon,
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
  { icon: BookOpenIcon,        title: 'Digitales Berichtsheft',   desc: 'Wochenberichte täglich, strukturiert und IHK-konform erfassen — kein Papier mehr.',           color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'group-hover:border-blue-500/30' },
  { icon: SparklesIcon,        title: 'KI-Formulierung',          desc: 'Aus deinen Stichpunkten wird in Sekunden professioneller Fließtext — powered by Claude AI.',   color: 'text-primary',    bg: 'bg-primary/10',    border: 'group-hover:border-primary/30' },
  { icon: CheckmarkBadge01Icon,title: 'Ausbilder-Freigabe',       desc: 'Digitaler Workflow: einreichen, kommentieren, freigeben — vollständig papierlos.',             color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'group-hover:border-green-500/30' },
  { icon: BarChartIcon,        title: 'Statistiken',              desc: 'Fortschrittsübersicht, Freigabequoten und Fristen immer im Blick.',                            color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'group-hover:border-yellow-500/30' },
  { icon: PdfIcon,             title: 'PDF-Export',               desc: 'Jahresexport als druckfertiges PDF für die IHK — ein Klick genügt.',                          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'group-hover:border-purple-500/30' },
  { icon: UserMultiple02Icon,  title: 'Nutzerverwaltung',         desc: 'Ausbilder laden Auszubildende per E-Mail ein und verwalten das gesamte Team.',                 color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'group-hover:border-orange-500/30' },
  { icon: CalendarIcon,        title: 'Kalender & Planung',       desc: 'Urlaubstage, Kranktage und Berufsschulwochen automatisch einplanen.',                         color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'group-hover:border-cyan-500/30' },
  { icon: Notification01Icon,  title: 'Erinnerungen',             desc: 'Smarte Benachrichtigungen erinnern pünktlich an offene oder überfällige Berichte.',           color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'group-hover:border-pink-500/30' },
  { icon: Shield01Icon,        title: 'DSGVO & Sicherheit',       desc: 'Alle Daten verschlüsselt, EU-Rechenzentren, DSGVO-konform. Kein Datenchaos.',                  color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'group-hover:border-teal-500/30' },
]

const STATS = [
  { value: '500+',    label: 'Aktive Nutzer',    icon: UserMultiple02Icon },
  { value: '12.000+', label: 'Berichte erstellt', icon: BookOpenIcon },
  { value: '80%',     label: 'Zeitersparnis',     icon: Time01Icon },
  { value: '4.9 ★',   label: 'Nutzerbewertung',   icon: StarIcon },
]

const STEPS = [
  { num: '01', title: 'Registrieren',      desc: 'Konto erstellen oder Einladung des Ausbilders annehmen. In unter 2 Minuten startklar.',                      color: 'from-primary to-orange-500' },
  { num: '02', title: 'Profil einrichten', desc: 'Ausbildungsberuf, Betrieb und Startdatum angeben. Das war es — alles andere erledigt AzubiHub.',             color: 'from-blue-500 to-cyan-500' },
  { num: '03', title: 'Einfach nutzen',    desc: 'Jede Woche Bericht schreiben, KI helfen lassen, dem Ausbilder einreichen und freigeben lassen.',             color: 'from-green-500 to-teal-500' },
]

const COMPARISON = [
  { feature: 'Berichte digital erfassen',     without: false, with: true },
  { feature: 'KI-gestützte Formulierung',     without: false, with: true },
  { feature: 'Ausbilder-Freigabe per Klick',  without: false, with: true },
  { feature: 'Überall verfügbar (Cloud)',      without: false, with: true },
  { feature: 'PDF-Export für die IHK',         without: false, with: true },
  { feature: 'Verlustgefahr durch Papier',     without: true,  with: false },
  { feature: 'Stundenlanger Schreibaufwand',   without: true,  with: false },
  { feature: 'E-Mail-Chaos mit dem Ausbilder', without: true,  with: false },
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
      <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
        <span className="text-primary-foreground font-black text-sm leading-none">A</span>
      </div>
      <span className="font-bold text-base tracking-tight">AzubiHub</span>
    </div>
  )
}

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-500',
      scrolled
        ? 'border-b border-border/40 bg-[hsl(var(--background))]/80 backdrop-blur-3xl shadow-[0_1px_0_0_hsl(var(--border)/0.4)]'
        : 'bg-transparent')}>
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80"><Logo /></Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5 text-sm">
          {[['#features','Features'],['#how-it-works','So funktionierts'],['#pricing','Preise'],['#faq','FAQ']].map(([href,label]) => (
            <a key={href} href={href}
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150 font-medium">
              {label}
            </a>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Login — subtle, minimal */}
          <Link href="/auth/login" className="hidden sm:block">
            <span className="group flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/[0.06] transition-all duration-150 cursor-pointer select-none">
              Anmelden
            </span>
          </Link>

          {/* Register — premium CTA */}
          <Link href="/auth/register">
            <span className="group relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white overflow-hidden cursor-pointer select-none
              bg-primary shadow-lg shadow-primary/30
              hover:shadow-primary/50 hover:shadow-xl
              transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
              {/* shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent
                -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
              Kostenlos starten
              <HugeiconsIcon icon={ArrowRight01Icon} size={13}
                className="transition-transform duration-200 group-hover:translate-x-0.5" />
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
    <button onClick={() => setOpen(o => !o)} className="w-full text-left rounded-2xl border border-border/60 bg-card/40 px-6 py-5 hover:bg-card/60 hover:border-border transition-all duration-200 group">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-sm leading-snug">{q}</span>
        <span className={cn('size-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200',
          open ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground group-hover:border-primary/40')}>
          <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={12} />
        </span>
      </div>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-40 mt-4' : 'max-h-0')}>
        <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */

function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground overflow-x-hidden">
      <LandingNav />

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center pt-16 pb-8 px-6 overflow-hidden">
        {/* Background ambience */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/6 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-primary/4 rounded-full blur-[120px]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — Text */}
            <div className="order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-8 shadow-lg shadow-primary/10">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Powered by Claude AI · 100 % kostenlos
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.06] mb-6">
                Das Berichtsheft,
                <br />
                <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent">
                  das sich selbst
                </span>
                <br />
                schreibt.
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                AzubiHub digitalisiert deinen Ausbildungsnachweis. KI-gestützt, IHK-konform und in Sekunden erledigt.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 px-8 text-base gap-2 w-full sm:w-auto shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90">
                    Kostenlos starten
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base w-full sm:w-auto border-border/60 hover:border-primary/40 hover:bg-primary/5">
                    Anmelden
                  </Button>
                </Link>
              </div>

              {/* Trust strip */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['LM','TK','SB','MD','JF'].map((init, i) => (
                    <div key={init} className="size-8 rounded-full border-2 border-[hsl(var(--background))] flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                      style={{ backgroundColor: ['#E53E3E','#3B82F6','#10B981','#F59E0B','#8B5CF6'][i], zIndex: 5 - i }}>
                      {init}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">500+ Auszubildende</span>
                  <span className="text-muted-foreground"> vertrauen AzubiHub</span>
                </div>
              </div>
            </div>

            {/* Right — App mockup */}
            <div className="order-1 lg:order-2 relative">
              {/* Glow behind mockup */}
              <div className="absolute inset-4 bg-primary/10 rounded-3xl blur-3xl" />

              {/* Floating badges */}
              <div className="absolute -left-4 top-16 z-20 hidden lg:flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm px-3 py-2 shadow-lg">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-green-400">IHK-konform</span>
              </div>
              <div className="absolute -right-4 top-1/3 z-20 hidden lg:flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-sm px-3 py-2 shadow-lg">
                <HugeiconsIcon icon={SparklesIcon} size={14} className="text-primary" />
                <span className="text-xs font-semibold text-primary">KI-gestützt</span>
              </div>
              <div className="absolute -right-2 bottom-20 z-20 hidden lg:flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-3 py-2 shadow-lg">
                <HugeiconsIcon icon={Shield01Icon} size={14} className="text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">DSGVO</span>
              </div>

              {/* Browser frame */}
              <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-[hsl(var(--card))] shadow-2xl shadow-black/60 ring-1 ring-white/5">
                {/* Browser bar */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--background))]/80 border-b border-border/40">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-red-500/70" />
                    <div className="size-2.5 rounded-full bg-yellow-500/70" />
                    <div className="size-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="max-w-[200px] mx-auto h-5 rounded-md bg-muted/60 flex items-center gap-1.5 px-2">
                      <HugeiconsIcon icon={LockPasswordIcon} size={9} className="text-muted-foreground/60" />
                      <span className="text-[10px] text-muted-foreground/70">azubihub.app/berichtsheft</span>
                    </div>
                  </div>
                </div>

                {/* App UI mockup */}
                <div className="flex" style={{ height: '420px' }}>
                  {/* Sidebar */}
                  <div className="w-14 bg-[hsl(var(--sidebar))] border-r border-border/30 flex flex-col items-center py-4 gap-4 shrink-0">
                    <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-black text-xs">A</span>
                    </div>
                    <div className="h-px w-8 bg-border/50 my-1" />
                    {[BookOpenIcon, BarChartIcon, CalendarIcon, UserMultiple02Icon].map((Ic, i) => (
                      <div key={i} className={cn('size-9 rounded-xl flex items-center justify-center transition-colors', i === 0 ? 'bg-primary/20 text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground')}>
                        <HugeiconsIcon icon={Ic} size={16} />
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 overflow-hidden p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Wochenberichte</div>
                        <div className="font-bold text-sm">KW 13 · 2025</div>
                      </div>
                      <div className="h-7 px-3 bg-primary/15 border border-primary/30 rounded-lg flex items-center text-[11px] text-primary font-medium gap-1.5">
                        <HugeiconsIcon icon={Add01Icon} size={11} />Neuer Bericht
                      </div>
                    </div>

                    {/* Stat pills */}
                    <div className="grid grid-cols-3 gap-2">
                      {[{v:'18',l:'Freigegeben',c:'text-green-400',bg:'bg-green-500/10'},{v:'3',l:'Ausstehend',c:'text-yellow-400',bg:'bg-yellow-500/10'},{v:'24',l:'Gesamt',c:'text-blue-400',bg:'bg-blue-500/10'}].map(s => (
                        <div key={s.l} className={cn('rounded-xl p-2.5 border border-border/30', s.bg)}>
                          <div className={cn('text-lg font-black tabular-nums', s.c)}>{s.v}</div>
                          <div className="text-[9px] text-muted-foreground">{s.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Report rows */}
                    <div className="space-y-1.5">
                      {[
                        { kw:'KW 11',s:'Freigegeben',sc:'bg-green-500/15 text-green-400 border-green-500/25' },
                        { kw:'KW 12',s:'In Prüfung', sc:'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
                        { kw:'KW 13',s:'Entwurf',    sc:'bg-muted/50 text-muted-foreground border-border/30' },
                      ].map(r => (
                        <div key={r.kw} className="flex items-center gap-2 rounded-xl border border-border/25 bg-muted/10 px-3 py-2">
                          <div className="text-[11px] font-semibold w-12 shrink-0">{r.kw}</div>
                          <div className="flex gap-1 flex-1">
                            {['Mo','Di','Mi','Do','Fr'].map(d => (
                              <div key={d} className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium">{d}</div>
                            ))}
                          </div>
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0', r.sc)}>{r.s}</span>
                        </div>
                      ))}
                    </div>

                    {/* AI Helper */}
                    <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 to-primary/4 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="size-5 rounded-md bg-primary/20 flex items-center justify-center">
                          <HugeiconsIcon icon={SparklesIcon} size={11} className="text-primary" />
                        </div>
                        <span className="text-[11px] font-bold text-primary">KI-Formulierung</span>
                        <span className="ml-auto text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">Ctrl+Enter</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground italic mb-2">„API-Fehler behoben, Datenbank-Migration, Teammeeting..."</div>
                      <div className="h-1 w-full rounded-full bg-primary/15 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 animate-pulse" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40 animate-bounce">
          <div className="size-5 rounded-full border border-current flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-current" />
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <section className="relative py-12 px-6 border-y border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent" />
        <div className="relative max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center group">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                <HugeiconsIcon icon={s.icon} size={18} className="text-primary" />
              </div>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Funktionen</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Alles, was du brauchst.
              <br />
              <span className="text-muted-foreground font-light">Nichts, was du nicht brauchst.</span>
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-lg">
              AzubiHub ist kein generisches Tool — es ist speziell für die Ausbildung gebaut.
            </p>
          </div>

          {/* Top 3 features — larger */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {FEATURES.slice(0, 3).map(f => (
              <div key={f.title} className={cn('group relative rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5', f.border)}>
                <div className={cn('size-12 rounded-2xl flex items-center justify-center mb-5', f.bg)}>
                  <HugeiconsIcon icon={f.icon} size={22} className={f.color} />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom 6 features — compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.slice(3).map(f => (
              <div key={f.title} className={cn('group flex items-start gap-4 rounded-2xl border border-border/40 bg-card/30 p-4 transition-all duration-200 hover:bg-card/60', f.border)}>
                <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', f.bg)}>
                  <HugeiconsIcon icon={f.icon} size={16} className={f.color} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/20 via-card/30 to-card/20" />
        <div className="absolute inset-0 border-y border-border/30" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">So einfach geht's</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">In 3 Schritten startklar.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connector */}
            <div className="absolute top-10 left-[calc(16.7%+1.5rem)] right-[calc(16.7%+1.5rem)] h-px hidden sm:block"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary)/40%), hsl(var(--border)/60%), hsl(var(--primary)/40%))' }} />

            {STEPS.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center">
                {/* Step indicator */}
                <div className={cn('size-20 rounded-2xl flex items-center justify-center mb-6 text-2xl font-black text-white shadow-xl relative z-10',
                  `bg-gradient-to-br ${s.color}`)}>
                  {s.num}
                  <div className={cn('absolute -inset-1 rounded-2xl blur-md opacity-30 bg-gradient-to-br', s.color)} />
                </div>
                <h3 className="font-bold text-base mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90">
                Jetzt kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BENEFITS + AI DEMO ══ */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Dein Vorteil</span>
            <h2 className="text-4xl font-black tracking-tight mb-6 leading-tight">
              Weniger Aufwand.<br />
              <span className="text-muted-foreground font-light">Mehr Ausbildung.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10 text-base">
              Das Berichtsheft ist Pflicht — aber es muss keine Qual sein. AzubiHub nimmt dir die stupide Arbeit ab.
            </p>
            <div className="space-y-5">
              {[
                { icon: Time01Icon, color: 'text-primary', bg: 'bg-primary/10', t: '80 % weniger Zeitaufwand', d: 'Nutzer sparen im Schnitt über 3 Stunden pro Monat beim Schreiben von Berichten.' },
                { icon: Shield01Icon, color: 'text-blue-400', bg: 'bg-blue-500/10', t: 'Nie wieder Berichte verlieren', d: 'Alle Berichte sicher in der Cloud. Kein Papier, kein vergesstes Heft.' },
                { icon: CheckmarkBadge01Icon, color: 'text-green-400', bg: 'bg-green-500/10', t: '100 % IHK-konform', d: 'Struktur und Format entsprechen den Anforderungen der IHK und Berufsschulen.' },
                { icon: Notification01Icon, color: 'text-yellow-400', bg: 'bg-yellow-500/10', t: 'Stressfrei durch die Ausbildung', d: 'Erinnerungen und Status-Updates halten dich immer auf dem richtigen Stand.' },
              ].map(b => (
                <div key={b.t} className="flex items-start gap-4">
                  <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', b.bg)}>
                    <HugeiconsIcon icon={b.icon} size={18} className={b.color} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{b.t}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Demo card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-blue-500/5 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-card/60 p-7 space-y-5 shadow-2xl shadow-black/30">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <HugeiconsIcon icon={SparklesIcon} size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">KI-Formulierung</p>
                  <p className="text-[11px] text-muted-foreground">Aus Stichpunkten wird professioneller Text</p>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/40 border border-border/40 p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deine Stichpunkte:</p>
                <ul className="space-y-1">
                  {['Nginx-Server eingerichtet und konfiguriert','API-Route debuggt, Fehler gefunden & behoben','Code Review im Entwicklungsteam'].map(t => (
                    <li key={t} className="flex items-start gap-2 text-xs text-foreground/70">
                      <span className="text-primary mt-0.5 shrink-0">•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-center gap-3 py-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <HugeiconsIcon icon={SparklesIcon} size={14} className="text-primary" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/20 p-4">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Generierter Text:</p>
                <p className="text-xs text-foreground/85 leading-relaxed">Am heutigen Arbeitstag konfigurierte ich einen Nginx-Webserver und richtete die erforderlichen Servereinstellungen ein. Im Anschluss analysierte ich einen Fehler in einer API-Route und konnte diesen erfolgreich identifizieren und beheben. Den Abschluss bildete ein Code Review im Entwicklungsteam.</p>
              </div>

              <div className="flex gap-2">
                {['Kurz','Normal','Ausführlich'].map((opt, i) => (
                  <button key={opt} className={cn('flex-1 rounded-xl py-2 text-[11px] font-semibold transition-all border', i === 1 ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' : 'bg-muted/30 text-muted-foreground border-border/40 hover:border-primary/30')}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ══ */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-card/20 via-card/30 to-card/20 border-y border-border/30" />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Vergleich</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Papier vs. AzubiHub.</h2>
            <p className="text-muted-foreground mt-4 text-base">Die Wahl ist eindeutig.</p>
          </div>

          <div className="rounded-3xl border border-border/60 overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="grid grid-cols-3 bg-muted/30 border-b border-border/40">
              <div className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Funktion</div>
              <div className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-x border-border/30">Papier / Word</div>
              <div className="px-4 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider">AzubiHub</div>
            </div>
            {COMPARISON.map((c, i) => (
              <div key={c.feature} className={cn('grid grid-cols-3 items-center', i % 2 === 0 ? 'bg-card/20' : 'bg-card/40')}>
                <div className="px-6 py-4 text-sm">{c.feature}</div>
                <div className="px-4 py-4 flex justify-center border-x border-border/20">
                  {c.without
                    ? <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-muted-foreground/40" /> Ja</div>
                    : <HugeiconsIcon icon={Cancel01Icon} size={18} className="text-destructive/50" />}
                </div>
                <div className="px-4 py-4 flex justify-center">
                  {c.with
                    ? <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold"><HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-400" /> Ja</div>
                    : <HugeiconsIcon icon={Cancel01Icon} size={18} className="text-destructive/50" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Preise</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Einfach. Kostenlos.</h2>
            <p className="text-muted-foreground mt-5 max-w-lg mx-auto text-base">Kein Abo. Keine Kreditkarte. Keine versteckten Kosten.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-3xl border border-border/60 bg-card/60 p-8 hover:border-border transition-colors">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Kostenlos</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-6xl font-black">0€</span>
                <span className="text-muted-foreground mb-2 text-sm">/ für immer</span>
              </div>
              <p className="text-sm text-muted-foreground mb-7">Alles, was du als Auszubildender brauchst.</p>
              <ul className="space-y-3 mb-8">
                {['Unbegrenzte Wochenberichte','KI-Formulierung','Ausbilder-Freigabe Workflow','PDF-Export','Kalender & Statistiken','Cloud-Sync auf allen Geräten'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-green-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="block">
                <Button variant="outline" className="w-full h-11 border-border hover:border-primary/40 hover:bg-primary/5">Jetzt registrieren</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-3xl bg-gradient-to-b from-primary/10 to-primary/5 p-[1px] shadow-2xl shadow-primary/15">
              <div className="rounded-3xl bg-[hsl(var(--card))] p-8 h-full">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.15em]">Pro</p>
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow shadow-primary/30">Demnächst</span>
                </div>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-6xl font-black">4,99€</span>
                  <span className="text-muted-foreground mb-2 text-sm">/ Monat</span>
                </div>
                <p className="text-sm text-muted-foreground mb-7">Für Betriebe mit mehreren Auszubildenden.</p>
                <ul className="space-y-3 mb-8">
                  {['Alles aus Kostenlos','Unbegrenzte KI-Nutzung','Team-Verwaltung (bis 20 Azubis)','Vorlagen-Bibliothek','Prioritäts-Support','Native App (iOS & Android)'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full h-11 opacity-50 cursor-not-allowed" disabled>Benachrichtigen wenn verfügbar</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-card/20 via-card/30 to-card/20 border-y border-border/30" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Stimmen</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Was andere sagen.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={cn('rounded-3xl border border-border/50 bg-gradient-to-b p-6 flex flex-col group hover:border-border transition-all duration-200 hover:-translate-y-0.5',
                i % 3 === 0 ? 'from-card/80 to-card/50' : i % 3 === 1 ? 'from-card/60 to-card/40' : 'from-card/70 to-card/50')}>
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <HugeiconsIcon key={j} icon={StarIcon} size={12} className="text-yellow-400" />)}
                </div>
                {/* Quote icon */}
                <HugeiconsIcon icon={QuoteUpIcon} size={18} className="text-primary/40 mb-3" />
                <p className="text-sm text-foreground/80 leading-relaxed flex-1 italic mb-6">{t.text}</p>
                <div className="flex items-center gap-3 border-t border-border/30 pt-4 mt-auto">
                  <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md shadow-primary/25">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 block">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Häufige Fragen.</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-10">
            Noch Fragen?{' '}
            <a href="mailto:kontakt@azubihub.app" className="text-primary hover:text-primary/80 font-medium transition-colors">Schreib uns direkt.</a>
          </p>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="relative py-36 px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/12 rounded-full blur-[120px]" />
          <div className="absolute inset-0 border-y border-primary/10" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-5 py-2 text-xs font-semibold text-primary mb-10 shadow-lg shadow-primary/10">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
            Kostenlos · Keine Kreditkarte · Sofort startklar
          </div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Bereit,
            <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"> das Berichtsheft</span>
            <br />endlich zu mögen?
          </h2>
          <p className="text-muted-foreground text-xl mb-12 leading-relaxed">
            Hunderte Auszubildende haben schon gewechselt.<br />Dein erster Bericht ist in 5 Minuten fertig.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-12 text-lg gap-2 shadow-2xl shadow-primary/35 w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold">
                Jetzt kostenlos starten
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="h-14 px-12 text-lg w-full sm:w-auto border-border/60 hover:border-primary/40 hover:bg-primary/5">
                Anmelden
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-border/40 pt-14 pb-8 px-6 bg-[hsl(var(--card))]/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-5">
              <Logo />
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xs">
                Das digitale Berichtsheft für moderne Ausbildungsbetriebe. KI-gestützt, IHK-konform, kostenlos.
              </p>
              <div className="flex items-center gap-2 mt-5">
                <a href="mailto:kontakt@azubihub.app"
                  className="size-9 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all">
                  <HugeiconsIcon icon={Mail01Icon} size={16} />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="size-9 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all">
                  <HugeiconsIcon icon={Github01Icon} size={16} />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="sm:col-span-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-5">Produkt</p>
              <div className="space-y-3">
                {[['#features','Features'],['#pricing','Preise'],['#faq','FAQ'],['/auth/register','Registrieren'],['/auth/login','Anmelden']].map(([href,label]) => (
                  <a key={label} href={href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</a>
                ))}
              </div>
            </div>
            <div className="sm:col-span-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-5">Rechtliches</p>
              <div className="space-y-3">
                <Link href="/impressum" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Impressum</Link>
                <Link href="/datenschutz" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Datenschutzerklärung</Link>
                <span className="block text-sm text-muted-foreground">AGB</span>
                <a href="mailto:kontakt@azubihub.app" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Kontakt</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.</span>
            <span className="text-xs text-muted-foreground/50">Made with ♥ für Auszubildende in Deutschland</span>
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
