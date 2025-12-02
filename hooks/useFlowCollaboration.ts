"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"
import type { Node, NodeChange, EdgeChange } from "@xyflow/react"

// Tipos de eventos de colaboração do flow
type FlowEventType = 
  | "node_move"
  | "node_update" 
  | "node_add"
  | "node_remove"
  | "edge_add"
  | "edge_remove"
  | "edge_update"
  | "viewport_change"
  | "node_select"
  | "full_sync"
  | "flow_saved"

interface FlowEventPayload {
  type: FlowEventType
  userId: string
  userName: string
  funnelId: string
  timestamp: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

interface NodeMovePayload {
  nodeId: string
  position: { x: number; y: number }
}

interface NodeUpdatePayload {
  nodeId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes: any
}

interface NodeAddPayload {
  node: Node
}

interface NodeRemovePayload {
  nodeId: string
}

interface EdgeAddPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edge: any
}

interface EdgeRemovePayload {
  edgeId: string
}

interface NodeSelectPayload {
  nodeId: string | null
}

interface ViewportPayload {
  x: number
  y: number
  zoom: number
}

interface FullSyncPayload {
  nodes: Node[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: any[]
}

// Intervalo de throttle para movimentos (30ms para estabilidade)
const MOVE_THROTTLE_MS = 30

// Debounce para atualizações de texto (500ms)
const UPDATE_DEBOUNCE_MS = 500

// Colaborador no flow
export interface FlowCollaborator {
  id: string
  name: string
  avatarUrl?: string | null
  color: string
  selectedNodeId?: string | null
  viewport?: ViewportPayload
  lastSeen: number
}

interface UseFlowCollaborationProps {
  funnelId: string
  nodes: Node[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: any[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEdges: React.Dispatch<React.SetStateAction<any[]>>
  onRemoteChange?: () => void
  // Função para hidratar dados do nó (converter rawLabel em label JSX)
  hydrateNodeData?: (data: Record<string, unknown>) => Record<string, unknown>
  // Callback quando outro colaborador salvar o flow
  onRemoteSave?: (savedBy: string, snapshot: string) => void
}

// Cliente Supabase singleton para evitar múltiplas instâncias
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null
function getSupabase() {
  if (!supabaseClient && typeof window !== "undefined") {
    supabaseClient = createSupabaseBrowserClient()
  }
  return supabaseClient
}

export function useFlowCollaboration({
  funnelId,
  nodes,
  edges,
  setNodes,
  setEdges,
  onRemoteChange,
  hydrateNodeData,
  onRemoteSave,
}: UseFlowCollaborationProps) {
  const { user } = useUser()
  const [collaborators, setCollaborators] = useState<FlowCollaborator[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Refs para evitar re-renders e closures stale
  const channelRef = useRef<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null>(null)
  const lastMoveRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const pendingMovesRef = useRef<Map<string, NodeMovePayload>>(new Map())
  const isProcessingRemoteRef = useRef(false)
  const updateDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const userRef = useRef(user)
  const funnelIdRef = useRef(funnelId)
  const setNodesRef = useRef(setNodes)
  const setEdgesRef = useRef(setEdges)
  const onRemoteChangeRef = useRef(onRemoteChange)
  const hydrateNodeDataRef = useRef(hydrateNodeData)
  const onRemoteSaveRef = useRef(onRemoteSave)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  // Mantém refs atualizadas
  useEffect(() => {
    userRef.current = user
    funnelIdRef.current = funnelId
    setNodesRef.current = setNodes
    setEdgesRef.current = setEdges
    onRemoteChangeRef.current = onRemoteChange
    hydrateNodeDataRef.current = hydrateNodeData
    onRemoteSaveRef.current = onRemoteSave
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [user, funnelId, setNodes, setEdges, onRemoteChange, hydrateNodeData, onRemoteSave, nodes, edges])

  // Função para enviar evento (usando refs para evitar dependências)
  const sendFlowEvent = useCallback((type: FlowEventType, data: unknown) => {
    const channel = channelRef.current
    const currentUser = userRef.current
    const currentFunnelId = funnelIdRef.current
    
    if (!channel || !currentUser) {
      console.log("[flow-collab] Cannot send event - no channel or user")
      return
    }

    const payload: FlowEventPayload = {
      type,
      userId: currentUser.id,
      userName: currentUser.full_name || currentUser.email?.split("@")[0] || "Usuário",
      funnelId: currentFunnelId,
      timestamp: Date.now(),
      data,
    }

    channel.send({
      type: "broadcast",
      event: "flow_event",
      payload,
    }).then(() => {
      console.log("[flow-collab] Event sent:", type)
    }).catch((err) => {
      console.error("[flow-collab] Error sending event:", err)
    })
  }, [])

  // Broadcast movimento de nó com throttling
  const broadcastNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    pendingMovesRef.current.set(nodeId, { nodeId, position })

    if (rafRef.current) return

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      
      const now = performance.now()
      if (now - lastMoveRef.current < MOVE_THROTTLE_MS) return
      lastMoveRef.current = now

      // Envia todos os movimentos pendentes
      pendingMovesRef.current.forEach((move) => {
        sendFlowEvent("node_move", move)
      })
      pendingMovesRef.current.clear()
    })
  }, [sendFlowEvent])

  // Broadcast atualização de nó (com debounce para text updates)
  const broadcastNodeUpdate = useCallback((nodeId: string, changes: Partial<Node>) => {
    // Cancela debounce anterior para esse nó
    const existingTimeout = updateDebounceRef.current.get(nodeId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Aplica debounce para atualizações de texto
    const timeout = setTimeout(() => {
      sendFlowEvent("node_update", { nodeId, changes })
      updateDebounceRef.current.delete(nodeId)
    }, UPDATE_DEBOUNCE_MS)
    
    updateDebounceRef.current.set(nodeId, timeout)
  }, [sendFlowEvent])

  // Broadcast adição de nó
  const broadcastNodeAdd = useCallback((node: Node) => {
    sendFlowEvent("node_add", { node })
  }, [sendFlowEvent])

  // Broadcast remoção de nó
  const broadcastNodeRemove = useCallback((nodeId: string) => {
    sendFlowEvent("node_remove", { nodeId })
  }, [sendFlowEvent])

  // Broadcast adição de edge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastEdgeAdd = useCallback((edge: any) => {
    sendFlowEvent("edge_add", { edge })
  }, [sendFlowEvent])

  // Broadcast remoção de edge
  const broadcastEdgeRemove = useCallback((edgeId: string) => {
    sendFlowEvent("edge_remove", { edgeId })
  }, [sendFlowEvent])

  // Broadcast atualização de edge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastEdgeUpdate = useCallback((edgeId: string, changes: any) => {
    sendFlowEvent("edge_update", { edgeId, changes })
  }, [sendFlowEvent])

  // Broadcast viewport
  const broadcastViewport = useCallback((viewport: ViewportPayload) => {
    sendFlowEvent("viewport_change", viewport)
  }, [sendFlowEvent])

  // Broadcast seleção de nó
  const broadcastNodeSelect = useCallback((nodeId: string | null) => {
    sendFlowEvent("node_select", { nodeId })
    // Atualiza o presence com o nó selecionado
    if (channelRef.current) {
      channelRef.current.track({
        id: userRef.current?.id,
        email: userRef.current?.email,
        name: userRef.current?.full_name || userRef.current?.email?.split("@")[0],
        avatar: userRef.current?.avatar_url,
        selectedNodeId: nodeId,
        lastActive: new Date().toISOString(),
      })
    }
  }, [sendFlowEvent])

  // Broadcast que o flow foi salvo
  const broadcastFlowSaved = useCallback((snapshot: string) => {
    sendFlowEvent("flow_saved", { snapshot })
  }, [sendFlowEvent])

  // Envia sync completo
  const sendFullSync = useCallback(() => {
    sendFlowEvent("full_sync", { 
      nodes: nodesRef.current, 
      edges: edgesRef.current 
    })
  }, [sendFlowEvent])

  // Handler para mudanças de nós que vêm do ReactFlow
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // Se estamos processando mudanças remotas, não broadcast
    if (isProcessingRemoteRef.current) return

    changes.forEach((change) => {
      switch (change.type) {
        case "position":
          if (change.position && !change.dragging) {
            // Posição final após drag
            broadcastNodeMove(change.id, change.position)
          } else if (change.position && change.dragging) {
            // Durante o drag - throttled
            broadcastNodeMove(change.id, change.position)
          }
          break
        case "remove":
          broadcastNodeRemove(change.id)
          break
      }
    })
  }, [broadcastNodeMove, broadcastNodeRemove])

  // Handler para mudanças de edges que vêm do ReactFlow
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (isProcessingRemoteRef.current) return

    changes.forEach((change) => {
      switch (change.type) {
        case "remove":
          broadcastEdgeRemove(change.id)
          break
      }
    })
  }, [broadcastEdgeRemove])

  // Configura canal de colaboração
  useEffect(() => {
    if (!user || !funnelId) return

    const client = getSupabase()
    if (!client) return

    console.log("[flow-collab] Setting up channel for funnel:", funnelId)

    const channelName = `flow_collab_${funnelId}`
    
    // Captura ref para cleanup
    const debounceMapForCleanup = updateDebounceRef.current
    
    // Remove canal anterior se existir
    if (channelRef.current) {
      console.log("[flow-collab] Removing previous channel")
      client.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    const channel = client.channel(channelName, {
      config: {
        broadcast: { 
          self: false,
          ack: true // Aguarda confirmação
        },
        presence: { 
          key: user.id 
        },
      },
    })

    channelRef.current = channel

    // Handler para eventos de flow
    channel.on("broadcast", { event: "flow_event" }, ({ payload }) => {
      const eventPayload = payload as FlowEventPayload
      const currentUser = userRef.current
      const currentFunnelId = funnelIdRef.current
      
      // Ignora eventos do próprio usuário ou de outros funnels
      if (eventPayload.userId === currentUser?.id) return
      if (eventPayload.funnelId !== currentFunnelId) return

      console.log("[flow-collab] Received event:", eventPayload.type)

      isProcessingRemoteRef.current = true

      try {
        switch (eventPayload.type) {
          case "node_move": {
            const { nodeId, position } = eventPayload.data as NodeMovePayload
            setNodesRef.current((nds) =>
              nds.map((node) =>
                node.id === nodeId ? { ...node, position } : node
              )
            )
            break
          }

          case "node_update": {
            const { nodeId, changes } = eventPayload.data as NodeUpdatePayload
            const hydrate = hydrateNodeDataRef.current
            
            setNodesRef.current((nds) =>
              nds.map((node) => {
                if (node.id !== nodeId) return node
                
                // Se tem changes.data e temos função de hidratação, usa ela
                let finalChanges = changes
                if (changes.data && hydrate) {
                  finalChanges = {
                    ...changes,
                    data: {
                      ...(node.data as Record<string, unknown>),
                      ...hydrate(changes.data as Record<string, unknown>),
                    },
                  }
                }
                
                return { ...node, ...finalChanges }
              })
            )
            break
          }

          case "node_add": {
            const { node } = eventPayload.data as NodeAddPayload
            const hydrate = hydrateNodeDataRef.current
            
            setNodesRef.current((nds) => {
              if (nds.some((n) => n.id === node.id)) return nds
              
              // Hidrata os dados do nó se tiver função de hidratação
              const hydratedNode = hydrate && node.data
                ? { ...node, data: hydrate(node.data as Record<string, unknown>) }
                : node
                
              return [...nds, hydratedNode]
            })
            break
          }

          case "node_remove": {
            const { nodeId } = eventPayload.data as NodeRemovePayload
            setNodesRef.current((nds) => nds.filter((n) => n.id !== nodeId))
            break
          }

          case "edge_add": {
            const { edge } = eventPayload.data as EdgeAddPayload
            setEdgesRef.current((eds) => {
              if (eds.some((e) => e.id === edge.id)) return eds
              return [...eds, edge]
            })
            break
          }

          case "edge_remove": {
            const { edgeId } = eventPayload.data as EdgeRemovePayload
            setEdgesRef.current((eds) => eds.filter((e) => e.id !== edgeId))
            break
          }

          case "full_sync": {
            const { nodes: syncNodes, edges: syncEdges } = eventPayload.data as FullSyncPayload
            setNodesRef.current(syncNodes)
            setEdgesRef.current(syncEdges)
            break
          }

          case "node_select": {
            const { nodeId } = eventPayload.data as NodeSelectPayload
            // Atualiza o collaborator com o nó selecionado
            setCollaborators((prev) =>
              prev.map((collab) =>
                collab.id === eventPayload.userId
                  ? { ...collab, selectedNodeId: nodeId }
                  : collab
              )
            )
            break
          }

          case "flow_saved": {
            const { snapshot } = eventPayload.data as { snapshot: string }
            // Notifica que outro colaborador salvou
            onRemoteSaveRef.current?.(eventPayload.userName, snapshot)
            break
          }
        }

        onRemoteChangeRef.current?.()
      } finally {
        // Reset flag após um tick
        setTimeout(() => {
          isProcessingRemoteRef.current = false
        }, 100)
      }
    })

    // Handler para presença - sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      console.log("[flow-collab] Presence sync:", state)
      
      const currentUser = userRef.current
      const collabs: FlowCollaborator[] = []
      
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
                viewport: entry.viewport as ViewportPayload | undefined,
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
      console.log("[flow-collab] User joined:", key, newPresences)
    })

    // Handler para presença - leave
    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("[flow-collab] User left:", key, leftPresences)
    })

    // Conecta ao canal
    channel
      .subscribe(async (status, err) => {
        console.log("[flow-collab] Channel status:", status, err)
        
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
          }
          
          console.log("[flow-collab] Tracking presence:", trackData)
          
          const trackResult = await channel.track(trackData)
          console.log("[flow-collab] Track result:", trackResult)
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.log("[flow-collab] Channel closed or error")
          setIsConnected(false)
        }
      })

    return () => {
      console.log("[flow-collab] Cleaning up channel")
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      
      // Limpa debounces
      debounceMapForCleanup.forEach((timeout) => clearTimeout(timeout))
      debounceMapForCleanup.clear()
      
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
  }, [user?.id, funnelId]) // Dependências mínimas - só reconecta se user ou funnel mudar

  // Retorna funções e estado
  return {
    isConnected,
    collaborators,
    // Handlers para interceptar mudanças locais
    handleNodesChange,
    handleEdgesChange,
    // Broadcasts manuais
    broadcastNodeMove,
    broadcastNodeUpdate,
    broadcastNodeAdd,
    broadcastNodeRemove,
    broadcastEdgeAdd,
    broadcastEdgeRemove,
    broadcastEdgeUpdate,
    broadcastViewport,
    broadcastNodeSelect,
    broadcastFlowSaved,
    sendFullSync,
  }
}
