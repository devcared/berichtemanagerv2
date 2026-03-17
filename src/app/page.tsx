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
  BookOpenIcon,
  CheckListIcon,
  CalendarIcon,
  GridViewIcon,
  Logout01Icon,
  SparklesIcon,
  CheckmarkBadge01Icon,
  ArrowRight01Icon,
  BarChartIcon,
  Notification01Icon,
  UserMultiple02Icon,
  PdfIcon,
  Shield01Icon,
  Time01Icon,
  StarIcon,
  QuoteUpIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Add01Icon,
  MinusSignIcon,
  Mail01Icon,
  Github01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── APP HOME (after login) ─── */

const modules: AppModule[] = [
  { id: 'berichtsheft', title: 'Berichtsheft-Manager', description: 'Verwalte und exportiere deine Ausbildungsnachweise', icon: 'BookOpenIcon', accentColor: '#3B82F6', routePath: '/berichtsheft', isEnabled: true, lastUsed: new Date().toISOString() },
  { id: 'lernfeld', title: 'Lernfeld-Tracker', description: 'Behalte den Überblick über deine Lernfelder', icon: 'CheckListIcon', accentColor: '#10B981', routePath: '/lernfeld', isEnabled: false },
  { id: 'pruefung', title: 'Prüfungsvorbereitung', description: 'Bereite dich auf deine Prüfungen vor', icon: 'GridViewIcon', accentColor: '#F59E0B', routePath: '/pruefung', isEnabled: false },
  { id: 'stundenplan', title: 'Stundenplan', description: 'Dein Berufsschul- und Betriebsplan', icon: 'CalendarIcon', accentColor: '#8B5CF6', routePath: '/stundenplan', isEnabled: false },
]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moduleIconMap: Record<string, any> = { BookOpenIcon, CheckListIcon, GridViewIcon, CalendarIcon }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
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
              const IconComponent = moduleIconMap[mod.icon]
              return (
                <Card key={mod.id} onClick={() => mod.isEnabled && router.push(mod.routePath)}
                  className={cn('relative overflow-hidden border border-border bg-card transition-all duration-200', mod.isEnabled ? 'cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5' : 'opacity-60 cursor-not-allowed')}
                  style={{ borderTop: `3px solid ${mod.accentColor}` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${mod.accentColor}20` }}>
                        {IconComponent && <HugeiconsIcon icon={IconComponent} size={22} style={{ color: mod.accentColor }} />}
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

/* ─── LANDING PAGE DATA ─── */

const FEATURES = [
  { icon: BookOpenIcon, title: 'Digitales Berichtsheft', desc: 'Wochenberichte strukturiert erfassen — täglich, übersichtlich und IHK-konform.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: SparklesIcon, title: 'KI-Unterstützung', desc: 'Aus Stichpunkten wird professioneller Fließtext. Formuliere schneller und besser mit Claude AI.', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: CheckmarkBadge01Icon, title: 'Ausbilder-Freigabe', desc: 'Digitaler Genehmigungsprozess: einreichen, kommentieren, freigeben — ohne Papierchaos.', color: 'text-green-400', bg: 'bg-green-400/10' },
  { icon: BarChartIcon, title: 'Statistiken & Fortschritt', desc: 'Visualisiere deinen Ausbildungsfortschritt und behalte Fristen im Blick.', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: PdfIcon, title: 'PDF-Export', desc: 'Professioneller Jahresexport als druckfertiges PDF für die IHK — ein Klick, fertig.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: UserMultiple02Icon, title: 'Team-Verwaltung', desc: 'Ausbilder laden Auszubildende per E-Mail ein und verwalten alle Berichte zentral.', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { icon: CalendarIcon, title: 'Kalender & Planung', desc: 'Urlaubstage, Krankentage und Berufsschulwochen automatisch erfassen und einplanen.', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { icon: Notification01Icon, title: 'Erinnerungen', desc: 'Smarte Push-Benachrichtigungen erinnern rechtzeitig an offene Berichte.', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { icon: Shield01Icon, title: 'Datensicherheit', desc: 'Alle Daten verschlüsselt in deutschen Rechenzentren gespeichert. DSGVO-konform.', color: 'text-teal-400', bg: 'bg-teal-400/10' },
]

const STATS = [
  { value: '500+', label: 'Auszubildende', sub: 'aktive Nutzer' },
  { value: '12.000+', label: 'Berichte', sub: 'bereits erstellt' },
  { value: '80%', label: 'Zeitersparnis', sub: 'durch KI-Formulierung' },
  { value: '4.9★', label: 'Bewertung', sub: 'von Nutzern' },
]

const STEPS = [
  { num: '01', title: 'Registrieren', desc: 'Konto erstellen oder Einladung des Ausbilders annehmen. In unter 2 Minuten startklar.' },
  { num: '02', title: 'Einrichten', desc: 'Ausbildungsberuf, Betrieb und Startdatum eingeben. Fertig — das war es wirklich.' },
  { num: '03', title: 'Einfach nutzen', desc: 'Jede Woche Bericht schreiben, KI helfen lassen und dem Ausbilder digital einreichen.' },
]

const BENEFITS = [
  { icon: Time01Icon, title: '80 % weniger Zeitaufwand', desc: 'Durchschnittlich spart jeder Nutzer über 3 Stunden pro Monat beim Schreiben von Berichten.' },
  { icon: Shield01Icon, title: 'Nie wieder Berichte verlieren', desc: 'Alle Berichte sicher in der Cloud — kein Papier, kein vergesstes Heft, kein verlorener USB-Stick.' },
  { icon: CheckmarkBadge01Icon, title: '100 % IHK-konform', desc: 'Struktur und Format entsprechen den Anforderungen der Berufsschulen und der IHK bundesweit.' },
  { icon: Notification01Icon, title: 'Stressfrei durch die Ausbildung', desc: 'Erinnerungen, Status-Updates und klare Übersichten halten dich immer auf dem richtigen Stand.' },
]

const COMPARISON = [
  { feature: 'Berichte digital schreiben', classic: false, azubi: true },
  { feature: 'KI-gestützte Formulierung', classic: false, azubi: true },
  { feature: 'Ausbilder-Freigabe per Klick', classic: false, azubi: true },
  { feature: 'Überall verfügbar (Cloud)', classic: false, azubi: true },
  { feature: 'PDF-Export für die IHK', classic: false, azubi: true },
  { feature: 'Verlustgefahr', classic: true, azubi: false },
  { feature: 'Stundenlanger Schreibaufwand', classic: true, azubi: false },
  { feature: 'Papierchaos beim Ausbilder', classic: true, azubi: false },
]

const TESTIMONIALS = [
  { name: 'Lena M.', role: 'Auszubildende zur Fachinformatikerin', text: 'Früher hat das Berichtsheft ewig gedauert. Jetzt tippe ich meine Stichpunkte ein und die KI macht den Rest. Absoluter Game Changer!' },
  { name: 'Thomas K.', role: 'Ausbilder · IT-Systemkaufmann', text: 'Endlich kann ich alle Berichte zentral prüfen und freigeben. Kein E-Mail-Chaos mehr, alles an einem Ort — und der Überblick ist perfekt.' },
  { name: 'Sara B.', role: 'Auszubildende zur Kauffrau für Büromanagement', text: 'Das Design ist so aufgeräumt und modern. Man merkt, dass es von jemandem gebaut wurde, der die Ausbildung wirklich kennt.' },
  { name: 'Marcus D.', role: 'Ausbilder · Mechatroniker', text: 'Das Einladungssystem ist super praktisch. Ich schicke einfach die E-Mail und meine Azubis sind in wenigen Minuten registriert.' },
  { name: 'Jana F.', role: 'Auszubildende zur Industriekauffrau', text: 'Dass der Ausbilder direkt kommentieren kann, ist Gold wert. Keine langen E-Mail-Threads mehr — einfach Feedback direkt am Bericht.' },
  { name: 'Florian R.', role: 'Ausbildungsleiter · Großbetrieb', text: 'Wir verwalten jetzt 12 Auszubildende über AzubiHub. Die Zeitersparnis gegenüber dem alten System ist enorm.' },
]

const FAQS = [
  { q: 'Ist AzubiHub kostenlos?', a: 'Ja, AzubiHub ist aktuell vollständig kostenlos nutzbar — für Auszubildende und Ausbilder. Wir planen in Zukunft optionale Premium-Features, der Kern bleibt aber dauerhaft gratis.' },
  { q: 'Welche Ausbildungsberufe werden unterstützt?', a: 'AzubiHub ist für alle Ausbildungsberufe geeignet, bei denen ein wöchentlicher Ausbildungsnachweis geführt werden muss. Das gilt für nahezu alle IHK- und HWK-Berufe in Deutschland.' },
  { q: 'Wie funktioniert die KI-Formulierung?', a: 'Du gibst deine Tätigkeiten als kurze Stichpunkte ein, wählst Länge und Stil, und die KI (basierend auf Claude von Anthropic) formuliert daraus einen professionellen, IHK-konformen Fließtext — in Sekunden.' },
  { q: 'Kann mein Ausbilder die Berichte auch kommentieren?', a: 'Ja! Ausbilder können direkt am Bericht kommentieren, Revisionen anfordern oder Berichte freigeben. Der gesamte Kommunikationsprozess läuft innerhalb von AzubiHub.' },
  { q: 'Sind meine Daten sicher?', a: 'Alle Daten werden verschlüsselt in sicheren Rechenzentren gespeichert. Wir verarbeiten keine Daten außerhalb der EU und halten uns vollständig an die DSGVO.' },
  { q: 'Kann ich meine Berichte exportieren?', a: 'Ja, du kannst jederzeit einen professionellen PDF-Jahresexport erstellen, der alle Wochenberichte enthält und für die IHK-Vorlage geeignet ist.' },
  { q: 'Wie lade ich meinen Ausbilder ein?', a: 'Als Ausbilder kannst du im Verwaltungsbereich einfach die E-Mail-Adresse eingeben. Deine Auszubildenden erhalten automatisch eine Einladung und sind in wenigen Minuten registriert.' },
  { q: 'Funktioniert AzubiHub auch auf dem Smartphone?', a: 'Ja, AzubiHub ist vollständig responsive und funktioniert auf allen Geräten — Smartphone, Tablet und Desktop. Eine native App ist in Planung.' },
]

/* ─── SHARED NAV ─── */
function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-[hsl(var(--background))]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-black text-sm">A</span>
          </div>
          <span className="font-bold text-base tracking-tight">AzubiHub</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">So funktionierts</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Preise</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">Anmelden</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="text-sm gap-1.5 shadow-lg shadow-primary/25">
              Kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── FAQ ACCORDION ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button onClick={() => setOpen(o => !o)} className="w-full text-left rounded-2xl border border-border bg-card/50 px-5 py-4 hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-sm">{q}</span>
        <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} size={16} className={cn('shrink-0 transition-colors', open ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      {open && <p className="text-sm text-muted-foreground mt-3 leading-relaxed text-left">{a}</p>}
    </button>
  )
}

/* ─── LANDING PAGE ─── */
function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground overflow-x-hidden">
      <LandingNav />

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <HugeiconsIcon icon={SparklesIcon} size={12} />
            Jetzt mit KI-Unterstützung · Powered by Claude AI
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Das Berichtsheft,{' '}
            <span className="text-primary">das sich selbst</span>
            <br />schreibt.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AzubiHub digitalisiert deinen Ausbildungsnachweis. Berichte schneller erstellen, vom Ausbilder freigeben lassen und als PDF exportieren — alles in einer App.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-xl shadow-primary/30 w-full sm:w-auto">
                Kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base w-full sm:w-auto border-border hover:border-primary/40">
                Bereits registriert? Anmelden
              </Button>
            </Link>
          </div>

          {/* App Mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(var(--background))] z-10 pointer-events-none rounded-2xl" />
            <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/5">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-[hsl(var(--background))]/60">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-500/60" /><div className="size-3 rounded-full bg-yellow-500/60" /><div className="size-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 max-w-xs mx-auto h-5 rounded bg-muted/50 flex items-center px-2">
                  <span className="text-[10px] text-muted-foreground">azubihub.app/berichtsheft</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-2 w-32 bg-muted rounded" />
                    <div className="h-4 w-48 bg-foreground/10 rounded" />
                  </div>
                  <div className="h-8 w-28 bg-primary/20 rounded-lg border border-primary/30" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[{ c: 'bg-blue-500/20 border-blue-500/30', v: '24', l: 'Berichte' }, { c: 'bg-green-500/20 border-green-500/30', v: '18', l: 'Freigegeben' }, { c: 'bg-yellow-500/20 border-yellow-500/30', v: '4', l: 'Ausstehend' }, { c: 'bg-primary/20 border-primary/30', v: '2', l: 'In Prüfung' }].map(s => (
                    <div key={s.l} className={`rounded-xl border p-3 ${s.c}`}><div className="text-xl font-bold">{s.v}</div><div className="text-[10px] text-muted-foreground">{s.l}</div></div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[{ kw: 'KW 11 · 2025', s: 'Freigegeben', sc: 'bg-green-500/20 text-green-400 border-green-500/30', d: ['Mo', 'Di', 'Mi', 'Do', 'Fr'] }, { kw: 'KW 12 · 2025', s: 'In Prüfung', sc: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', d: ['Mo', 'Di', 'Mi', 'Do', 'Fr'] }, { kw: 'KW 13 · 2025', s: 'Entwurf', sc: 'bg-muted text-muted-foreground border-border', d: ['Mo', 'Di'] }].map(r => (
                    <div key={r.kw} className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5">
                      <div className="text-xs font-medium w-28 shrink-0">{r.kw}</div>
                      <div className="flex gap-1 flex-1">{r.d.map(d => <div key={d} className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">{d}</div>)}</div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r.sc}`}>{r.s}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <HugeiconsIcon icon={SparklesIcon} size={13} className="text-primary" />
                    <span className="text-xs font-semibold text-primary">KI-Formulierung</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Ctrl+Enter</span>
                  </div>
                  <div className="text-xs text-muted-foreground italic">„Datenbank-Migration, SQL-Optimierung, Teammeeting Projektplanung..."</div>
                  <div className="h-1 w-full bg-muted/50 rounded mt-2 overflow-hidden">
                    <div className="h-full w-2/3 bg-primary/40 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 px-6 border-y border-border bg-card/20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-black text-primary mb-1">{s.value}</div>
              <div className="text-sm font-semibold">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Funktionen</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Alles was du brauchst,<br />nichts was du nicht brauchst.</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">AzubiHub ist speziell für die Ausbildung gebaut — kein generisches Tool, sondern die perfekte Lösung.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-border bg-card/50 p-5 hover:border-border/80 transition-colors">
                <div className={cn('size-11 rounded-xl flex items-center justify-center mb-4', f.bg)}>
                  <HugeiconsIcon icon={f.icon} size={20} className={f.color} />
                </div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">So einfach geht's</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">In 3 Schritten startklar.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="absolute top-8 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent hidden sm:block" />
            {STEPS.map((s, i) => (
              <div key={s.num} className="text-center relative">
                <div className={cn('size-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-black border-2', i === 0 ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30' : i === 1 ? 'bg-primary/20 text-primary border-primary/40' : 'bg-muted text-muted-foreground border-border')}>
                  {s.num}
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-xl shadow-primary/25">
                Jetzt kostenlos starten <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── BENEFITS + KI DEMO ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Dein Vorteil</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">Weniger Aufwand.<br />Mehr Ausbildung.</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">Das Berichtsheft ist Pflicht — aber es muss keine Qual sein. AzubiHub nimmt dir die stupide Arbeit ab, damit du dich auf das konzentrieren kannst, was wirklich zählt.</p>
              <div className="space-y-4">
                {BENEFITS.map(b => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <HugeiconsIcon icon={b.icon} size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{b.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
              <div className="relative rounded-2xl border border-border bg-card/80 p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <HugeiconsIcon icon={SparklesIcon} size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">KI-Formulierung</p>
                    <p className="text-[11px] text-muted-foreground">Aus Stichpunkten wird Text</p>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 border border-border p-3">
                  <p className="text-[11px] text-muted-foreground mb-1 font-medium">Deine Stichpunkte:</p>
                  <p className="text-xs text-foreground/70">• Server-Setup, Nginx Config<br />• Bug in API-Route gesucht/gefunden<br />• Code Review mit dem Team</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center">
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-primary" />
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="rounded-xl bg-primary/8 border border-primary/20 p-3">
                  <p className="text-[11px] text-primary mb-1 font-medium">Generierter Text:</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">Am heutigen Arbeitstag konfigurierte ich einen Nginx-Webserver und richtete die erforderlichen Server-Einstellungen ein. Im Anschluss analysierte ich einen Fehler in einer API-Route und konnte diesen erfolgreich beheben. Den Abschluss des Tages bildete ein Code Review gemeinsam mit dem Entwicklungsteam.</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground text-center cursor-pointer hover:border-primary/40 transition-colors">Kurz</div>
                  <div className="flex-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] text-primary text-center font-medium">Normal</div>
                  <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground text-center cursor-pointer hover:border-primary/40 transition-colors">Ausführlich</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Vergleich</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Papier vs. AzubiHub.</h2>
            <p className="text-muted-foreground mt-4">Schon klar, welche Wahl einfacher ist.</p>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>Funktion</div>
              <div className="text-center">Papier / Word</div>
              <div className="text-center text-primary">AzubiHub</div>
            </div>
            {COMPARISON.map((c, i) => (
              <div key={c.feature} className={cn('grid grid-cols-3 px-6 py-3.5 items-center', i % 2 === 0 ? 'bg-card/50' : 'bg-card/20')}>
                <span className="text-sm">{c.feature}</span>
                <div className="flex justify-center">
                  {c.classic
                    ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-muted-foreground/50" />
                    : <HugeiconsIcon icon={Cancel01Icon} size={18} className="text-destructive/60" />}
                </div>
                <div className="flex justify-center">
                  {c.azubi
                    ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-green-400" />
                    : <HugeiconsIcon icon={Cancel01Icon} size={18} className="text-destructive/60" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Preise</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Einfach. Kostenlos.</h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">Kein Abo, keine Kreditkarte, keine versteckten Kosten. AzubiHub ist für alle Auszubildenden und Ausbilder kostenlos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card/80 p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kostenlos</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black">0€</span>
                  <span className="text-muted-foreground mb-1.5">/ immer</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Alles, was du als Auszubildender brauchst.</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                {['Unbegrenzte Wochenberichte', 'KI-Formulierung (täglich)', 'Ausbilder-Freigabe Workflow', 'PDF-Export', 'Kalender & Statistiken', 'Cloud-Sync auf allen Geräten'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} className="text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="block">
                <Button variant="outline" className="w-full border-border hover:border-primary/40">Jetzt registrieren</Button>
              </Link>
            </div>
            {/* Pro (coming soon) */}
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-7 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full">Bald</span>
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black">4,99€</span>
                  <span className="text-muted-foreground mb-1.5">/ Monat</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Für Ausbildungsbetriebe mit mehreren Azubis.</p>
              </div>
              <ul className="space-y-2.5 mb-7">
                {['Alles aus Kostenlos', 'Unbegrenzte KI-Nutzung', 'Team-Verwaltung (bis 20 Azubis)', 'Vorlagen-Bibliothek', 'Prioritäts-Support', 'Bald: Mobile App'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full opacity-60" disabled>Benachrichtigen, wenn verfügbar</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Stimmen</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Was andere über uns sagen.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl border border-border bg-card/80 p-5 flex flex-col">
                <HugeiconsIcon icon={QuoteUpIcon} size={20} className="text-primary mb-3" />
                <p className="text-sm text-foreground/80 leading-relaxed mb-5 italic flex-1">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-primary/15 flex items-center justify-center font-bold text-xs text-primary shrink-0">{t.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.role}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[...Array(5)].map((_, i) => <HugeiconsIcon key={i} icon={StarIcon} size={10} className="text-yellow-400" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Häufig gestellte Fragen.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">Weitere Fragen? <a href="mailto:kontakt@azubihub.app" className="text-primary hover:underline">Schreib uns</a></p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
            Kostenlos · Keine Kreditkarte nötig
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Bereit, das Berichtsheft<br /><span className="text-primary">endlich zu mögen?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">Tritt hunderten Auszubildenden bei, die ihre Ausbildung smarter gestalten.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-10 text-base gap-2 shadow-2xl shadow-primary/30 w-full sm:w-auto">
                Jetzt kostenlos registrieren <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="h-14 px-10 text-base w-full sm:w-auto border-border hover:border-primary/40">Anmelden</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border pt-12 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-primary-foreground font-black text-sm">A</span>
                </div>
                <span className="font-bold text-base">AzubiHub</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Das digitale Berichtsheft für moderne Ausbildungsbetriebe. KI-gestützt, IHK-konform, kostenlos.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="mailto:kontakt@azubihub.app" className="size-8 rounded-lg border border-border hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <HugeiconsIcon icon={Mail01Icon} size={15} />
                </a>
                <a href="https://github.com" className="size-8 rounded-lg border border-border hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <HugeiconsIcon icon={Github01Icon} size={15} />
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Produkt</p>
              <div className="space-y-2.5">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Preise</a>
                <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
                <Link href="/auth/register" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Registrieren</Link>
                <Link href="/auth/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Anmelden</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Rechtliches</p>
              <div className="space-y-2.5">
                <Link href="/impressum" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Impressum</Link>
                <Link href="/datenschutz" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Datenschutzerklärung</Link>
                <span className="block text-sm text-muted-foreground cursor-default">AGB</span>
                <a href="mailto:kontakt@azubihub.app" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Kontakt</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/50">
            <span>© {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.</span>
            <span>Made with ❤️ für Auszubildende in Deutschland</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── ROOT PAGE ─── */
export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <LandingPage />
  return <AppHome />
}
