'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import type {
  AuthChangeEvent,
  RealtimePostgresChangesPayload,
  Session,
} from '@supabase/supabase-js'
import { formatRelative } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from '@/lib/supabase/client'
import { useUnreadMessages } from '@/contexts/unread-messages'
import { useCollaboration } from '@/contexts/collaboration-context'
import type { CursorMessageHistoryItem } from '@/hooks/useRealtimeCollaboration'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'

const MESSAGES_LIMIT = 200
const MAX_MESSAGE_LENGTH = 600
const TYPING_TIMEOUT = 3000 // 3 segundos sem digitar = parou de digitar

type TeamMessageRow = Database['public']['Tables']['team_messages']['Row']
type TeamMessageInsert = Database['public']['Tables']['team_messages']['Insert']

export type TeamMessage = TeamMessageRow

interface ChatIdentity {
  id: string
  name: string
  email?: string
  avatarUrl?: string | null
}

interface TypingUser {
  id: string
  name: string
  avatarUrl?: string | null
  timestamp: number
}

const formatAuthUser = (user: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
} | null): ChatIdentity | null => {
  if (!user) return null
  const metadata = user.user_metadata ?? {}
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : undefined
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined
  const fallbackName = user.email?.split('@')[0] ?? 'Membro Flow'

  return {
    id: user.id,
    name: fullName?.trim().length ? fullName : fallbackName,
    email: user.email,
    avatarUrl: avatarUrl ?? null,
  }
}

// Componente de animação de digitação (bolinhas)
function TypingDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  )
}

// Componente de indicador de digitação
function TypingIndicator({ typingUsers }: { typingUsers: TypingUser[] }) {
  if (typingUsers.length === 0) return null

  const names = typingUsers.map((u) => u.name.split(' ')[0])
  let text = ''
  
  if (names.length === 1) {
    text = `${names[0]} está digitando`
  } else if (names.length === 2) {
    text = `${names[0]} e ${names[1]} estão digitando`
  } else {
    text = `${names[0]} e mais ${names.length - 1} estão digitando`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 px-2"
    >
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="h-7 w-7 border-2 border-slate-900">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-primary/20 text-[10px] font-semibold uppercase text-primary">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-3 py-2 border border-slate-700/50">
        <span className="text-xs text-slate-400">{text}</span>
        <TypingDots />
      </div>
    </motion.div>
  )
}

export function TeamChat() {
  const [messages, setMessages] = useState<TeamMessageRow[]>([])
  const [pendingMessage, setPendingMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [identity, setIdentity] = useState<ChatIdentity | null>(null)
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())
  const listRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<SupabaseBrowserClient | null>(null)
  const typingChannelRef = useRef<ReturnType<SupabaseBrowserClient["channel"]> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const processedBroadcastsRef = useRef<Set<string>>(new Set())
  const { resetUnread } = useUnreadMessages()
  const { sendCursorMessage, messageHistory } = useCollaboration()

  const getSupabaseClient = () => {
    if (supabaseRef.current) return supabaseRef.current
    if (typeof window === 'undefined') return null
    supabaseRef.current = createSupabaseBrowserClient()
    return supabaseRef.current
  }

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return

    let mounted = true

    const hydrateIdentity = async () => {
      try {
        // Refresh session to ensure valid token
        const { error: refreshError } = await client.auth.refreshSession()
        if (refreshError) {
          console.warn('[team-chat] session refresh error:', refreshError.message)
        }
        
        const { data: { user } } = await client.auth.getUser()
        if (mounted) {
          setIdentity(formatAuthUser(user))
        }
      } catch (e) {
        console.error('[team-chat] hydrate error:', e)
      }
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setIdentity(formatAuthUser(session?.user ?? null))
      },
    )

    startTransition(() => {
      void hydrateIdentity()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadMessages = useCallback(async () => {
    const client = getSupabaseClient()
    if (!client) return
    setLoading(true)
    
    // Verify session is loaded
    const { data: { session }, error: authError } = await client.auth.getSession()
    
    if (authError || !session) {
      console.error('[team-chat] no session found:', authError?.message)
      toast.error('Sua sessão expirou. Por favor, faça login novamente.')
      setLoading(false)
      return
    }
    
    const { data, error } = await client
      .from('team_messages')
      .select('*')
      .order('inserted_at', { ascending: true })
      .limit(MESSAGES_LIMIT)

    if (error) {
      console.error('[team-chat] error loading messages:', {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      toast.error(`Erro ao carregar chat: ${error.message || 'Desconhecido'}`)
      setLoading(false)
      return
    }

    setMessages(data ?? [])
    setLoading(false)
    resetUnread() // Clear unread counter when user views messages
  }, [resetUnread])

  useEffect(() => {
    const handleFocus = () => {
      resetUnread()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [resetUnread])

  useEffect(() => {
    if (!identity) {
      // Aguardar identidade ser carregada antes de carregar mensagens
      return
    }
    
    startTransition(() => {
      void loadMessages()
    })
  }, [identity, loadMessages])

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return

    const channel = client
      .channel('team_messages_stream', {
        config: {
          broadcast: { self: false },
          presence: { key: identity?.id },
        },
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages' },
        (payload: RealtimePostgresChangesPayload<TeamMessageRow>) => {
          if (!payload.new) return
          const newMessage = payload.new as TeamMessageRow
          setMessages((prev) => {
            // Avoid duplicates by ID
            if (prev.find((m) => m.id === newMessage.id)) return prev
            
            // Also check for broadcast messages with same content/user
            // Remove temporary broadcast message if real one arrived
            const filtered = prev.filter((m) => {
              if (!m.id.startsWith('broadcast-')) return true
              // Remove broadcast message if it matches the new real message
              return !(m.user_id === newMessage.user_id && 
                       m.content === newMessage.content &&
                       Math.abs(new Date(m.inserted_at).getTime() - new Date(newMessage.inserted_at).getTime()) < 10000)
            })
            
            const next = [...filtered, newMessage]
            if (next.length > MESSAGES_LIMIT) {
              return next.slice(next.length - MESSAGES_LIMIT)
            }
            return next
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'team_messages' },
        (payload: RealtimePostgresChangesPayload<TeamMessageRow>) => {
          const oldMessage = payload.old as TeamMessageRow
          if (!oldMessage?.id) return
          setMessages((prev) => prev.filter((m) => m.id !== oldMessage.id))
        },
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          console.log('[team-chat] realtime subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[team-chat] realtime channel error')
        }
      })

    return () => {
      void channel.unsubscribe()
    }
  }, [identity])

  // Sincroniza mensagens do broadcast (messageHistory) com o chat
  // Isso garante que mensagens enviadas via Ctrl+M apareçam no chat
  // NOTA: Mensagens do banco (postgres_changes) já são tratadas separadamente
  // Aqui só tratamos mensagens de broadcast que ainda não chegaram pelo banco
  useEffect(() => {
    if (!identity) return

    messageHistory.forEach((msg: CursorMessageHistoryItem) => {
      // Ignora mensagens próprias (já foram adicionadas ao enviar)
      if (msg.isOwn) return
      
      // Verifica se já processamos essa mensagem
      if (processedBroadcastsRef.current.has(msg.messageId)) return
      processedBroadcastsRef.current.add(msg.messageId)

      // Verifica se a mensagem já existe no estado atual
      // Isso evita adicionar duplicatas quando o postgres_changes já trouxe a mensagem
      setMessages((prev) => {
        // Verifica duplicata por conteúdo e usuário (janela de 10 segundos)
        const isDuplicate = prev.some(
          (m) => m.user_id === msg.id && 
                 m.content === msg.message &&
                 Math.abs(new Date(m.inserted_at).getTime() - msg.timestamp) < 10000
        )
        if (isDuplicate) return prev

        // Cria uma mensagem temporária para exibição imediata
        const tempMessage: TeamMessageRow = {
          id: `broadcast-${msg.messageId}`,
          content: msg.message,
          username: msg.name,
          avatar_url: msg.avatarUrl || null,
          user_id: msg.id,
          inserted_at: new Date(msg.timestamp).toISOString(),
        }

        const next = [...prev, tempMessage]
        if (next.length > MESSAGES_LIMIT) {
          return next.slice(next.length - MESSAGES_LIMIT)
        }
        return next
      })
    })
  }, [messageHistory, identity])

  // Canal de broadcast para indicador de digitação
  useEffect(() => {
    const client = getSupabaseClient()
    if (!client || !identity) return

    const typingChannel = client.channel('team_chat_typing', {
      config: {
        broadcast: { self: false },
      },
    })

    typingChannelRef.current = typingChannel

    // Listener para eventos de typing
    typingChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const { userId, userName, userAvatar, isTyping } = payload as {
        userId: string
        userName: string
        userAvatar?: string | null
        isTyping: boolean
      }

      if (userId === identity.id) return

      setTypingUsers((prev) => {
        const updated = new Map(prev)
        if (isTyping) {
          updated.set(userId, {
            id: userId,
            name: userName,
            avatarUrl: userAvatar,
            timestamp: Date.now(),
          })
        } else {
          updated.delete(userId)
        }
        return updated
      })
    })

    typingChannel.subscribe()

    // Limpa usuários que pararam de digitar (timeout de segurança)
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setTypingUsers((prev) => {
        const updated = new Map(prev)
        let hasChanges = false
        prev.forEach((user, id) => {
          if (now - user.timestamp > TYPING_TIMEOUT) {
            updated.delete(id)
            hasChanges = true
          }
        })
        return hasChanges ? updated : prev
      })
    }, 1000)

    return () => {
      clearInterval(cleanupInterval)
      void typingChannel.unsubscribe()
      typingChannelRef.current = null
    }
  }, [identity])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, typingUsers])

  // Broadcast typing status
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (!typingChannelRef.current || !identity) return
    if (isTypingRef.current === isTyping) return // Evita broadcasts repetidos
    
    isTypingRef.current = isTyping
    
    void typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: identity.id,
        userName: identity.name,
        userAvatar: identity.avatarUrl,
        isTyping,
      },
    })
  }, [identity])

  // Handle text change com typing indicator
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setPendingMessage(value)

    // Broadcast typing
    if (value.trim().length > 0) {
      broadcastTyping(true)
      
      // Reset timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false)
      }, TYPING_TIMEOUT)
    } else {
      broadcastTyping(false)
    }
  }, [broadcastTyping])

  const handleSend = async () => {
    if (!pendingMessage.trim() || sending) return
    if (!identity) {
      toast.error('Carregando os dados do usuário...')
      return
    }

    // Para de digitar ao enviar
    broadcastTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    setSending(true)
    const payload: TeamMessageInsert = {
      content: pendingMessage.trim().slice(0, MAX_MESSAGE_LENGTH),
      username: identity.name,
      avatar_url: identity.avatarUrl || null,
      user_id: identity.id,
    }

    const client = getSupabaseClient()
    if (!client) {
      toast.error('Cliente do chat ainda não carregou. Recarregue a página e tente novamente.')
      setSending(false)
      return
    }

    // Supabase typings com SSR ainda não inferem corretamente o insert, então suprimimos o any aqui.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client.from('team_messages') as any).insert([payload]).select()
    
    if (error) {
      console.error('[team-chat] error sending message:', {
        code: error.code,
        message: error.message,
      })
      toast.error('Falha ao enviar mensagem. Tente novamente.')
    } else if (data && data.length > 0) {
      // Add message immediately without waiting for realtime
      setMessages((prev) => [...prev, data[0]])
      // Também envia para o sistema de mensagens flutuantes de colaboração
      // skipPersist=true porque já salvamos no banco acima
      sendCursorMessage(payload.content, true)
      setPendingMessage('')
    }
    setSending(false)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSend()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
    // Allow Shift+Enter to add a new line (default behavior)
    // No need to handle it explicitly
  }

  const renderMessages = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-300">
          Carregando histórico do time...
        </div>
      )
    }

    if (!messages.length) {
      return (
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
          Comece a conversa enviando a primeira mensagem!
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwn = message.user_id && identity?.id && message.user_id === identity.id
          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isOwn && 'flex-row-reverse text-right')}
            >
              <Avatar className="h-10 w-10 border border-white/10">
                {message.avatar_url && <AvatarImage src={message.avatar_url} alt={message.username} />}
                <AvatarFallback className="bg-primary/20 text-xs font-semibold uppercase text-primary">
                  {message.username
                    .split(' ')
                    .map((piece) => piece[0]?.toUpperCase() ?? '')
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  'max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-lg shadow-black/40',
                  isOwn 
                    ? 'bg-white/90 text-slate-900 border border-white/20' 
                    : 'bg-slate-800 text-slate-50 border border-slate-700/50',
                )}
              >
                <div className={cn('mb-2 text-xs font-bold uppercase tracking-wide', isOwn ? 'text-slate-700' : 'text-slate-300')}>
                  {message.username}
                </div>
                <p className={cn('whitespace-pre-line text-sm leading-relaxed', isOwn ? 'text-slate-800' : 'text-slate-100')}>
                  {message.content}
                </p>
                <div className={cn('mt-2 text-xs uppercase tracking-wider', isOwn ? 'text-slate-600' : 'text-slate-400')}>
                  {formatRelative(new Date(message.inserted_at), new Date(), { locale: ptBR })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-8">
        {renderMessages()}
        
        {/* Indicador de digitação */}
        <AnimatePresence>
          {typingUsers.size > 0 && (
            <div className="mt-4">
              <TypingIndicator typingUsers={Array.from(typingUsers.values())} />
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-slate-700/50 px-6 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={pendingMessage}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Escreva uma mensagem para sua equipe..."
            className="min-h-[100px] resize-none border-slate-600/50 bg-slate-900/60 text-slate-100 placeholder-slate-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-400">
            <span>
              {pendingMessage.trim().length}/{MAX_MESSAGE_LENGTH} caracteres
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600/50 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                onClick={() => {
                  setPendingMessage('')
                  broadcastTyping(false)
                }}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={!pendingMessage.trim() || sending || !identity}
                className="bg-white/90 text-slate-900 hover:bg-white font-semibold disabled:opacity-50 disabled:bg-white/50 disabled:text-slate-900"
              >
                {sending ? 'Enviando...' : 'Enviar mensagem'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
