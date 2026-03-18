'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const C = {
  blue:        '#4285f4',
  blueDark:    '#1967d2',
  textPrimary: '#202124',
  textSec:     '#5f6368',
  textLight:   '#80868b',
  border:      '#dadce0',
  red:         '#ea4335',
}

function Logo({ size = 32 }: { size?: number }) {
  const fs = size * 0.57
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.38 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/App Icon.png" alt="AzubiHub" width={size} height={size} style={{ borderRadius: size * 0.22, display: 'block', objectFit: 'cover' }} />
      <span style={{ fontSize: fs, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1, userSelect: 'none', color: C.textPrimary }}>
        Azubi<span style={{ color: C.textSec }}>Hub</span>
      </span>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const router = useRouter()
  const [email,     setEmail]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg,  setErrorMsg]  = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setErrorMsg('')
    const { error } = await resetPassword(email)
    if (error) { setErrorMsg(error); setIsLoading(false) }
    else        { router.push('/auth/success?type=reset') }
  }

  return (
    <div style={{
      minHeight: '100svh', background: '#ffffff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: '"Google Sans","Roboto",-apple-system,"Segoe UI",sans-serif',
      WebkitFontSmoothing: 'antialiased', color: C.textPrimary,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.25rem' }}>
          <Logo size={34} />
        </div>

        {/* Card */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '2rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 450, color: C.textPrimary, marginBottom: '0.375rem', textAlign: 'center', lineHeight: 1.3 }}>
            Passwort vergessen?
          </h1>
          <p style={{ fontSize: '0.9375rem', color: C.textSec, textAlign: 'center', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.
          </p>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: C.textSec, marginBottom: '0.375rem' }}>E-Mail</label>
              <input
                id="email" type="email" required placeholder="name@beispiel.de"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: '0.9375rem', color: C.textPrimary, background: '#ffffff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms ease', fontFamily: 'inherit' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.blue)}
                onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'rgba(234,67,53,0.08)', border: '1px solid rgba(234,67,53,0.2)', borderRadius: 4, color: C.red, fontSize: '0.875rem', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit" disabled={isLoading || !email}
              style={{ marginTop: '0.25rem', width: '100%', padding: '0.6875rem 1rem', background: C.blue, color: 'white', border: 'none', borderRadius: 9999, fontSize: '0.9375rem', fontWeight: 450, cursor: isLoading || !email ? 'not-allowed' : 'pointer', opacity: isLoading || !email ? 0.6 : 1, transition: 'background 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
              onMouseEnter={e => { if (!isLoading && email) (e.currentTarget as HTMLButtonElement).style.background = C.blueDark }}
              onMouseLeave={e => { if (!isLoading && email) (e.currentTarget as HTMLButtonElement).style.background = C.blue }}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block' }} />
                  Senden...
                </>
              ) : 'Link anfordern'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9375rem' }}>
          <Link href="/auth/login" style={{ color: C.blue, fontWeight: 500, textDecoration: 'none' }}>
            Zurück zum Login
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.8125rem', color: C.textLight }}>
          © {new Date().getFullYear()} AzubiHub
        </p>
      </div>
    </div>
  )
}
