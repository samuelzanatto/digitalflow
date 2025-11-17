"use client"

import { useEffect, useMemo, useState } from "react"
import { IconDotsVertical, IconLogout } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from "@/lib/supabase/client"

type SidebarUser = {
  name: string
  email?: string
  avatar?: string
}

const deriveDisplayUser = (user: SidebarUser | null): SidebarUser => {
  if (user) {
    return user
  }
  return {
    name: "Carregando...",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  }
}

const buildUserFromSession = (sessionUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
} | null): SidebarUser | null => {
  if (!sessionUser) return null
  const metadata = sessionUser.user_metadata ?? {}
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : undefined
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined
  const fallbackName = sessionUser.email?.split("@")[0] ?? "Usuário Flow"

  return {
    name: fullName?.trim() || fallbackName,
    email: sessionUser.email,
    avatar: avatarUrl,
  }
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = useMemo<SupabaseBrowserClient | null>(() => {
    if (typeof window === "undefined") {
      return null
    }
    return createSupabaseBrowserClient()
  }, [])
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isMounted = true

    const hydrate = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (isMounted) {
        setCurrentUser(buildUserFromSession(user))
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(buildUserFromSession(session?.user ?? null))
    })

    void hydrate()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    if (!supabase) return
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
    setSigningOut(false)
  }

  const sidebarUser = deriveDisplayUser(currentUser)
  const initials = sidebarUser.name
    .split(" ")
    .map((piece) => piece[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const subtitle = sidebarUser.email ?? "conta@flow.app"

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
                  <AvatarImage src={sidebarUser.avatar || "/avatars/shadcn.jpg"} alt={sidebarUser.name} />
                  <AvatarFallback className="rounded-lg">{initials || "FL"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{sidebarUser.name}</span>
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
                    <AvatarImage src={sidebarUser.avatar || "/avatars/shadcn.jpg"} alt={sidebarUser.name} />
                    <AvatarFallback className="rounded-lg">{initials || "FL"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{sidebarUser.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
