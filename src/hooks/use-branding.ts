'use client'
import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'

export interface Branding {
  name: string        // Company/platform name
  logoUrl: string     // Logo URL (empty string = use default AzubiHub logo)
  accentColor: string // Hex color like '#4285f4'
}

const DEFAULT_BRANDING: Branding = {
  name: 'AzubiHub',
  logoUrl: '',
  accentColor: '#4285f4',
}

const GLOBAL_BRANDING_KEY = 'azubihub-global-branding'

export function useBranding(): Branding {
  const { profile } = useProfile()
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    async function loadBranding() {
      if (profile?.companyId) {
        // Fetch branding from company record
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('companies')
            .select('name, logo_url, accent_color')
            .eq('id', profile.companyId)
            .single()

          if (!error && data) {
            setBranding({
              name: data.name ?? DEFAULT_BRANDING.name,
              logoUrl: data.logo_url ?? '',
              accentColor: data.accent_color ?? DEFAULT_BRANDING.accentColor,
            })
            return
          }
        } catch {
          // Fall through to defaults
        }
      }

      // No company assigned — read from localStorage global branding
      try {
        const stored = localStorage.getItem(GLOBAL_BRANDING_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Branding>
          setBranding({
            name: parsed.name || DEFAULT_BRANDING.name,
            logoUrl: parsed.logoUrl ?? '',
            accentColor: parsed.accentColor || DEFAULT_BRANDING.accentColor,
          })
          return
        }
      } catch {
        // Fall through to defaults
      }

      setBranding(DEFAULT_BRANDING)
    }

    loadBranding()
  }, [isMounted, profile?.companyId])

  return branding
}
