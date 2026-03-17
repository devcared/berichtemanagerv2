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
    const { bulletPoints, length = 'normal', tone = 'neutral', dayName, category } = await req.json()

    if (!bulletPoints?.trim()) {
      return NextResponse.json({ error: 'Keine Stichpunkte angegeben.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'KI-Dienst nicht konfiguriert. Bitte ANTHROPIC_API_KEY setzen.' }, { status: 500 })
    }

    const lengthMap = {
      kurz: '1–2 kurze, prägnante Sätze.',
      normal: '2–4 Sätze.',
      ausführlich: '4–6 Sätze mit etwas mehr Kontext und Detail.',
    }

    const toneMap = {
      neutral: 'Schreibe neutral und sachlich.',
      technisch: 'Verwende technische Fachsprache, wo sie sich aus den Stichpunkten ergibt.',
      einfach: 'Schreibe in klarer, einfacher Sprache – gut verständlich.',
    }

    const categoryLabel = category ? CATEGORY_LABELS[category] ?? category : undefined
    const contextHint = [
      dayName ? `Tag: ${dayName}` : null,
      categoryLabel ? `Bereich: ${categoryLabel}` : null,
    ]
      .filter(Boolean)
      .join(', ')

    const prompt = `Du hilfst einem Auszubildenden dabei, seinen Ausbildungsnachweis (Berichtsheft) professionell zu formulieren.

Kontext: ${contextHint || 'Arbeitstag im Betrieb'}

Der Azubi hat folgende Stichpunkte eingegeben:
"""
${bulletPoints.trim()}
"""

Erstelle daraus einen professionellen Fließtext. Halte diese Regeln strikt ein:
- Schreibe in der Ich-Form und Vergangenheitsform (z. B. "Ich nahm teil an …", "Ich führte durch …", "Ich bearbeitete …")
- Sachlich, präzise, keine blumige oder werbliche Sprache
- IHK-konform und geeignet für einen offiziellen Ausbildungsnachweis
- Verwende ausschließlich Inhalte, die aus den Stichpunkten ableitbar sind – keine erfundenen Details
- Schreibe ${lengthMap[length as keyof typeof lengthMap] ?? lengthMap.normal}
- ${toneMap[tone as keyof typeof toneMap] ?? toneMap.neutral}
- Gib NUR den fertigen Fließtext aus – keine Erklärungen, keine Anführungszeichen, keine Formatierung.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
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
    console.error('generate-text error:', error)
    return NextResponse.json({ error: 'Interner Fehler bei der Textgenerierung.' }, { status: 500 })
  }
}
