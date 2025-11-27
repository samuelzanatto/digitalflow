"use client"

import { memo, useCallback } from "react"
import { Handle, Position, NodeToolbar, useReactFlow } from "@xyflow/react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

function EditableNode(props: Record<string, unknown>) {
  const { id, data, selected, isConnectable } = props as {
    id: string
    data: {
      label: React.ReactNode
      rawLabel?: string
      value?: number
      description?: string
    }
    selected?: boolean
    isConnectable: boolean
  }

  const { setNodes, setEdges } = useReactFlow()

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id))
  }, [id, setEdges, setNodes])

  return (
    <>
      {/* Botão de delete centralizado acima do node */}
      <NodeToolbar
        position={Position.Top}
        isVisible={selected}
        align="center"
        offset={8}
        className="bg-transparent! border-0! shadow-none! p-0!"
      >
        <button
          type="button"
          aria-label="Remover nó"
          onClick={handleDelete}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </NodeToolbar>

      <div
        className={cn(
          "rf-minimal-node",
          selected && "rf-minimal-node--selected",
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="rf-minimal-handle"
          data-variant="target"
        />
        
        <div className="rf-minimal-shell">
          <div className="rf-minimal-body">
            {/* Renderiza o label estruturado (JSX) */}
            {data.label}

            {data.description && (
              <p className="text-xs text-white/60 leading-snug mt-1">
                {data.description}
              </p>
            )}
          </div>

          {data.value !== undefined && (
            <div className="rf-minimal-node__stat">
              <span>Valor</span>
              <strong>{data.value}</strong>
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="rf-minimal-handle"
          data-variant="source"
        />
      </div>
    </>
  )
}

export default memo(EditableNode)
