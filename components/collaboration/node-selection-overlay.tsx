"use client"

import { memo, useMemo } from "react"
import { useNodes, useViewport, useStore, Panel } from "@xyflow/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { FlowCollaborator } from "@/hooks/useFlowCollaboration"

interface NodeSelectionOverlayProps {
  collaborators: FlowCollaborator[]
}

function NodeSelectionOverlayInner({ collaborators }: NodeSelectionOverlayProps) {
  const nodes = useNodes()
  const viewport = useViewport()
  const { width: containerWidth, height: containerHeight } = useStore((state) => ({
    width: state.width,
    height: state.height,
  }))
  
  // Filtra colaboradores que têm nós selecionados
  const selectionsWithNodes = useMemo(() => {
    return collaborators
      .filter((collab) => collab.selectedNodeId)
      .map((collab) => {
        const node = nodes.find((n) => n.id === collab.selectedNodeId)
        if (!node) return null
        
        return {
          collaborator: collab,
          node,
        }
      })
      .filter(Boolean) as Array<{
        collaborator: FlowCollaborator
        node: {
          id: string
          position: { x: number; y: number }
          measured?: { width?: number; height?: number }
          width?: number
          height?: number
        }
      }>
  }, [collaborators, nodes])
  
  if (selectionsWithNodes.length === 0) {
    return null
  }
  
  return (
    <Panel 
      position="top-left"
      className="absolute! inset-0! m-0! p-0! pointer-events-none bg-transparent!"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {selectionsWithNodes.map(({ collaborator, node }) => {
        // Calcula posição do nó considerando o viewport (pan e zoom)
        const nodeWidth = node.measured?.width || node.width || 200
        const nodeHeight = node.measured?.height || node.height || 100
        
        const x = node.position.x * viewport.zoom + viewport.x
        const y = node.position.y * viewport.zoom + viewport.y
        const width = nodeWidth * viewport.zoom
        const height = nodeHeight * viewport.zoom
        
        const color = collaborator.color || "#3b82f6"
        const initials = (collaborator.name || "U").slice(0, 2).toUpperCase()
        
        return (
          <div
            key={`selection-${collaborator.id}-${node.id}`}
            className="absolute transition-all duration-150 ease-out"
            style={{
              left: x - 4,
              top: y - 4,
              width: width + 8,
              height: height + 8,
            }}
          >
            {/* Borda de seleção */}
            <div
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                border: `2px solid ${color}`,
                boxShadow: `0 0 12px ${color}40, inset 0 0 8px ${color}20`,
              }}
            />
            
            {/* Avatar do colaborador */}
            <div
              className="absolute -top-3 -right-3 pointer-events-auto"
              style={{ transform: "scale(0.9)" }}
            >
              <Avatar
                className="h-6 w-6 border-2"
                style={{ borderColor: color }}
              >
                <AvatarImage src={collaborator.avatarUrl || undefined} />
                <AvatarFallback
                  className="text-[10px] font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Nome do colaborador */}
            <div
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              {collaborator.name}
            </div>
          </div>
        )
      })}
    </Panel>
  )
}

// Wrapper que garante que o componente só renderize dentro do ReactFlow
function NodeSelectionOverlay(props: NodeSelectionOverlayProps) {
  return <NodeSelectionOverlayInner {...props} />
}

export default memo(NodeSelectionOverlay)
