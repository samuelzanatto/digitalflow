"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react"
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from "@/lib/supabase/client"

// Email do administrador raiz definido em variável de ambiente
const ROOT_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL || "admin@digitalflow.com").toLowerCase()

export type UserRole = "admin" | "user"

type UserData = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
}

type UserContextType = {
  user: UserData | null
  isLoading: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
  updateUserData: (data: Partial<Pick<UserData, "full_name" | "avatar_url">>) => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo<SupabaseBrowserClient | null>(() => {
    if (typeof window === "undefined") return null
    return createSupabaseBrowserClient()
  }, [])

  const buildUserData = useCallback((sessionUser: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  } | null): UserData | null => {
    if (!sessionUser) return null
    const metadata = sessionUser.user_metadata ?? {}
    const email = sessionUser.email || ""
    
    // Determina o role: admin se for o email root ou se tiver role="admin" no metadata
    const metadataRole = typeof metadata.role === "string" ? metadata.role : undefined
    const isRootAdmin = email.toLowerCase() === ROOT_ADMIN_EMAIL
    const role: UserRole = isRootAdmin || metadataRole === "admin" ? "admin" : "user"
    
    return {
      id: sessionUser.id,
      email,
      full_name: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
      avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
      role,
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!supabase) return
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(buildUserData(authUser))
  }, [supabase, buildUserData])

  // Atualiza dados localmente sem precisar buscar do servidor
  const updateUserData = useCallback((data: Partial<Pick<UserData, "full_name" | "avatar_url">>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }, [])

  // Verifica se o usuário é admin
  const isAdmin = useMemo(() => user?.role === "admin", [user?.role])

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    const hydrate = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (isMounted) {
        setUser(buildUserData(authUser))
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(buildUserData(session?.user ?? null))
      setIsLoading(false)
    })

    void hydrate()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, buildUserData])

  const value = useMemo(() => ({
    user,
    isLoading,
    isAdmin,
    refreshUser,
    updateUserData,
  }), [user, isLoading, isAdmin, refreshUser, updateUserData])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
