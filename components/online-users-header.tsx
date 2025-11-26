"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useOnlineUsers, type OnlineUser } from "@/contexts/online-users-context"
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

function AvatarItem({ user }: { user: OnlineUser }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700/50">
            <Avatar className="h-6 w-6 border border-slate-600/50">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/20 text-[10px] font-semibold uppercase text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-24 truncate">{user.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p className="font-medium">{user.name}</p>
          {user.email && <p className="text-muted-foreground">{user.email}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function OnlineUsersHeader({ className }: { className?: string }) {
  const { onlineUsers, isConnected } = useOnlineUsers()

  if (!isConnected) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Conectando...
        </span>
      </div>
    )
  }

  if (onlineUsers.length === 0) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Ninguém online
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Online agora
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {onlineUsers.map((user) => (
          <AvatarItem key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
