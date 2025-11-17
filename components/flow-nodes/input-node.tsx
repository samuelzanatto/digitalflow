"use client"

import { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { cn } from "@/lib/utils"

type InputNodeProps = {
  data: { label: string; value?: string; header?: string; meta?: string }
  isConnectable: boolean
  selected?: boolean
}

function InputNode(rawProps: unknown) {
  const { data, isConnectable, selected } = rawProps as InputNodeProps
  const headerText = (data.header || "Input").toUpperCase()
  const metaText = data.meta?.toUpperCase()

  return (
    <div
      className={cn(
        "rf-minimal-node rf-minimal-node--compact",
        selected && "rf-minimal-node--selected",
      )}
      data-node-variant="input"
    >
      <div className="rf-minimal-shell">
        <div className="rf-minimal-header">
          <span className="rf-minimal-header__title">{headerText}</span>
          {metaText && <span className="rf-minimal-header__meta">{metaText}</span>}
        </div>
        <div className="rf-minimal-body">
          <p className="rf-minimal-label text-left">{data.label}</p>
          {data.value && (
            <div className="rf-minimal-node__stat">
              <span>Valor</span>
              <strong>{data.value}</strong>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="rf-minimal-handle"
        data-variant="source"
      />
    </div>
  )
}

export default memo(InputNode)
