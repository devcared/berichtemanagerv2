'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { AuthLogo, ThemeToggle } from '@/components/auth-ui'

export default function UpdatePasswordPage() {
  const { updatePassword } = useAuth()
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
    <div className="min-h-[100svh] bg-background flex flex-col items-center justify-center p-6 text-foreground selection:bg-primary/20">
      
      {/* Theme Toggle in Corner */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px]">
        
        <div className="flex justify-center mb-10">
          <AuthLogo size={42} />
        </div>

        <div className="bg-card border border-border sm:rounded-2xl p-8 transition-all relative overflow-hidden text-center">
          <h1 className="text-[1.5rem] font-semibold text-foreground mb-4 tracking-tight text-center">
            Neues Passwort
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground text-center mb-8">
            Setze ein sicheres Passwort für deinen Account.
          </p>

          <form onSubmit={handleUpdate} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[0.8125rem] font-semibold text-foreground/80 ml-0.5">
                Neues Passwort
              </label>
              <input
                id="password" type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[0.9375rem] transition-all"
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
                className={`w-full px-4 py-2.5 rounded-lg border bg-input focus:bg-background focus:ring-2 outline-none text-[0.9375rem] transition-all ${
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
              className="mt-4 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[0.9375rem] font-semibold transition-all shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
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
