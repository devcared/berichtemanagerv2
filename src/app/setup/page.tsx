'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import type { TrainingProfile, ReportType } from '@/types'
import { cn } from '@/lib/utils'
import {
  CheckmarkCircle01Icon,
  UserCircleIcon,
  BuildingIcon,
  Settings01Icon,
  Building01Icon,
  Key01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const DAY_OPTIONS = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Fr' },
]

function generateId(): string {
  return crypto.randomUUID()
}

interface StepIndicatorProps {
  steps: string[]
  current: number
}

function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
              i < current
                ? 'bg-primary text-primary-foreground'
                : i === current
                  ? 'bg-primary/20 text-primary ring-2 ring-primary'
                  : 'bg-muted text-muted-foreground'
            )}>
              {i < current ? (
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
              ) : (
                i + 1
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium whitespace-nowrap',
              i === current ? 'text-primary' : 'text-muted-foreground'
            )}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'h-px w-10 mb-5 transition-colors',
              i < current ? 'bg-primary' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

interface PublicCompany {
  id: string
  name: string
  logo_url: string | null
  accent_color: string
}

export default function ProfilSetupPage() {
  const router = useRouter()
  const { saveProfile } = useProfile()
  const { completeSetup } = useAuth()
  const [step, setStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // Step 0: Personal data
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')

  // Step 1: Company selection (optional)
  const [companies, setCompanies] = useState<PublicCompany[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null)
  const [joinCodeVerifying, setJoinCodeVerifying] = useState(false)
  const [joinCodeVerified, setJoinCodeVerified] = useState(false)

  // Step 2: Training data
  const [occupation, setOccupation] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [department, setDepartment] = useState('')
  const [trainingStart, setTrainingStart] = useState('')
  const [trainingEnd, setTrainingEnd] = useState('')
  const [currentYear, setCurrentYear] = useState('1')

  // Step 3: Settings
  const [reportType, setReportType] = useState<ReportType>('weekly')
  const [weeklyHours, setWeeklyHours] = useState('40')
  const [schoolDays, setSchoolDays] = useState<number[]>([1, 2])
  const [schoolHoursPerDay, setSchoolHoursPerDay] = useState('8')

  const steps = ['Persönliche Daten', 'Unternehmen', 'Ausbildungsdaten', 'Einstellungen']

  // Load companies when entering step 1
  useEffect(() => {
    if (step === 1 && companies.length === 0 && !companiesLoading) {
      setCompaniesLoading(true)
      fetch('/api/companies/public')
        .then(r => r.ok ? r.json() : { companies: [] })
        .then(json => setCompanies(json.companies ?? []))
        .catch(() => { /* ignore */ })
        .finally(() => setCompaniesLoading(false))
    }
  }, [step, companies.length, companiesLoading])

  function toggleSchoolDay(day: number) {
    setSchoolDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function selectCompany(id: string) {
    if (selectedCompanyId === id) {
      // Deselect
      setSelectedCompanyId(null)
      setJoinCode('')
      setJoinCodeError(null)
      setJoinCodeVerified(false)
    } else {
      setSelectedCompanyId(id)
      setJoinCode('')
      setJoinCodeError(null)
      setJoinCodeVerified(false)
      // Auto-fill company name
      const c = companies.find(c => c.id === id)
      if (c) setCompanyName(c.name)
    }
  }

  async function verifyJoinCode() {
    if (!selectedCompanyId || !joinCode.trim()) return
    setJoinCodeVerifying(true)
    setJoinCodeError(null)
    try {
      const res = await fetch('/api/companies/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompanyId, joinCode: joinCode.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setJoinCodeVerified(true)
        setJoinCodeError(null)
      } else {
        setJoinCodeError(json.error ?? 'Ungültiger Code')
        setJoinCodeVerified(false)
      }
    } catch {
      setJoinCodeError('Verbindungsfehler')
    } finally {
      setJoinCodeVerifying(false)
    }
  }

  function canProceed(): boolean {
    if (step === 0) return firstName.trim() !== '' && lastName.trim() !== '' && birthDate !== ''
    if (step === 1) {
      // Company step is optional — if company selected, must verify code first
      if (selectedCompanyId) return joinCodeVerified
      return true // No company selected → skip
    }
    if (step === 2) return occupation.trim() !== '' && companyName.trim() !== '' && trainerName.trim() !== '' && trainingStart !== '' && trainingEnd !== ''
    return true
  }

  async function handleFinish() {
    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const profile: TrainingProfile = {
        id: generateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        occupation: occupation.trim(),
        companyName: companyName.trim(),
        trainerName: trainerName.trim(),
        department: department.trim() || undefined,
        trainingStart,
        trainingEnd,
        currentYear: parseInt(currentYear) || 1,
        reportType,
        weeklyHours: parseFloat(weeklyHours) || 40,
        schoolDays,
        schoolHoursPerDay: parseFloat(schoolHoursPerDay) || 8,
        role: 'apprentice',
        createdAt: now,
        updatedAt: now,
        companyId: (joinCodeVerified && selectedCompanyId) ? selectedCompanyId : undefined,
      }
      await saveProfile(profile)
      await completeSetup()
      router.push('/')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 min-h-full">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-primary font-bold text-xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Profil einrichten</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Richte dein Ausbildungsprofil ein, um loszulegen
          </p>
        </div>

        <StepIndicator steps={steps} current={step} />

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            {/* Step 0: Personal Data */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <HugeiconsIcon icon={UserCircleIcon} size={18} className="text-primary" />
                  <h2 className="font-semibold text-foreground">Persönliche Daten</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Max"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Mustermann"
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Geburtsdatum *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Company Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <HugeiconsIcon icon={Building01Icon} size={18} className="text-primary" />
                  <h2 className="font-semibold text-foreground">Unternehmen beitreten</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Optional — du kannst diesen Schritt überspringen und später beitreten.
                </p>

                {companiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Noch keine Unternehmen registriert.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {companies.map(c => {
                      const isSelected = selectedCompanyId === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCompany(c.id)}
                          className={cn(
                            'w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all',
                            isSelected
                              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                              : 'border-border hover:bg-muted/50'
                          )}
                        >
                          {c.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.logo_url}
                              alt={c.name}
                              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'hsl(var(--muted))', flexShrink: 0 }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: c.accent_color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, fontSize: '0.875rem',
                            }}>
                              {c.name[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="flex-1 text-sm font-medium text-foreground truncate">{c.name}</span>
                          {isSelected && (
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedCompanyId && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label htmlFor="joinCode" className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Key01Icon} size={14} className="text-muted-foreground" />
                      Beitrittscode eingeben
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="joinCode"
                        value={joinCode}
                        onChange={e => {
                          setJoinCode(e.target.value.toUpperCase())
                          setJoinCodeVerified(false)
                          setJoinCodeError(null)
                        }}
                        placeholder="z.B. AZUBI2024"
                        className={cn(
                          'bg-input border-border font-mono tracking-widest flex-1',
                          joinCodeVerified && 'border-green-500/50 bg-green-500/5',
                          joinCodeError && 'border-red-500/50 bg-red-500/5',
                        )}
                        maxLength={20}
                        disabled={joinCodeVerified}
                      />
                      {joinCodeVerified ? (
                        <div className="flex items-center gap-1.5 px-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm font-medium">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                          Bestätigt
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={verifyJoinCode}
                          disabled={!joinCode.trim() || joinCodeVerifying}
                          className="h-10"
                        >
                          {joinCodeVerifying ? (
                            <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                          )}
                        </Button>
                      )}
                    </div>
                    {joinCodeError && (
                      <p className="text-xs text-destructive">{joinCodeError}</p>
                    )}
                    {joinCodeVerified && (
                      <p className="text-xs text-green-600">
                        Code korrekt! Du wirst diesem Unternehmen zugewiesen.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Training Data */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <HugeiconsIcon icon={BuildingIcon} size={18} className="text-primary" />
                  <h2 className="font-semibold text-foreground">Ausbildungsdaten</h2>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="occupation">Ausbildungsberuf *</Label>
                  <Input
                    id="occupation"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    placeholder="z.B. Fachinformatiker/in für Anwendungsentwicklung"
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Ausbildungsbetrieb *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Muster GmbH"
                    className="bg-input border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="trainerName">Ausbilder/in *</Label>
                    <Input
                      id="trainerName"
                      value={trainerName}
                      onChange={e => setTrainerName(e.target.value)}
                      placeholder="Frau Beispiel"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="department">Abteilung</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="IT-Abteilung"
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="trainingStart">Ausbildungsbeginn *</Label>
                    <Input
                      id="trainingStart"
                      type="date"
                      value={trainingStart}
                      onChange={e => setTrainingStart(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trainingEnd">Ausbildungsende *</Label>
                    <Input
                      id="trainingEnd"
                      type="date"
                      value={trainingEnd}
                      onChange={e => setTrainingEnd(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currentYear">Aktuelles Ausbildungsjahr</Label>
                  <Input
                    id="currentYear"
                    type="number"
                    min={1}
                    max={4}
                    value={currentYear}
                    onChange={e => setCurrentYear(e.target.value)}
                    className="bg-input border-border w-24"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <HugeiconsIcon icon={Settings01Icon} size={18} className="text-primary" />
                  <h2 className="font-semibold text-foreground">Einstellungen</h2>
                </div>

                <div className="space-y-2">
                  <Label>Berichtshefttyp</Label>
                  <RadioGroup
                    value={reportType}
                    onValueChange={v => setReportType(v as ReportType)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="cursor-pointer font-normal">Wöchentlich</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="cursor-pointer font-normal">Täglich</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weeklyHours">Wochenstunden</Label>
                  <Input
                    id="weeklyHours"
                    type="number"
                    min={1}
                    max={60}
                    value={weeklyHours}
                    onChange={e => setWeeklyHours(e.target.value)}
                    className="bg-input border-border w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Berufsschultage</Label>
                  <div className="flex gap-2">
                    {DAY_OPTIONS.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleSchoolDay(day.value)}
                        className={cn(
                          'size-10 rounded-lg text-xs font-medium transition-all border',
                          schoolDays.includes(day.value)
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="schoolHours">Stunden pro Berufsschultag</Label>
                  <Input
                    id="schoolHours"
                    type="number"
                    min={1}
                    max={12}
                    value={schoolHoursPerDay}
                    onChange={e => setSchoolHoursPerDay(e.target.value)}
                    className="bg-input border-border w-24"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            Zurück
          </Button>
          {step < steps.length - 1 ? (
            <div className="flex items-center gap-2">
              {step === 1 && !selectedCompanyId && (
                <Button
                  variant="ghost"
                  onClick={() => setStep(s => s + 1)}
                  className="text-muted-foreground text-sm"
                >
                  Überspringen
                </Button>
              )}
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Weiter
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSaving}
            >
              {isSaving ? 'Wird gespeichert...' : 'Fertigstellen'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
