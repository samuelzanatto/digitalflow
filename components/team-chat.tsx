'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AuthChangeEvent,
  RealtimePostgresChangesPayload,
  Session,
} from '@supabase/supabase-js'
import { formatRelative } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
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
  const listRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo<SupabaseBrowserClient>(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    let mounted = true

    const hydrateIdentity = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (mounted) {
        setIdentity(formatAuthUser(user))
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
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
  }, [supabase])

  const loadMessages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
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
  }, [supabase])

  useEffect(() => {
    startTransition(() => {
      void loadMessages()
    })
  }, [loadMessages])

  useEffect(() => {
    const channel = supabase
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
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

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

    // Supabase SSR helper still loses insert inference, so we suppress the explicit any.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('team_messages') as any).insert(payload)
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

  return (
    <Card className="flex h-[calc(100vh-220px)] flex-col gap-0 overflow-hidden border-white/10 bg-zinc-900/60">
      <div className="flex flex-col gap-3 border-b border-white/5 p-4 text-white">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            Chat geral da equipe
          </p>
          <h2 className="text-2xl font-semibold">Converse com o seu time em tempo real</h2>
          <p className="text-sm text-white/60">
            Todos que estiverem logados na dashboard podem acompanhar aqui as atualizações.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
          <Avatar className="h-10 w-10 border border-white/10">
            {identity?.avatarUrl && <AvatarImage src={identity.avatarUrl} alt={identity.name} />}
            <AvatarFallback className="bg-white/10 text-xs uppercase text-white">
              {identity?.name
                ?.split(' ')
                .map((piece) => piece[0]?.toUpperCase() ?? '')
                .join('')
                .slice(0, 2) || 'FL'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50">Você está falando como</p>
            <p className="text-base font-medium text-white">{identity?.name ?? 'Carregando...'}</p>
            <p className="text-xs text-white/50">{identity?.email ?? 'Conta Flow'}</p>
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto bg-black/20 px-4 py-6">
        {renderMessages()}
      </div>

      <div className="border-t border-white/5 bg-black/40 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={pendingMessage}
            onChange={(event) => setPendingMessage(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Escreva uma mensagem para sua equipe..."
            className="min-h-[90px] resize-none border-white/10 bg-transparent text-white placeholder-white/40"
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
    </Card>
  )
}
