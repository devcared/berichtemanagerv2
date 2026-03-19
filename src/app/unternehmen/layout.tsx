'use client'
import * as React from 'react'
import DashboardLayout, { NavSection } from '@/components/dashboard-layout'
import {
  MessageMultiple01Icon, CalendarCheckIn01Icon,
  StarAward01Icon, UserGroup02Icon, GridViewIcon,
  Building01Icon,
} from '@hugeicons/core-free-icons'

const sections: NavSection[] = [
  {
    title: 'Mein Unternehmen',
    items: [
      { label: 'Chat',          href: '/unternehmen/chat',          icon: MessageMultiple01Icon },
      { label: 'Rotationsplan', href: '/unternehmen/rotationsplan', icon: CalendarCheckIn01Icon },
      { label: 'Mein Feedback', href: '/unternehmen/feedback',      icon: StarAward01Icon },
      { label: 'Meine Ausbilder', href: '/unternehmen/ausbilder',   icon: UserGroup02Icon },
    ],
  },
  {
    title: 'Ausbilder-Tools',
    items: [
      { label: 'Rotationen verwalten', href: '/unternehmen/rotationen-verwalten', icon: CalendarCheckIn01Icon, trainerOnly: true },
      { label: 'Feedback geben',       href: '/unternehmen/feedback-geben',       icon: StarAward01Icon,        trainerOnly: true },
      { label: 'Ausbilder-Zuordnung',  href: '/unternehmen/ausbilder-zuordnung',  icon: Building01Icon,         adminOnly: true },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { label: 'Zur Übersicht', href: '/', icon: GridViewIcon },
    ],
  },
]

export default function UnternehmenLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sections={sections} subtitle="Mein Unternehmen">
      {children}
    </DashboardLayout>
  )
}
