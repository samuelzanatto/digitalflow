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
      const {
        data: { user },
      } = await client.auth.getUser()
      if (mounted) {
        setIdentity(formatAuthUser(user))
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
    const { data, error } = await client
      .from('team_messages')
      .select('*')
      .order('inserted_at', { ascending: true })
      .limit(MESSAGES_LIMIT)

    if (error) {
      console.error('Erro ao carregar mensagens do chat', error)
      toast.error('Não foi possível carregar o chat da equipe.')
      setLoading(false)
      return
    }

    setMessages(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => {
      void loadMessages()
    })
  }, [loadMessages])

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return

    const channel = client
      .channel('team_messages_stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages' },
        (payload: RealtimePostgresChangesPayload<TeamMessageRow>) => {
          if (!payload.new) return
          const newMessage = payload.new as TeamMessageRow
          setMessages((prev) => {
            const next = [...prev, newMessage]
            if (next.length > MESSAGES_LIMIT) {
              return next.slice(next.length - MESSAGES_LIMIT)
            }
            return next
          })
        },
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          console.info('[team-chat] realtime subscription ativa')
        }
      })

    return () => {
      void client.removeChannel(channel)
    }
  }, [])

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
  const { error } = await (client.from('team_messages') as any).insert(payload)
    if (error) {
      console.error('Erro ao enviar mensagem do chat', error)
      toast.error('Falha ao enviar mensagem. Tente novamente.')
    } else {
      setPendingMessage('')
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
        <div className="flex h-full items-center justify-center text-sm text-white/60">
          Carregando histórico do time...
        </div>
      )
    }

    if (!messages.length) {
      return (
        <div className="flex h-full items-center justify-center text-center text-sm text-white/50">
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
                <AvatarFallback className="bg-white/10 text-xs uppercase text-white">
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
                  isOwn ? 'bg-primary text-white' : 'bg-white/5 text-white/90 backdrop-blur',
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  {message.username}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">
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
      return <span className="text-xs uppercase tracking-widest text-white/30">Ninguém online</span>
    }

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/40">Online agora</span>
        <div className="flex items-center gap-2">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">
              <Avatar className="h-6 w-6 border border-white/10">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-white/10 text-[10px] uppercase text-white">
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

      <div className="border-t border-white/5 px-6 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={pendingMessage}
            onChange={(event) => setPendingMessage(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Escreva uma mensagem para sua equipe..."
            className="min-h-[100px] resize-none border-white/10 bg-black/30 text-white placeholder-white/40"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            <span>
              {pendingMessage.trim().length}/{MAX_MESSAGE_LENGTH} caracteres
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white"
                onClick={() => {
                  setPendingMessage('')
                }}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={!pendingMessage.trim() || sending || !identity}
                className="bg-primary px-6 text-white hover:bg-primary/90"
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
