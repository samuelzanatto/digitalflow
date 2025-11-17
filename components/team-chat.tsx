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
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'

const MESSAGES_LIMIT = 200
const MAX_MESSAGE_LENGTH = 600

type TeamMessageRow = Database['public']['Tables']['team_messages']['Row']
type TeamMessageInsert = Database['public']['Tables']['team_messages']['Insert']

export type TeamMessage = TeamMessageRow

interface ChatIdentity {
  id: string
  name: string
  email?: string
  avatarUrl?: string | null
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

export function TeamChat() {
  const [messages, setMessages] = useState<TeamMessageRow[]>([])
  const [pendingMessage, setPendingMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [identity, setIdentity] = useState<ChatIdentity | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<ChatIdentity[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<SupabaseBrowserClient | null>(null)

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
  }, [])

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
            // Avoid duplicates
            if (prev.find((m) => m.id === newMessage.id)) return prev
            const next = [...prev, newMessage]
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

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!identity) return
    const client = getSupabaseClient()
    if (!client) return

    const channel = client.channel('team_online_presence', {
      config: {
        presence: {
          key: identity.id,
        },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      type PresencePayload = ChatIdentity & { presence_ref: string }
      const state = channel.presenceState<PresencePayload>()
      const unique = new Map<string, ChatIdentity>()

      Object.values(state).forEach((entries) => {
        entries.forEach((rest) => {
          if (rest.id) {
            unique.set(rest.id, {
              id: rest.id,
              name: rest.name,
              email: rest.email,
              avatarUrl: rest.avatarUrl,
            })
          }
        })
      })

      setOnlineUsers(Array.from(unique.values()))
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({
          id: identity.id,
          name: identity.name,
          email: identity.email,
          avatarUrl: identity.avatarUrl ?? undefined,
        })
      }
    })

    return () => {
      void client.removeChannel(channel)
    }
  }, [identity])

  const handleSend = async () => {
    if (!pendingMessage.trim() || sending) return
    if (!identity) {
      toast.error('Carregando os dados do usuário...')
      return
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
      setPendingMessage('')
      toast.success('Mensagem enviada!')
    }
    setSending(false)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSend()
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

  const renderOnlineUsers = () => {
    if (!onlineUsers.length) {
      return <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Ninguém online</span>
    }

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Online agora</span>
        <div className="flex items-center gap-2">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-200">
              <Avatar className="h-6 w-6 border border-slate-600/50">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary/20 text-[10px] font-semibold uppercase text-primary">
                  {user.name
                    .split(' ')
                    .map((piece) => piece[0]?.toUpperCase() ?? '')
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-1 flex-col overflow-hidden rounded-3xl bg-zinc-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-end border-b border-white/5 px-6 py-4">
        {renderOnlineUsers()}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-8">
        {renderMessages()}
      </div>

      <div className="border-t border-slate-700/50 px-6 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={pendingMessage}
            onChange={(event) => setPendingMessage(event.target.value)}
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
                }}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={!pendingMessage.trim() || sending || !identity}
                className="bg-white/90 text-slate-900 hover:bg-white font-semibold disabled:opacity-50 disabled:bg-white/50 disabled:text-slate-500"
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
