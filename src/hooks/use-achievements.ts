'use client'
import { useState, useEffect, useMemo } from 'react'
import { useProfile } from './use-profile'
import { useReports } from './use-reports'
import { buildContext, getUnlockedIds, ACHIEVEMENTS } from '@/lib/achievements'
import type { AchievementContext } from '@/lib/achievements'

const SEEN_KEY = 'azubihub-seen-achievements'

export interface UseAchievementsResult {
  ctx: AchievementContext | null
  unlockedIds: string[]
  seenIds: string[]
  newCount: number
  loading: boolean
  markAllSeen: () => void
}

export function useAchievements(): UseAchievementsResult {
  const { profile, loading: profileLoading } = useProfile()
  const { reports, loading: reportsLoading } = useReports()
  const [seenIds, setSeenIds] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      setSeenIds(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      setSeenIds([])
    }
  }, [])

  const ctx = useMemo<AchievementContext | null>(() => {
    if (profileLoading || reportsLoading) return null
    return buildContext(profile, reports)
  }, [profile, reports, profileLoading, reportsLoading])

  const unlockedIds = useMemo(() => {
    if (!ctx) return []
    return getUnlockedIds(ctx)
  }, [ctx])

  const newCount = useMemo(() => {
    if (!isMounted) return 0
    return unlockedIds.filter(id => !seenIds.includes(id)).length
  }, [unlockedIds, seenIds, isMounted])

  const markAllSeen = () => {
    // Merge existing seen with all currently unlocked
    const merged = Array.from(new Set([...seenIds, ...unlockedIds]))
    setSeenIds(merged)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(merged))
    } catch { /* ignore */ }
  }

  // Auto-persist when new achievements unlock (but never remove from seen)
  useEffect(() => {
    if (!isMounted || unlockedIds.length === 0) return
    // We intentionally do NOT auto-mark as seen here — user must visit the page
  }, [unlockedIds, isMounted])

  return {
    ctx,
    unlockedIds,
    seenIds,
    newCount,
    loading: profileLoading || reportsLoading,
    markAllSeen,
  }
}

// Re-export for convenience
export { ACHIEVEMENTS }
