'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TrainingProfile, UserRole } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function useProfile() {
  const [profile, setProfile] = useState<TrainingProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = Rows not found
          throw error
        }

        if (!cancelled) {
          if (data) {
            setProfile({
              id: data.id,
              firstName: data.first_name,
              lastName: data.last_name,
              birthDate: data.birth_date,
              occupation: data.occupation,
              companyName: data.company_name,
              trainerName: data.trainer_name,
              department: data.department || undefined,
              trainingStart: data.training_start,
              trainingEnd: data.training_end,
              currentYear: data.current_year,
              reportType: data.report_type,
              weeklyHours: data.weekly_hours,
              schoolDays: data.school_days,
              schoolHoursPerDay: data.school_hours_per_day,
              role: (data.role as UserRole) ?? 'apprentice',
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              companyId: data.company_id ?? undefined,
              pendingCompanyId: data.pending_company_id ?? undefined,
              pendingCompanyName: data.pending_company_name ?? undefined,
            })
          } else {
            setProfile(null)
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden des Profils')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey])

  const saveProfile = useCallback(async (p: TrainingProfile) => {
    if (!user) throw new Error('Nutzer nicht angemeldet')
      
    try {
      const dbProfile = {
        id: user.id, // Always enforce logged-in user ID
        first_name: p.firstName,
        last_name: p.lastName,
        birth_date: p.birthDate,
        occupation: p.occupation,
        company_name: p.companyName,
        trainer_name: p.trainerName,
        department: p.department || null,
        training_start: p.trainingStart,
        training_end: p.trainingEnd,
        current_year: p.currentYear,
        report_type: p.reportType,
        weekly_hours: p.weeklyHours,
        school_days: p.schoolDays,
        school_hours_per_day: p.schoolHoursPerDay,
        company_id: p.companyId ?? null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(dbProfile) // inserts row or updates it on conflict
      
      if (error) throw error

      setProfile(p)
      return p
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern des Profils')
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const refreshProfile = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return { profile, saveProfile, refreshProfile, loading, error }
}
