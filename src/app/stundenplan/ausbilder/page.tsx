'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import {
  CheckmarkBadge01Icon, Alert01Icon, File01Icon,
  Upload01Icon, Delete02Icon, CheckmarkCircle01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── TYPES ─── */

interface Apprentice {
  id: string
  first_name: string
  last_name: string
  occupation: string
  company_name: string
}

interface TrainerDocument {
  id: string
  title: string
  file_name: string
  file_size: number
  created_at: string
  schedule_document_assignments: { profile_id: string }[]
}

/* ─── CONSTANTS ─── */

const PERSON_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EC4899',
  '#8B5CF6','#06B6D4','#EF4444','#84CC16',
]

/* ─── HELPERS ─── */

function fmtSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/* ─── PAGE ─── */

export default function AusbilderStundenplanPage() {
  const router = useRouter()
  const { profile: trainerProfile, loading: profileLoading } = useProfile()

  const [apprentices, setApprentices] = useState<Apprentice[]>([])
  const [documents, setDocuments]     = useState<TrainerDocument[]>([])
  const [loading, setLoading]         = useState(true)

  /* upload state */
  const [uploadOpen, setUploadOpen]           = useState(false)
  const [uploadFile, setUploadFile]           = useState<File | null>(null)
  const [uploadTitle, setUploadTitle]         = useState('')
  const [uploadAssignees, setUploadAssignees] = useState<Set<string>>(new Set())
  const [uploading, setUploading]             = useState(false)
  const [uploadError, setUploadError]         = useState<string | null>(null)

  /* ── Load ── */
  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/schedule').then(r => r.json()),
      fetch('/api/admin/schedule/documents').then(r => r.json()),
    ])
      .then(([scheduleData, docsData]) => {
        setApprentices(scheduleData.profiles ?? [])
        setDocuments(docsData.documents ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (profileLoading) return
    if (trainerProfile?.role !== 'trainer') { router.push('/stundenplan'); return }
    load()
  }, [profileLoading, trainerProfile, router, load])

  /* ── Upload ── */
  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('title', uploadTitle.trim())
      fd.append('assigneeIds', JSON.stringify([...uploadAssignees]))
      const res  = await fetch('/api/admin/schedule/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Fehler.'); return }
      setUploadOpen(false)
      setUploadFile(null)
      setUploadTitle('')
      setUploadAssignees(new Set())
      load()
    } catch {
      setUploadError('Netzwerkfehler beim Hochladen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    await fetch(`/api/admin/schedule/documents/${docId}`, { method: 'DELETE' })
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  function openUpload() {
    setUploadFile(null)
    setUploadTitle('')
    setUploadAssignees(new Set())
    setUploadError(null)
    setUploadOpen(true)
  }

  /* ── Guards ── */
  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  if (trainerProfile?.role !== 'trainer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <HugeiconsIcon icon={Alert01Icon} size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Kein Zugriff</h2>
        <p className="text-muted-foreground text-sm">Dieser Bereich ist nur für Ausbilder zugänglich.</p>
      </div>
    )
  }

  /* ── Derived ── */
  const withDocs    = apprentices.filter(ap => documents.some(d => d.schedule_document_assignments.some(a => a.profile_id === ap.id)))
  const withoutDocs = apprentices.filter(ap => !documents.some(d => d.schedule_document_assignments.some(a => a.profile_id === ap.id)))

  /* ── Render ── */
  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── Hero Header ── */}
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={24} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Ausbilder-Bereich</p>
              <h1 className="text-2xl font-bold tracking-tight">
                {trainerProfile.firstName} {trainerProfile.lastName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })} · Stundenplan-Dokumente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={load}>
              Aktualisieren
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openUpload}>
              <HugeiconsIcon icon={Upload01Icon} size={12} />
              Dokument hochladen
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full space-y-10">

        {/* ── Summary pills ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: File01Icon,            label: 'Dokumente',      value: documents.length,    color: 'text-primary',    bg: 'bg-primary/10' },
            { icon: CheckmarkCircle01Icon, label: 'Mit Dokument',   value: withDocs.length,     color: 'text-green-500',  bg: 'bg-green-500/10' },
            { icon: UserMultiple02Icon,    label: 'Ohne Dokument',  value: withoutDocs.length,  color: 'text-orange-500', bg: 'bg-orange-500/10' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0', s.bg, s.color)}>
                <HugeiconsIcon icon={s.icon} size={17} />
              </div>
              <div>
                <p className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Documents ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hochgeladene Dokumente
            </h2>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={openUpload}>
              <HugeiconsIcon icon={Upload01Icon} size={11} />
              Hochladen
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/5 py-14 flex flex-col items-center gap-3 text-center">
              <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                <HugeiconsIcon icon={File01Icon} size={28} className="text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Noch keine Dokumente</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Lade ein PDF hoch und weise es deinen Auszubildenden zu — sie sehen es direkt in ihrem Stundenplan.
                </p>
              </div>
              <Button size="sm" className="gap-1.5 text-xs mt-1" onClick={openUpload}>
                <HugeiconsIcon icon={Upload01Icon} size={12} />
                Erstes Dokument hochladen
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => {
                const assignedIds = doc.schedule_document_assignments.map(a => a.profile_id)
                const assigned    = assignedIds
                  .map(id => apprentices.find(a => a.id === id))
                  .filter((a): a is Apprentice => !!a)

                return (
                  <div key={doc.id}
                    className="rounded-2xl border border-border/50 bg-card p-5 flex items-start gap-4">
                    <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={File01Icon} size={22} className="text-red-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {format(new Date(doc.created_at), 'dd. MMMM yyyy', { locale: de })}
                            {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ''}
                          </p>
                        </div>
                        <button onClick={() => handleDelete(doc.id)}
                          className="size-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0 group">
                          <HugeiconsIcon icon={Delete02Icon} size={14} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {assigned.length === 0 ? (
                          <span className="text-xs text-orange-400/70 italic">Noch niemand zugewiesen</span>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground/60 shrink-0">Zugewiesen:</span>
                            {assigned.map(ap => {
                              const idx = apprentices.findIndex(a => a.id === ap.id)
                              const c   = PERSON_COLORS[idx % PERSON_COLORS.length]
                              return (
                                <span key={ap.id}
                                  className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${c}18`, color: c }}>
                                  {ap.first_name} {ap.last_name}
                                </span>
                              )
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Apprentice overview ── */}
        {apprentices.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Auszubildende
            </h2>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
              <div className="divide-y divide-border/40">
                {apprentices.map((ap, idx) => {
                  const color       = PERSON_COLORS[idx % PERSON_COLORS.length]
                  const initials    = `${ap.first_name[0] ?? ''}${ap.last_name[0] ?? ''}`.toUpperCase()
                  const assignedDocs = documents.filter(d =>
                    d.schedule_document_assignments.some(a => a.profile_id === ap.id)
                  )
                  return (
                    <div key={ap.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="size-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: color }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{ap.first_name} {ap.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{ap.occupation}</p>
                      </div>
                      {assignedDocs.length === 0 ? (
                        <span className="text-xs text-muted-foreground/50 italic shrink-0">Kein Dokument</span>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} className="text-green-400" />
                          <span className="text-xs font-semibold text-green-400">
                            {assignedDocs.length} {assignedDocs.length === 1 ? 'Dokument' : 'Dokumente'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Upload Dialog ── */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 pt-6 pb-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-base">PDF hochladen</h2>
              <button onClick={() => setUploadOpen(false)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors text-xl leading-none">
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* File picker */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">PDF-Datei *</p>
                <label className={cn(
                  'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors',
                  uploadFile ? 'border-primary/40 bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/20'
                )}>
                  <HugeiconsIcon icon={Upload01Icon} size={22}
                    className={uploadFile ? 'text-primary' : 'text-muted-foreground/40'} />
                  {uploadFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-primary truncate max-w-[280px]">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtSize(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Klicken zum Auswählen</p>
                      <p className="text-xs text-muted-foreground/50">PDF · max. 25 MB</p>
                    </div>
                  )}
                  <input type="file" accept=".pdf,application/pdf" className="sr-only"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              {/* Title */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Titel *</p>
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                  placeholder="z. B. Arbeitsplan KW 12, Ausbildungsrahmenplan…"
                  className="h-9 text-sm" />
              </div>

              {/* Apprentice multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Auszubildende
                  </p>
                  <button
                    onClick={() => setUploadAssignees(
                      uploadAssignees.size === apprentices.length
                        ? new Set()
                        : new Set(apprentices.map(a => a.id))
                    )}
                    className="text-[10px] text-primary hover:underline">
                    {uploadAssignees.size === apprentices.length ? 'Alle abwählen' : 'Alle auswählen'}
                  </button>
                </div>
                {apprentices.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 italic">Keine Auszubildenden gefunden.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-border/40 p-2">
                    {apprentices.map((ap, idx) => {
                      const checked = uploadAssignees.has(ap.id)
                      const color   = PERSON_COLORS[idx % PERSON_COLORS.length]
                      return (
                        <label key={ap.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                          <div className={cn(
                            'size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            checked ? 'bg-primary border-primary' : 'border-border'
                          )}>
                            {checked && (
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-primary-foreground" />
                            )}
                          </div>
                          <div className="size-7 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: color }}>
                            {ap.first_name[0]}{ap.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ap.first_name} {ap.last_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{ap.occupation}</p>
                          </div>
                          <input type="checkbox" className="sr-only" checked={checked}
                            onChange={e => {
                              setUploadAssignees(prev => {
                                const next = new Set(prev)
                                e.target.checked ? next.add(ap.id) : next.delete(ap.id)
                                return next
                              })
                            }} />
                        </label>
                      )
                    })}
                  </div>
                )}
                {uploadAssignees.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {uploadAssignees.size} {uploadAssignees.size === 1 ? 'Person' : 'Personen'} ausgewählt
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-border/40 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)}>
                Abbrechen
              </Button>
              <Button size="sm" className="gap-1.5"
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                onClick={handleUpload}>
                {uploading ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Hochladen…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Upload01Icon} size={13} />
                    Hochladen{uploadAssignees.size > 0 ? ` (${uploadAssignees.size})` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
