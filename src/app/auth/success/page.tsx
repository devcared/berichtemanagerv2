'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle01Icon, Mail01Icon } from '@hugeicons/core-free-icons'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type')

  let title = 'Erfolgreich!'
  let description = 'Die Aktion wurde erfolgreich durchgeführt.'
  let icon = CheckmarkCircle01Icon
  let buttonText = 'Zurück zur Startseite'
  let targetPath = '/'

  switch (type) {
    case 'reset':
      title = 'E-Mail gesendet'
      description = 'Wir haben dir einen Link zum Zurücksetzen deines Passworts an deine E-Mail-Adresse gesendet. Bitte überprüfe auch deinen Spam-Ordner.'
      icon = Mail01Icon
      buttonText = 'Zurück zum Login'
      targetPath = '/auth/login'
      break
    case 'password-updated':
      title = 'Passwort geändert'
      description = 'Dein Passwort wurde erfolgreich aktualisiert. Du bist nun mit dem neuen Passwort eingeloggt.'
      icon = CheckmarkCircle01Icon
      buttonText = 'Zum Dashboard'
      targetPath = '/'
      break
    default:
      break
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header / Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-extrabold text-2xl">A</span>
          </div>
          <div className="text-center">
            <span className="text-foreground text-xl font-bold tracking-wider uppercase">AzubiHub</span>
          </div>
        </div>

        {/* Success Card */}
        <Card className="border border-border bg-card shadow-lg shadow-emerald-500/5 relative overflow-hidden transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
          
          <CardHeader className="space-y-4 pb-6 pt-10 text-center">
            <div className="mx-auto size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <HugeiconsIcon icon={icon} size={32} className="text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-sm text-center px-2">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Space for dynamic content if needed */}
          </CardContent>
            
          <CardFooter className="flex flex-col gap-5 pt-2 pb-8">
            <Button
              onClick={() => router.push(targetPath)}
              className="w-full h-11 text-base font-medium"
            >
              {buttonText}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
