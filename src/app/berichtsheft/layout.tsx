'use client'

import * as React from 'react'
import DashboardLayout, { NavSection } from '@/components/dashboard-layout'
import {
  HomeIcon, CalendarIcon, AnalyticsUpIcon,
  UserCircleIcon, GridViewIcon, CheckmarkBadge01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'

const sections: NavSection[] = [
  {
    title: 'Navigation',
    items: [
      { label: 'Dashboard',       href: '/berichtsheft',            icon: HomeIcon },
      { label: 'Kalender',        href: '/berichtsheft/kalender',   icon: CalendarIcon },
      { label: 'Statistiken',     href: '/berichtsheft/statistiken', icon: AnalyticsUpIcon },
      { label: 'Ausbilder-Bereich', href: '/berichtsheft/ausbilder', icon: CheckmarkBadge01Icon, trainerOnly: true },
    ],
  },
  {
    title: 'Einstellungen',
    items: [
      { label: 'Profil',            href: '/berichtsheft/profil', icon: UserCircleIcon },
      { label: 'Admin-Panel',       href: '/admin',               icon: Shield01Icon, adminOnly: true },
      { label: 'Zur Übersicht',     href: '/',                    icon: GridViewIcon },
    ],
  },
]

export default function BerichtsheftLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sections={sections} subtitle="Berichtsheft-Manager">
      {children}
    </DashboardLayout>
  )
}
