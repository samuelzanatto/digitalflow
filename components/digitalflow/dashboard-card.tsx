"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardCardProps {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
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
  ({ children, className, onClick }, ref) => {
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
          "h-[220px] rounded-3xl transition-all duration-300 group overflow-hidden",
          "bg-black/70 border border-white/10",
          "hover:shadow-xl hover:border-primary/50",
          onClick && "cursor-pointer",
          className
        )}
      >
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
        <DropdownMenuContent align="end" className="w-40">
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
