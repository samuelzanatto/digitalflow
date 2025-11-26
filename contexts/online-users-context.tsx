"use client"

import { createContext, useContext, useEffect, useState, useMemo, useRef, type ReactNode } from "react"
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"

export type OnlineUser = {
  id: string
  name: string
  email?: string
  avatarUrl?: string | null
}

type OnlineUsersContextType = {
  onlineUsers: OnlineUser[]
  isConnected: boolean
}

const OnlineUsersContext = createContext<OnlineUsersContextType | null>(null)

export function OnlineUsersProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const supabaseRef = useRef<SupabaseBrowserClient | null>(null)

  const getSupabaseClient = () => {
    if (supabaseRef.current) return supabaseRef.current
    if (typeof window === "undefined") return null
    supabaseRef.current = createSupabaseBrowserClient()
    return supabaseRef.current
  }

  useEffect(() => {
    if (!user) return
    
    const client = getSupabaseClient()
    if (!client) return

    const channel = client.channel("global_online_presence", {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel.on("presence", { event: "sync" }, () => {
      type PresencePayload = OnlineUser & { presence_ref: string }
      const state = channel.presenceState<PresencePayload>()
      const unique = new Map<string, OnlineUser>()

      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.id) {
            unique.set(entry.id, {
              id: entry.id,
              name: entry.name,
              email: entry.email,
              avatarUrl: entry.avatarUrl,
            })
          }
        })
      })

      setOnlineUsers(Array.from(unique.values()))
    })

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true)
        void channel.track({
          id: user.id,
          name: user.full_name || user.email?.split("@")[0] || "Usuário",
          email: user.email,
          avatarUrl: user.avatar_url ?? undefined,
        })
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false)
      }
    })

    return () => {
      void client.removeChannel(channel)
    }
  }, [user])

  // Atualiza a presença quando o avatar do usuário muda
  useEffect(() => {
    if (!user || !isConnected) return
    
    const client = getSupabaseClient()
    if (!client) return

    const channel = client.channel("global_online_presence")
    
    // Re-track com dados atualizados
    void channel.track({
      id: user.id,
      name: user.full_name || user.email?.split("@")[0] || "Usuário",
      email: user.email,
      avatarUrl: user.avatar_url ?? undefined,
    })
  }, [user?.avatar_url, user?.full_name, user, isConnected])

  const value = useMemo(() => ({
    onlineUsers,
    isConnected,
  }), [onlineUsers, isConnected])

  return (
    <OnlineUsersContext.Provider value={value}>
      {children}
    </OnlineUsersContext.Provider>
  )
}

export function useOnlineUsers() {
  const context = useContext(OnlineUsersContext)
  if (!context) {
    throw new Error("useOnlineUsers must be used within an OnlineUsersProvider")
  }
  return context
}
