"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { SidebarCollaboratorAvatars } from "@/components/collaboration/sidebar-collaborator-avatars"
import { useCollaboration } from "@/contexts/collaboration-context"

export interface NavItem {
  title: string
  url: string
  icon?: Icon
  badge?: number
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export function NavMain({
  groups,
  unreadCount = 0,
}: {
  groups: NavGroup[]
  unreadCount?: number
}) {
  const pathname = usePathname()
  const { collaboratorsByPath } = useCollaboration()

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={group.label || groupIndex}>
          {group.label && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                // Marcar como ativo apenas se for correspondência exata (não incluir subrotas)
                const isActive = pathname === item.url
                const isTeamPage = item.title === "Equipe"
                const collaboratorsOnThisPage = collaboratorsByPath[item.url] || []
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url} className="relative flex w-full items-center gap-2">
                        {item.icon && <item.icon />}
                        <span className="flex-1 text-left">{item.title}</span>
                        
                        {/* Badge de mensagens não lidas */}
                        {isTeamPage && unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 shrink-0 rounded-full px-1.5 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                        
                        {/* Avatares dos colaboradores nessa página */}
                        {collaboratorsOnThisPage.length > 0 && (
                          <SidebarCollaboratorAvatars 
                            collaborators={collaboratorsOnThisPage}
                            maxVisible={2}
                            size="sm"
                            className="shrink-0"
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
