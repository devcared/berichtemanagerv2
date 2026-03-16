'use client'

import { cn } from '@/lib/utils'
import type { ActivityCategory } from '@/types'

interface CategoryChipProps {
  category: ActivityCategory
  selected?: boolean
  onClick?: () => void
  className?: string
}

const CATEGORY_CONFIG: Record<ActivityCategory, { label: string; color: string; bg: string; selectedBg: string }> = {
  company: {
    label: 'Betrieb',
    color: '#3B82F6',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    selectedBg: 'bg-blue-500/25 text-blue-300 border-blue-500/50 ring-1 ring-blue-500/40',
  },
  vocationalSchool: {
    label: 'Berufsschule',
    color: '#10B981',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    selectedBg: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/40',
  },
  interCompany: {
    label: 'Überbetrieblich',
    color: '#8B5CF6',
    bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    selectedBg: 'bg-violet-500/25 text-violet-300 border-violet-500/50 ring-1 ring-violet-500/40',
  },
  vacation: {
    label: 'Urlaub',
    color: '#F59E0B',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    selectedBg: 'bg-amber-500/25 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/40',
  },
  sick: {
    label: 'Krank',
    color: '#EF4444',
    bg: 'bg-red-500/10 text-red-400 border-red-500/20',
    selectedBg: 'bg-red-500/25 text-red-300 border-red-500/50 ring-1 ring-red-500/40',
  },
  holiday: {
    label: 'Feiertag',
    color: '#EC4899',
    bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    selectedBg: 'bg-pink-500/25 text-pink-300 border-pink-500/50 ring-1 ring-pink-500/40',
  },
}

export function getCategoryLabel(category: ActivityCategory): string {
  return CATEGORY_CONFIG[category]?.label ?? category
}

export function getCategoryColor(category: ActivityCategory): string {
  return CATEGORY_CONFIG[category]?.color ?? '#888'
}

export function CategoryChip({ category, selected = false, onClick, className }: CategoryChipProps) {
  const config = CATEGORY_CONFIG[category]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
        selected ? config.selectedBg : config.bg,
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
        className
      )}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </button>
  )
}

export { CATEGORY_CONFIG }
