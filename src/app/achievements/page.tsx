'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useBranding } from '@/hooks/use-branding'
import { useAchievements } from '@/hooks/use-achievements'
import {
  ACHIEVEMENTS, RARITY_COLOR, RARITY_LABEL, TOTAL_POINTS,
  type AchievementCategory, type AchievementDef,
} from '@/lib/achievements'
import { ArrowLeft01Icon, Award01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useProfile } from '@/hooks/use-profile'

// ── Category tabs config ──────────────────────────────────────────────────────

const CATEGORIES: { id: AchievementCategory | 'all'; label: string; emoji: string }[] = [
  { id: 'all',         label: 'Alle',           emoji: '✨' },
  { id: 'start',       label: 'Erste Schritte', emoji: '🎯' },
  { id: 'reports',     label: 'Berichte',       emoji: '📋' },
  { id: 'hours',       label: 'Stunden',        emoji: '⏰' },
  { id: 'training',    label: 'Ausbildung',     emoji: '🎓' },
  { id: 'consistency', label: 'Konsistenz',     emoji: '🔥' },
  { id: 'categories',  label: 'Kategorien',     emoji: '🌐' },
]

// ── Achievement card ──────────────────────────────────────────────────────────

function AchievementCard({
  def,
  unlocked,
  isNew,
  ctx,
}: {
  def: AchievementDef
  unlocked: boolean
  isNew: boolean
  ctx: ReturnType<typeof useAchievements>['ctx']
}) {
  const [hovered, setHovered] = useState(false)
  const color = RARITY_COLOR[def.rarity]
  const progress = ctx && def.progress ? def.progress(ctx) : null
  const pct = progress ? Math.min(100, Math.round((progress.value / progress.max) * 100)) : 0

  const active = unlocked || hovered

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '0.875rem 0.875rem 0.75rem',
        borderRadius: 12,
        border: `1px solid ${active ? color + '45' : 'hsl(var(--border))'}`,
        background: active ? color + '0a' : 'hsl(var(--card))',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transition: 'border-color 200ms, background 200ms',
        userSelect: 'none',
      }}
    >
      {/* "NEU" badge */}
      {isNew && (
        <div style={{
          position: 'absolute', top: -7, right: -7,
          padding: '1px 6px', borderRadius: 9999,
          background: '#ea4335', border: '2px solid hsl(var(--background))',
          fontSize: '0.5625rem', fontWeight: 800, color: 'white', lineHeight: '16px',
        }}>NEU</div>
      )}

      {/* Icon circle + rarity chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: active ? color + '18' : 'hsl(var(--muted))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', lineHeight: 1,
          filter: unlocked ? 'none' : hovered ? 'grayscale(0.3) opacity(0.7)' : 'grayscale(1) opacity(0.35)',
          transition: 'filter 200ms, background 200ms',
        }}>
          {def.emoji}
        </div>

        <div style={{
          padding: '2px 7px', borderRadius: 9999,
          background: active ? color + '18' : 'hsl(var(--muted))',
          color: active ? color : 'hsl(var(--muted-foreground))',
          fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.05em',
          transition: 'color 200ms, background 200ms',
          whiteSpace: 'nowrap',
        }}>
          {RARITY_LABEL[def.rarity].toUpperCase()}
        </div>
      </div>

      {/* Title + description */}
      <div>
        <div style={{
          fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3, marginBottom: 2,
          color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
          opacity: active ? 1 : 0.6,
          transition: 'color 200ms, opacity 200ms',
        }}>
          {def.title}
        </div>
        <div style={{
          fontSize: '0.6875rem', lineHeight: 1.45,
          color: 'hsl(var(--muted-foreground))',
          opacity: active ? 0.85 : 0.4,
          transition: 'opacity 200ms',
        }}>
          {def.description}
        </div>
      </div>

      {/* Progress bar — only for locked achievements with trackable progress */}
      {!unlocked && progress && (
        <div style={{ marginTop: 2 }}>
          <div style={{ height: 3, borderRadius: 9999, background: 'hsl(var(--border))', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 9999,
              background: hovered ? color : 'hsl(var(--muted-foreground))',
              opacity: hovered ? 1 : 0.35,
              transition: 'width 500ms ease, background 200ms, opacity 200ms',
            }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: 2 }}>
            <span style={{ fontSize: '0.5625rem', color: 'hsl(var(--muted-foreground))', opacity: hovered ? 0.8 : 0.4, transition: 'opacity 200ms' }}>
              {progress.value} / {progress.max}
            </span>
          </div>
        </div>
      )}

      {/* Points + check */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{
          fontSize: '0.625rem', fontWeight: 500,
          color: active ? color : 'hsl(var(--muted-foreground))',
          opacity: active ? 1 : 0.4,
          transition: 'color 200ms, opacity 200ms',
        }}>
          +{def.points} Pkt
        </span>
        {unlocked ? (
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: color + '25', border: `1px solid ${color + '60'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <span style={{ fontSize: '0.5625rem', color: 'hsl(var(--muted-foreground))', opacity: 0.35 }}>🔒</span>
        )}
      </div>
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', margin: '0 0 0.5rem' }}>
      {children}
    </p>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ height: 140, borderRadius: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', opacity: 0.5 }} />
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const branding = useBranding()
  const { profile } = useProfile()
  const isDark = theme === 'dark'
  const primaryColor = branding.accentColor || (isDark ? '#8ab4f8' : '#4285f4')

  const { ctx, unlockedIds, seenIds, newCount, loading, markAllSeen } = useAchievements()
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (!isMounted || loading || newCount === 0) return
    const t = setTimeout(() => markAllSeen(), 1500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, loading])

  const earnedPoints = ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .reduce((s, a) => s + a.points, 0)

  const categoryFiltered = ACHIEVEMENTS.filter(
    a => activeCategory === 'all' || a.category === activeCategory,
  )
  const unlockedFiltered = categoryFiltered.filter(a => unlockedIds.includes(a.id))
  const lockedFiltered   = categoryFiltered.filter(a => !unlockedIds.includes(a.id))

  const completionPct = Math.round((unlockedIds.length / ACHIEVEMENTS.length) * 100)
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'

  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.625rem',
  }

  return (
    <div style={{ minHeight: '100svh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Topbar ── */}
      <header style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 clamp(0.875rem,3vw,1.25rem)', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.push('/')}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', flexShrink: 0, transition: 'background 120ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#10B98118', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HugeiconsIcon icon={Award01Icon} size={15} style={{ color: '#10B981' }} />
          </div>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Achievements & Badges</span>
          {isMounted && newCount > 0 && (
            <div style={{ padding: '1px 7px', borderRadius: 9999, background: '#ea4335', fontSize: '0.6875rem', fontWeight: 700, color: 'white' }}>
              {newCount} neu
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(0.875rem,2.5vw,1.25rem)' }}>

        {/* ── Stats + progress ── */}
        <div style={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', marginBottom: '1rem', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { value: loading ? '–' : `${unlockedIds.length}/${ACHIEVEMENTS.length}`, label: 'Freigeschaltet', color: primaryColor },
              { value: loading ? '–' : String(earnedPoints),                           label: 'Punkte',         color: '#10B981'   },
              { value: loading ? '–' : `${completionPct}%`,                            label: 'Abgeschlossen',  color: '#f59e0b'   },
            ].map(({ value, label, color }, i, arr) => (
              <div key={label} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', borderRight: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 1rem 0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                {profile?.firstName ? `${profile.firstName}s` : 'Dein'} Gesamtfortschritt
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))' }}>
                {loading ? '–' : `${earnedPoints} / ${TOTAL_POINTS} Pkt`}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: 'hsl(var(--border))', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: loading ? '0%' : `${Math.round((earnedPoints / TOTAL_POINTS) * 100)}%`,
                borderRadius: 9999,
                background: `linear-gradient(90deg, ${primaryColor}, #10B981)`,
                transition: 'width 900ms cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.125rem' }}>
          {CATEGORIES.map(c => {
            const isActive = activeCategory === c.id
            const catUnlocked = c.id === 'all'
              ? unlockedIds.length
              : ACHIEVEMENTS.filter(a => a.category === c.id && unlockedIds.includes(a.id)).length
            const catTotal = c.id === 'all'
              ? ACHIEVEMENTS.length
              : ACHIEVEMENTS.filter(a => a.category === c.id).length
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 9999,
                  border: `1px solid ${isActive ? primaryColor + '55' : 'hsl(var(--border))'}`,
                  background: isActive ? primaryColor + '12' : 'transparent',
                  color: isActive ? primaryColor : 'hsl(var(--muted-foreground))',
                  fontSize: '0.75rem', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  transition: 'all 120ms',
                }}
              >
                <span>{c.emoji}</span>
                {c.label}
                <span style={{
                  padding: '0 5px', borderRadius: 4,
                  background: isActive ? primaryColor + '20' : 'hsl(var(--muted))',
                  color: isActive ? primaryColor : (catUnlocked === catTotal ? '#10B981' : 'hsl(var(--muted-foreground))'),
                  fontSize: '0.5625rem', fontWeight: 700,
                }}>{catUnlocked}/{catTotal}</span>
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <>
            <SectionLabel>Lade…</SectionLabel>
            <div style={grid}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : (
          <>
            {/* Unlocked section */}
            {unlockedFiltered.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <SectionLabel>✅ Freigeschaltet · {unlockedFiltered.length}</SectionLabel>
                <div style={grid}>
                  {unlockedFiltered.map(def => (
                    <AchievementCard
                      key={def.id}
                      def={def}
                      unlocked={true}
                      isNew={isMounted && !seenIds.includes(def.id)}
                      ctx={ctx}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locked section */}
            {lockedFiltered.length > 0 && (
              <div>
                <SectionLabel>🔒 Noch gesperrt · {lockedFiltered.length} — hover für Vorschau</SectionLabel>
                <div style={grid}>
                  {lockedFiltered.map(def => (
                    <AchievementCard
                      key={def.id}
                      def={def}
                      unlocked={false}
                      isNew={false}
                      ctx={ctx}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {unlockedFiltered.length === 0 && lockedFiltered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                Keine Achievements in dieser Kategorie.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
