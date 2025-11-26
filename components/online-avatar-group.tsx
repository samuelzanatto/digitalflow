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

const MAX_VISIBLE_AVATARS = 4

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

function OnlineIndicator() {
  return (
    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
  )
}

function AvatarItem({ user, showIndicator = false }: { user: OnlineUser; showIndicator?: boolean }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className="h-7 w-7 border-2 border-sidebar ring-0 transition-transform hover:scale-110 hover:z-10">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {showIndicator && <OnlineIndicator />}
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

function ExtraAvatarsIndicator({ count, users }: { count: number; users: OnlineUser[] }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className="h-7 w-7 border-2 border-sidebar ring-0 cursor-default">
              <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                +{count}
              </AvatarFallback>
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p className="font-medium mb-1">Também online:</p>
          <ul className="space-y-0.5">
            {users.map((user) => (
              <li key={user.id} className="text-muted-foreground">
                {user.name}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function OnlineAvatarGroup({ className }: { className?: string }) {
  const { onlineUsers, isConnected } = useOnlineUsers()

  // Não mostrar nada se não estiver conectado ou não houver usuários
  if (!isConnected || onlineUsers.length === 0) {
    return null
  }

  const visibleUsers = onlineUsers.slice(0, MAX_VISIBLE_AVATARS)
  const extraUsers = onlineUsers.slice(MAX_VISIBLE_AVATARS)
  const extraCount = extraUsers.length

  return (
    <div className={cn("flex items-center justify-end", className)}>
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <AvatarItem 
            key={user.id} 
            user={user} 
            showIndicator={index === 0} 
          />
        ))}
        {extraCount > 0 && (
          <ExtraAvatarsIndicator count={extraCount} users={extraUsers} />
        )}
      </div>
    </div>
  )
}
