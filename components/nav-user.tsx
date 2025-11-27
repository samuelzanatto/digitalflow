"use client"

import { useState } from "react"
import { IconDotsVertical, IconLogout, IconPalette, IconPointer, IconPointerOff } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import { useCollaboration } from "@/contexts/collaboration-context"
import { cn } from "@/lib/utils"

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { user, isLoading } = useUser()
  const { cursorsVisible, setCursorsVisible, isConnected, currentUserColor, setUserColor, availableColors } = useCollaboration()
  const [signingOut, setSigningOut] = useState(false)

  const handleLogout = async () => {
    if (typeof window === "undefined") return
    const supabase = createSupabaseBrowserClient()
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
    setSigningOut(false)
  }

  const displayName = user?.full_name?.trim() || user?.email?.split("@")[0] || (isLoading ? "Carregando..." : "Usuário Flow")
  const initials = displayName
    .split(" ")
    .map((piece) => piece[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const subtitle = user?.email ?? "conta@flow.app"
  const avatarUrl = user?.avatar_url

  return (
    <div suppressHydrationWarning>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{initials || "FL"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="rounded-lg">{initials || "FL"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isConnected && (
                <>
                  <DropdownMenuItem
                    className="flex items-center justify-between gap-3"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      {cursorsVisible ? (
                        <IconPointer className="h-4 w-4" />
                      ) : (
                        <IconPointerOff className="h-4 w-4 opacity-50" />
                      )}
                      <span className="text-sm">Cursores visíveis</span>
                    </div>
                    <Switch
                      checked={cursorsVisible}
                      onCheckedChange={setCursorsVisible}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <IconPalette className="h-4 w-4" />
                      <span className="text-sm">Cor do cursor</span>
                      <span
                        className="ml-15 h-4 w-4 rounded-full"
                        style={{ backgroundColor: currentUserColor }}
                      />
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-2">
                      <div className="grid grid-cols-5 gap-2">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setUserColor(color)}
                            className={cn(
                              "h-6 w-6 rounded-full transition-all hover:scale-110",
                              currentUserColor === color && "ring-2 ring-offset-2 ring-offset-background"
                            )}
                            style={{ 
                              backgroundColor: color,
                              // @ts-expect-error CSS custom property for ring color
                              "--tw-ring-color": color,
                            }}
                            title={`Selecionar ${color}`}
                          />
                        ))}
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} disabled={signingOut}>
                <IconLogout />
                {signingOut ? "Saindo..." : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  )
}
