'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { AuthLogo, ThemeToggle } from '@/components/auth-ui'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type')

  let title = 'Erfolgreich!'
  let description = 'Die Aktion wurde erfolgreich durchgeführt.'
  let buttonText = 'Zurück zur Startseite'
  let targetPath = '/'

  switch (type) {
    case 'reset':
      title = 'E-Mail gesendet'
      description = 'Wir haben dir einen Link zum Zurücksetzen deines Passworts an deine E-Mail-Adresse gesendet. Bitte überprüfe auch deinen Spam-Ordner.'
      buttonText = 'Zurück zum Login'
      targetPath = '/auth/login'
      break
    case 'password-updated':
      title = 'Passwort geändert'
      description = 'Dein Passwort wurde erfolgreich aktualisiert. Du bist nun mit dem neuen Passwort eingeloggt.'
      buttonText = 'Zum Dashboard'
      targetPath = '/'
      break
    default:
      break
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

        <div className="bg-card border-none sm:border sm:border-border rounded-[2rem] p-8 sm:p-10 transition-all duration-500 text-center">
          
          <div className="mx-auto size-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 drop-shadow-sm">
              <path d="M10 24l8 8 20-20" />
            </svg>
          </div>

          <h1 className="text-[1.75rem] font-bold text-foreground mb-4 tracking-tight">
            {title}
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground mb-10 leading-relaxed px-4">
            {description}
          </p>

          <button
            onClick={() => router.push(targetPath)}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[1rem] font-bold transition-all duration-300 active:scale-[0.985] group"
          >
            {buttonText}
          </button>
        </div>

        <p className="text-center mt-12 text-[0.8125rem] text-muted-foreground/40 font-bold uppercase tracking-widest select-none">
          © {new Date().getFullYear()} AzubiHub — Digital Excellence
        </p>
      </div>
    </div>
  )
}
