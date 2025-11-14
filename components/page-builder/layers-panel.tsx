'use client'

import React from 'react'
import { useEditor } from '@craftjs/core'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LayersPanel() {
  const { rootNodeId, nodes, selectedNodeId } = useEditor((state) => {
    const nodesArray = Object.entries(state.nodes)
    const root = nodesArray.find(([, node]) => !(node as Record<string, unknown>).parent)
    const selected = Array.from(state.events.selected)

    return {
      rootNodeId: root?.[0],
      nodes: state.nodes,
      selectedNodeId: selected.length > 0 ? selected[0] : null,
    }
  })

  return (
    <div className="h-full flex flex-col border-r bg-card">
      <div className="px-4 py-3 border-b bg-background">
        <h2 className="text-sm font-semibold">Camadas</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rootNodeId && (
          <LayerTree
            nodeId={rootNodeId}
            nodes={nodes as Record<string, unknown>}
            selectedNodeId={selectedNodeId}
          />
        )}
      </div>
    </div>
  )
}

interface LayerTreeProps {
  nodeId: string
  nodes: Record<string, unknown>
  selectedNodeId: string | null
}

function LayerTree({ nodeId, nodes, selectedNodeId }: LayerTreeProps) {
  const [expanded, setExpanded] = React.useState(true)
  const { actions } = useEditor()

  const node = (nodes[nodeId] as Record<string, unknown>) || {}
  const children = (node.nodes as string[]) || []
  const data = node.data as Record<string, unknown>
  const displayName = ((data?.displayName as string) || 'Elemento') || ''
  const isSelected = selectedNodeId === nodeId

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group transition-colors ${
          isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent'
        }`}
        onClick={() => actions.selectNode(nodeId)}
      >
        {/* Expand Arrow */}
        {children.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0 hover:bg-accent rounded"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? '' : '-rotate-90'}`} />
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Layer Name */}
        <span className="text-sm flex-1 truncate font-medium">{displayName}</span>

        {/* Delete Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            actions.delete(nodeId)
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div>
          {children.map((childId: string) => (
            <LayerTree key={childId} nodeId={childId} nodes={nodes} selectedNodeId={selectedNodeId} />
          ))}
        </div>
      )}
    </div>
  )
}
