import Link from 'next/link'

export const metadata = { title: 'Datenschutzerklärung – AzubiHub' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-base mb-4 text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  )
}

export default function DatenschutzPage() {
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
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Zurück</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Zurück zur Startseite
        </Link>

        <div className="mb-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Rechtliches</p>
          <h1 className="text-4xl font-black tracking-tight">Datenschutzerklärung</h1>
          <p className="text-muted-foreground mt-3">Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          <Section title="1. Verantwortlicher">
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-1">
              <p className="font-semibold text-foreground">AzubiHub – Emil Schröder</p>
              <p>Musterstraße 1, 12345 Musterstadt</p>
              <p>E-Mail: <a href="mailto:kontakt@azubihub.app" className="text-primary hover:underline">kontakt@azubihub.app</a></p>
            </div>
          </Section>

          <Section title="2. Welche Daten wir erheben">
            <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Registrierungsdaten:</strong> E-Mail-Adresse, Passwort (verschlüsselt)</li>
              <li><strong className="text-foreground">Profildaten:</strong> Vorname, Nachname, Ausbildungsberuf, Betriebsname</li>
              <li><strong className="text-foreground">Ausbildungsdaten:</strong> Wochenberichte, Tätigkeitseinträge, Kommentare, Freigabe-Status</li>
              <li><strong className="text-foreground">Nutzungsdaten:</strong> Login-Zeitpunkte, IP-Adresse (temporär), Browser-Informationen</li>
            </ul>
          </Section>

          <Section title="3. Zweck der Datenverarbeitung">
            <p>Wir verarbeiten deine Daten ausschließlich für folgende Zwecke:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Bereitstellung und Betrieb der AzubiHub-Plattform</li>
              <li>Verwaltung von Benutzerkonten und Authentifizierung</li>
              <li>Speicherung und Verwaltung von Ausbildungsnachweisen</li>
              <li>KI-gestützte Textgenerierung (anonymisiert an Anthropic API übermittelt)</li>
              <li>Kommunikation zwischen Auszubildenden und Ausbildern</li>
              <li>Verbesserung und Weiterentwicklung der Plattform</li>
            </ul>
          </Section>

          <Section title="4. Rechtsgrundlage">
            <p>Die Verarbeitung deiner Daten erfolgt auf Basis folgender Rechtsgrundlagen gemäß DSGVO:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Art. 6 Abs. 1 lit. b DSGVO</strong> – Vertragserfüllung: Daten zur Bereitstellung des Dienstes</li>
              <li><strong className="text-foreground">Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung: für optionale Features wie Benachrichtigungen</li>
              <li><strong className="text-foreground">Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigte Interessen: Sicherheit und Missbrauchsprävention</li>
            </ul>
          </Section>

          <Section title="5. Drittanbieter und Datenübermittlung">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card/50 p-5">
                <p className="font-semibold text-foreground mb-1">Supabase (Datenbank & Authentifizierung)</p>
                <p>Wir nutzen Supabase für Datenbank und Auth. Daten werden in EU-Rechenzentren (Frankfurt) gespeichert. Datenschutzerklärung: <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></p>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-5">
                <p className="font-semibold text-foreground mb-1">Anthropic (KI-Textgenerierung)</p>
                <p>Wenn du die KI-Formulierungsfunktion nutzt, werden deine Stichpunkte zur Textgenerierung an die Anthropic API übermittelt. Die Daten werden nicht dauerhaft gespeichert. Datenschutzerklärung: <a href="https://www.anthropic.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a></p>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-5">
                <p className="font-semibold text-foreground mb-1">Vercel (Hosting)</p>
                <p>Die Plattform wird auf Vercel gehostet. Vercel verarbeitet temporär IP-Adressen für die Auslieferung der Anwendung. Datenschutzerklärung: <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></p>
              </div>
            </div>
          </Section>

          <Section title="6. Cookies und lokale Speicherung">
            <p>AzubiHub verwendet technisch notwendige Cookies ausschließlich für die Sitzungsverwaltung (Authentifizierung). Diese Cookies sind zur Nutzung der Plattform erforderlich und können nicht deaktiviert werden.</p>
            <p>Wir verwenden keine Tracking-Cookies, keine Analyse-Cookies (z. B. Google Analytics) und keine Werbe-Cookies.</p>
          </Section>

          <Section title="7. Datenspeicherung und Löschung">
            <p>Deine Daten werden so lange gespeichert, wie dein Konto aktiv ist. Nach der Löschung deines Kontos werden alle personenbezogenen Daten innerhalb von 30 Tagen vollständig entfernt.</p>
            <p>Ausbildungsnachweise, die mit einem Ausbilder geteilt wurden, können im System des Ausbilders bis zur Löschung seines Kontos verbleiben.</p>
          </Section>

          <Section title="8. Deine Rechte">
            <p>Du hast folgende Rechte bezüglich deiner personenbezogenen Daten:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Auskunftsrecht (Art. 15 DSGVO):</strong> Welche Daten wir über dich gespeichert haben</li>
              <li><strong className="text-foreground">Berichtigungsrecht (Art. 16 DSGVO):</strong> Korrektur unrichtiger Daten</li>
              <li><strong className="text-foreground">Löschungsrecht (Art. 17 DSGVO):</strong> Löschung deiner Daten</li>
              <li><strong className="text-foreground">Einschränkungsrecht (Art. 18 DSGVO):</strong> Einschränkung der Verarbeitung</li>
              <li><strong className="text-foreground">Datenübertragbarkeit (Art. 20 DSGVO):</strong> Export deiner Daten in maschinenlesbarem Format</li>
              <li><strong className="text-foreground">Widerspruchsrecht (Art. 21 DSGVO):</strong> Widerspruch gegen die Verarbeitung</li>
            </ul>
            <p>Zur Ausübung deiner Rechte wende dich an: <a href="mailto:kontakt@azubihub.app" className="text-primary hover:underline">kontakt@azubihub.app</a></p>
          </Section>

          <Section title="9. Datensicherheit">
            <p>Alle Verbindungen zu AzubiHub sind durch TLS/SSL verschlüsselt. Passwörter werden ausschließlich als bcrypt-Hash gespeichert. Datenbankzugriffe sind durch Row-Level-Security (RLS) abgesichert — jeder Nutzer kann nur seine eigenen Daten lesen.</p>
            <p>Wir aktualisieren unsere Sicherheitsmaßnahmen regelmäßig und orientieren uns an den aktuellen Empfehlungen des BSI.</p>
          </Section>

          <Section title="10. Beschwerderecht">
            <p>Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die zuständige Aufsichtsbehörde für Deutschland ist der Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI):</p>
            <div className="rounded-2xl border border-border bg-card/50 p-5">
              <p>Bundesbeauftragter für den Datenschutz und die Informationsfreiheit</p>
              <p>Husarenstraße 30, 53117 Bonn</p>
              <p><a href="https://www.bfdi.bund.de" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.bfdi.bund.de</a></p>
            </div>
          </Section>

          <Section title="11. Änderungen dieser Datenschutzerklärung">
            <p>Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen der Rechtslage oder der Plattform anzupassen. Die jeweils aktuelle Version ist unter <Link href="/datenschutz" className="text-primary hover:underline">azubihub.app/datenschutz</Link> abrufbar. Bei wesentlichen Änderungen informieren wir registrierte Nutzer per E-Mail.</p>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border flex gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Startseite</Link>
          <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        </div>
      </div>
    </div>
  )
}
