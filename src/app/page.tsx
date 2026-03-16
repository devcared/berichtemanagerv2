'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/use-profile'
import type { AppModule } from '@/types'
import {
  BookOpenIcon,
  CheckListIcon,
  CalendarIcon,
  GridViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const modules: AppModule[] = [
  {
    id: 'berichtsheft',
    title: 'Berichtsheft-Manager',
    description: 'Verwalte und exportiere deine Ausbildungsnachweise',
    icon: 'BookOpenIcon',
    accentColor: '#3B82F6',
    routePath: '/berichtsheft',
    isEnabled: true,
    lastUsed: new Date().toISOString(),
  },
  {
    id: 'lernfeld',
    title: 'Lernfeld-Tracker',
    description: 'Behalte den Überblick über deine Lernfelder',
    icon: 'CheckListIcon',
    accentColor: '#10B981',
    routePath: '/lernfeld',
    isEnabled: false,
  },
  {
    id: 'pruefung',
    title: 'Prüfungsvorbereitung',
    description: 'Bereite dich auf deine Prüfungen vor',
    icon: 'GridViewIcon',
    accentColor: '#F59E0B',
    routePath: '/pruefung',
    isEnabled: false,
  },
  {
    id: 'stundenplan',
    title: 'Stundenplan',
    description: 'Dein Berufsschul- und Betriebsplan',
    icon: 'CalendarIcon',
    accentColor: '#8B5CF6',
    routePath: '/stundenplan',
    isEnabled: false,
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moduleIconMap: Record<string, any> = {
  BookOpenIcon,
  CheckListIcon,
  GridViewIcon,
  CalendarIcon,
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function HomePage() {
  const router = useRouter()
  const { profile } = useProfile()
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(format(new Date(), "EEEE, d. MMMM yyyy", { locale: de }))
  }, [])

  const greeting = `${getGreeting()}${profile ? `, ${profile.firstName}` : ''}!`

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">A</span>
            </div>
            <span className="text-muted-foreground text-sm font-medium tracking-wider uppercase">AzubiHub</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-4">{greeting}</h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>

        {/* Module Grid */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Module
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((mod) => {
              const IconComponent = moduleIconMap[mod.icon]
              return (
                <Card
                  key={mod.id}
                  onClick={() => mod.isEnabled && router.push(mod.routePath)}
                  className={cn(
                    'relative overflow-hidden border border-border bg-card transition-all duration-200',
                    mod.isEnabled
                      ? 'cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
                      : 'opacity-60 cursor-not-allowed'
                  )}
                  style={{
                    borderTop: `3px solid ${mod.accentColor}`,
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="size-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${mod.accentColor}20` }}
                      >
                        {IconComponent && (
                          <HugeiconsIcon
                            icon={IconComponent}
                            size={22}
                            style={{ color: mod.accentColor }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-base">{mod.title}</h3>
                          {!mod.isEnabled && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              Bald verfügbar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                        {mod.isEnabled && mod.lastUsed && (
                          <p className="text-xs text-muted-foreground/60 mt-2">
                            Zuletzt genutzt heute
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            AzubiHub · Dein persönlicher Ausbildungsassistent
          </p>
        </div>
      </div>
    </div>
  )
}
