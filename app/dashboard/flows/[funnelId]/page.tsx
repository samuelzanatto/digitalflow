"use client"

import { CSSProperties, useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Panel,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  type Viewport,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Plus, ArrowLeft, Save, Maximize2, Minimize2, Users } from "lucide-react"
import { toast } from "sonner"
import { saveFlowNodes } from "@/lib/actions/flows"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"
import { EditableNode, InputNode, OutputNode } from "@/components/flow-nodes"
import { useFlowCollaboration } from "@/hooks/useFlowCollaboration"
import { FlowCollaborators } from "@/components/collaboration/flow-collaborators"
import NodeSelectionOverlay from "@/components/collaboration/node-selection-overlay"

// Definir nodeTypes fora do componente para evitar re-renders
const nodeTypes = {
  default: EditableNode,
  input: InputNode,
  output: OutputNode,
  editable: EditableNode,
}

const STRUCTURED_LABEL_FALLBACK = "Novo nó"
const DEFAULT_NODE_STYLE: CSSProperties = {
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  borderRadius: 16,
  padding: 16,
  textAlign: "left",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.35)",
}

const ensureNodeStyle = (style?: CSSProperties): CSSProperties => ({
  ...DEFAULT_NODE_STYLE,
  ...(style ?? {}),
})

const buildStructuredLabel = (rawValue: string) => {
  const safeValue = rawValue?.trim() ?? ""
  if (!safeValue) {
    return STRUCTURED_LABEL_FALLBACK
  }

  const lines = safeValue.split(/\r?\n/).map((line) => line.trim())
  const entries = lines.filter(Boolean)

  if (!entries.length) {
    return STRUCTURED_LABEL_FALLBACK
  }

  const [title, ...rest] = entries
  const blocks: Array<
    | { type: "text"; content: string }
    | { type: "bullets"; items: string[] }
  > = []

  let textBuffer: string[] = []
  let bulletBuffer: string[] = []

  const flushText = () => {
    if (!textBuffer.length) return
    blocks.push({ type: "text", content: textBuffer.join("\n") })
    textBuffer = []
  }

  const flushBullets = () => {
    if (!bulletBuffer.length) return
    blocks.push({ type: "bullets", items: bulletBuffer })
    bulletBuffer = []
  }

  rest.forEach((line) => {
    if (/^[-•]/.test(line)) {
      flushText()
      bulletBuffer.push(line.replace(/^[-•]\s*/, ""))
    } else {
      flushBullets()
      textBuffer.push(line)
    }
  })

  flushText()
  flushBullets()

  return (
    <div
      className="flex flex-col gap-1.5 leading-snug"
      style={{ textAlign: "inherit", color: "inherit" }}
    >
      <span className="text-[13px] font-semibold" style={{ color: "inherit" }}>
        {title}
      </span>
      {blocks.map((block, index) =>
        block.type === "text" ? (
          <p
            key={`text-${index}`}
            className="text-xs whitespace-pre-wrap"
            style={{ color: "inherit", opacity: 0.8 }}
          >
            {block.content}
          </p>
        ) : (
          <ul
            key={`list-${index}`}
            className="list-disc space-y-0.5 pl-4 text-[11px]"
            style={{ color: "inherit", opacity: 0.75 }}
          >
            {block.items.map((line) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}

const withStructuredLabel = (rawValue: string) => ({
  rawLabel: rawValue,
  label: buildStructuredLabel(rawValue),
})

const hydrateNodes = (
  nodes: Array<Omit<Node, "data"> & { data: { label: string } }>
): Node[] =>
  nodes.map((node) => ({
    ...node,
    data: {
      ...withStructuredLabel(node.data.label),
    },
    style: ensureNodeStyle(node.style),
  }))

const templateNodes: Node[] = hydrateNodes([
  {
    id: "1",
    type: "input",
    position: { x: 250, y: 0 },
    data: { label: "Início do Funil\n- Origem do lead" },
  },
  {
    id: "2",
    type: "default",
    position: { x: 100, y: 150 },
    data: { label: "Lead Capturado\nCampos validados\n- Email confirmado" },
  },
  {
    id: "3",
    type: "default",
    position: { x: 400, y: 150 },
    data: { label: "Email de Boas-vindas\nMensagem principal\n- CTA para onboarding" },
  },
  {
    id: "4",
    type: "output",
    position: { x: 250, y: 300 },
    data: { label: "Conclusão\n- Cliente convertido" },
  },
])

const templateEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-4", source: "3", target: "4" },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeFlow = (nodes: Node[], edges: any[]) => {
  const safeNodes = nodes
    .map((node) => {
      const data = node.data as { rawLabel?: string }
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        style: node.style,
        data: {
          rawLabel: typeof data?.rawLabel === "string" ? data.rawLabel : "",
        },
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))

  const safeEdges = edges
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: Boolean(edge.animated),
      label: typeof edge.label === "string" ? edge.label : undefined,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  return JSON.stringify({ nodes: safeNodes, edges: safeEdges })
}

type StoredNode = {
  id: string
  type?: Node["type"]
  position?: Node["position"]
  style?: CSSProperties
  data?: { rawLabel?: string }
}

type StoredEdge = {
  id: string
  source: string
  target: string
  type?: Edge["type"]
  animated?: boolean
  label?: string
}

type NodeWithDimensions = Node & {
  width?: number
  height?: number
  positionAbsolute?: { x: number; y: number }
}

const ensurePosition = (position?: Node["position"]): Node["position"] =>
  position ?? { x: 0, y: 0 }

const mapStoredNodes = (storedNodes?: StoredNode[]): Node[] => {
  if (!Array.isArray(storedNodes) || storedNodes.length === 0) {
    return []
  }

  return storedNodes.map((node) => ({
    id: node.id,
    type: node.type ?? "default",
    position: ensurePosition(node.position),
    data: withStructuredLabel(node.data?.rawLabel ?? ""),
    style: ensureNodeStyle(node.style),
  }))
}

const mapStoredEdges = (storedEdges?: StoredEdge[]): Edge[] => {
  if (!Array.isArray(storedEdges) || storedEdges.length === 0) {
    return []
  }

  return storedEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    label: edge.label,
  }))
}

export default function FlowEditor() {
  const params = useParams()
  const router = useRouter()
  const { setPageHeader } = usePageHeader()
  const funnelId = params.funnelId as string
  const { user } = useSupabaseUser()

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<Edge>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isHydrating, setIsHydrating] = useState(true)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    serializeFlow([], []),
  )
  const [nodeLabel, setNodeLabel] = useState("")
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Ref para evitar loops de sync
  const isRemoteUpdateRef = useRef(false)

  // Função para hidratar dados do nó (converter rawLabel em label JSX)
  const hydrateNodeData = useCallback((data: Record<string, unknown>) => {
    if (typeof data.rawLabel === "string") {
      return withStructuredLabel(data.rawLabel)
    }
    return data
  }, [])

  // Hook de colaboração em tempo real
  const {
    isConnected: isCollabConnected,
    collaborators,
    handleNodesChange: handleCollabNodesChange,
    handleEdgesChange: handleCollabEdgesChange,
    broadcastNodeUpdate,
    broadcastNodeAdd,
    broadcastEdgeAdd,
    broadcastNodeSelect,
    broadcastFlowSaved,
  } = useFlowCollaboration({
    funnelId,
    nodes,
    edges,
    setNodes,
    setEdges,
    onRemoteChange: () => {
      isRemoteUpdateRef.current = true
      // Reset após um tick
      setTimeout(() => {
        isRemoteUpdateRef.current = false
      }, 100)
    },
    hydrateNodeData,
    onRemoteSave: (savedBy, snapshot) => {
      // Outro colaborador salvou - atualiza o lastSavedSnapshot
      setLastSavedSnapshot(snapshot)
      toast.success(`${savedBy} salvou o fluxo`)
    },
  })

  // Handler combinado para mudanças de nós
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChangeBase(changes)
    
    // Só broadcast se não for uma atualização remota
    if (!isRemoteUpdateRef.current) {
      handleCollabNodesChange(changes)
    }
  }, [onNodesChangeBase, handleCollabNodesChange])

  // Handler combinado para mudanças de edges
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChangeBase(changes)
    
    // Só broadcast se não for uma atualização remota
    if (!isRemoteUpdateRef.current) {
      handleCollabEdgesChange(changes)
    }
  }, [onEdgesChangeBase, handleCollabEdgesChange])

  useEffect(() => {
    let cancelled = false

    const loadFlow = async () => {
      setIsHydrating(true)
      try {
        const response = await fetch(`/api/flows/${funnelId}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Falha ao carregar fluxo")
        }
        const payload = await response.json()
        const storedFlow = payload?.data

        if (storedFlow?.nodesData) {
          const hydratedNodes = mapStoredNodes(storedFlow.nodesData.nodes)
          const hydratedEdges = mapStoredEdges(storedFlow.nodesData.edges)

          if (!cancelled) {
            setNodes(hydratedNodes)
            setEdges(hydratedEdges)
            setLastSavedSnapshot(serializeFlow(hydratedNodes, hydratedEdges))
          }
        } else if (!cancelled) {
          setNodes(templateNodes)
          setEdges(templateEdges)
          setLastSavedSnapshot(serializeFlow(templateNodes, templateEdges))
        }
      } catch (error) {
        console.error("Erro ao carregar fluxo", error)
      } finally {
        if (!cancelled) {
          setIsHydrating(false)
        }
      }
    }

    loadFlow()

    return () => {
      cancelled = true
    }
  }, [funnelId, setEdges, setNodes])
  const getRawLabel = useCallback((node?: Node | null) => {
    if (!node) return ""
    const data = node.data as { rawLabel?: string; label?: string }
    if (typeof data?.rawLabel === "string") return data.rawLabel
    if (typeof data?.label === "string") return data.label
    return ""
  }, [])
  const activeNode = useMemo(() => nodes.find((node) => node.selected) ?? null, [nodes])
  const selectedNodeId = activeNode?.id ?? null
  
  // Broadcast seleção de nó para colaboradores
  useEffect(() => {
    broadcastNodeSelect(selectedNodeId)
  }, [selectedNodeId, broadcastNodeSelect])
  
  const selectedNodeLabel = activeNode ? getRawLabel(activeNode) : ""
  const selectedNodeStyle = ensureNodeStyle(activeNode?.style)
  const selectedNodeAlignment = selectedNodeStyle.textAlign ?? "left"
  const selectedNodeBackground =
    typeof selectedNodeStyle.backgroundColor === "string"
      ? selectedNodeStyle.backgroundColor
      : DEFAULT_NODE_STYLE.backgroundColor
  const selectedNodeColor =
    typeof selectedNodeStyle.color === "string"
      ? selectedNodeStyle.color
      : DEFAULT_NODE_STYLE.color
  const alignmentOptions: Array<{ value: NonNullable<CSSProperties["textAlign"]>; label: string }> = [
    { value: "left", label: "Esq." },
    { value: "center", label: "Centro" },
    { value: "right", label: "Dir." },
  ]

  const updateSelectedNodeStyle = useCallback(
    (partial: Partial<CSSProperties>) => {
      if (!selectedNodeId) return
      
      const newStyle = ensureNodeStyle({
        ...selectedNodeStyle,
        ...partial,
      })
      
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                style: newStyle,
              }
            : node,
        ),
      )
      
      // Broadcast alteração de estilo
      broadcastNodeUpdate(selectedNodeId, { style: newStyle })
    },
    [selectedNodeId, selectedNodeStyle, setNodes, broadcastNodeUpdate],
  )

  const handleSelectedNodeLabelChange = useCallback(
    (value: string) => {
      if (!selectedNodeId) return

      const newData = {
        ...withStructuredLabel(value),
      }

      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...(node.data as Record<string, unknown>),
                  ...newData,
                },
              }
            : node,
        ),
      )
      
      // Broadcast apenas o rawLabel (serializável), não o JSX
      broadcastNodeUpdate(selectedNodeId, { data: { rawLabel: value } })
    },
    [selectedNodeId, setNodes, broadcastNodeUpdate],
  )

  const handleAlignmentChange = useCallback(
    (value: NonNullable<CSSProperties["textAlign"]>) => {
      updateSelectedNodeStyle({ textAlign: value })
    },
    [updateSelectedNodeStyle],
  )

  const handleColorChange = useCallback(
    (key: "backgroundColor" | "color", value: string) => {
      updateSelectedNodeStyle({ [key]: value })
    },
    [updateSelectedNodeStyle],
  )

  const handleViewportChange = useCallback((_: unknown, nextViewport: Viewport) => {
    setViewport(nextViewport)
  }, [])

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    setViewport(instance.getViewport())
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = { ...connection, id: `e${connection.source}-${connection.target}`, animated: true }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEdges((eds) => addEdge(newEdge, eds as any))
      
      // Broadcast nova conexão
      broadcastEdgeAdd(newEdge)
    },
    [setEdges, broadcastEdgeAdd]
  )

  const addNewNode = useCallback(() => {
    const nodeCount = nodes.length
    const rawLabel = nodeLabel.trim() || `Nó ${nodeCount + 1}`
    const newNode: Node = {
      id: `node_${Date.now()}_${nodeCount + 1}`,
      type: "default",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        ...withStructuredLabel(rawLabel),
      },
      style: ensureNodeStyle(),
    }
    setNodes((nds) => [...nds, newNode])
    setNodeLabel("")
    
    // Broadcast novo nó (apenas com rawLabel, sem JSX)
    broadcastNodeAdd({
      ...newNode,
      data: { rawLabel },
    })
  }, [nodeLabel, nodes.length, setNodes, broadcastNodeAdd])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const currentSnapshot = useMemo(() => serializeFlow(nodes, edges), [nodes, edges])
  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot
  const canSave = !isHydrating && !isSaving && hasUnsavedChanges
  const shouldShowSkeleton = isHydrating && nodes.length === 0 && edges.length === 0

  const handleSave = useCallback(async () => {
    if (isHydrating || !hasUnsavedChanges || isSaving) return

    setIsSaving(true)
    const snapshotAtSave = currentSnapshot
    try {
      // Parsear os nós e arestas do snapshot
      const flowData = JSON.parse(snapshotAtSave)
      
      // Chamar a action para salvar no banco de dados
      const result = await saveFlowNodes({
        funnelId,
        userId: user?.id,
        nodesData: {
          nodes: flowData.nodes,
          edges: flowData.edges,
        },
      })

      if (result.success) {
        setLastSavedSnapshot(snapshotAtSave)
        toast.success("Fluxo salvo com sucesso!")
        // Notifica outros colaboradores que o flow foi salvo
        broadcastFlowSaved(snapshotAtSave)
      } else {
        toast.error(result.error || "Não foi possível salvar o fluxo.")
      }
    } catch (error) {
      console.error("Erro ao salvar fluxo", error)
      toast.error("Não foi possível salvar o fluxo.")
    } finally {
      setIsSaving(false)
    }
  }, [currentSnapshot, funnelId, hasUnsavedChanges, isHydrating, isSaving, user?.id, broadcastFlowSaved])

  useEffect(() => {
    const actions = (
      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleSave}
          disabled={!canSave}
        >
          <Save className="w-4 h-4" />
          {isHydrating ? "Carregando..." : isSaving ? "Salvando..." : "Salvar Fluxo"}
        </Button>
      </div>
    )

    setPageHeader(
      "Editor de Fluxos",
      `Configure o funil #${funnelId}`,
      actions
    )
  }, [canSave, funnelId, handleBack, handleSave, isHydrating, isSaving, setPageHeader, isFullscreen])

  return (
    <div className="flex flex-1 overflow-hidden rounded-b-2xl bg-black">
      <div className={cn(
        "flex w-full max-h-[calc(100vh-5rem)] overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 max-h-full"
      )}>
        {/* Sidebar - Node Builder */}
        <div className={cn(
          "w-80 bg-black/40 p-4 overflow-y-auto space-y-4 shrink-0",
          isFullscreen && "hidden"
        )}>
          <div>
            <h2 className="font-semibold mb-4">Adicionar Nó</h2>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Nó</label>
                <Textarea
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault()
                      addNewNode()
                    }
                  }}
                  placeholder={"Ex: Email de boas-vindas\nMensagem curta\n- CTA para onboarding"}
                  className="bg-black/50 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use quebras de linha para subtítulos e prefixe com hífen (-) para listas. Ctrl/⌘+Enter confirma.
                </p>
              </div>
              <Button
                onClick={addNewNode}
                disabled={!nodeLabel.trim()}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Nó
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Editar Nó Selecionado</h3>
              {selectedNodeId && (
                <span className="text-[11px] uppercase tracking-wide text-white/40">
                  ID {selectedNodeId}
                </span>
              )}
            </div>

            {selectedNodeId ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/70">
                    Nome
                  </label>
                  <Textarea
                    value={selectedNodeLabel}
                    onChange={(event) => handleSelectedNodeLabelChange(event.target.value)}
                    placeholder="Nome do nó"
                    className="bg-black/40 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter cria uma nova linha; use hífen (-) para destacar bullets dentro do nó.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70">Alinhamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {alignmentOptions.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleAlignmentChange(item.value)}
                        className={cn(
                          "rounded-md border border-white/10 px-2 py-1 text-xs transition-colors",
                          selectedNodeAlignment === item.value
                            ? "bg-white/10 text-white"
                            : "bg-black/40 text-white/70 hover:text-white",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70">Cores</label>
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-white/70">
                    <label className="flex flex-col gap-1">
                      Fundo
                      <input
                        type="color"
                        value={selectedNodeBackground}
                        onChange={(event) => handleColorChange("backgroundColor", event.target.value)}
                        className="h-9 w-full cursor-pointer rounded border border-white/10 bg-black/30"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Texto
                      <input
                        type="color"
                        value={selectedNodeColor}
                        onChange={(event) => handleColorChange("color", event.target.value)}
                        className="h-9 w-full cursor-pointer rounded border border-white/10 bg-black/30"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/50">
                Selecione um nó no canvas para editar texto estruturado e o tipo nativo.
              </p>
            )}
          </div>

          {/* Info */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Nós totais:</strong> {nodes.length}
            </p>
            <p>
              <strong>Conexões:</strong> {edges.length}
            </p>
            <p className="mt-3">
              💡 <strong>Dica:</strong> Use múltiplas linhas para subtítulos, prefixe com hífen (-) para listas e Ctrl+Enter para criar rapidamente.
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative rf-theme-dark">
          {shouldShowSkeleton ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Carregando fluxo...
            </div>
          ) : (
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onMove={handleViewportChange}
                onInit={handleInit}
                fitView
                colorMode="dark"
              >
                <Background variant={BackgroundVariant.Dots} />
                <Controls />
                {/* Overlay de seleção dos colaboradores */}
                <NodeSelectionOverlay collaborators={collaborators} />
                {/* Painel de colaboração */}
                <Panel position="top-center" className="bg-card/80 backdrop-blur-sm border rounded-lg px-4 py-2">
                  <FlowCollaborators 
                    collaborators={collaborators}
                    isConnected={isCollabConnected}
                  />
                </Panel>
                {isFullscreen && (
                  <Panel position="top-left" className="bg-card border rounded-lg p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsFullscreen(false)}
                    >
                      <Minimize2 className="w-4 h-4" />
                      Sair de Tela Cheia
                    </Button>
                  </Panel>
                )}
              </ReactFlow>
            </ReactFlowProvider>
          )}
        </div>
      </div>
    </div>
  )
}
