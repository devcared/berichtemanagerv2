'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

export function AuthLogo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <Image
        src="/App Icon.png"
        alt="AzubiHub"
        width={size}
        height={size}
        className="rounded-xl object-cover"
        priority
      />
      <span className="text-[1.25rem] font-semibold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
        <span style={{ color: '#4285f4' }}>Azubi</span>
        <span className="text-foreground/65 font-normal">Hub</span>
      </span>
    </div>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
      title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
    >
      {theme === 'dark' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

import Link from 'next/link'

export function HomeButton() {
  return (
    <Link
      href="/"
      className="flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
      title="Zurück zur Startseite"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </Link>
  )
}
