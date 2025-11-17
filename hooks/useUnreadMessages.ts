import { useCallback, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type TeamMessageRow = Database['public']['Tables']['team_messages']['Row']

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isFocused, setIsFocused] = useState(true)

  // Rastrear focus da janela
  useEffect(() => {
    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const incrementUnread = useCallback(() => {
    setUnreadCount((prev) => prev + 1)
  }, [])

  const resetUnread = useCallback(() => {
    setUnreadCount(0)
  }, [])

  // Subscribir a novas mensagens via Realtime
  useEffect(() => {
    const client = createSupabaseBrowserClient()
    if (!client) return

    const channel = client
      .channel('team_messages_unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages' },
        (payload: RealtimePostgresChangesPayload<TeamMessageRow>) => {
          if (!payload.new) return
          const newMessage = payload.new as TeamMessageRow

          // Se a aba não está em foco, incrementa contador e notifica
          if (!isFocused) {
            incrementUnread()

            // Enviar notificação do navegador
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nova mensagem no chat', {
                body: `${newMessage.username}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
                icon: newMessage.avatar_url || undefined,
                tag: 'team-chat',
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      void channel.unsubscribe()
    }
  }, [isFocused, incrementUnread])

  return { unreadCount, resetUnread }
}
