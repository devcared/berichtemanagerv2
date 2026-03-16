'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthState {
  isAuthenticated: boolean
  needsSetup: boolean
}

interface AuthContextType extends AuthState {
  login: () => void
  register: () => void
  completeSetup: () => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    needsSetup: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage on mount
    const storedAuth = localStorage.getItem('azubihub_auth')
    if (storedAuth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthState(JSON.parse(storedAuth))
    }
    setIsLoading(false)
  }, [])

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

  const saveAuth = (state: AuthState) => {
    localStorage.setItem('azubihub_auth', JSON.stringify(state))
    setAuthState(state)
  }

  const login = () => {
    saveAuth({ isAuthenticated: true, needsSetup: false })
    router.push('/')
  }

  const register = () => {
    saveAuth({ isAuthenticated: true, needsSetup: true })
    router.push('/berichtsheft/profil/setup')
  }

  const completeSetup = () => {
    saveAuth({ isAuthenticated: true, needsSetup: false })
    router.push('/')
  }

  const logout = () => {
    localStorage.removeItem('azubihub_auth')
    setAuthState({ isAuthenticated: false, needsSetup: false })
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, register, completeSetup, logout, isLoading }}>
      {/* While initial load happens, we can just show nothing or a full screen loader to prevent flash of content */}
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
