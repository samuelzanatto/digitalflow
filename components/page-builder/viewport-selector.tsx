'use client'

import React from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { useViewport, ViewportMode, VIEWPORT_CONFIGS } from '@/contexts/viewport-context'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const VIEWPORT_ICONS = {
  monitor: Monitor,
  tablet: Tablet,
  smartphone: Smartphone,
}

interface ViewportSelectorProps {
  className?: string
}

export function ViewportSelector({ className }: ViewportSelectorProps) {
  const { currentViewport, setViewport, config } = useViewport()

  const viewportModes: ViewportMode[] = ['desktop', 'tablet', 'mobile']

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1 bg-muted/50 rounded-lg p-1', className)}>
        {viewportModes.map((mode) => {
          const modeConfig = VIEWPORT_CONFIGS[mode]
          const Icon = VIEWPORT_ICONS[modeConfig.icon]
          const isActive = currentViewport === mode

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewport(mode)}
                  className={cn(
                    'p-2 rounded-md transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{modeConfig.label}</p>
                <p className="text-muted-foreground">
                  {modeConfig.width} × {modeConfig.height}px
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}

        {/* Indicador de tamanho atual */}
        <div className="ml-2 px-2 py-1 text-[10px] text-muted-foreground border-l">
          {config.width}px
        </div>
      </div>
    </TooltipProvider>
  )
}
