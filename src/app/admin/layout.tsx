'use client'
import * as React from 'react'
import DashboardLayout, { NavSection } from '@/components/dashboard-layout'
import {
  UserGroup02Icon, Analytics01Icon, Audit01Icon,
  Settings01Icon, Database01Icon, Crown02Icon, GridViewIcon,
} from '@hugeicons/core-free-icons'

const sections: NavSection[] = [
  {
    title: 'Admin-Bereich',
    items: [
      { label: 'Benutzer',     href: '/admin/users',     icon: UserGroup02Icon, adminOnly: true },
      { label: 'Analytics',   href: '/admin/analytics', icon: Analytics01Icon, adminOnly: true },
      { label: 'Audit-Log',   href: '/admin/audit',     icon: Audit01Icon,     adminOnly: true },
      { label: 'Rollen & Rechte', href: '/admin/roles', icon: Crown02Icon,     adminOnly: true },
      { label: 'System',      href: '/admin/settings',  icon: Settings01Icon,  adminOnly: true },
      { label: 'Datenbank',   href: '/admin/data',      icon: Database01Icon,  adminOnly: true },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { label: 'Zur Übersicht', href: '/', icon: GridViewIcon },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout sections={sections} subtitle="Admin-Panel">
      {children}
    </DashboardLayout>
  )
}
