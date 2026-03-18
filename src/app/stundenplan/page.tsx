'use client'

import { useState, useEffect, useRef } from 'react'
import { format, isPast, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  File01Icon, ArrowLeft01Icon, ArrowRight02Icon,
  CalendarIcon, Upload01Icon, CheckmarkCircle01Icon, Time01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

/* ─── TYPES ─── */

interface AssignedDoc {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileSize: number
  createdAt: string
  expiresAt: string | null
  isRead: boolean
  url: string | null
}

interface MyDoc {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileSize: number
  createdAt: string
  url: string | null
}

/* ─── CONSTANTS ─── */

const CATEGORIES = [
  { id: 'allgemein',       label: 'Allgemein',        color: '#6B7280' },
  { id: 'wochenplan',      label: 'Wochenplan',       color: '#3B82F6' },
  { id: 'urlaubsplan',     label: 'Urlaubsplan',      color: '#10B981' },
  { id: 'betriebsplan',    label: 'Betriebsplan',     color: '#8B5CF6' },
  { id: 'ausbildungsplan', label: 'Ausbildungsplan',  color: '#F59E0B' },
  { id: 'sonstiges',       label: 'Sonstiges',        color: '#EC4899' },
]

/* ─── HELPERS ─── */

function fmtSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
}

function ExpiryHint({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null
  const d        = new Date(expiresAt)
  const expired  = isPast(d)
  const daysLeft = differenceInDays(d, new Date())
  if (expired)   return <span className="text-[10px] font-semibold text-destructive">Abgelaufen</span>
  if (daysLeft <= 7) return (
    <span className="text-[10px] font-semibold text-orange-400">
      Noch {daysLeft === 0 ? 'heute' : `${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}`}
    </span>
  )
  return null
}

/* ─── PAGE ─── */

export default function StundenplanPage() {
  const [docs,           setDocs]          = useState<AssignedDoc[]>([])
  const [myDocs,         setMyDocs]        = useState<MyDoc[]>([])
  const [loading,        setLoading]       = useState(true)
  const [activeDoc,      setActiveDoc]     = useState<AssignedDoc | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('alle')

  /* own upload state */
  const [uploadOpen,    setUploadOpen]    = useState(false)
  const [uploadFile,    setUploadFile]    = useState<File | null>(null)
  const [uploadTitle,   setUploadTitle]   = useState('')
  const [uploadDesc,    setUploadDesc]    = useState('')
  const [uploadCat,     setUploadCat]     = useState('sonstiges')
  const [uploading,     setUploading]     = useState(false)
  const [uploadError,   setUploadError]   = useState<string | null>(null)
  const [dragOver,      setDragOver]      = useState(false)

  /* track which docs were already read this session to avoid duplicate calls */
  const markedRead = useRef<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch('/api/schedule/documents').then(r => r.json()),
      fetch('/api/schedule/my-documents').then(r => r.json()),
    ])
      .then(([assigned, own]) => {
        setDocs(assigned.documents ?? [])
        setMyDocs(own.documents ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* mark as read when opened */
  async function openDoc(doc: AssignedDoc) {
    setActiveDoc(doc)
    if (!doc.isRead && !markedRead.current.has(doc.id)) {
      markedRead.current.add(doc.id)
      try {
        await fetch(`/api/schedule/documents/${doc.id}/read`, { method: 'POST' })
        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, isRead: true } : d))
      } catch { /* silent */ }
    }
  }

  /* own upload */
  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return
    setUploading(true); setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file',        uploadFile)
      fd.append('title',       uploadTitle.trim())
      fd.append('description', uploadDesc)
      fd.append('category',    uploadCat)
      const res  = await fetch('/api/schedule/documents/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Fehler.'); return }
      /* reload own docs */
      const own = await fetch('/api/schedule/my-documents').then(r => r.json())
      setMyDocs(own.documents ?? [])
      setUploadOpen(false)
      setUploadFile(null); setUploadTitle(''); setUploadDesc(''); setUploadCat('sonstiges')
    } catch { setUploadError('Netzwerkfehler.') }
    finally  { setUploading(false) }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-3">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      </div>
    )
  }

  /* ── PDF Viewer ── */
  if (activeDoc) {
    const cat = getCat(activeDoc.category)
    return (
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => setActiveDoc(null)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
            Zurück
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Category dot */}
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
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
          <iframe src={activeDoc.url} className="flex-1 w-full border-0" title={activeDoc.title} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">PDF-Link nicht verfügbar.</p>
          </div>
        )}
      </div>
    )
  }

  /* ── No docs assigned ── */
  const hasContent = docs.length > 0 || myDocs.length > 0
  if (!hasContent) {
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
        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
          onClick={() => { setUploadOpen(true); setUploadError(null) }}>
          <HugeiconsIcon icon={Upload01Icon} size={12} />
          Eigenes Dokument hochladen
        </Button>

        {/* Upload dialog (empty state) */}
        {uploadOpen && <UploadDialog
          uploadFile={uploadFile} setUploadFile={setUploadFile}
          uploadTitle={uploadTitle} setUploadTitle={setUploadTitle}
          uploadDesc={uploadDesc} setUploadDesc={setUploadDesc}
          uploadCat={uploadCat} setUploadCat={setUploadCat}
          dragOver={dragOver} setDragOver={setDragOver}
          uploading={uploading} uploadError={uploadError}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />}
      </div>
    )
  }

  /* ── derived ── */
  const unreadCount = docs.filter(d => !d.isRead).length
  const allCats     = [...new Set(docs.map(d => d.category))]
  const filtered    = categoryFilter === 'alle'
    ? docs
    : docs.filter(d => d.category === categoryFilter)

  /* ── Document list ── */
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <HugeiconsIcon icon={File01Icon} size={18} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">Mein Stundenplan</h2>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {unreadCount} neu
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground ml-12">
              {docs.length === 1 ? '1 Dokument' : `${docs.length} Dokumente`} von deinem Ausbilder
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs shrink-0"
            onClick={() => { setUploadOpen(true); setUploadError(null) }}>
            <HugeiconsIcon icon={Upload01Icon} size={12} />
            Hochladen
          </Button>
        </div>

        {/* ── Category filter ── */}
        {allCats.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {['alle', ...allCats].map(cat => {
              const meta = cat === 'alle' ? null : getCat(cat)
              return (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    categoryFilter === cat
                      ? 'border-transparent text-white'
                      : 'border-border/50 text-muted-foreground hover:border-border'
                  )}
                  style={categoryFilter === cat && meta
                    ? { backgroundColor: meta.color }
                    : categoryFilter === cat
                      ? { backgroundColor: 'hsl(var(--primary))' }
                      : {}
                  }>
                  {cat === 'alle' ? 'Alle' : meta?.label ?? cat}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Assigned docs ── */}
        {docs.length > 0 && (
          <div className="space-y-3 mb-8">
            {filtered.map(doc => {
              const cat = getCat(doc.category)
              return (
                <button key={doc.id} onClick={() => openDoc(doc)}
                  className="w-full flex items-center gap-4 rounded-2xl border bg-card p-5 hover:border-primary/40 hover:bg-primary/[0.025] transition-all text-left group shadow-sm hover:shadow-md border-border/50">

                  {/* Left: category accent + PDF icon */}
                  <div className="relative shrink-0">
                    <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
                      <HugeiconsIcon icon={File01Icon} size={22} className="text-red-400" />
                    </div>
                    {/* Unread dot */}
                    {!doc.isRead && (
                      <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base truncate">{doc.title}</p>
                      {/* Category badge */}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                        {cat.label}
                      </span>
                      {/* Unread badge */}
                      {!doc.isRead && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary shrink-0">
                          Neu
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.createdAt), 'dd. MMMM yyyy', { locale: de })}
                        {doc.fileSize ? ` · ${fmtSize(doc.fileSize)}` : ''}
                      </p>
                      <ExpiryHint expiresAt={doc.expiresAt} />
                      {doc.isRead && (
                        <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} />
                          Gelesen
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="size-8 rounded-lg bg-muted/40 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                    <HugeiconsIcon icon={ArrowRight02Icon} size={15}
                      className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── My own uploads ── */}
        {myDocs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Meine Uploads
            </h3>
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
              {myDocs.map(doc => {
                const cat = getCat(doc.category)
                return (
                  <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="size-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={File01Icon} size={16} className="text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{doc.title}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(doc.createdAt), 'dd. MMM yyyy', { locale: de })}
                        {doc.fileSize ? ` · ${fmtSize(doc.fileSize)}` : ''}
                      </p>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
                          Öffnen
                        </Button>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Upload dialog ── */}
      {uploadOpen && (
        <UploadDialog
          uploadFile={uploadFile} setUploadFile={setUploadFile}
          uploadTitle={uploadTitle} setUploadTitle={setUploadTitle}
          uploadDesc={uploadDesc} setUploadDesc={setUploadDesc}
          uploadCat={uploadCat} setUploadCat={setUploadCat}
          dragOver={dragOver} setDragOver={setDragOver}
          uploading={uploading} uploadError={uploadError}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  )
}

/* ─── UPLOAD DIALOG (own upload) ─── */

interface UploadDialogProps {
  uploadFile:    File | null;    setUploadFile:  (f: File | null) => void
  uploadTitle:   string;         setUploadTitle: (s: string) => void
  uploadDesc:    string;         setUploadDesc:  (s: string) => void
  uploadCat:     string;         setUploadCat:   (s: string) => void
  dragOver:      boolean;        setDragOver:    (b: boolean) => void
  uploading:     boolean
  uploadError:   string | null
  onClose:       () => void
  onUpload:      () => void
}

function UploadDialog({
  uploadFile, setUploadFile,
  uploadTitle, setUploadTitle,
  uploadDesc, setUploadDesc,
  uploadCat, setUploadCat,
  dragOver, setDragOver,
  uploading, uploadError,
  onClose, onUpload,
}: UploadDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

        <div className="px-6 pt-6 pb-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-bold text-base">Dokument hochladen</h2>
          <button onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground text-xl leading-none transition-colors">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* File zone */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">PDF-Datei *</p>
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f?.type === 'application/pdf') setUploadFile(f)
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-all',
                dragOver     ? 'border-primary bg-primary/10 scale-[1.01]'
                : uploadFile ? 'border-primary/40 bg-primary/5'
                : 'border-border/50 hover:border-border hover:bg-muted/20'
              )}>
              <HugeiconsIcon icon={Upload01Icon} size={22}
                className={uploadFile || dragOver ? 'text-primary' : 'text-muted-foreground/40'} />
              {uploadFile ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary truncate max-w-[280px]">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{fmtSize(uploadFile.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {dragOver ? 'Datei loslassen …' : 'Hierher ziehen oder klicken'}
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">PDF · max. 25 MB</p>
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
              placeholder="z. B. Eigener Wochenplan, Nachweise …" className="h-9 text-sm" />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Beschreibung</p>
            <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
              placeholder="Optionale Notiz …" rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kategorie</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setUploadCat(cat.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    uploadCat === cat.id ? 'border-transparent text-white' : 'border-border/50 text-muted-foreground hover:border-border'
                  )}
                  style={uploadCat === cat.id ? { backgroundColor: cat.color } : {}}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {uploadError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              {uploadError}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-border/40 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
          <Button size="sm" className="gap-1.5"
            disabled={!uploadFile || !uploadTitle.trim() || uploading}
            onClick={onUpload}>
            {uploading ? (
              <><span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Hochladen…</>
            ) : (
              <><HugeiconsIcon icon={Upload01Icon} size={13} />Hochladen</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
