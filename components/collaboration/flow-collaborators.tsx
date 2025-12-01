"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { FlowCollaborator } from "@/hooks/useFlowCollaboration"

interface FlowCollaboratorsProps {
  collaborators: FlowCollaborator[]
  isConnected: boolean
  className?: string
}

export function FlowCollaborators({ collaborators, isConnected, className }: FlowCollaboratorsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Indicador de conexão */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div 
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          )} 
        />
        <span>{isConnected ? "Colaboração ativa" : "Conectando..."}</span>
      </div>

      {/* Avatares dos colaboradores */}
      {collaborators.length > 0 && (
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground mr-2 border-l border-border pl-3">
            {collaborators.length} {collaborators.length === 1 ? "pessoa" : "pessoas"} editando
          </span>
          <TooltipProvider>
            <div className="flex -space-x-2">
              {collaborators.slice(0, 5).map((collab) => (
                <Tooltip key={collab.id}>
                  <TooltipTrigger asChild>
                    <Avatar 
                      className="h-7 w-7 border-2 border-background ring-2 shadow-lg cursor-default"
                      style={{ "--tw-ring-color": collab.color } as React.CSSProperties}
                    >
                      <AvatarImage src={collab.avatarUrl ?? undefined} alt={collab.name} />
                      <AvatarFallback 
                        className="text-xs font-medium text-white"
                        style={{ backgroundColor: collab.color }}
                      >
                        {collab.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {collab.name} está editando
                  </TooltipContent>
                </Tooltip>
              ))}
              {collaborators.length > 5 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium shadow-lg">
                      +{collaborators.length - 5}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {collaborators.slice(5).map((c) => c.name).join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}
