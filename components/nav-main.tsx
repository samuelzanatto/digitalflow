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
                // Marcar como ativo: correspondência exata OU subrota (apenas se não for /dashboard raiz)
                const isExactMatch = pathname === item.url
                const isSubRoute = item.url !== "/dashboard" && pathname.startsWith(item.url + "/")
                const isActive = isExactMatch || isSubRoute
                const isTeamPage = item.title === "Equipe"
                
                // Pegar colaboradores da página atual e de suas subrotas (exceto /dashboard raiz)
                const collaboratorsOnThisPage = Object.entries(collaboratorsByPath)
                  .filter(([path]) => {
                    if (item.url === "/dashboard") {
                      // Para o Dashboard, só mostrar se estiver exatamente em /dashboard
                      return path === item.url
                    }
                    return path === item.url || path.startsWith(item.url + "/")
                  })
                  .flatMap(([, collabs]) => collabs)
                  // Remover duplicatas pelo ID
                  .filter((collab, index, self) => 
                    index === self.findIndex(c => c.id === collab.id)
                  )
                
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
