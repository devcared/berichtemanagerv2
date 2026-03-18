'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { AuthLogo, ThemeToggle, HomeButton } from '@/components/auth-ui'

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
    <div className="min-h-[100svh] bg-background flex flex-col items-center justify-center p-6 text-foreground selection:bg-primary/20">

      {/* Top Navigation */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <HomeButton />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px]">

        <div className="flex justify-center mb-10">
          <AuthLogo size={42} />
        </div>

        <div className="bg-card border border-border sm:rounded-2xl p-8 transition-all relative overflow-hidden">
          <h1 className="text-[1.5rem] font-semibold text-foreground mb-1 text-center tracking-tight">
            Passwort vergessen?
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground text-center mb-8">
            Trage deine E-Mail ein, um dein Passwort zurückzusetzen.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {errorMsg && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[0.875rem] text-center font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit" disabled={isLoading || !email}
              className="mt-4 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[0.9375rem] font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Wird gesendet...
                </>
              ) : 'Link anfordern'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[0.9375rem] text-muted-foreground">
          Zurück zum{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Login
          </Link>
        </p>

        <p className="text-center mt-12 text-[0.8125rem] text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} AzubiHub — Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}
