'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { AuthLogo, ThemeToggle } from '@/components/auth-ui'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    const { error } = await resetPassword(email)
    if (error) {
      setErrorMsg(error)
      setIsLoading(false)
    } else {
      router.push('/auth/success?type=reset')
    }
  }

  return (
    <div className="min-h-[100svh] bg-background flex flex-col items-center justify-center p-6 font-sans antialiased text-foreground selection:bg-primary/20">
      
      {/* Theme Toggle Top Right */}
      <div className="fixed top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px] py-12">
        
        <div className="flex justify-center mb-12">
          <AuthLogo size={56} />
        </div>

        <div className="bg-card border-none sm:border sm:border-border rounded-[2rem] p-8 sm:p-10 transition-all duration-500">
          <div className="text-center mb-10">
            <h1 className="text-[1.75rem] font-bold text-foreground mb-2 tracking-tight">
              Kennwort vergessen?
            </h1>
            <p className="text-[0.9375rem] text-muted-foreground">
              Wir senden dir einen Link zum Zurücksetzen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[0.8125rem] font-bold text-foreground/85 ml-1">
                Deine E-Mail
              </label>
              <input
                id="email" type="email" required
                placeholder="max@mustermann.de"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-[0.9375rem] transition-all duration-200 placeholder:text-muted-foreground/40"
              />
            </div>

            {errorMsg && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[0.875rem] text-center font-semibold animate-in fade-in zoom-in-95">
                {errorMsg}
              </div>
            )}

            <button
              type="submit" disabled={isLoading || !email}
              className="mt-4 w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[1rem] font-bold transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.985] group"
            >
              {isLoading ? (
                <>
                  <span className="size-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  Link anfordern
                  <svg className="size-4 opacity-0 transition-all duration-300 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <p className="text-[0.9375rem] text-muted-foreground font-medium text-center leading-relaxed">
            Doch wieder eingefallen?{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-2">
              Zurück zum Login
            </Link>
          </p>

          <p className="text-[0.8125rem] text-muted-foreground/40 font-bold uppercase tracking-widest select-none">
            © {new Date().getFullYear()} AzubiHub — Digital Excellence
          </p>
        </div>
      </div>
    </div>
  )
}
