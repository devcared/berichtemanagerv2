import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { entries } = await req.json()

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Entries are required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API Key is missing in .env.local' }, { status: 500 })
    }

    const summaryData = entries
      .filter(e => e.activities && e.activities.trim().length > 0)
      .map(e => `- ${e.activities}`)
      .join('\n')

    if (!summaryData) {
      return NextResponse.json({ error: 'Keine ausreichenden Daten für ein Fazit vorhanden.' }, { status: 400 })
    }

    const systemPrompt = `Du bist ein Assistent für Auszubildende, der ein wöchentliches Ausbildungsfazit (2-3 Sätze) auf Basis der Täglichen Einträge verfasst.
Regeln:
- Schreibe aus der Ich-Perspektive ("In dieser Woche lag mein Schwerpunkt auf...")
- Der Text soll sachlich, professionell und für das IHK-Berichtsheft geeignet sein.
- Fasse die großen Themen der Woche intelligent zusammen, aber erfinde keine Fachbegriffe, Hardware oder Tätigkeiten, die nicht impliziert wurden!
- Gib nur den finalen Text zurück.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: summaryData }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'OpenAI API Request failed' }, { status: response.status })
    }

    const data = await response.json()
    const generatedText = data.choices?.[0]?.message?.content?.trim()

    return NextResponse.json({ text: generatedText })

  } catch (error) {
    console.error('AI Summary Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
