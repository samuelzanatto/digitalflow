"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCollaboration } from "@/contexts/collaboration-context"

interface DashboardCardProps {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  /**
   * Path que identifica este card para mostrar avatares de colaboradores
   * que estão visualizando este item específico
   */
  itemPath?: string
}

interface DashboardCardHeaderProps {
  children?: React.ReactNode
  className?: string
  icon?: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
}

interface DashboardCardContentProps {
  children?: React.ReactNode
  className?: string
}

interface DashboardCardFooterProps {
  children?: React.ReactNode
  className?: string
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
}

interface DashboardCardActionsProps {
  children?: React.ReactNode
}

const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ children, className, onClick, itemPath }, ref) => {
    const { collaborators } = useCollaboration()
    
    // Filtra colaboradores que estão visualizando este item específico
    const viewingCollaborators = itemPath
      ? collaborators.filter((c) => c.currentPath === itemPath)
      : []

    return (
      <div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onClick()
          }
        }}
        className={cn(
          "h-[220px] rounded-3xl transition-all duration-300 group relative",
          "bg-black/70 border border-white/10",
          "hover:shadow-xl hover:border-primary/50",
          onClick && "cursor-pointer",
          viewingCollaborators.length > 0 && "ring-2 ring-offset-2 ring-offset-background",
          className
        )}
        style={viewingCollaborators.length > 0 ? { 
          "--tw-ring-color": viewingCollaborators[0]?.color 
        } as React.CSSProperties : undefined}
      >
        {/* Avatares dos colaboradores visualizando este card */}
        {viewingCollaborators.length > 0 && (
          <div className="absolute -top-2 -right-2 z-50 flex -space-x-2">
            <TooltipProvider>
              {viewingCollaborators.slice(0, 3).map((collaborator) => (
                <Tooltip key={collaborator.id}>
                  <TooltipTrigger asChild>
                    <Avatar 
                      className="h-7 w-7 border-2 border-background ring-2 shadow-lg cursor-default"
                      style={{ "--tw-ring-color": collaborator.color } as React.CSSProperties}
                    >
                      <AvatarImage src={collaborator.avatarUrl ?? undefined} alt={collaborator.name} />
                      <AvatarFallback 
                        className="text-xs font-medium text-white"
                        style={{ backgroundColor: collaborator.color }}
                      >
                        {collaborator.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {collaborator.name} está visualizando
                  </TooltipContent>
                </Tooltip>
              ))}
              {viewingCollaborators.length > 3 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium shadow-lg">
                      +{viewingCollaborators.length - 3}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {viewingCollaborators.slice(3).map((c) => c.name).join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        )}
        <div className="p-6 h-full flex flex-col">{children}</div>
      </div>
    )
  }
)
DashboardCard.displayName = "DashboardCard"

const DashboardCardHeader = React.forwardRef<HTMLDivElement, DashboardCardHeaderProps>(
  ({ className, icon, title, description, actions }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-start justify-between gap-4", className)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <span className="text-primary shrink-0">{icon}</span>
            )}
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
    )
  }
)
DashboardCardHeader.displayName = "DashboardCardHeader"

const DashboardCardContent = React.forwardRef<HTMLDivElement, DashboardCardContentProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex-1 py-3", className)}>
        {children}
      </div>
    )
  }
)
DashboardCardContent.displayName = "DashboardCardContent"

const DashboardCardFooter = React.forwardRef<HTMLDivElement, DashboardCardFooterProps>(
  ({ children, className, leftContent, rightContent }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between pt-3 border-t border-white/5 mt-auto",
          className
        )}
      >
        {leftContent && (
          <div className="flex flex-col text-xs text-muted-foreground">
            {leftContent}
          </div>
        )}
        {rightContent && <div>{rightContent}</div>}
        {children}
      </div>
    )
  }
)
DashboardCardFooter.displayName = "DashboardCardFooter"

const DashboardCardActions = React.forwardRef<HTMLDivElement, DashboardCardActionsProps>(
  ({ children }, ref) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="rounded-full border border-white/10 p-1.5 text-white/60 hover:text-white hover:border-white/30 transition-colors shrink-0"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-40"
          onClick={(e) => e.stopPropagation()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
DashboardCardActions.displayName = "DashboardCardActions"

export {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardCardFooter,
  DashboardCardActions,
}
