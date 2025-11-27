"use client"

import { createContext, useContext, useEffect, useRef, ReactNode } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"
import { toast } from "sonner"
import { usePathname } from "next/navigation"
import { IconMessageCircle } from "@tabler/icons-react"
import type { RealtimeChannel } from "@supabase/supabase-js"

type ChatSessionRow = Database['public']['Tables']['ChatSession']['Row']

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatNotificationsContextValue {
  // Pode ser expandido no futuro
}

const ChatNotificationsContext = createContext<ChatNotificationsContextValue>({})

export const useChatNotifications = () => useContext(ChatNotificationsContext)

export function ChatNotificationsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Não mostrar notificações na própria página de chat
    if (pathname === '/dashboard/chat') return

    // Inicializar cliente Supabase
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient()
    }
    
    const supabase = supabaseRef.current

    console.log('[Chat Notifications] Configurando listener global...')

    // Canal para novas sessões de chat
    const channel = supabase
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ChatSession' 
        },
        (payload) => {
          const newSession = payload.new as ChatSessionRow
          console.log('[Chat Notifications] Nova sessão detectada:', newSession)
          
          if (newSession.status === 'waiting') {
            // Tocar som de notificação (opcional)
            try {
              const audio = new Audio('/notification.mp3')
              audio.volume = 0.5
              audio.play().catch(() => {})
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) {
              // Ignorar erro se não houver arquivo de áudio
            }
            
            toast.info('Novo cliente aguardando!', {
              description: `${newSession.visitorName} entrou na fila de atendimento`,
              duration: 10000,
              icon: <IconMessageCircle className="w-5 h-5 text-primary" />,
              action: {
                label: 'Atender',
                onClick: () => {
                  window.location.href = '/dashboard/chat'
                }
              }
            })
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Chat Notifications] Status:', status, err)
        if (status === 'SUBSCRIBED') {
          console.log('[Chat Notifications] Listener global ativo!')
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[Chat Notifications] Removendo listener global')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [pathname])

  return (
    <ChatNotificationsContext.Provider value={{}}>
      {children}
    </ChatNotificationsContext.Provider>
  )
}
