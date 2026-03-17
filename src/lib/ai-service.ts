export type TextLength = 'kurz' | 'normal' | 'ausführlich'
export type TextTone = 'neutral' | 'technisch' | 'einfach'

export interface GenerateTextParams {
  bulletPoints: string
  length?: TextLength
  tone?: TextTone
  dayName?: string
  category?: string
}

export interface GenerateSummaryParams {
  entries: Array<{
    activities: string
    category: string
    date: string
  }>
  calendarWeek: number
  year: number
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'KI-Anfrage fehlgeschlagen.')
  }
  return data as T
}

export async function generateReportText(params: GenerateTextParams): Promise<string> {
  const { text } = await postJson<{ text: string }>('/api/ai/generate-text', params)
  return text
}

export async function generateWeeklySummary(params: GenerateSummaryParams): Promise<string> {
  const { text } = await postJson<{ text: string }>('/api/ai/generate-summary', params)
  return text
}
