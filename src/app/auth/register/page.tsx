'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrorMsg('Die Passwörter stimmen nicht überein.')
      return
    }
    
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    const { error, needsEmailVerification } = await register(email, password)
    if (error) {
      setErrorMsg(error)
      setIsLoading(false)
    } else if (needsEmailVerification) {
      setSuccessMsg('Erfolgreich! Bitte überprüfe deine E-Mails, um deinen Account zu aktivieren.')
      setIsLoading(false)
    } else {
      // successful login -> redirect happens via AuthContext effect
      setIsLoading(false)
    }
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
            <p className="text-sm text-muted-foreground mt-1">Starte in deine Ausbildung</p>
          </div>
        </div>

        {/* Register Card */}
        <Card className="border border-border bg-card shadow-lg shadow-primary/5 relative overflow-hidden transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          
          <CardHeader className="space-y-2 pb-6 pt-8 text-center">
            <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
            <CardDescription className="text-sm">
              Registriere dich, um loszulegen.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleRegister}>
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
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Passwort
                </Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Passwort bestätigen
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background h-11 transition-shadow hover:border-primary/50 focus-visible:ring-primary/20"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-5 pt-2 pb-8">
              {errorMsg && (
                <div className="w-full p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-md text-sm text-center mb-2">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="w-full p-3 bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 rounded-md text-sm text-center mb-2">
                  {successMsg}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium relative overflow-hidden group"
                disabled={isLoading || password !== confirmPassword || password === ''}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    <span>Registrieren...</span>
                  </div>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Registrieren
                  </span>
                )}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Bereits einen Account? </span>
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Anmelden
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
