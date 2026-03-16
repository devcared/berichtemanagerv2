'use client'
import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import type { TrainingProfile } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<TrainingProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const profiles = await db.getAllProfiles()
        if (!cancelled) {
          setProfile(profiles.length > 0 ? profiles[0] : null)
        }
      } catch (err) {
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
  }, [])

  const saveProfile = useCallback(async (p: TrainingProfile) => {
    try {
      await db.saveProfile(p)
      setProfile(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern des Profils')
      throw err
    }
  }, [])

  return { profile, saveProfile, loading, error }
}
