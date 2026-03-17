import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, length = 'normal', style = 'neutral' } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API Key is missing in .env.local' }, { status: 500 })
    }

    // Adjust length
    let lengthInstruction = 'etwa 2-3 Sätze'
    if (length === 'kurz') lengthInstruction = 'maximal 1-2 sehr kurze Sätze'
    if (length === 'ausführlich') lengthInstruction = 'etwa 4-5 ausführliche Sätze'

    // Adjust style
    let styleInstruction = 'sachlich, professionell und neutral'
    if (style === 'technisch') styleInstruction = 'mit starkem technischem Fokus, fachsprachlich, präzise'
    if (style === 'einfach') styleInstruction = 'einfach formuliert, leicht verständlich, entspannt'

    const systemPrompt = `Du bist ein Assistent für Auszubildende, der Stichpunkte in professionelle, IHK-konforme Fließtexte für das Berichtsheft umwandelt.
Regeln:
- Schreibe aus der Ich-Perspektive ("Ich habe...")
- Schreibstil: ${styleInstruction}
- Länge: ${lengthInstruction}
- Verwende nur Inhalte, die im Input genannt oder sinnvoll direkt ableitbar sind. Erfinde absolut keine Fachbegriffe, Hardware oder Tätigkeiten, die nicht impliziert wurden!
- Formuliere es als abgeschlossenen Ausbildungsnachweis-Eintrag. Keine Einleitung wie "Hier ist dein Text:". Gib nur den fertigen Text zurück.`

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
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI Error:', errorData)
      return NextResponse.json({ error: 'OpenAI API Request failed' }, { status: response.status })
    }

    const data = await response.json()
    const generatedText = data.choices?.[0]?.message?.content?.trim()

    return NextResponse.json({ text: generatedText })

  } catch (error) {
    console.error('AI Generation Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
