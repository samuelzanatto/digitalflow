"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CollaboratorPresence } from "@/hooks/useRealtimeCollaboration"
import { cn } from "@/lib/utils"

interface SidebarCollaboratorAvatarsProps {
  collaborators: CollaboratorPresence[]
  maxVisible?: number
  size?: "sm" | "md"
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

export function SidebarCollaboratorAvatars({ 
  collaborators, 
  maxVisible = 3,
  size = "sm",
  className 
}: SidebarCollaboratorAvatarsProps) {
  if (collaborators.length === 0) return null

  const visible = collaborators.slice(0, maxVisible)
  const extra = collaborators.slice(maxVisible)
  const extraCount = extra.length

  const sizeClasses = {
    sm: "h-5 w-5 text-[7px]",
    md: "h-6 w-6 text-[9px]",
  }

  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {visible.map((collaborator) => (
        <TooltipProvider key={collaborator.id} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar 
                  className={cn(
                    sizeClasses[size],
                    "border-2 border-sidebar ring-0 transition-transform hover:scale-110 hover:z-10"
                  )}
                  style={{ borderColor: collaborator.color }}
                >
                  <AvatarImage src={collaborator.avatarUrl ?? undefined} alt={collaborator.name} />
                  <AvatarFallback 
                    className="font-semibold text-white"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {getInitials(collaborator.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Indicador de atividade */}
                <span 
                  className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-sidebar"
                  style={{ backgroundColor: collaborator.color }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <p className="font-medium">{collaborator.name}</p>
              <p className="text-muted-foreground">Navegando aqui</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {extraCount > 0 && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={cn(sizeClasses[size], "border-2 border-sidebar")}>
                <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
                  +{extraCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              <p className="font-medium mb-1">Também navegando:</p>
              <ul className="space-y-0.5">
                {extra.map((c) => (
                  <li key={c.id} className="text-muted-foreground">{c.name}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
