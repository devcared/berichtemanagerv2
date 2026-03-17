'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { ScheduleBlock, ScheduleCategory } from '@/types'

type BlockInput = Omit<ScheduleBlock, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): ScheduleBlock {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as ScheduleCategory,
    color: row.color,
    dayOfWeek: row.day_of_week ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    isRecurring: row.is_recurring,
    specificDate: row.specific_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useSchedule() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setIsLoading(false); return }
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('profile_id', user.id)
      .order('start_time')
    if (!error && data) setBlocks(data.map(mapRow))
    setIsLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const createBlock = useCallback(async (input: BlockInput) => {
    if (!user) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({
        profile_id: user.id,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        color: input.color,
        day_of_week: input.dayOfWeek ?? null,
        start_time: input.startTime,
        end_time: input.endTime,
        is_recurring: input.isRecurring,
        specific_date: input.specificDate ?? null,
      })
      .select()
      .single()
    if (!error && data) setBlocks(prev => [...prev, mapRow(data)])
  }, [user])

  const updateBlock = useCallback(async (id: string, input: Partial<BlockInput>) => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (input.title !== undefined)       patch.title = input.title
    if (input.description !== undefined) patch.description = input.description ?? null
    if (input.category !== undefined)    patch.category = input.category
    if (input.color !== undefined)       patch.color = input.color
    if (input.startTime !== undefined)   patch.start_time = input.startTime
    if (input.endTime !== undefined)     patch.end_time = input.endTime
    if (input.isRecurring !== undefined) {
      patch.is_recurring = input.isRecurring
      patch.day_of_week    = input.isRecurring ? (input.dayOfWeek ?? null) : null
      patch.specific_date  = input.isRecurring ? null : (input.specificDate ?? null)
    }
    const { data, error } = await supabase
      .from('schedule_blocks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setBlocks(prev => prev.map(b => b.id === id ? mapRow(data) : b))
  }, [])

  const deleteBlock = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('schedule_blocks').delete().eq('id', id)
    if (!error) setBlocks(prev => prev.filter(b => b.id !== id))
  }, [])

  return { blocks, isLoading, createBlock, updateBlock, deleteBlock, reload: load }
}
