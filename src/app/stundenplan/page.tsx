'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  File01Icon, ArrowLeft01Icon, ArrowRight02Icon, CalendarIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface AssignedDoc {
  id: string
  title: string
  fileName: string
  fileSize: number
  createdAt: string
  url: string | null
}

function fmtSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function StundenplanPage() {
  const [docs, setDocs]           = useState<AssignedDoc[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeDoc, setActiveDoc] = useState<AssignedDoc | null>(null)

  useEffect(() => {
    fetch('/api/schedule/documents')
      .then(r => r.json())
      .then(data => setDocs(data.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-3">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      </div>
    )
  }

  /* ── PDF viewer ── */
  if (activeDoc) {
    return (
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => setActiveDoc(null)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
            Zurück
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{activeDoc.title}</p>
            <p className="text-xs text-muted-foreground truncate">{activeDoc.fileName}</p>
          </div>
          {activeDoc.url && (
            <a href={activeDoc.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
                <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
                Neuer Tab
              </Button>
            </a>
          )}
        </div>

        {activeDoc.url ? (
          <iframe
            src={activeDoc.url}
            className="flex-1 w-full border-0"
            title={activeDoc.title}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">PDF-Link nicht verfügbar.</p>
          </div>
        )}
      </div>
    )
  }

  /* ── No docs assigned ── */
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-6 p-8 text-center">
        <div className="size-24 rounded-3xl bg-muted/30 border border-border/40 flex items-center justify-center">
          <HugeiconsIcon icon={CalendarIcon} size={40} className="text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Kein Plan hinterlegt</h2>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Dein Ausbilder hat noch keinen Stundenplan für dich hochgeladen.
            Schau später noch einmal vorbei.
          </p>
        </div>
      </div>
    )
  }

  /* ── Document list ── */
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon icon={File01Icon} size={18} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Mein Stundenplan</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            {docs.length === 1 ? '1 Dokument' : `${docs.length} Dokumente`} von deinem Ausbilder
          </p>
        </div>

        <div className="space-y-3">
          {docs.map(doc => (
            <button key={doc.id} onClick={() => setActiveDoc(doc)}
              className="w-full flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/40 hover:bg-primary/[0.025] transition-all text-left group shadow-sm hover:shadow-md">
              <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/15 transition-colors">
                <HugeiconsIcon icon={File01Icon} size={22} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {format(new Date(doc.createdAt), 'dd. MMMM yyyy', { locale: de })}
                  {doc.fileSize ? ` · ${fmtSize(doc.fileSize)}` : ''}
                </p>
              </div>
              <div className="size-8 rounded-lg bg-muted/40 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                <HugeiconsIcon icon={ArrowRight02Icon} size={15}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
