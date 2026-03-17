import { NextRequest, NextResponse } from 'next/server'

const CATEGORY_LABELS: Record<string, string> = {
  company: 'Betrieb',
  vocationalSchool: 'Berufsschule',
  interCompany: 'Überbetriebliche Ausbildung',
  vacation: 'Urlaub',
  sick: 'Krankheit',
  holiday: 'Feiertag',
}

export async function POST(req: NextRequest) {
  try {
    const { entries, calendarWeek, year } = await req.json()

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Keine Einträge übergeben.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'KI-Dienst nicht konfiguriert. Bitte ANTHROPIC_API_KEY setzen.' }, { status: 500 })
    }

    // Build a concise summary of the week's entries for the prompt
    const entryLines = entries
      .filter((e: { activities?: string }) => e.activities?.trim())
      .map((e: { date?: string; category?: string; activities?: string }) => {
        const dateStr = e.date ? new Date(e.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' }) : ''
        const catLabel = e.category ? (CATEGORY_LABELS[e.category] ?? e.category) : ''
        return `- ${dateStr}${catLabel ? ` (${catLabel})` : ''}: ${e.activities?.trim()}`
      })
      .join('\n')

    if (!entryLines) {
      return NextResponse.json({ error: 'Keine Aktivitäten eingetragen.' }, { status: 400 })
    }

    const prompt = `Du hilfst einem Auszubildenden dabei, sein Berichtsheft professionell zu führen.

Der Azubi hat folgende Tätigkeiten in KW ${calendarWeek}/${year} eingetragen:
${entryLines}

Erstelle daraus ein kompaktes Wochenfazit mit genau 2–3 Sätzen. Halte diese Regeln ein:
- Schreibe in der Ich-Form (z. B. "In dieser Woche lag mein Schwerpunkt auf …")
- Fasse thematisch zusammen – nenne keine einzelnen Tage oder Daten
- Sachlich, professionell, IHK-konform
- Schließe mit einem Satz ab, der den Lerneffekt oder den Bezug zu betrieblichen Abläufen betont
- Gib NUR das fertige Fazit aus – keine Erklärungen, keine Formatierung.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      return NextResponse.json({ error: 'KI-Anfrage fehlgeschlagen.' }, { status: 502 })
    }

    const data = await response.json()
    const text: string = data.content?.[0]?.text?.trim() ?? ''

    return NextResponse.json({ text })
  } catch (error) {
    console.error('generate-summary error:', error)
    return NextResponse.json({ error: 'Interner Fehler bei der Zusammenfassung.' }, { status: 500 })
  }
}
