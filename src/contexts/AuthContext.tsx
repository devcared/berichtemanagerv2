'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  isAuthenticated: boolean
  needsSetup: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string) => Promise<{ error?: string }>
  completeSetup: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  user: User | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    needsSetup: false,
  })
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (mounted) {
        setUser(session?.user ?? null)
        setAuthState({
          isAuthenticated: !!session,
          // Wir lesen needsSetup aus den user_metadata (falls vorhanden) - Standardmäßig ist es false
          needsSetup: session?.user?.user_metadata?.needsSetup === true,
        })
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        setAuthState({
          isAuthenticated: !!session,
          needsSetup: session?.user?.user_metadata?.needsSetup === true,
        })
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoading) return

    const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')
    const isSetupRoute = pathname.startsWith('/berichtsheft/profil/setup')

    if (!authState.isAuthenticated) {
      if (!isAuthRoute) {
        router.push('/auth/login')
      }
    } else {
      if (authState.needsSetup) {
        if (!isSetupRoute) {
          router.push('/berichtsheft/profil/setup')
        }
      } else {
        if (isAuthRoute || isSetupRoute) {
          router.push('/')
        }
      }
    }
  }, [authState.isAuthenticated, authState.needsSetup, isLoading, pathname, router])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { error: error.message }
    // Event listener wird state aktualisieren und useEffect wird router pushed
    return {}
  }

  const register = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            needsSetup: true,
          }
        }
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { error: e.message }
      }
      return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
    }
  }

  const completeSetup = async () => {
    // Profil Setup als "Erledigt" markieren
    await supabase.auth.updateUser({
      data: { needsSetup: false }
    })
    
    // Lokalen State manuell updaten, damit der Guard sofort anspringt 
    // (obwohl update_user auch ein onAuthStateChange Triggert)
    setAuthState(prev => ({ ...prev, needsSetup: false }))
  }

  const logout = async () => {
    await supabase.auth.signOut()
    // Event listener kümmert sich um den Rest
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, register, completeSetup, logout, isLoading, user }}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
           <span className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
