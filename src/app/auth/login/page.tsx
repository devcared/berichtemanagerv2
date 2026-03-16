'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simuliere einen Login-Vorgang
    setTimeout(() => {
      setIsLoading(false)
      router.push('/')
    }, 1500)
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
            <p className="text-sm text-muted-foreground mt-1">Dein Ausbildungsassistent</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border border-border bg-card shadow-lg shadow-primary/5 relative overflow-hidden transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
          
          <CardHeader className="space-y-2 pb-6 pt-8 text-center">
            <CardTitle className="text-2xl font-bold">Willkommen zurück</CardTitle>
            <CardDescription className="text-sm">
              Bitte melde dich an, um fortzufahren.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  E-Mail Adresse
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background h-11 transition-shadow hover:border-primary/50 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Passwort
                  </Label>
                  <Link
                    href="#"
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Vergessen?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background h-11 transition-shadow hover:border-primary/50 focus-visible:ring-primary/20"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-5 pt-2 pb-8">
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium relative overflow-hidden group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    <span>Anmelden...</span>
                  </div>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Anmelden
                  </span>
                )}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Noch keinen Account? </span>
                <Link
                  href="#"
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Registrieren
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AzubiHub. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </div>
  )
}
