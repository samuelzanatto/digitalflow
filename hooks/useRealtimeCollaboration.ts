"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

export interface CollaboratorPresence {
  id: string
  name: string
  email?: string
  avatarUrl?: string | null
  color: string
  currentPath: string
  cursorPosition: { x: number; y: number } | null
  message?: string
  messageTimestamp?: number
  isTyping?: boolean
  lastActive: number
}

export interface CursorMessagePayload {
  id: string
  name: string
  avatarUrl?: string | null
  color: string
  message: string
  timestamp: number
  senderPath: string
}

// Mensagem no histórico (inclui messageId único)
export interface CursorMessageHistoryItem extends CursorMessagePayload {
  messageId: string
  isOwn?: boolean
}

// Cores vibrantes para distinguir colaboradores
export const COLLABORATOR_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
]

// Chave para salvar a cor personalizada no localStorage
const CUSTOM_COLOR_KEY = "collaboration_user_color"

// Obtém a cor personalizada do usuário (se existir)
export function getCustomUserColor(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CUSTOM_COLOR_KEY)
}

// Salva a cor personalizada do usuário
export function setCustomUserColor(color: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CUSTOM_COLOR_KEY, color)
}

// Gera uma cor consistente baseada no ID do usuário (ou usa a personalizada)
export function getCollaboratorColor(userId: string, customColor?: string | null): string {
  if (customColor) return customColor
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length]
}

// Intervalo de throttle para cursor (16ms = ~60fps)
const CURSOR_THROTTLE_MS = 16

// Path da tela de chat em equipe (onde desabilitamos mensagens por cursor)
const TEAM_CHAT_PATH = "/dashboard/equipe"

// Path do chat comum (oculta status, mas mantém cursor e mensagens)
const COMMON_CHAT_PATH = "/dashboard/chat"

// Máximo de mensagens no histórico
const MAX_MESSAGE_HISTORY = 10

export function useRealtimeCollaboration() {
  const { user } = useUser()
  const pathname = usePathname()
  const [collaborators, setCollaborators] = useState<Map<string, CollaboratorPresence>>(new Map())
  const [messageHistory, setMessageHistory] = useState<CursorMessageHistoryItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [userColor, setUserColorState] = useState<string>(() => {
    if (typeof window === "undefined") return COLLABORATOR_COLORS[0]
    const custom = getCustomUserColor()
    return custom || COLLABORATOR_COLORS[0]
  })
  const supabaseRef = useRef<SupabaseBrowserClient | null>(null)
  const presenceChannelRef = useRef<ReturnType<SupabaseBrowserClient["channel"]> | null>(null)
  const cursorChannelRef = useRef<ReturnType<SupabaseBrowserClient["channel"]> | null>(null)
  const cursorPositionRef = useRef<{ x: number; y: number } | null>(null)
  const lastBroadcastRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  // Atualiza a cor quando o usuário muda
  useEffect(() => {
    if (!user) return
    const custom = getCustomUserColor()
    const color = custom || getCollaboratorColor(user.id)
    setUserColorState(color)
  }, [user])

  // Função para alterar a cor do usuário
  const setUserColor = useCallback((color: string) => {
    setCustomUserColor(color)
    setUserColorState(color)
    
    // Atualiza a presença com a nova cor
    if (presenceChannelRef.current && user) {
      void presenceChannelRef.current.track({
        id: user.id,
        name: user.full_name || user.email?.split("@")[0] || "Usuário",
        email: user.email,
        avatarUrl: user.avatar_url,
        color: color,
        currentPath: pathname,
        cursorPosition: cursorPositionRef.current,
        lastActive: Date.now(),
      })
    }
  }, [user, pathname])

  // Verifica se está na tela de chat em equipe (desabilita tudo)
  const isInChatPage = pathname === TEAM_CHAT_PATH
  
  // Verifica se está em alguma tela de chat (oculta status)
  const isInAnyChatPage = pathname === TEAM_CHAT_PATH || pathname === COMMON_CHAT_PATH

  const getSupabaseClient = useCallback(() => {
    if (supabaseRef.current) return supabaseRef.current
    if (typeof window === "undefined") return null
    supabaseRef.current = createSupabaseBrowserClient()
    return supabaseRef.current
  }, [])

  // Broadcast cursor usando requestAnimationFrame para fluidez máxima
  const broadcastCursor = useCallback(() => {
    if (!cursorChannelRef.current || !user || !cursorPositionRef.current) return
    
    const now = performance.now()
    if (now - lastBroadcastRef.current < CURSOR_THROTTLE_MS) return
    lastBroadcastRef.current = now

    void cursorChannelRef.current.send({
      type: "broadcast",
      event: "cursor_move",
      payload: {
        id: user.id,
        x: cursorPositionRef.current.x,
        y: cursorPositionRef.current.y,
        path: pathname,
      },
    })
  }, [user, pathname])

  // Atualiza posição do cursor (com throttling via RAF)
  const updateCursorPosition = useCallback((x: number, y: number) => {
    cursorPositionRef.current = { x, y }
    
    if (rafRef.current) return
    
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      broadcastCursor()
    })
  }, [broadcastCursor])

  // Broadcast indicador de digitação
  const setTypingIndicator = useCallback((isTyping: boolean) => {
    if (!cursorChannelRef.current || !user) return

    void cursorChannelRef.current.send({
      type: "broadcast",
      event: "cursor_typing",
      payload: {
        id: user.id,
        isTyping,
      },
    })
  }, [user])

  // Envia mensagem pelo cursor (persiste no banco e broadcast)
  const sendCursorMessage = useCallback((message: string, skipPersist?: boolean) => {
    if (!cursorChannelRef.current || !user) return

    const messageId = `${user.id}-${Date.now()}`
    const payload: CursorMessagePayload = {
      id: user.id,
      name: user.full_name || user.email?.split("@")[0] || "Usuário",
      avatarUrl: user.avatar_url,
      color: userColor,
      message,
      timestamp: Date.now(),
      senderPath: pathname,
    }

    // Adiciona a própria mensagem ao histórico
    const historyItem: CursorMessageHistoryItem = {
      ...payload,
      messageId,
      isOwn: true,
    }
    
    setMessageHistory((prev) => {
      const updated = [...prev, historyItem]
      // Mantém apenas as últimas MAX_MESSAGE_HISTORY mensagens
      if (updated.length > MAX_MESSAGE_HISTORY) {
        return updated.slice(-MAX_MESSAGE_HISTORY)
      }
      return updated
    })

    void cursorChannelRef.current.send({
      type: "broadcast",
      event: "cursor_message",
      payload: { ...payload, messageId },
    })

    // Persiste a mensagem no banco de dados (team_messages)
    // skipPersist é usado quando a mensagem já foi salva pelo TeamChat
    if (!skipPersist) {
      const client = getSupabaseClient()
      if (client) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(client.from("team_messages") as any)
          .insert({
            content: message,
            username: user.full_name || user.email?.split("@")[0] || "Usuário",
            avatar_url: user.avatar_url || null,
            user_id: user.id,
          })
          .then(({ error }: { error: unknown }) => {
            if (error) {
              console.error("[collaboration] Erro ao salvar mensagem no chat:", error)
            }
          })
      }
    }

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      if (!cursorChannelRef.current || !user) return
      void cursorChannelRef.current.send({
        type: "broadcast",
        event: "cursor_message_clear",
        payload: { id: user.id },
      })
    }, 5000)
  }, [user, pathname, getSupabaseClient, userColor])

  useEffect(() => {
    if (!user) return

    const client = getSupabaseClient()
    if (!client) return

    // Canal de presença para estado geral (quem está online, em qual página)
    const presenceChannel = client.channel("collaboration_presence", {
      config: {
        presence: { key: user.id },
      },
    })

    // Canal de broadcast para cursores (alta frequência, baixa latência)
    const cursorChannel = client.channel("collaboration_cursors", {
      config: {
        broadcast: { self: false },
      },
    })

    presenceChannelRef.current = presenceChannel
    cursorChannelRef.current = cursorChannel

    // Handler para sync de presença
    presenceChannel.on("presence", { event: "sync" }, () => {
      type PresencePayload = CollaboratorPresence & { presence_ref: string }
      const state = presenceChannel.presenceState<PresencePayload>()

      setCollaborators((prev) => {
        const updated = new Map(prev)
        
        Object.values(state).forEach((entries) => {
          entries.forEach((entry) => {
            if (entry.id && entry.id !== user.id) {
              const existing = updated.get(entry.id)
              updated.set(entry.id, {
                id: entry.id,
                name: entry.name,
                email: entry.email,
                avatarUrl: entry.avatarUrl,
                color: entry.color || getCollaboratorColor(entry.id),
                currentPath: entry.currentPath,
                cursorPosition: existing?.cursorPosition ?? entry.cursorPosition,
                message: existing?.message ?? entry.message,
                messageTimestamp: existing?.messageTimestamp ?? entry.messageTimestamp,
                isTyping: existing?.isTyping ?? false,
                lastActive: entry.lastActive,
              })
            }
          })
        })
        
        // Remove colaboradores que saíram
        const activeIds = new Set(
          Object.values(state).flatMap((entries) => entries.map((e) => e.id))
        )
        updated.forEach((_, id) => {
          if (!activeIds.has(id)) updated.delete(id)
        })
        
        return updated
      })
    })

    // Handler para movimento de cursor (alta frequência)
    cursorChannel.on("broadcast", { event: "cursor_move" }, ({ payload }) => {
      const { id, x, y, path } = payload as { id: string; x: number; y: number; path: string }
      if (id === user.id) return

      setCollaborators((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        
        const updated = new Map(prev)
        updated.set(id, {
          ...existing,
          cursorPosition: { x, y },
          currentPath: path,
          lastActive: Date.now(),
        })
        return updated
      })
    })

    // Handler para indicador de digitação
    cursorChannel.on("broadcast", { event: "cursor_typing" }, ({ payload }) => {
      const { id, isTyping } = payload as { id: string; isTyping: boolean }
      if (id === user.id) return

      setCollaborators((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        
        const updated = new Map(prev)
        updated.set(id, {
          ...existing,
          isTyping,
        })
        return updated
      })
    })

    // Handler para mensagens de cursor
    cursorChannel.on("broadcast", { event: "cursor_message" }, ({ payload }) => {
      const msgPayload = payload as CursorMessagePayload & { messageId: string }
      if (msgPayload.id === user.id) return

      // Adiciona ao histórico de mensagens
      const historyItem: CursorMessageHistoryItem = {
        ...msgPayload,
        messageId: msgPayload.messageId,
        isOwn: false,
      }
      
      setMessageHistory((prev) => {
        const updated = [...prev, historyItem]
        // Mantém apenas as últimas MAX_MESSAGE_HISTORY mensagens
        if (updated.length > MAX_MESSAGE_HISTORY) {
          return updated.slice(-MAX_MESSAGE_HISTORY)
        }
        return updated
      })

      // Atualiza estado do colaborador
      setCollaborators((prev) => {
        const existing = prev.get(msgPayload.id)
        if (!existing) return prev
        
        const updated = new Map(prev)
        updated.set(msgPayload.id, {
          ...existing,
          message: msgPayload.message,
          messageTimestamp: msgPayload.timestamp,
          isTyping: false,
        })
        return updated
      })

      // Mostra notificação no sonner apenas se:
      // 1. O remetente está em uma página diferente da atual
      // 2. O usuário atual NÃO está na tela de chat em equipe (onde já vê as mensagens)
      const isCurrentUserInTeamChat = pathname === TEAM_CHAT_PATH
      if (msgPayload.senderPath !== pathname && !isCurrentUserInTeamChat) {
        toast.message(msgPayload.name, {
          description: msgPayload.message,
          duration: 5000,
        })
      }
    })

    // Handler para limpar mensagens
    cursorChannel.on("broadcast", { event: "cursor_message_clear" }, ({ payload }) => {
      const { id } = payload as { id: string }
      if (id === user.id) return

      setCollaborators((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev
        
        const updated = new Map(prev)
        updated.set(id, {
          ...existing,
          message: undefined,
          messageTimestamp: undefined,
        })
        return updated
      })
    })

    // Subscribe nos canais
    presenceChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true)
        void presenceChannel.track({
          id: user.id,
          name: user.full_name || user.email?.split("@")[0] || "Usuário",
          email: user.email,
          avatarUrl: user.avatar_url,
          color: getCollaboratorColor(user.id),
          currentPath: pathname,
          cursorPosition: null,
          lastActive: Date.now(),
        })
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false)
      }
    })

    cursorChannel.subscribe()

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      void client.removeChannel(presenceChannel)
      void client.removeChannel(cursorChannel)
      presenceChannelRef.current = null
      cursorChannelRef.current = null
    }
  }, [user, getSupabaseClient, pathname])

  // Atualiza path quando muda
  useEffect(() => {
    if (!presenceChannelRef.current || !user || !isConnected) return

    void presenceChannelRef.current.track({
      id: user.id,
      name: user.full_name || user.email?.split("@")[0] || "Usuário",
      email: user.email,
      avatarUrl: user.avatar_url,
      color: getCollaboratorColor(user.id),
      currentPath: pathname,
      cursorPosition: cursorPositionRef.current,
      lastActive: Date.now(),
    })
  }, [pathname, user, isConnected])

  // Retorna colaboradores filtrados por página atual
  const collaboratorsOnCurrentPage = Array.from(collaborators.values()).filter(
    (c) => c.currentPath === pathname
  )

  // Retorna colaboradores agrupados por página (para sidebar)
  const collaboratorsByPath = Array.from(collaborators.values()).reduce(
    (acc, collaborator) => {
      const path = collaborator.currentPath
      if (!acc[path]) {
        acc[path] = []
      }
      acc[path].push(collaborator)
      return acc
    },
    {} as Record<string, CollaboratorPresence[]>
  )

  return {
    collaborators: Array.from(collaborators.values()),
    collaboratorsOnCurrentPage,
    collaboratorsByPath,
    messageHistory,
    isConnected,
    isInChatPage,
    isInAnyChatPage,
    updateCursorPosition,
    sendCursorMessage,
    setTypingIndicator,
    currentUserColor: userColor,
    setUserColor,
    availableColors: COLLABORATOR_COLORS,
  }
}
