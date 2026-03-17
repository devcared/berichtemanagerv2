'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { generateReportText, type TextLength, type TextTone } from '@/lib/ai-service'
import { HugeiconsIcon } from '@hugeicons/react'
import { MagicWand01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'

interface AiTextHelperProps {
  dayName: string
  category: string
  onApply: (text: string) => void
}

export function AiTextHelper({ dayName, category, onApply }: AiTextHelperProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [bulletPoints, setBulletPoints] = useState('')
  const [length, setLength] = useState<TextLength>('normal')
  const [tone, setTone] = useState<TextTone>('neutral')
  const [generated, setGenerated] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!bulletPoints.trim()) return
    setIsLoading(true)
    setError('')
    setGenerated('')
    try {
      const text = await generateReportText({ bulletPoints, length, tone, dayName, category })
      setGenerated(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Textgenerierung.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!generated) return
    onApply(generated)
    setIsOpen(false)
    setBulletPoints('')
    setGenerated('')
    setError('')
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-2 print:hidden"
      >
        <HugeiconsIcon icon={MagicWand01Icon} size={13} />
        Mit KI formulieren
      </button>
    )
  }

  return (
    <div className="mt-2 p-3 rounded-xl border border-primary/25 bg-primary/5 space-y-3 print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <HugeiconsIcon icon={MagicWand01Icon} size={13} />
          KI-Assistent
        </div>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setGenerated(''); setError('') }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Schließen
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Stichpunkte für {dayName}
        </Label>
        <Textarea
          value={bulletPoints}
          onChange={e => setBulletPoints(e.target.value)}
          placeholder="z. B.: Meeting mit Team, Server neu gestartet, Netzwerkkabel verlegt"
          className="min-h-[68px] text-sm bg-background border-border resize-none"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleGenerate()
            }
          }}
        />
        <p className="text-[10px] text-muted-foreground">Tipp: Strg+Enter zum Generieren</p>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Länge</Label>
          <Select value={length} onValueChange={v => setLength(v as TextLength)}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kurz">Kurz (1–2 Sätze)</SelectItem>
              <SelectItem value="normal">Normal (2–4 Sätze)</SelectItem>
              <SelectItem value="ausführlich">Ausführlich (4–6 Sätze)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Stil</Label>
          <Select value={tone} onValueChange={v => setTone(v as TextTone)}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="technisch">Technisch</SelectItem>
              <SelectItem value="einfach">Einfach</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={handleGenerate}
          disabled={isLoading || !bulletPoints.trim()}
        >
          {isLoading ? (
            <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          ) : (
            <HugeiconsIcon icon={MagicWand01Icon} size={13} />
          )}
          {isLoading ? 'Generiert…' : 'Formulieren'}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {generated && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">Generierter Text (bearbeitbar)</Label>
          <Textarea
            value={generated}
            onChange={e => setGenerated(e.target.value)}
            className="min-h-[80px] text-sm bg-background border-border resize-y"
          />
          <Button
            type="button"
            size="sm"
            className="w-full h-8 gap-1.5 text-xs"
            onClick={handleApply}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
            Text in Tätigkeitsfeld übernehmen
          </Button>
        </div>
      )}
    </div>
  )
}
