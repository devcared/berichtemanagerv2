'use client'
import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'

export interface Branding {
  name: string
  logoUrl: string
  accentColor: string
}

const DEFAULT_BRANDING: Branding = {
  name: 'AzubiHub',
  logoUrl: '',
  accentColor: '#4285f4',
}

const CACHE_KEY = 'azubihub-branding-cache'

function readCache(): Branding | null {
  try {
    const s = localStorage.getItem(CACHE_KEY)
    return s ? (JSON.parse(s) as Branding) : null
  } catch { return null }
}

function writeCache(b: Branding) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(b)) } catch { /* ignore */ }
}

export function useBranding(): Branding {
  const { profile, loading: profileLoading } = useProfile()

  // Start with cached value immediately — no flash on repeat visits
  const [branding, setBranding] = useState<Branding>(() => {
    if (typeof window === 'undefined') return DEFAULT_BRANDING
    return readCache() ?? DEFAULT_BRANDING
  })

  useEffect(() => {
    // Wait until we know whether the user has a company or not
    if (profileLoading) return

    let cancelled = false

    async function load() {
      if (profile?.companyId) {
        // User is in a company — load that company's branding
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('companies')
            .select('name, logo_url, accent_color')
            .eq('id', profile.companyId)
            .single()

          if (!cancelled && !error && data) {
            const b: Branding = {
              name: data.name ?? DEFAULT_BRANDING.name,
              logoUrl: data.logo_url ?? '',
              accentColor: data.accent_color ?? DEFAULT_BRANDING.accentColor,
            }
            setBranding(b)
            writeCache(b)
            return
          }
        } catch { /* fall through */ }
      }

      // No company → load global platform branding from Supabase
      try {
        const res = await fetch('/api/platform-settings')
        if (!cancelled && res.ok) {
          const json = await res.json()
          const b = json.branding
          if (b) {
            const result: Branding = {
              name: b.name || DEFAULT_BRANDING.name,
              logoUrl: b.logoUrl ?? '',
              accentColor: b.accentColor || DEFAULT_BRANDING.accentColor,
            }
            setBranding(result)
            writeCache(result)
            return
          }
        }
      } catch { /* ignore */ }

      if (!cancelled) {
        setBranding(DEFAULT_BRANDING)
        writeCache(DEFAULT_BRANDING)
      }
    }

    load()
    return () => { cancelled = true }
  }, [profileLoading, profile?.companyId])

  return branding
}
