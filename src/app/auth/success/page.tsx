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
    <div className="min-h-[100svh] bg-background flex flex-col items-center justify-center p-6 text-foreground selection:bg-primary/20">
      
      {/* Theme Toggle in Corner */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px]">
        
        <div className="flex justify-center mb-10">
          <AuthLogo size={42} />
        </div>

        <div className="bg-card border border-border sm:rounded-2xl p-8 transition-all relative overflow-hidden text-center">
          
          <div className="mx-auto size-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 mt-4">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <path d="M7 13l3 3 7-7" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>

          <h1 className="text-[1.5rem] font-semibold text-foreground mb-2 tracking-tight">
            {title}
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground mb-8 px-2 leading-relaxed">
            {description}
          </p>

          <button
            onClick={() => router.push(targetPath)}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[0.9375rem] font-semibold transition-all active:scale-[0.98]"
          >
            {buttonText}
          </button>
        </div>

        <p className="text-center mt-12 text-[0.8125rem] text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} AzubiHub — Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  )
}
