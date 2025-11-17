"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

export function NavMain({
  items,
  unreadCount = 0,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
  unreadCount?: number
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            // Marcar como ativo apenas se for correspondência exata (não incluir subrotas)
            const isActive = pathname === item.url
            const isTeamPage = item.title === "Equipe"
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link href={item.url} className="relative flex w-full items-center gap-2 pr-6">
                    {item.icon && <item.icon />}
                    <span className="flex-1 text-left">{item.title}</span>
                    {isTeamPage && unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 transform rounded-full p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
