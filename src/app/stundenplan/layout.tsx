'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/AuthContext'
import { CalendarIcon, GridViewIcon, Logout01Icon, CheckmarkBadge01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useProfile()
  const { logout } = useAuth()

  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : 'AZ'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => router.push('/stundenplan')} className="cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/App Icon.png" alt="AzubiHub" width={28} height={28} style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">AzubiHub</span>
                <span className="truncate text-xs text-muted-foreground">Stundenplan</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/stundenplan')}
                  isActive={pathname === '/stundenplan'}
                  tooltip="Wochenplan"
                  className="cursor-pointer"
                >
                  <HugeiconsIcon icon={CalendarIcon} size={16} />
                  <span>Wochenplan</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {profile?.role === 'trainer' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push('/stundenplan/ausbilder')}
                    isActive={pathname.startsWith('/stundenplan/ausbilder')}
                    tooltip="Ausbilder-Bereich"
                    className="cursor-pointer text-primary"
                  >
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} />
                    <span>Ausbilder-Bereich</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Allgemein</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/')} tooltip="Zur Übersicht" className="cursor-pointer">
                  <HugeiconsIcon icon={GridViewIcon} size={16} />
                  <span>Zur Übersicht</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => logout()}
                  tooltip="Abmelden"
                  className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} />
                  <span>Abmelden</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-pointer">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground">
                  {profile ? `${profile.firstName} ${profile.lastName}` : 'Kein Profil'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {profile?.occupation ?? 'Profil einrichten'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function StundenplanLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={CalendarIcon} size={14} />
              <span>Stundenplan</span>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
