'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/types'

interface StatusBadgeProps {
  status: ReportStatus
  className?: string
}

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  draft: {
    label: 'Entwurf',
    className: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30 border hover:bg-yellow-500/20',
  },
  submitted: {
    label: 'Eingereicht',
    className: 'bg-blue-500/15 text-blue-500 border-blue-500/30 border hover:bg-blue-500/20',
  },
  in_review: {
    label: 'In Prüfung',
    className: 'bg-orange-500/15 text-orange-500 border-orange-500/30 border hover:bg-orange-500/20',
  },
  approved: {
    label: 'Freigegeben',
    className: 'bg-green-500/15 text-green-500 border-green-500/30 border hover:bg-green-500/20',
  },
  needs_revision: {
    label: 'Überarbeitung',
    className: 'bg-red-500/15 text-red-500 border-red-500/30 border hover:bg-red-500/20',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
