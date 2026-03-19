'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
interface ThemeCtxValue {
  theme: Theme
  toggleTheme: (origin?: { x: number; y: number }) => void
}

const Ctx = createContext<ThemeCtxValue>({ theme: 'light', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = (origin?: { x: number; y: number }) => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'

    const apply = () => {
      setTheme(next)
      localStorage.setItem('azubihub-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
    }

    // View Transitions API — circular reveal from click origin
    if (!document.startViewTransition) {
      apply()
      return
    }

    const x = origin ? `${origin.x}px` : '50%'
    const y = origin ? `${origin.y}px` : '50%'
    document.documentElement.style.setProperty('--vt-x', x)
    document.documentElement.style.setProperty('--vt-y', y)

    document.startViewTransition(apply)
  }

  return <Ctx.Provider value={{ theme, toggleTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
