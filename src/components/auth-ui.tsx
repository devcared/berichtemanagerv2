'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

export function AuthLogo({ size = 48 }: { size?: number }) {
  const fs = size * 0.52
  return (
    <div className="flex flex-col items-center gap-4 select-none animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/10 rounded-[28%] scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Image 
          src="/App Icon.png" 
          alt="AzubiHub" 
          width={size} 
          height={size} 
          className="rounded-[22%] object-cover shadow-sm transition-transform duration-500 group-hover:scale-105" 
          priority
        />
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[1.75rem] font-bold tracking-tight text-foreground">
          Azubi<span className="text-primary">Hub</span>
        </span>
        <div className="h-0.5 w-8 bg-primary/30 rounded-full mt-1.5" />
      </div>
    </div>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button 
      onClick={toggleTheme}
      className="p-2.5 rounded-xl hover:bg-muted transition-all duration-300 text-muted-foreground border border-transparent hover:border-border active:scale-95 group shadow-none"
      title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
    >
      <div className="relative size-5">
        <div className={`absolute inset-0 transition-all duration-500 ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </div>
        <div className={`absolute inset-0 transition-all duration-500 ${theme === 'light' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </div>
      </div>
    </button>
  )
}
