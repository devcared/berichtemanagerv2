/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { db } from '@/lib/db'
import { useProfile } from '@/hooks/use-profile'
import { CategoryChip, getCategoryColor, getCategoryLabel } from '@/components/berichtsheft/category-chip'
import type { ActivityTemplate, ActivityCategory } from '@/types'
import { cn } from '@/lib/utils'
import {
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  SearchIcon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const CATEGORY_OPTIONS: { value: ActivityCategory; label: string }[] = [
  { value: 'company', label: 'Betrieb' },
  { value: 'vocationalSchool', label: 'Berufsschule' },
  { value: 'interCompany', label: 'Überbetrieblich' },
  { value: 'vacation', label: 'Urlaub' },
  { value: 'sick', label: 'Krank' },
  { value: 'holiday', label: 'Feiertag' },
]

function generateId(): string {
  return crypto.randomUUID()
}

const emptyForm = (): Omit<ActivityTemplate, 'id' | 'createdAt' | 'usageCount'> => ({
  profileId: '',
  title: '',
  content: '',
  category: 'company',
  isFavorite: false,
})

export default function VorlagenPage() {
  const { profile } = useProfile()
  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null)
  const [formData, setFormData] = useState(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const all = await db.getAllTemplates()
      setTemplates(all.sort((a, b) => {
        if (b.isFavorite !== a.isFavorite) return b.isFavorite ? 1 : -1
        return b.usageCount - a.usageCount
      }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  function openNew() {
    setEditingTemplate(null)
    setFormData({ ...emptyForm(), profileId: profile?.id ?? '' })
    setDialogOpen(true)
  }

  function openEdit(tpl: ActivityTemplate) {
    setEditingTemplate(tpl)
    setFormData({
      profileId: tpl.profileId,
      title: tpl.title,
      content: tpl.content,
      category: tpl.category,
      isFavorite: tpl.isFavorite,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.content.trim()) return
    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const tpl: ActivityTemplate = editingTemplate
        ? {
            ...editingTemplate,
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category,
            isFavorite: formData.isFavorite,
          }
        : {
            id: generateId(),
            profileId: profile?.id ?? '',
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category,
            isFavorite: formData.isFavorite,
            usageCount: 0,
            createdAt: now,
          }
      await db.saveTemplate(tpl)
      await loadTemplates()
      setDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await db.deleteTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    setDeleteId(null)
  }

  async function toggleFavorite(tpl: ActivityTemplate) {
    const updated = { ...tpl, isFavorite: !tpl.isFavorite }
    await db.saveTemplate(updated)
    setTemplates(prev =>
      prev
        .map(t => t.id === tpl.id ? updated : t)
        .sort((a, b) => {
          if (b.isFavorite !== a.isFavorite) return b.isFavorite ? 1 : -1
          return b.usageCount - a.usageCount
        })
    )
  }

  const filtered = templates.filter(t =>
    search === '' ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase()) ||
    getCategoryLabel(t.category).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vorlagen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Wiederverwendbare Tätigkeitsbeschreibungen</p>
        </div>
        <Button onClick={openNew}>
          <HugeiconsIcon icon={Add01Icon} size={16} data-icon="inline-start" />
          Neue Vorlage
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <HugeiconsIcon icon={SearchIcon} size={16} />
        </div>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Vorlagen durchsuchen..."
          className="pl-9 bg-input border-border"
        />
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Lade Vorlagen...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <HugeiconsIcon icon={Add01Icon} size={20} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            {search ? 'Keine Vorlagen gefunden.' : 'Noch keine Vorlagen erstellt.'}
          </p>
          {!search && (
            <Button variant="outline" size="sm" onClick={openNew}>
              Erste Vorlage erstellen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(tpl => (
            <Card key={tpl.id} className="bg-card border-border hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {tpl.isFavorite && (
                        <HugeiconsIcon
                          icon={StarIcon}
                          size={14}
                          className="text-yellow-400 shrink-0"
                        />
                      )}
                      <h3 className="font-medium text-foreground truncate">{tpl.title}</h3>
                      <CategoryChip category={tpl.category} className="shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {tpl.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/60">
                      <span>{tpl.usageCount}× verwendet</span>
                      <span>Erstellt {format(new Date(tpl.createdAt), 'd. MMM yyyy', { locale: de })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'size-8',
                        tpl.isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-muted-foreground'
                      )}
                      onClick={() => toggleFavorite(tpl)}
                      title={tpl.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                    >
                      <HugeiconsIcon icon={StarIcon} size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(tpl)}
                    >
                      <HugeiconsIcon icon={Edit01Icon} size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(tpl.id)}
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-title">Titel *</Label>
              <Input
                id="tpl-title"
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="z.B. Datenbankpflege"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={v => setFormData(f => ({ ...f, category: v as ActivityCategory }))}
              >
                <SelectTrigger id="tpl-category" className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-content">Inhalt *</Label>
              <Textarea
                id="tpl-content"
                value={formData.content}
                onChange={e => setFormData(f => ({ ...f, content: e.target.value }))}
                placeholder="Beschreibung der Tätigkeit..."
                className="min-h-[100px] bg-input border-border resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="tpl-favorite"
                checked={formData.isFavorite}
                onCheckedChange={v => setFormData(f => ({ ...f, isFavorite: v }))}
              />
              <Label htmlFor="tpl-favorite" className="cursor-pointer font-normal">Als Favorit markieren</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.title.trim() || !formData.content.trim()}
            >
              {isSaving ? 'Speichert...' : editingTemplate ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Vorlage wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
