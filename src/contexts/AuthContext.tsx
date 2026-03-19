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
  register: (email: string, password: string) => Promise<{ error?: string, needsEmailVerification?: boolean }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  completeSetup: () => Promise<void>
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        setAuthState({
          isAuthenticated: !!session,
          needsSetup: session?.user?.user_metadata?.needsSetup === true,
        })
        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoading) return

    const isLoginRegisterRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register') || pathname.startsWith('/auth/forgot-password')
    const isUpdatePasswordRoute = pathname.startsWith('/auth/update-password')
    const isSuccessRoute = pathname.startsWith('/auth/success')
    const isSetupRoute = pathname.startsWith('/setup')
    const isLandingPage = pathname === '/'
    const isPublicPage = pathname === '/impressum' || pathname === '/datenschutz'

    if (!authState.isAuthenticated) {
      if (!isLoginRegisterRoute && !isSuccessRoute && !isUpdatePasswordRoute && !isLandingPage && !isPublicPage) {
        router.push('/auth/login')
      }
    } else {
      // Immer erlauben auf Erfolgs- oder Passwort-Update-Seite zu bleiben (auch wenn eingeloggt!)
      if (isUpdatePasswordRoute || isSuccessRoute) {
        return
      }

      if (authState.needsSetup) {
        if (!isSetupRoute) {
          router.push('/setup')
        }
      } else {
        if (isLoginRegisterRoute) {
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
      const { data, error } = await supabase.auth.signUp({
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
      
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        return { error: 'Diese E-Mail-Adresse wird bereits verwendet. Bitte melde dich an.' }
      }

      if (!data.session) {
        return { needsEmailVerification: true }
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

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })
    if (error) return { error: error.message }
    return {}
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return {}
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const signInWithApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    // Event listener kümmert sich um den Rest
  }

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      register, 
      resetPassword, 
      updatePassword, 
      completeSetup, 
      signInWithGoogle,
      signInWithApple,
      logout,
      isLoading, 
      user 
    }}>
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
