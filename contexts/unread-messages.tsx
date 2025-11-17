'use client'

import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type TeamMessageRow = Database['public']['Tables']['team_messages']['Row']

interface UnreadMessagesContextType {
  unreadCount: number
  resetUnread: () => void
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined)

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isFocused, setIsFocused] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default'
    return Notification.permission
  })
  const pathname = usePathname()
  const isViewingChat = pathname?.startsWith('/dashboard/equipe') ?? false

  // Rastrear focus da janela
  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true)
    }
    const handleBlur = () => {
      setIsFocused(false)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const resetUnread = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const incrementUnread = useCallback(() => {
    setUnreadCount((prev) => prev + 1)
  }, [])

  // Solicitar permissão somente após interação do usuário, conforme orientações da Notifications API
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission !== 'default') {
      return
    }

    const requestPermission = async () => {
      try {
        const result = await Notification.requestPermission()
        setPermission(result)
      } catch (error) {
        console.error('[unread-messages] notification permission error:', error)
      }
    }

    const handleFirstInteraction = () => {
      void requestPermission()
    }

    document.addEventListener('pointerdown', handleFirstInteraction, { once: true })
    document.addEventListener('keydown', handleFirstInteraction, { once: true })

    return () => {
      document.removeEventListener('pointerdown', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  // Subscribir a novas mensagens via Realtime
  useEffect(() => {
    if (typeof window === 'undefined') return
    const supportsNotifications = 'Notification' in window

    const client = createSupabaseBrowserClient()
    if (!client) return

    const channel = client
      .channel('team_messages_notifications', {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages' },
        (payload: RealtimePostgresChangesPayload<TeamMessageRow>) => {
          if (!payload.new) return
          const newMessage = payload.new as TeamMessageRow

          const shouldIncrement = !isViewingChat || !isFocused

          if (shouldIncrement) {
            incrementUnread()
          }

          const shouldNotify = (!isViewingChat || !isFocused) && supportsNotifications && permission === 'granted'

          if (shouldNotify) {
            const notification = new Notification('Nova mensagem no chat da equipe', {
              body: `${newMessage.username}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
              icon: newMessage.avatar_url || '/icons/chat.svg',
              tag: 'team-chat-notification',
              badge: '/icons/chat.svg',
            })

            // Focar na aba ao clicar na notificação
            notification.onclick = () => {
              window.focus()
            }
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[unread-messages] notification channel subscribed')
        }
      })

    return () => {
      void channel.unsubscribe()
    }
  }, [isFocused, incrementUnread, isViewingChat, permission])

  // Reset contador será feito diretamente no componente do chat quando ele estiver ativo

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, resetUnread }}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext)
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider')
  }
  return context
}
