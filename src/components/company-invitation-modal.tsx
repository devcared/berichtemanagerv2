'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building01Icon, CheckmarkCircle01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'

export default function CompanyInvitationModal() {
  const { profile, refreshProfile } = useProfile()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Only show when there's a pending invitation
  if (!profile?.pendingCompanyId || !profile?.pendingCompanyName) return null

  async function respond(action: 'accept' | 'reject') {
    setLoading(action)
    setError(null)
    try {
      const res = await fetch('/api/companies/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Fehler')
      }
      refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Verarbeiten.')
      setLoading(null)
    }
  }

  const companyName = profile.pendingCompanyName

  return (
    /* Backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif',
    }}>
      {/* Dialog */}
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 16,
        padding: '2rem',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'fadeInUp 0.2s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'hsl(var(--primary) / 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
        }}>
          <HugeiconsIcon icon={Building01Icon} size={26} style={{ color: 'hsl(var(--primary))' }} />
        </div>

        {/* Text */}
        <h2 style={{
          fontSize: '1.125rem', fontWeight: 600,
          color: 'hsl(var(--foreground))',
          marginBottom: '0.5rem', lineHeight: 1.3,
        }}>
          Unternehmens-Einladung
        </h2>
        <p style={{
          fontSize: '0.9375rem', color: 'hsl(var(--muted-foreground))',
          lineHeight: 1.55, marginBottom: '1.5rem',
        }}>
          Du wurdest ins Unternehmen{' '}
          <strong style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>
            &ldquo;{companyName}&rdquo;
          </strong>{' '}
          zugewiesen. Möchtest du die Einladung annehmen?
        </p>

        {/* Company chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10,
          background: 'hsl(var(--muted) / 0.6)',
          border: '1px solid hsl(var(--border))',
          marginBottom: '1.5rem',
        }}>
          <HugeiconsIcon icon={Building01Icon} size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
            {companyName}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive) / 0.25)',
            color: 'hsl(var(--destructive))',
            fontSize: '0.8125rem', marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => respond('accept')}
            disabled={!!loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
              fontSize: '0.9375rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'accept' ? 0.5 : 1,
              transition: 'opacity 150ms',
            }}
          >
            {loading === 'accept' ? (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            )}
            Bestätigen
          </button>

          <button
            onClick={() => respond('reject')}
            disabled={!!loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              border: '1px solid hsl(var(--border))',
              background: 'transparent', color: 'hsl(var(--foreground))',
              fontSize: '0.9375rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'reject' ? 0.5 : 1,
              transition: 'background 150ms, opacity 150ms',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--accent))' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {loading === 'reject' ? (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.15)', borderTopColor: 'hsl(var(--foreground))', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            )}
            Ablehnen
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
