"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"

// Tipos de eventos de colaboração do page builder
type PageBuilderEventType = 
  | "node_update"
  | "node_add"
  | "node_remove"
  | "node_select"
  | "full_sync"
  | "request_sync"
  | "page_saved"

interface PageBuilderEventPayload {
  type: PageBuilderEventType
  userId: string
  userName: string
  pageId: string
  timestamp: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

interface NodeSelectPayload {
  nodeId: string | null
  nodeName?: string | null
}

interface FullSyncPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serializedNodes: any
}

// Debounce para sincronização completa (300ms)
const SYNC_DEBOUNCE_MS = 300

// Colaborador no page builder
export interface PageBuilderCollaborator {
  id: string
  name: string
  avatarUrl?: string | null
  color: string
  selectedNodeId?: string | null
  selectedNodeName?: string | null
  lastSeen: number
}

// Interface para seleção de nó com metadados
export interface NodeSelectionInfo {
  nodeId: string | null
  nodeName?: string | null
}

interface UsePageBuilderCollaborationProps {
  pageId: string
  // Função para obter o estado serializado atual
  getSerializedState: () => string | null
  // Função para aplicar estado serializado
  applySerializedState: (serialized: string) => void
  // Callback quando ocorre mudança remota
  onRemoteChange?: () => void
  // Callback quando outro colaborador salvar a página
  onRemoteSave?: (savedBy: string) => void
}

// Cliente Supabase singleton
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null
function getSupabase() {
  if (!supabaseClient && typeof window !== "undefined") {
    supabaseClient = createSupabaseBrowserClient()
  }
  return supabaseClient
}

export function usePageBuilderCollaboration({
  pageId,
  getSerializedState,
  applySerializedState,
  onRemoteChange,
  onRemoteSave,
}: UsePageBuilderCollaborationProps) {
  const { user } = useUser()
  const [collaborators, setCollaborators] = useState<PageBuilderCollaborator[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Refs para evitar re-renders e closures stale
  const channelRef = useRef<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null>(null)
  const isProcessingRemoteRef = useRef(false)
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const userRef = useRef(user)
  const pageIdRef = useRef(pageId)
  const getSerializedStateRef = useRef(getSerializedState)
  const applySerializedStateRef = useRef(applySerializedState)
  const onRemoteChangeRef = useRef(onRemoteChange)
  const onRemoteSaveRef = useRef(onRemoteSave)
  const lastSyncHashRef = useRef<string>("")

  // Mantém refs atualizadas
  useEffect(() => {
    userRef.current = user
    pageIdRef.current = pageId
    getSerializedStateRef.current = getSerializedState
    applySerializedStateRef.current = applySerializedState
    onRemoteChangeRef.current = onRemoteChange
    onRemoteSaveRef.current = onRemoteSave
  }, [user, pageId, getSerializedState, applySerializedState, onRemoteChange, onRemoteSave])

  // Função para gerar hash simples do estado
  const hashState = useCallback((state: string): string => {
    let hash = 0
    for (let i = 0; i < state.length; i++) {
      const char = state.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }, [])

  // Função para enviar evento
  const sendPageBuilderEvent = useCallback((type: PageBuilderEventType, data: unknown) => {
    const channel = channelRef.current
    const currentUser = userRef.current
    const currentPageId = pageIdRef.current
    
    if (!channel || !currentUser) {
      console.log("[page-builder-collab] Cannot send event - no channel or user")
      return
    }

    const payload: PageBuilderEventPayload = {
      type,
      userId: currentUser.id,
      userName: currentUser.full_name || currentUser.email?.split("@")[0] || "Usuário",
      pageId: currentPageId,
      timestamp: Date.now(),
      data,
    }

    channel.send({
      type: "broadcast",
      event: "page_builder_event",
      payload,
    }).then(() => {
      console.log("[page-builder-collab] Event sent:", type)
    }).catch((err) => {
      console.error("[page-builder-collab] Error sending event:", err)
    })
  }, [])

  // Broadcast sync completo (com debounce)
  const broadcastFullSync = useCallback(() => {
    // Cancela debounce anterior
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current)
    }

    syncDebounceRef.current = setTimeout(() => {
      const serialized = getSerializedStateRef.current()
      if (!serialized) return

      // Só envia se o estado mudou
      const hash = hashState(serialized)
      if (hash === lastSyncHashRef.current) return
      lastSyncHashRef.current = hash

      sendPageBuilderEvent("full_sync", { serializedNodes: serialized })
    }, SYNC_DEBOUNCE_MS)
  }, [sendPageBuilderEvent, hashState])

  // Broadcast seleção de nó com nome do componente
  const broadcastNodeSelect = useCallback((nodeId: string | null, nodeName?: string | null) => {
    sendPageBuilderEvent("node_select", { nodeId, nodeName })
  }, [sendPageBuilderEvent])

  // Solicita sync de outro usuário
  const requestSync = useCallback(() => {
    sendPageBuilderEvent("request_sync", {})
  }, [sendPageBuilderEvent])

  // Broadcast que a página foi salva
  const broadcastPageSaved = useCallback(() => {
    sendPageBuilderEvent("page_saved", {})
  }, [sendPageBuilderEvent])

  // Flag para indicar se é uma mudança local
  const setProcessingRemote = useCallback((value: boolean) => {
    isProcessingRemoteRef.current = value
  }, [])

  // Verifica se está processando mudança remota
  const isProcessingRemote = useCallback(() => {
    return isProcessingRemoteRef.current
  }, [])

  // Configura canal de colaboração
  useEffect(() => {
    if (!user || !pageId) return

    const client = getSupabase()
    if (!client) return

    console.log("[page-builder-collab] Setting up channel for page:", pageId)

    const channelName = `page_builder_collab_${pageId}`
    
    // Remove canal anterior se existir
    if (channelRef.current) {
      console.log("[page-builder-collab] Removing previous channel")
      client.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    const channel = client.channel(channelName, {
      config: {
        broadcast: { 
          self: false,
          ack: true
        },
        presence: { 
          key: user.id 
        },
      },
    })

    channelRef.current = channel

    // Handler para eventos do page builder
    channel.on("broadcast", { event: "page_builder_event" }, ({ payload }) => {
      const eventPayload = payload as PageBuilderEventPayload
      const currentUser = userRef.current
      const currentPageId = pageIdRef.current
      
      // Ignora eventos do próprio usuário ou de outras páginas
      if (eventPayload.userId === currentUser?.id) return
      if (eventPayload.pageId !== currentPageId) return

      console.log("[page-builder-collab] Received event:", eventPayload.type)

      switch (eventPayload.type) {
        case "full_sync": {
          const { serializedNodes } = eventPayload.data as FullSyncPayload
          if (serializedNodes) {
            isProcessingRemoteRef.current = true
            try {
              applySerializedStateRef.current(serializedNodes)
              onRemoteChangeRef.current?.()
            } finally {
              setTimeout(() => {
                isProcessingRemoteRef.current = false
              }, 100)
            }
          }
          break
        }

        case "node_select": {
          const { nodeId, nodeName } = eventPayload.data as NodeSelectPayload
          // Atualiza colaborador com o nó selecionado e nome
          setCollaborators((prev) => 
            prev.map((c) => 
              c.id === eventPayload.userId 
                ? { ...c, selectedNodeId: nodeId, selectedNodeName: nodeName }
                : c
            )
          )
          break
        }

        case "request_sync": {
          // Outro usuário está pedindo sync - envia estado atual
          const serialized = getSerializedStateRef.current()
          if (serialized) {
            sendPageBuilderEvent("full_sync", { serializedNodes: serialized })
          }
          break
        }

        case "page_saved": {
          // Outro colaborador salvou a página
          onRemoteSaveRef.current?.(eventPayload.userName)
          break
        }
      }
    })

    // Handler para presença - sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      console.log("[page-builder-collab] Presence sync:", state)
      
      const currentUser = userRef.current
      const collabs: PageBuilderCollaborator[] = []
      
      Object.entries(state).forEach(([key, entries]) => {
        if (Array.isArray(entries)) {
          entries.forEach((entry: Record<string, unknown>) => {
            const entryId = entry.id as string || key
            if (entryId !== currentUser?.id) {
              collabs.push({
                id: entryId,
                name: (entry.name as string) || "Usuário",
                avatarUrl: entry.avatarUrl as string | null,
                color: (entry.color as string) || "#3b82f6",
                selectedNodeId: entry.selectedNodeId as string | null,
                lastSeen: Date.now(),
              })
            }
          })
        }
      })
      
      setCollaborators(collabs)
    })

    // Handler para presença - join
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("[page-builder-collab] User joined:", key, newPresences)
      
      // Quando alguém entra, envia o estado atual após um pequeno delay
      setTimeout(() => {
        const serialized = getSerializedStateRef.current()
        if (serialized) {
          sendPageBuilderEvent("full_sync", { serializedNodes: serialized })
        }
      }, 500)
    })

    // Handler para presença - leave
    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("[page-builder-collab] User left:", key, leftPresences)
    })

    // Conecta ao canal
    channel
      .subscribe(async (status, err) => {
        console.log("[page-builder-collab] Channel status:", status, err)
        
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
          
          // Anuncia presença
          const customColor = typeof window !== "undefined" 
            ? localStorage.getItem("collaboration_user_color") 
            : null
          
          const trackData = {
            id: user.id,
            name: user.full_name || user.email?.split("@")[0] || "Usuário",
            avatarUrl: user.avatar_url,
            color: customColor || "#3b82f6",
            selectedNodeId: null,
          }
          
          console.log("[page-builder-collab] Tracking presence:", trackData)
          
          const trackResult = await channel.track(trackData)
          console.log("[page-builder-collab] Track result:", trackResult)

          // Solicita sync de outros usuários
          setTimeout(() => {
            requestSync()
          }, 1000)
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.log("[page-builder-collab] Channel closed or error")
          setIsConnected(false)
        }
      })

    return () => {
      console.log("[page-builder-collab] Cleaning up channel")
      
      // Limpa debounce
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current)
      }
      
      // Remove canal
      const currentChannel = channelRef.current
      if (currentChannel) {
        client.removeChannel(currentChannel)
        channelRef.current = null
      }
      
      setIsConnected(false)
      setCollaborators([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, pageId, sendPageBuilderEvent, requestSync])

  return {
    isConnected,
    collaborators,
    broadcastFullSync,
    broadcastNodeSelect,
    broadcastPageSaved,
    requestSync,
    setProcessingRemote,
    isProcessingRemote,
  }
}
