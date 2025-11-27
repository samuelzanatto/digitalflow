"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconMessage,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconLayout,
  IconPlug,
  IconRobotFace,
  IconProgressHelp,
  IconRouteSquare2,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OnlineAvatarGroup } from "@/components/online-avatar-group"
import { useUnreadMessages } from "@/contexts/unread-messages"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Páginas",
      url: "/dashboard/paginas",
      icon: IconLayout,
    },
    {
      title: "Flows",
      url: "/dashboard/flows",
      icon: IconRouteSquare2,
    },
    {
      title: "Automações",
      url: "/dashboard/automacoes",
      icon: IconRobotFace,
    },
    {
      title: "Chat",
      url: "/dashboard/chat",
      icon: IconMessage,
    },
    {
      title: "Equipe",
      url: "/dashboard/equipe",
      icon: IconUsersGroup,
    },
    {
      title: "Leads",
      url: "/dashboard/leads",
      icon: IconUsers,
    },
    {
      title: "Pipeline",
      url: "/dashboard/pipeline",
      icon: IconChartBar,
    },
    {
      title: "Clientes",
      url: "/dashboard/clientes",
      icon: IconDatabase,
    },
    {
      title: "Perguntas",
      url: "/dashboard/perguntas",
      icon: IconProgressHelp,
    },
    {
      title: "Integrações",
      url: "/dashboard/integracoes",
      icon: IconPlug,
    },
  ],
  navSecondary: [
    {
      title: "Análise & Feedback",
      url: "/dashboard/analise",
      icon: IconSearch,
    },
    {
      title: "Configurações",
      url: "/dashboard/configuracoes",
      icon: IconSettings,
    },
    {
      title: "Usuários",
      url: "/dashboard/usuarios",
      icon: IconUsers,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { unreadCount } = useUnreadMessages()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5! shrink-0"
              >
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Flow Logo"
                    width={32}
                    height={32}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-base font-semibold">flow</span>
                </Link>
              </SidebarMenuButton>
              <OnlineAvatarGroup className="absolute ml-56" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} unreadCount={unreadCount} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
