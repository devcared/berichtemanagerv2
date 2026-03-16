'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/types'

interface StatusBadgeProps {
  status: ReportStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'draft') {
    return (
      <Badge
        className={cn(
          'bg-yellow-500/15 text-yellow-500 border-yellow-500/30 border hover:bg-yellow-500/20',
          className
        )}
      >
        Entwurf
      </Badge>
    )
  }

  if (status === 'completed') {
    return (
      <Badge
        className={cn(
          'bg-green-500/15 text-green-500 border-green-500/30 border hover:bg-green-500/20',
          className
        )}
      >
        Fertig
      </Badge>
    )
  }

  if (status === 'exported') {
    return (
      <Badge
        className={cn(
          'bg-blue-500/15 text-blue-400 border-blue-500/30 border hover:bg-blue-500/20',
          className
        )}
      >
        Exportiert
      </Badge>
    )
  }

  return null
}
