/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useProfile } from '@/hooks/use-profile'
import type { TrainingProfile, ReportType } from '@/types'
import { cn } from '@/lib/utils'
import {
  UserCircleIcon,
  BuildingIcon,
  Settings01Icon,
  FloppyDiskIcon,
  Add01Icon,
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

export default function ProfilPage() {
  const router = useRouter()
  const { profile, saveProfile, loading } = useProfile()
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Personal data
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')

  // Training data
  const [occupation, setOccupation] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [department, setDepartment] = useState('')
  const [trainingStart, setTrainingStart] = useState('')
  const [trainingEnd, setTrainingEnd] = useState('')
  const [currentYear, setCurrentYear] = useState('1')

  // Settings
  const [reportType, setReportType] = useState<ReportType>('weekly')
  const [weeklyHours, setWeeklyHours] = useState('40')
  const [schoolDays, setSchoolDays] = useState<number[]>([1, 2])
  const [schoolHoursPerDay, setSchoolHoursPerDay] = useState('8')

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName)
      setLastName(profile.lastName)
      setBirthDate(profile.birthDate ?? '')
      setOccupation(profile.occupation)
      setCompanyName(profile.companyName)
      setTrainerName(profile.trainerName)
      setDepartment(profile.department ?? '')
      setTrainingStart(profile.trainingStart)
      setTrainingEnd(profile.trainingEnd)
      setCurrentYear(String(profile.currentYear))
      setReportType(profile.reportType)
      setWeeklyHours(String(profile.weeklyHours))
      setSchoolDays(profile.schoolDays)
      setSchoolHoursPerDay(String(profile.schoolHoursPerDay))
    }
  }, [profile])

  function toggleSchoolDay(day: number) {
    setSchoolDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const updatedProfile: TrainingProfile = {
        id: profile?.id ?? generateId(),
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
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
      }
      await saveProfile(updatedProfile)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <p className="text-muted-foreground text-sm">Lade Profil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 gap-4">
        <p className="text-muted-foreground text-sm">Noch kein Profil vorhanden.</p>
        <Button onClick={() => router.push('/setup')}>
          <HugeiconsIcon icon={Add01Icon} size={16} data-icon="inline-start" />
          Profil einrichten
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 gap-6 p-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deine Ausbildungsdaten</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <HugeiconsIcon icon={FloppyDiskIcon} size={16} data-icon="inline-start" />
          {isSaving ? 'Speichert...' : savedSuccess ? 'Gespeichert ✓' : 'Speichern'}
        </Button>
      </div>

      {/* Personal Data */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <HugeiconsIcon icon={UserCircleIcon} size={14} />
            Persönliche Daten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-firstName">Vorname</Label>
              <Input
                id="edit-firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lastName">Nachname</Label>
              <Input
                id="edit-lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="bg-input border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-birthDate">Geburtsdatum</Label>
            <Input
              id="edit-birthDate"
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Training Data */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <HugeiconsIcon icon={BuildingIcon} size={14} />
            Ausbildungsdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-occupation">Ausbildungsberuf</Label>
            <Input
              id="edit-occupation"
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-company">Ausbildungsbetrieb</Label>
            <Input
              id="edit-company"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-trainer">Ausbilder/in</Label>
              <Input
                id="edit-trainer"
                value={trainerName}
                onChange={e => setTrainerName(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-dept">Abteilung</Label>
              <Input
                id="edit-dept"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="bg-input border-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-start">Ausbildungsbeginn</Label>
              <Input
                id="edit-start"
                type="date"
                value={trainingStart}
                onChange={e => setTrainingStart(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-end">Ausbildungsende</Label>
              <Input
                id="edit-end"
                type="date"
                value={trainingEnd}
                onChange={e => setTrainingEnd(e.target.value)}
                className="bg-input border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-year">Aktuelles Ausbildungsjahr</Label>
            <Input
              id="edit-year"
              type="number"
              min={1}
              max={4}
              value={currentYear}
              onChange={e => setCurrentYear(e.target.value)}
              className="bg-input border-border w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <HugeiconsIcon icon={Settings01Icon} size={14} />
            Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Berichtshefttyp</Label>
            <RadioGroup
              value={reportType}
              onValueChange={v => setReportType(v as ReportType)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="weekly" id="edit-weekly" />
                <Label htmlFor="edit-weekly" className="cursor-pointer font-normal">Wöchentlich</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="daily" id="edit-daily" />
                <Label htmlFor="edit-daily" className="cursor-pointer font-normal">Täglich</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-hours">Wochenstunden</Label>
            <Input
              id="edit-hours"
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
            <Label htmlFor="edit-schoolhours">Stunden pro Berufsschultag</Label>
            <Input
              id="edit-schoolhours"
              type="number"
              min={1}
              max={12}
              value={schoolHoursPerDay}
              onChange={e => setSchoolHoursPerDay(e.target.value)}
              className="bg-input border-border w-24"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <HugeiconsIcon icon={FloppyDiskIcon} size={16} data-icon="inline-start" />
          {isSaving ? 'Speichert...' : savedSuccess ? 'Gespeichert ✓' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>
  )
}
