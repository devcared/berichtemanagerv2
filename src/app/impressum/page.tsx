import Link from 'next/link'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

export const metadata = { title: 'Impressum – AzubiHub' }

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-[hsl(var(--background))]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-primary-foreground font-black text-sm">A</span>
            </div>
            <span className="font-bold text-base tracking-tight">AzubiHub</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <span>← Zurück</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Zurück zur Startseite
        </Link>

        <div className="mb-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Rechtliches</p>
          <h1 className="text-4xl font-black tracking-tight">Impressum</h1>
          <p className="text-muted-foreground mt-3">Angaben gemäß § 5 TMG</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-base mb-4 text-foreground">Anbieter</h2>
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">AzubiHub</p>
              <p>Emil Schröder</p>
              <p>Musterstraße 1</p>
              <p>12345 Musterstadt</p>
              <p>Deutschland</p>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-base mb-4 text-foreground">Kontakt</h2>
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-2 text-muted-foreground">
              <p><span className="text-foreground font-medium">E-Mail:</span>{' '}
                <a href="mailto:kontakt@azubihub.app" className="text-primary hover:underline">kontakt@azubihub.app</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-base mb-4 text-foreground">Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)</h2>
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-1 text-muted-foreground">
              <p>Emil Schröder</p>
              <p>Musterstraße 1</p>
              <p>12345 Musterstadt</p>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-base mb-4 text-foreground">Haftungsausschluss</h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Haftung für Inhalte</h3>
                <p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Haftung für Links</h3>
                <p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Urheberrecht</h3>
                <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-base mb-4 text-foreground">Streitschlichtung</h2>
            <p className="text-muted-foreground">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border flex gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Startseite</Link>
          <Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutzerklärung</Link>
        </div>
      </div>
    </div>
  )
}
