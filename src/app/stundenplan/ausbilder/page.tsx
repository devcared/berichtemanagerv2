'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, isPast, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import {
  CheckmarkBadge01Icon, Alert01Icon, File01Icon,
  Upload01Icon, Delete02Icon, CheckmarkCircle01Icon,
  UserMultiple02Icon, Edit01Icon, ArrowRight02Icon,
  ArrowLeft01Icon, Time01Icon,
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
  description: string | null
  category: string
  status: 'draft' | 'published'
  file_name: string
  file_size: number
  created_at: string
  expires_at: string | null
  schedule_document_assignments: { profile_id: string }[]
  schedule_document_reads: { profile_id: string }[]
}

interface ApprenticeDocument {
  id: string
  title: string
  description: string | null
  category: string
  file_name: string
  file_size: number
  created_at: string
  uploaded_by: string
  uploaderName: string
  url: string | null
}

/* ─── CONSTANTS ─── */

const PERSON_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899',
  '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16',
]

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

function ExpiryBadge({ expires_at }: { expires_at: string | null }) {
  if (!expires_at) return null
  const d = new Date(expires_at)
  const expired  = isPast(d)
  const daysLeft = differenceInDays(d, new Date())
  const soon     = !expired && daysLeft <= 7

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
      expired ? 'bg-destructive/15 text-destructive'
              : soon ? 'bg-orange-500/15 text-orange-500'
              : 'bg-muted/50 text-muted-foreground'
    )}>
      <HugeiconsIcon icon={Time01Icon} size={9} />
      {expired
        ? 'Abgelaufen'
        : daysLeft === 0
          ? 'Läuft heute ab'
          : `Noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}`
      }
    </span>
  )
}

/* ─── PAGE ─── */

export default function AusbilderStundenplanPage() {
  const router = useRouter()
  const { profile: trainerProfile, loading: profileLoading } = useProfile()

  const [apprentices,       setApprentices]       = useState<Apprentice[]>([])
  const [documents,         setDocuments]         = useState<TrainerDocument[]>([])
  const [apprenticeDocs,    setApprenticeDocs]    = useState<ApprenticeDocument[]>([])
  const [loading,           setLoading]           = useState(true)
  const [categoryFilter,    setCategoryFilter]    = useState<string>('alle')

  /* ── Preview ── */
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null)

  /* ── Upload state ── */
  const [uploadOpen,      setUploadOpen]      = useState(false)
  const [uploadFile,      setUploadFile]      = useState<File | null>(null)
  const [uploadTitle,     setUploadTitle]     = useState('')
  const [uploadDesc,      setUploadDesc]      = useState('')
  const [uploadCategory,  setUploadCategory]  = useState('allgemein')
  const [uploadStatus,    setUploadStatus]    = useState<'draft' | 'published'>('published')
  const [uploadExpiry,    setUploadExpiry]    = useState('')
  const [uploadAssignees, setUploadAssignees] = useState<Set<string>>(new Set())
  const [uploading,       setUploading]       = useState(false)
  const [uploadError,     setUploadError]     = useState<string | null>(null)
  const [dragOver,        setDragOver]        = useState(false)

  /* ── Edit state ── */
  const [editDoc,       setEditDoc]       = useState<TrainerDocument | null>(null)
  const [editTitle,     setEditTitle]     = useState('')
  const [editDesc,      setEditDesc]      = useState('')
  const [editCategory,  setEditCategory]  = useState('allgemein')
  const [editStatus,    setEditStatus]    = useState<'draft' | 'published'>('published')
  const [editExpiry,    setEditExpiry]    = useState('')
  const [editAssignees, setEditAssignees] = useState<Set<string>>(new Set())
  const [saving,        setSaving]        = useState(false)
  const [editError,     setEditError]     = useState<string | null>(null)

  /* ─── Load ─── */
  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/schedule').then(r => r.json()),
      fetch('/api/admin/schedule/documents').then(r => r.json()),
    ])
      .then(([scheduleData, docsData]) => {
        setApprentices(scheduleData.profiles ?? [])
        setDocuments(docsData.documents ?? [])
        setApprenticeDocs(docsData.apprenticeDocuments ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (profileLoading) return
    if (trainerProfile?.role !== 'trainer') { router.push('/stundenplan'); return }
    load()
  }, [profileLoading, trainerProfile, router, load])

  /* ─── Upload handlers ─── */
  function openUpload() {
    setUploadFile(null); setUploadTitle(''); setUploadDesc(''); setUploadCategory('allgemein')
    setUploadStatus('published'); setUploadExpiry(''); setUploadAssignees(new Set())
    setUploadError(null); setDragOver(false); setUploadOpen(true)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setUploadFile(f)
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle.trim()) return
    setUploading(true); setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file',        uploadFile)
      fd.append('title',       uploadTitle.trim())
      fd.append('description', uploadDesc)
      fd.append('category',    uploadCategory)
      fd.append('status',      uploadStatus)
      fd.append('expires_at',  uploadExpiry)
      fd.append('assigneeIds', JSON.stringify([...uploadAssignees]))
      const res  = await fetch('/api/admin/schedule/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Fehler.'); return }
      setUploadOpen(false); load()
    } catch { setUploadError('Netzwerkfehler.') }
    finally  { setUploading(false) }
  }

  /* ─── Edit handlers ─── */
  function openEdit(doc: TrainerDocument) {
    setEditDoc(doc)
    setEditTitle(doc.title)
    setEditDesc(doc.description ?? '')
    setEditCategory(doc.category)
    setEditStatus(doc.status)
    setEditExpiry(doc.expires_at ? doc.expires_at.slice(0, 10) : '')
    setEditAssignees(new Set(doc.schedule_document_assignments.map(a => a.profile_id)))
    setEditError(null)
  }

  async function handleSave() {
    if (!editDoc || !editTitle.trim()) return
    setSaving(true); setEditError(null)
    try {
      const res = await fetch(`/api/admin/schedule/documents/${editDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       editTitle.trim(),
          description: editDesc || null,
          category:    editCategory,
          status:      editStatus,
          expires_at:  editExpiry || null,
          assigneeIds: [...editAssignees],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? 'Fehler.'); return }
      setEditDoc(null); load()
    } catch { setEditError('Netzwerkfehler.') }
    finally  { setSaving(false) }
  }

  async function handleDelete(docId: string) {
    await fetch(`/api/admin/schedule/documents/${docId}`, { method: 'DELETE' })
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  /* ─── Guards ─── */
  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }
  if (trainerProfile?.role !== 'trainer') return null

  /* ─── Derived ─── */
  const withDocs    = apprentices.filter(ap => documents.some(d => d.schedule_document_assignments.some(a => a.profile_id === ap.id)))
  const withoutDocs = apprentices.filter(ap => !documents.some(d => d.schedule_document_assignments.some(a => a.profile_id === ap.id)))

  const allCategories = [...new Set(documents.map(d => d.category))]
  const filteredDocs  = categoryFilter === 'alle'
    ? documents
    : documents.filter(d => d.category === categoryFilter)

  /* ─── Render ─── */
  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── PDF Preview Overlay ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="flex items-center gap-3 px-4 py-3 bg-card/90 border-b border-border shrink-0">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
              onClick={() => setPreviewDoc(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
              Zurück
            </Button>
            <div className="h-4 w-px bg-border" />
            <p className="font-semibold text-sm truncate flex-1">{previewDoc.title}</p>
            <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0">
                <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
                Neuer Tab
              </Button>
            </a>
          </div>
          <iframe src={previewDoc.url} className="flex-1 w-full border-0" title={previewDoc.title} />
        </div>
      )}

      {/* ── Hero Header ── */}
      <div className="border-b border-border bg-card px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={24} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Ausbilder-Bereich · Stundenplan</p>
              <h1 className="text-2xl font-bold tracking-tight">
                {trainerProfile.firstName} {trainerProfile.lastName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={load}>
              Aktualisieren
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openUpload}>
              <HugeiconsIcon icon={Upload01Icon} size={12} />
              PDF hochladen
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full space-y-10">

        {/* ── Summary pills ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: File01Icon,            label: 'Dokumente',     value: documents.length,   color: 'text-primary',    bg: 'bg-primary/10' },
            { icon: CheckmarkCircle01Icon, label: 'Mit Dokument',  value: withDocs.length,    color: 'text-green-500',  bg: 'bg-green-500/10' },
            { icon: UserMultiple02Icon,    label: 'Ohne Dokument', value: withoutDocs.length, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={cn('size-9 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                <HugeiconsIcon icon={s.icon} size={17} className={s.color} />
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
              Deine Dokumente
            </h2>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={openUpload}>
              <HugeiconsIcon icon={Upload01Icon} size={11} />
              Hochladen
            </Button>
          </div>

          {/* Category filter chips */}
          {allCategories.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {['alle', ...allCategories].map(cat => {
                const meta = cat === 'alle' ? null : getCat(cat)
                return (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-all border',
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
              {filteredDocs.map(doc => {
                const cat         = getCat(doc.category)
                const assigned    = doc.schedule_document_assignments.map(a => a.profile_id)
                const readCount   = doc.schedule_document_reads.length
                const totalAssigned = assigned.length
                const assignedProfiles = assigned
                  .map(id => apprentices.find(a => a.id === id))
                  .filter((a): a is Apprentice => !!a)

                return (
                  <div key={doc.id}
                    className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    {/* Category accent top bar */}
                    <div className="h-0.5 w-full" style={{ backgroundColor: cat.color }} />

                    <div className="p-5 flex items-start gap-4">
                      {/* PDF icon */}
                      <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={File01Icon} size={22} className="text-red-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{doc.title}</p>

                              {/* Category badge */}
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                {cat.label}
                              </span>

                              {/* Status badge */}
                              {doc.status === 'draft' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-500/15 text-yellow-500">
                                  Entwurf
                                </span>
                              )}

                              <ExpiryBadge expires_at={doc.expires_at} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                              {format(new Date(doc.created_at), 'dd. MMMM yyyy', { locale: de })}
                              {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ''}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEdit(doc)}
                              className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors group">
                              <HugeiconsIcon icon={Edit01Icon} size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            <button onClick={() => handleDelete(doc.id)}
                              className="size-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors group">
                              <HugeiconsIcon icon={Delete02Icon} size={13} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {doc.description}
                          </p>
                        )}

                        {/* Read receipt */}
                        {totalAssigned > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${(readCount / totalAssigned) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                              {readCount}/{totalAssigned} gelesen
                            </span>
                          </div>
                        )}

                        {/* Assigned persons */}
                        {assignedProfiles.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {assignedProfiles.map(ap => {
                              const idx = apprentices.findIndex(a => a.id === ap.id)
                              const c   = PERSON_COLORS[idx % PERSON_COLORS.length]
                              return (
                                <span key={ap.id}
                                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${c}18`, color: c }}>
                                  {ap.first_name} {ap.last_name}
                                  {doc.schedule_document_reads.some(r => r.profile_id === ap.id) && (
                                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={9} />
                                  )}
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {assignedProfiles.length === 0 && (
                          <p className="mt-2 text-[10px] text-orange-400/70 italic">Noch niemand zugewiesen</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Apprentice Uploads ── */}
        {apprenticeDocs.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Von Auszubildenden hochgeladen
            </h2>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card divide-y divide-border/40">
              {apprenticeDocs.map(doc => {
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
                        {doc.uploaderName} · {format(new Date(doc.created_at), 'dd. MMM yyyy', { locale: de })}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{doc.description}</p>
                      )}
                    </div>
                    {doc.url && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 shrink-0"
                        onClick={() => setPreviewDoc({ title: doc.title, url: doc.url! })}>
                        <HugeiconsIcon icon={ArrowRight02Icon} size={11} />
                        Ansehen
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Apprentice overview ── */}
        {apprentices.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Auszubildende
            </h2>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
              <div className="divide-y divide-border/40">
                {apprentices.map((ap, idx) => {
                  const color        = PERSON_COLORS[idx % PERSON_COLORS.length]
                  const initials     = `${ap.first_name[0] ?? ''}${ap.last_name[0] ?? ''}`.toUpperCase()
                  const assignedDocs = documents.filter(d =>
                    d.schedule_document_assignments.some(a => a.profile_id === ap.id)
                  )
                  const readCount = assignedDocs.filter(d =>
                    d.schedule_document_reads.some(r => r.profile_id === ap.id)
                  ).length
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
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} className="text-green-400" />
                            <span className="text-xs font-semibold text-green-400">
                              {assignedDocs.length} {assignedDocs.length === 1 ? 'Dok.' : 'Dok.'}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {readCount}/{assignedDocs.length} gelesen
                          </p>
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

      {/* ═══════════════════════════════════════════
          UPLOAD DIALOG
      ═══════════════════════════════════════════ */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 pt-6 pb-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-base">PDF hochladen</h2>
              <button onClick={() => setUploadOpen(false)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* ── Drag & Drop zone ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">PDF-Datei *</p>
                <label
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-all',
                    dragOver        ? 'border-primary bg-primary/10 scale-[1.01]'
                    : uploadFile    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/50 hover:border-border hover:bg-muted/20'
                  )}>
                  <HugeiconsIcon icon={Upload01Icon} size={24}
                    className={uploadFile || dragOver ? 'text-primary' : 'text-muted-foreground/40'} />
                  {uploadFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-primary truncate max-w-[300px]">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtSize(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        {dragOver ? 'Datei loslassen …' : 'Hierher ziehen oder klicken'}
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">PDF · max. 25 MB</p>
                    </div>
                  )}
                  <input type="file" accept=".pdf,application/pdf" className="sr-only"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              {/* ── Title ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Titel *</p>
                <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                  placeholder="z. B. Wochenplan KW 22, Ausbildungsrahmenplan …" className="h-9 text-sm" />
              </div>

              {/* ── Description ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Beschreibung</p>
                <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                  placeholder="Optionaler Hinweis für die Auszubildenden …"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
              </div>

              {/* ── Category ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kategorie</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setUploadCategory(cat.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                        uploadCategory === cat.id ? 'border-transparent text-white' : 'border-border/50 text-muted-foreground hover:border-border'
                      )}
                      style={uploadCategory === cat.id ? { backgroundColor: cat.color } : {}}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Status + Expiry ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(['published', 'draft'] as const).map(s => (
                      <button key={s} type="button"
                        onClick={() => setUploadStatus(s)}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-medium transition-colors',
                          uploadStatus === s
                            ? s === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}>
                        {s === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ablaufdatum</p>
                  <Input type="date" value={uploadExpiry}
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="h-9 text-sm" />
                </div>
              </div>

              {/* ── Apprentice multi-select ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auszubildende</p>
                  <button type="button"
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
                            {checked && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-primary-foreground" />}
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
                            onChange={e => setUploadAssignees(prev => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(ap.id) : next.delete(ap.id)
                              return next
                            })} />
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
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)}>Abbrechen</Button>
              <Button size="sm" className="gap-1.5"
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                onClick={handleUpload}>
                {uploading ? (
                  <><span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Hochladen…</>
                ) : (
                  <><HugeiconsIcon icon={Upload01Icon} size={13} />
                    Hochladen{uploadAssignees.size > 0 ? ` (${uploadAssignees.size})` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          EDIT DIALOG
      ═══════════════════════════════════════════ */}
      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 pt-6 pb-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-base">Dokument bearbeiten</h2>
              <button onClick={() => setEditDoc(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground text-xl leading-none transition-colors">
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* ── Title ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Titel *</p>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  placeholder="Dokumententitel" className="h-9 text-sm" />
              </div>

              {/* ── Description ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Beschreibung</p>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  placeholder="Optionaler Hinweis …"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
              </div>

              {/* ── Category ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kategorie</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setEditCategory(cat.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                        editCategory === cat.id ? 'border-transparent text-white' : 'border-border/50 text-muted-foreground hover:border-border'
                      )}
                      style={editCategory === cat.id ? { backgroundColor: cat.color } : {}}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Status + Expiry ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(['published', 'draft'] as const).map(s => (
                      <button key={s} type="button"
                        onClick={() => setEditStatus(s)}
                        className={cn(
                          'flex-1 py-1.5 text-xs font-medium transition-colors',
                          editStatus === s
                            ? s === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}>
                        {s === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ablaufdatum</p>
                  <div className="flex gap-1">
                    <Input type="date" value={editExpiry}
                      onChange={e => setEditExpiry(e.target.value)}
                      className="h-9 text-sm flex-1" />
                    {editExpiry && (
                      <button type="button" onClick={() => setEditExpiry('')}
                        className="h-9 px-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 text-xs transition-colors">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Assignees ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auszubildende</p>
                  <button type="button"
                    onClick={() => setEditAssignees(
                      editAssignees.size === apprentices.length
                        ? new Set()
                        : new Set(apprentices.map(a => a.id))
                    )}
                    className="text-[10px] text-primary hover:underline">
                    {editAssignees.size === apprentices.length ? 'Alle abwählen' : 'Alle auswählen'}
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-border/40 p-2">
                  {apprentices.map((ap, idx) => {
                    const checked = editAssignees.has(ap.id)
                    const color   = PERSON_COLORS[idx % PERSON_COLORS.length]
                    return (
                      <label key={ap.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                        <div className={cn(
                          'size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          checked ? 'bg-primary border-primary' : 'border-border'
                        )}>
                          {checked && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="text-primary-foreground" />}
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
                          onChange={e => setEditAssignees(prev => {
                            const next = new Set(prev)
                            e.target.checked ? next.add(ap.id) : next.delete(ap.id)
                            return next
                          })} />
                      </label>
                    )
                  })}
                </div>
              </div>

              {editError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                  {editError}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-border/40 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditDoc(null)}>Abbrechen</Button>
              <Button size="sm" className="gap-1.5"
                disabled={!editTitle.trim() || saving}
                onClick={handleSave}>
                {saving ? (
                  <><span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Speichern…</>
                ) : (
                  <><HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />Speichern</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
