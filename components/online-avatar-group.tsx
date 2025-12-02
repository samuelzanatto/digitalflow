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

const DEFAULT_MAX_AVATARS = 4

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
          <div className="relative">
            <Avatar className="h-6 w-6 border-2 border-sidebar ring-0 transition-transform hover:scale-110 hover:z-10">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
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

interface OnlineAvatarGroupProps {
  className?: string
  maxAvatars?: number
}

export function OnlineAvatarGroup({ className, maxAvatars = DEFAULT_MAX_AVATARS }: OnlineAvatarGroupProps) {
  const { onlineUsers, isConnected } = useOnlineUsers()

  // Não mostrar nada se não estiver conectado ou não houver usuários
  if (!isConnected || onlineUsers.length === 0) {
    return null
  }

  const visibleUsers = onlineUsers.slice(0, maxAvatars)
  const extraUsers = onlineUsers.slice(maxAvatars)
  const extraCount = extraUsers.length

  return (
    <div className={cn("flex items-center shrink-0", className)}>
      <div className="flex">
        {extraCount > 0 && (
          <div className="-mr-1">
            <ExtraAvatarsIndicator count={extraCount} users={extraUsers} />
          </div>
        )}
        {visibleUsers.map((user, index) => (
          <div key={user.id} className={index > 0 ? "-ml-1" : ""}>
            <AvatarItem user={user} />
          </div>
        ))}
      </div>
    </div>
  )
}
