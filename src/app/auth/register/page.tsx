'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLogo, ThemeToggle } from '@/components/auth-ui'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853"/><path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.55 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#fbbc05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#ea4335"/></svg>
)

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="currentColor"><path d="M14.94 9c0 2.22 1.44 3.53 1.5 3.57-.01.03-.23.83-.8 1.66-.49.72-1 1.44-1.8 1.45-.78.01-1.03-.47-1.92-.47-.89 0-1.17.46-1.9.47-.74.01-1.31-.72-1.82-1.45-1.03-1.48-1.82-4.18-.76-6.02.53-.91 1.47-1.49 2.49-1.5 1.15-.02 2.1.77 2.8.77.7 0 1.65-.79 2.8-.79 1.15 0 2.1.58 2.39 1.41.01.03-.02.04-.04.04-.1-.01-1.8.01-1.8 1.86zm-5-3.52c.03-2.13 1.77-3.83 3.86-3.83.03 0 .05.02.05.04s-.01.04-.03.04c-1.93.04-3.54 1.7-3.88 3.75 0 2.05-1.6 3.71-3.53 3.75-.02 0-.04-.02-.04-.04 0-.02 0-.04.02-.04 1.85-.04 3.52-1.63 3.55-3.67z" /></svg>
)

export default function RegisterPage() {
  const { register, signInWithGoogle, signInWithApple } = useAuth()
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setErrorMsg('Die Passwörter stimmen nicht überein.'); return }
    setIsLoading(true); setErrorMsg(''); setSuccessMsg('')
    const { error, needsEmailVerification } = await register(email, password)
    if (error) {
      setErrorMsg(error)
      setIsLoading(false)
    } else if (needsEmailVerification) {
      setSuccessMsg('Erfolgreich! Bitte überprüfe deine E-Mails, um deinen Account zu aktivieren.')
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }

  const ssoButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.625rem 1rem',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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

        <div className="bg-card border border-border sm:rounded-2xl p-8 transition-all">
          <h1 className="text-[1.5rem] font-semibold text-foreground mb-1 text-center tracking-tight">
            Konto erstellen
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground text-center mb-8">
            Werde Teil von AzubiHub
          </p>

          <div className="flex flex-col gap-3 mb-8">
            <button 
              onClick={() => signInWithGoogle()}
              style={ssoButtonStyle}
              className="hover:bg-muted"
            >
              <GoogleIcon />
              Weiter mit Google
            </button>
            <button 
              onClick={() => signInWithApple()}
              style={ssoButtonStyle}
              className="hover:bg-muted"
            >
              <AppleIcon />
              Weiter mit Apple
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <span className="relative px-4 bg-card text-[0.8125rem] text-muted-foreground font-medium uppercase tracking-wider">
              oder E-Mail
            </span>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[0.8125rem] font-semibold text-foreground/80 ml-0.5">
                E-Mail-Adresse
              </label>
              <input
                id="email" type="email" required
                placeholder="name@beispiel.de"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[0.9375rem] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[0.8125rem] font-semibold text-foreground/80 ml-0.5">Passwort</label>
              <input
                id="password" type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[0.9375rem] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-[0.8125rem] font-semibold text-foreground/80 ml-0.5">Passwort bestätigen</label>
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
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[0.875rem] text-center font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-[0.875rem] text-center font-medium">
                {successMsg}
              </div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="mt-4 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[0.9375rem] font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Wird registriert...
                </>
              ) : 'Registrieren'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[0.9375rem] text-muted-foreground">
          Schon ein Konto?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Einloggen
          </Link>
        </p>

        <p className="text-center mt-12 text-[0.8125rem] text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} AzubiHub — Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}
