"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconMessage,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconLayout,
  IconPlug,
  IconRobotFace,
  IconProgressHelp,
  IconRouteSquare2,
  IconTargetArrow,
  IconBrandHipchat,
  IconBrandGithubCopilot,
  IconSparkles,
  IconMap,
} from "@tabler/icons-react"

import { NavMain, type NavGroup } from "@/components/nav-main"
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
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navGroups: NavGroup[] = [
  {
    // Grupo principal sem label
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
    ],
  },
  {
    label: "CRM",
    items: [
      {
        title: "Pipeline",
        url: "/dashboard/pipeline",
        icon: IconTargetArrow,
      },
      {
        title: "Leads",
        url: "/dashboard/leads",
        icon: IconUsers,
      },
    ],
  },
  {
    label: "Produção",
    items: [
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
        title: "IA Flow",
        url: "/dashboard/ia",
        icon: IconBrandGithubCopilot,
      },
    ],
  },
  {
    label: "Comunicação",
    items: [
      {
        title: "Chat",
        url: "/dashboard/chat",
        icon: IconBrandHipchat,
      },
      {
        title: "Equipe",
        url: "/dashboard/equipe",
        icon: IconMessage,
      },
    ],
  },
  {
    label: "Dados",
    items: [
      {
        title: "Análise",
        url: "/dashboard/analise",
        icon: IconChartBar,
      },
      {
        title: "Mapa",
        url: "/dashboard/mapa",
        icon: IconMap,
      },
      {
        title: "Integrações",
        url: "/dashboard/integracoes",
        icon: IconPlug,
      },
      {
        title: "Perguntas",
        url: "/dashboard/perguntas",
        icon: IconProgressHelp,
      },
    ],
  },
]

const navSecondary = [
  {
    title: "Configurações",
    url: "/dashboard/configuracoes",
    icon: IconSettings,
  },
  {
    title: "Usuários",
    url: "/dashboard/usuarios",
    icon: IconUsersGroup,
    adminOnly: true,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { unreadCount } = useUnreadMessages()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-1.5 py-1.5">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="Flow Logo"
                  width={32}
                  height={32}
                  className="w-6 h-6 object-contain"
                />
                <span className="text-base font-semibold">flow</span>
              </Link>
              <OnlineAvatarGroup maxAvatars={3} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} unreadCount={unreadCount} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
