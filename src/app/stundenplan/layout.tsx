'use client'

import * as React from 'react'
import DashboardLayout, { NavSection } from '@/components/dashboard-layout'
import { CalendarIcon, GridViewIcon, CheckmarkBadge01Icon } from '@hugeicons/core-free-icons'

const sections: NavSection[] = [
  {
    title: 'Navigation',
    items: [
      { label: 'Wochenplan',        href: '/stundenplan',           icon: CalendarIcon },
      { label: 'Ausbilder-Bereich', href: '/stundenplan/ausbilder', icon: CheckmarkBadge01Icon, trainerOnly: true },
    ],
  },
  {
    title: 'Allgemein',
    items: [
      { label: 'Zur Übersicht', href: '/', icon: GridViewIcon },
    ],
  },
]

export default function StundenplanLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sections={sections} subtitle="Stundenplan">
      {children}
    </DashboardLayout>
  )
}
