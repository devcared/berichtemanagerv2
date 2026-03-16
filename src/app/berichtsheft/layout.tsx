'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useProfile } from '@/hooks/use-profile'
import {
  HomeIcon,
  CalendarIcon,
  AnalyticsUpIcon,
  UserCircleIcon,
  GridViewIcon,
  BookOpenIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
}

const navMain: NavItem[] = [
  { label: 'Dashboard', href: '/berichtsheft', icon: HomeIcon },
  { label: 'Kalender', href: '/berichtsheft/kalender', icon: CalendarIcon },
  { label: 'Statistiken', href: '/berichtsheft/statistiken', icon: AnalyticsUpIcon },
]

const navSettings: NavItem[] = [
  { label: 'Profil', href: '/berichtsheft/profil', icon: UserCircleIcon },
  { label: 'Zurück zur Übersicht', href: '/', icon: GridViewIcon },
]

function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useProfile()

  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : 'AZ'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => router.push('/berichtsheft')}
              className="cursor-pointer"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm shrink-0">
                A
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">AzubiHub</span>
                <span className="truncate text-xs text-muted-foreground">Berichtsheft</span>
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
              {navMain.map((item) => {
                const isActive = item.href === '/berichtsheft'
                  ? pathname === '/berichtsheft'
                  : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      isActive={isActive}
                      tooltip={item.label}
                      className="cursor-pointer"
                    >
                      <HugeiconsIcon icon={item.icon} size={16} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSettings.map((item) => {
                const isActive = pathname.startsWith(item.href) && item.href !== '/'
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      isActive={isActive}
                      tooltip={item.label}
                      className="cursor-pointer"
                    >
                      <HugeiconsIcon icon={item.icon} size={16} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => router.push('/berichtsheft/profil')}
              className="cursor-pointer"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
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

export default function BerichtsheftLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon icon={BookOpenIcon} size={14} />
            <span>Berichtsheft-Manager</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  )
}
