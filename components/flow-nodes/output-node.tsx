"use client"

import { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"

type OutputNodeProps = {
  data: { label: string; value?: string; header?: string; meta?: string }
  isConnectable: boolean
  selected?: boolean
}

function OutputNode(rawProps: unknown) {
  const { data, isConnectable, selected } = rawProps as OutputNodeProps
  const headerText = (data.header || "Output").toUpperCase()
  const metaText = data.meta?.toUpperCase()

  return (
    <div
      className={cn(
        "rf-minimal-node rf-minimal-node--compact",
        selected && "rf-minimal-node--selected",
      )}
      data-node-variant="output"
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
          <p className="rf-minimal-label text-left">{data.label}</p>
          {data.value && (
            <div className="rf-minimal-node__stat">
              <span>Resultado</span>
              <strong>{data.value}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(OutputNode)
