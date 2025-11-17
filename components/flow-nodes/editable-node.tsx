"use client"

import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeToolbar, NodeResizer, useReactFlow } from "@xyflow/react"
import { Trash2, Copy, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

function EditableNode(props: Record<string, unknown>) {
  const { id, data, selected, isConnectable } = props as {
    id: string
    data: {
      label: string
      value?: number
      header?: string
      meta?: string
      description?: string
    }
    selected?: boolean
    isConnectable: boolean
  }

  const { setNodes, setEdges, getNode, addNodes } = useReactFlow()

  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(() => data.label || "Nó")

  const handleLabelChange = useCallback((newLabel: string) => {
    setLabel(newLabel)
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label: newLabel } } : node,
      ),
    )
  }, [id, setNodes])

  const toggleEdit = useCallback(() => {
    setIsEditing((prev) => !prev)
  }, [])

  const handleDuplicate = useCallback(() => {
    const current = getNode(id)
    if (!current) return

    const cloneId = `${current.id}-${Math.random().toString(16).slice(2, 6)}`

    addNodes({
      ...current,
      id: cloneId,
      position: {
        x: current.position.x + 48,
        y: current.position.y + 48,
      },
      selected: false,
      data: {
        ...current.data,
        label: `${(current.data as { label?: string })?.label ?? "Nó"} (cópia)`
      },
    })
  }, [addNodes, getNode, id])

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id))
  }, [id, setEdges, setNodes])

  const headerText = (data.header || "Step").toUpperCase()
  const metaText = data.meta?.toUpperCase()

  const toolbarActions = [
    { icon: Settings, label: "Editar nó", handler: toggleEdit },
    { icon: Copy, label: "Duplicar nó", handler: handleDuplicate },
    { icon: Trash2, label: "Remover nó", handler: handleDelete, destructive: true },
  ]

  return (
    <>
      <NodeResizer
        minWidth={160}
        minHeight={72}
        isVisible={selected}
        color="#94a3b8"
        handleClassName="rf-minimal-resizer-handle"
        lineClassName="rf-minimal-resizer-line"
      />

      <NodeToolbar
        position={Position.Top}
        isVisible={selected}
        align="end"
        className="rf-minimal-toolbar"
      >
        {toolbarActions.map(({ icon: Icon, handler, label: actionLabel, destructive }) => (
          <button
            key={actionLabel}
            type="button"
            aria-label={actionLabel}
            onClick={handler}
            className={cn(
              "rf-minimal-toolbar__button",
              destructive && "rf-minimal-toolbar__button--danger",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        ))}
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
          <div className="rf-minimal-header">
            <span className="rf-minimal-header__title">{headerText}</span>
            {metaText && <span className="rf-minimal-header__meta">{metaText}</span>}
          </div>

          <div className="rf-minimal-body">
            {isEditing ? (
              <input
                value={label}
                onChange={(event) => handleLabelChange(event.target.value)}
                onBlur={toggleEdit}
                autoFocus
                className="rf-minimal-input"
              />
            ) : (
              <button
                type="button"
                onClick={toggleEdit}
                className="rf-minimal-label"
              >
                {label}
              </button>
            )}

            {data.description && (
              <p className="text-xs text-white/60 leading-snug">
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
