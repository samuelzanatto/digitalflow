"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileWord,
  IconCalendar,
  IconMessage,
  IconReport,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconUsers,
  IconQuestionMark,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  user: {
    name: "Gestor Flow",
    email: "gestor@flow.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Chat",
      url: "/dashboard/chat",
      icon: IconMessage,
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
      title: "Agendamentos",
      url: "/dashboard/agendamentos",
      icon: IconCalendar,
    },
    {
      title: "Clientes",
      url: "/dashboard/clientes",
      icon: IconDatabase,
    },
    {
      title: "Perguntas",
      url: "/dashboard/perguntas",
      icon: IconQuestionMark,
    },
  ],
  navClouds: [],
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
  ],
  documents: [
    {
      name: "Relatórios",
      url: "/dashboard/relatorios",
      icon: IconReport,
    },
    {
      name: "Tarefas",
      url: "/dashboard/tarefas",
      icon: IconListDetails,
    },
    {
      name: "Automações",
      url: "/dashboard/automacoes",
      icon: IconFileAi,
    },
    {
      name: "Documentos",
      url: "/dashboard/documentos",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
