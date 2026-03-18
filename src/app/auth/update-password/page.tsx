'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'

function Logo({ size = 32 }: { size?: number }) {
  const fs = size * 0.57
  return (
    <div className="flex items-center gap-2 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/App Icon.png" alt="AzubiHub" width={size} height={size} className="rounded-lg object-cover" />
      <span className="text-foreground tracking-tight" style={{ fontSize: fs, fontWeight: 500 }}>
        Azubi<span className="text-muted-foreground">Hub</span>
      </span>
    </div>
  )
}

export default function UpdatePasswordPage() {
  const { updatePassword } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrorMsg('Die Passwörter stimmen nicht überein.')
      return
    }
    
    setIsLoading(true)
    setErrorMsg('')
    
    const { error } = await updatePassword(password)
    
    if (error) {
      setErrorMsg(error)
      setIsLoading(false)
    } else {
      router.push('/auth/success?type=password-updated')
    }
  }

  return (
    <div className="min-h-[100svh] bg-background flex flex-col items-center justify-center p-6 font-sans antialiased text-foreground selection:bg-primary/20">
      
      {/* Theme Toggle in Corner */}
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      <div className="w-full max-w-[400px]">
        
        <div className="flex justify-center mb-10">
          <Logo size={42} />
        </div>

        <div className="bg-card border border-border sm:shadow-xl sm:shadow-primary/5 rounded-2xl p-8 transition-all relative overflow-hidden">
          {/* Accent Line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

          <h1 className="text-[1.5rem] font-semibold text-foreground mb-1 text-center tracking-tight">
            Neues Passwort
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground text-center mb-8">
            Setze ein sicheres Passwort für deinen Account.
          </p>

          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[0.8125rem] font-semibold text-foreground/80 ml-0.5">
                Neues Passwort
              </label>
              <input
                id="password" type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[0.9375rem] transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-[0.8125rem] font-semibold text-foreground/80 ml-0.5">
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword" type="password" required
                placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border bg-input focus:bg-background focus:ring-2 outline-none text-[0.9375rem] transition-all placeholder:text-muted-foreground/50 ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' 
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                }`}
              />
            </div>

            {errorMsg && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[0.875rem] text-center font-medium animate-in fade-in slide-in-from-top-1">
                {errorMsg}
              </div>
            )}

            <button
              type="submit" disabled={isLoading || !password || password !== confirmPassword}
              className="mt-4 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[0.9375rem] font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Aktualisieren...
                </>
              ) : 'Passwort speichern'}
            </button>
          </form>
        </div>

        <p className="text-center mt-12 text-[0.8125rem] text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} AzubiHub — Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}

