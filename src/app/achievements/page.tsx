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
import {
  ArrowLeft01Icon, Award01Icon, LockIcon, FilterIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useProfile } from '@/hooks/use-profile'

// ── Category tab config ─────────────────────────────────────────────────────

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all',         label: 'Alle' },
  { id: 'start',       label: 'Erste Schritte' },
  { id: 'reports',     label: 'Berichte' },
  { id: 'hours',       label: 'Stunden' },
  { id: 'training',    label: 'Ausbildung' },
  { id: 'consistency', label: 'Konsistenz' },
  { id: 'categories',  label: 'Kategorien' },
]

// ── Small progress bar ──────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ height: 4, borderRadius: 9999, background: 'hsl(var(--border))', overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, background: color, transition: 'width 600ms ease' }} />
    </div>
  )
}

// ── Achievement card ────────────────────────────────────────────────────────

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
  const rarityColor = RARITY_COLOR[def.rarity]
  const progress = ctx && def.progress ? def.progress(ctx) : null

  return (
    <div
      style={{
        position: 'relative',
        padding: '0.875rem',
        borderRadius: 10,
        border: `1px solid ${unlocked ? rarityColor + '40' : 'hsl(var(--border))'}`,
        background: unlocked ? rarityColor + '08' : 'hsl(var(--card))',
        opacity: unlocked ? 1 : 0.55,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'opacity 200ms',
      }}
    >
      {/* New badge */}
      {isNew && (
        <div style={{
          position: 'absolute', top: -6, right: -6,
          width: 18, height: 18, borderRadius: '50%',
          background: '#ea4335', border: '2px solid hsl(var(--background))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5625rem', fontWeight: 800, color: 'white', lineHeight: 1,
        }}>!</div>
      )}

      {/* Top row: emoji + rarity + lock */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          fontSize: '1.5rem', lineHeight: 1,
          filter: unlocked ? 'none' : 'grayscale(1)',
          flexShrink: 0,
        }}>
          {unlocked ? def.emoji : <HugeiconsIcon icon={LockIcon} size={22} style={{ color: 'hsl(var(--muted-foreground))' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {def.title}
            </span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
            {def.description}
          </div>
        </div>
      </div>

      {/* Progress bar (only when locked and progress available) */}
      {!unlocked && progress && (
        <div>
          <ProgressBar value={progress.value} max={progress.max} color={rarityColor} />
          <div style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))', marginTop: 3, textAlign: 'right' }}>
            {progress.value} / {progress.max}
          </div>
        </div>
      )}

      {/* Bottom row: rarity + points */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: rarityColor, letterSpacing: '0.04em' }}>
          {RARITY_LABEL[def.rarity].toUpperCase()}
        </span>
        <span style={{ fontSize: '0.625rem', color: 'hsl(var(--muted-foreground))' }}>
          +{def.points} Pkt
        </span>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const branding = useBranding()
  const { profile } = useProfile()
  const isDark = theme === 'dark'
  const primaryColor = branding.accentColor || (isDark ? '#8ab4f8' : '#4285f4')

  const { ctx, unlockedIds, seenIds, newCount, loading, markAllSeen } = useAchievements()

  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  // Mark all seen when the page mounts (with a tiny delay so badge flash is visible)
  useEffect(() => {
    if (!isMounted || loading || newCount === 0) return
    const t = setTimeout(() => markAllSeen(), 1200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, loading])

  const earnedPoints = ACHIEVEMENTS
    .filter(a => unlockedIds.includes(a.id))
    .reduce((s, a) => s + a.points, 0)

  const filtered = ACHIEVEMENTS.filter(a => {
    if (activeCategory !== 'all' && a.category !== activeCategory) return false
    if (showOnlyUnlocked && !unlockedIds.includes(a.id)) return false
    return true
  })

  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'

  const card: React.CSSProperties = {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    padding: '1rem',
  }

  return (
    <div style={{ minHeight: '100svh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: '"Google Sans","Roboto",-apple-system,sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Header ── */}
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
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Achievements & Badges
          </span>
          {isMounted && newCount > 0 && (
            <div style={{ padding: '1px 7px', borderRadius: 9999, background: '#ea4335', fontSize: '0.6875rem', fontWeight: 700, color: 'white' }}>
              {newCount} neu
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(0.875rem,2.5vw,1.25rem)' }}>

        {/* ── Stats strip ── */}
        <div style={{ ...card, padding: '0.625rem 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
          {[
            { value: unlockedIds.length, max: ACHIEVEMENTS.length, label: 'Freigeschaltet', color: primaryColor },
            { value: earnedPoints, max: TOTAL_POINTS, label: 'Punkte', color: '#10B981' },
            { value: Math.round((unlockedIds.length / ACHIEVEMENTS.length) * 100), max: 100, label: 'Fortschritt', color: '#f59e0b', suffix: '%' },
          ].map(({ value, max, label, color, suffix }, i, arr) => (
            <div key={label} style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderRight: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color, lineHeight: 1 }}>
                {loading ? '–' : `${value}${suffix ?? (label === 'Freigeschaltet' ? `/${max}` : '')}`}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        {!loading && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                {profile?.firstName ? `${profile.firstName}s` : 'Dein'} Fortschritt
              </span>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                {earnedPoints} / {TOTAL_POINTS} Punkte
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 9999, background: 'hsl(var(--border))', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((earnedPoints / TOTAL_POINTS) * 100)}%`,
                borderRadius: 9999,
                background: `linear-gradient(90deg, ${primaryColor}, #10B981)`,
                transition: 'width 800ms ease',
              }} />
            </div>
          </div>
        )}

        {/* ── Category tabs + filter ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
            {CATEGORIES.map(c => {
              const isActive = activeCategory === c.id
              const catCount = c.id === 'all'
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
                    padding: '4px 10px', borderRadius: 9999, border: `1px solid ${isActive ? primaryColor + '60' : 'hsl(var(--border))'}`,
                    background: isActive ? primaryColor + '15' : 'transparent',
                    color: isActive ? primaryColor : 'hsl(var(--muted-foreground))',
                    fontSize: '0.75rem', fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 120ms',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {c.label}
                  <span style={{ fontSize: '0.625rem', opacity: 0.75 }}>{catCount}/{catTotal}</span>
                </button>
              )
            })}
          </div>

          {/* Only-unlocked toggle */}
          <button
            onClick={() => setShowOnlyUnlocked(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 9999,
              border: `1px solid ${showOnlyUnlocked ? primaryColor + '60' : 'hsl(var(--border))'}`,
              background: showOnlyUnlocked ? primaryColor + '15' : 'transparent',
              color: showOnlyUnlocked ? primaryColor : 'hsl(var(--muted-foreground))',
              fontSize: '0.75rem', fontWeight: showOnlyUnlocked ? 600 : 400,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 120ms',
            }}
          >
            <HugeiconsIcon icon={FilterIcon} size={12} />
            Freigeschaltet
          </button>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            Lade Achievements…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            Keine Achievements in dieser Kategorie.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.625rem' }}>
            {filtered.map(def => {
              const unlocked = unlockedIds.includes(def.id)
              const isNew = unlocked && isMounted && !seenIds.includes(def.id)
              return (
                <AchievementCard
                  key={def.id}
                  def={def}
                  unlocked={unlocked}
                  isNew={isNew}
                  ctx={ctx}
                />
              )
            })}
          </div>
        )}

        {/* Hint for locked achievements */}
        {!loading && !showOnlyUnlocked && (
          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
            {ACHIEVEMENTS.length - unlockedIds.length} Achievements noch nicht freigeschaltet — erfülle die Bedingungen, um sie zu enthüllen.
          </p>
        )}
      </div>
    </div>
  )
}
