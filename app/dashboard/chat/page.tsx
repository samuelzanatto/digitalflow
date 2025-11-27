"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { useUser } from "@/contexts/user-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"
import { toast } from "sonner"
import { 
  IconSearch, 
  IconSend, 
  IconClock, 
  IconCheck, 
  IconMessageCircle,
  IconUsers,
  IconPlayerPlay,
  IconArchive,
  IconClipboardList,
  IconChevronDown,
  IconChevronUp
} from "@tabler/icons-react"

type ChatSessionRow = Database['public']['Tables']['ChatSession']['Row']
type ChatMessageRow = Database['public']['Tables']['ChatMessage']['Row']

interface ChatSessionWithMessages extends ChatSessionRow {
  messages: ChatMessageRow[]
}

export default function ChatDashboardPage() {
  const { setPageHeader } = usePageHeader()
  const { user } = useUser()
  const [sessions, setSessions] = useState<ChatSessionWithMessages[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSessionWithMessages | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("waiting")
  const [isLoading, setIsLoading] = useState(true)
  const [showQuizAnswers, setShowQuizAnswers] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null)
  const sessionsRef = useRef<ChatSessionWithMessages[]>([])
  const selectedSessionRef = useRef<ChatSessionWithMessages | null>(null)

  // Manter refs atualizadas
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])
  
  useEffect(() => {
    selectedSessionRef.current = selectedSession
  }, [selectedSession])

  // Inicializar cliente Supabase no browser (apenas para Realtime)
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient()
    }
    return supabaseRef.current
  }, [])

  useEffect(() => {
    setPageHeader("Central de Atendimento", "Gerencie os chats de suporte em tempo real")
  }, [setPageHeader])

  // Carregar sessões iniciais via API
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/dashboard/chat')
        const data = await response.json()
        
        if (data.sessions) {
          setSessions(data.sessions)
        }
      } catch (error) {
        console.error('Erro ao carregar sessões:', error)
      }
      setIsLoading(false)
    }
    
    loadSessions()
  }, [])

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    const supabase = getSupabase()
    
    console.log('[Dashboard Chat] Configurando Realtime...')
    
    // Canal único para todas as mudanças de chat
    const channel = supabase
      .channel('dashboard-chat-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ChatSession' },
        (payload) => {
          console.log('[Dashboard Chat] Mudança em ChatSession:', payload.eventType, payload)
          
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as ChatSessionRow
            console.log('[Dashboard Chat] Nova sessão:', newSession)
            
            setSessions(prev => {
              // Evitar duplicação
              if (prev.find(s => s.id === newSession.id)) return prev
              return [{...newSession, messages: []}, ...prev]
            })
            
            // Toast para novo cliente na fila
            if (newSession.status === 'waiting') {
              toast.info('Novo cliente na fila!', {
                description: `${newSession.visitorName} está aguardando atendimento`,
                action: {
                  label: 'Ver',
                  onClick: () => {
                    setActiveTab('waiting')
                  }
                }
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as ChatSessionRow
            console.log('[Dashboard Chat] Sessão atualizada:', updatedSession)
            
            setSessions(prev => prev.map(s => 
              s.id === updatedSession.id ? { ...s, ...updatedSession } : s
            ))
            setSelectedSession(prev => 
              prev?.id === updatedSession.id ? { ...prev, ...updatedSession } : prev
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedSession = payload.old as ChatSessionRow
            console.log('[Dashboard Chat] Sessão deletada:', deletedSession)
            
            setSessions(prev => prev.filter(s => s.id !== deletedSession.id))
            setSelectedSession(prev => prev?.id === deletedSession.id ? null : prev)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ChatMessage' },
        (payload) => {
          const newMessage = payload.new as ChatMessageRow
          console.log('[Dashboard Chat] Nova mensagem:', newMessage)
          
          // Atualizar lista de sessões
          setSessions(prev => prev.map(s => 
            s.id === newMessage.sessionId 
              ? { ...s, messages: [...s.messages.filter(m => m.id !== newMessage.id), newMessage] }
              : s
          ))
          
          // Atualizar sessão selecionada
          setSelectedSession(prev => {
            if (prev?.id !== newMessage.sessionId) return prev
            // Evitar duplicação
            if (prev.messages.find(m => m.id === newMessage.id)) return prev
            return { ...prev, messages: [...prev.messages, newMessage] }
          })
          
          // Toast para nova mensagem do visitante (se não estiver visualizando essa sessão)
          if (newMessage.sender === 'visitor') {
            const currentSessions = sessionsRef.current
            const currentSelected = selectedSessionRef.current
            const session = currentSessions.find(s => s.id === newMessage.sessionId)
            
            if (session && (!currentSelected || currentSelected.id !== newMessage.sessionId)) {
              toast.info(`Nova mensagem de ${session.visitorName}`, {
                description: newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
                action: {
                  label: 'Responder',
                  onClick: () => {
                    const fullSession = sessionsRef.current.find(s => s.id === newMessage.sessionId)
                    if (fullSession) setSelectedSession(fullSession)
                  }
                }
              })
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Dashboard Chat] Status da subscrição:', status, err)
        if (status === 'SUBSCRIBED') {
          console.log('[Dashboard Chat] Realtime conectado com sucesso!')
        }
        if (err) {
          console.error('[Dashboard Chat] Erro na subscrição:', err)
        }
      })
    
    return () => {
      console.log('[Dashboard Chat] Removendo canal Realtime')
      supabase.removeChannel(channel)
    }
  }, [getSupabase])

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedSession?.messages])

  // Filtrar sessões por status e busca
  const filteredSessions = sessions.filter(session => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && session.status === 'in_progress') ||
      (activeTab !== 'active' && session.status === activeTab)
    const matchesSearch = session.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.visitorEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  // Contadores
  const waitingCount = sessions.filter(s => s.status === 'waiting').length
  const activeCount = sessions.filter(s => s.status === 'in_progress').length
  const completedCount = sessions.filter(s => s.status === 'completed').length

  // Aceitar chat da fila via API
  const handleAcceptChat = async (session: ChatSessionWithMessages) => {
    try {
      await fetch('/api/dashboard/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          action: 'accept',
          attendantName: user?.full_name || 'Atendente'
        })
      })
      
      setSelectedSession({
        ...session,
        status: 'in_progress',
        attendantId: user?.id || null,
        queuePosition: 0
      })
    } catch (error) {
      console.error('Erro ao aceitar chat:', error)
    }
  }

  // Finalizar chat via API
  const handleCloseChat = async (sessionId: string) => {
    try {
      await fetch('/api/dashboard/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'close'
        })
      })
      
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
      }
    } catch (error) {
      console.error('Erro ao finalizar chat:', error)
    }
  }

  // Enviar mensagem via API
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedSession) return

    const content = inputValue.trim()
    setInputValue("")
    
    // Gerar ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`
    const tempMessage: ChatMessageRow = {
      id: tempId,
      sessionId: selectedSession.id,
      sender: 'attendant',
      senderId: user?.id || null,
      content,
      createdAt: new Date().toISOString()
    }
    
    // Atualização otimista - adicionar mensagem imediatamente
    setSelectedSession(prev => prev ? { 
      ...prev, 
      messages: [...prev.messages, tempMessage] 
    } : null)
    
    setSessions(prev => prev.map(s => 
      s.id === selectedSession.id 
        ? { ...s, messages: [...s.messages, tempMessage] }
        : s
    ))

    try {
      const response = await fetch('/api/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          content
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }
      
      const data = await response.json()
      
      // Substituir mensagem temporária pela real (com ID do banco)
      if (data.message) {
        setSelectedSession(prev => {
          if (!prev) return null
          return {
            ...prev,
            messages: prev.messages.map(m => 
              m.id === tempId ? data.message : m
            )
          }
        })
        
        setSessions(prev => prev.map(s => 
          s.id === selectedSession.id 
            ? { ...s, messages: s.messages.map(m => m.id === tempId ? data.message : m) }
            : s
        ))
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      // Remover mensagem temporária em caso de erro
      setSelectedSession(prev => {
        if (!prev) return null
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempId)
        }
      })
      setSessions(prev => prev.map(s => 
        s.id === selectedSession.id 
          ? { ...s, messages: s.messages.filter(m => m.id !== tempId) }
          : s
      ))
      setInputValue(content) // Restaurar input em caso de erro
      toast.error('Erro ao enviar mensagem')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora'
    if (minutes < 60) return minutes + 'm atrás'
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return hours + 'h atrás'
    return date.toLocaleDateString('pt-BR')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando atendimentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-8rem)]">
      {/* Sidebar - Lista de Sessões */}
      <div className="w-96 min-w-96 border-r flex flex-col">
        {/* Stats */}
        <div className="p-4 border-b grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{waitingCount}</p>
            <p className="text-xs text-muted-foreground">Na fila</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </Card>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar atendimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="p-3 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex gap-3 p-1">
              <TabsTrigger value="waiting" className="text-xs flex-1">
                <IconClock size={14} className="mr-1.5" />
                Fila
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs flex-1">
                <IconPlayerPlay size={14} className="mr-1.5" />
                Ativos
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs flex-1">
                <IconArchive size={14} className="mr-1.5" />
                Finalizados
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs flex-1">
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <IconMessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum atendimento encontrado</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={'p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ' + (
                    selectedSession?.id === session.id ? 'bg-muted' : ''
                  )}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(session.visitorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{session.visitorName}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(session.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {session.messages.length > 0 
                          ? session.messages[session.messages.length - 1].content 
                          : 'Novo atendimento'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            session.status === 'waiting' ? 'default' :
                            session.status === 'in_progress' ? 'secondary' : 'outline'
                          }
                          className={
                            session.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                            session.status === 'in_progress' ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''
                          }
                        >
                          {session.status === 'waiting' && ('Fila #' + session.queuePosition)}
                          {session.status === 'in_progress' && 'Em atendimento'}
                          {session.status === 'completed' && 'Finalizado'}
                          {session.status === 'abandoned' && 'Abandonado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(selectedSession.visitorName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedSession.visitorName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.visitorEmail || 'Sem email'}
                    {selectedSession.visitorPhone && ` • ${selectedSession.visitorPhone}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedSession.status === 'waiting' && (
                  <Button onClick={() => handleAcceptChat(selectedSession)} className="gap-2">
                    <IconPlayerPlay size={16} />
                    Aceitar
                  </Button>
                )}
                {selectedSession.status === 'in_progress' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCloseChat(selectedSession.id)}
                    className="gap-2"
                  >
                    <IconCheck size={16} />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>

            {/* Quiz Answers Panel */}
            {selectedSession.quizAnswers && Object.keys(selectedSession.quizAnswers as object).length > 0 && (
              <div className="border-b">
                <button
                  onClick={() => setShowQuizAnswers(!showQuizAnswers)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <IconClipboardList size={18} className="text-primary" />
                    <span>Respostas do Quiz</span>
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys((selectedSession.quizAnswers as Record<string, unknown>)?.answers || selectedSession.quizAnswers as object).length} respostas
                    </Badge>
                  </div>
                  {showQuizAnswers ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </button>
                
                <AnimatePresence>
                  {showQuizAnswers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {(() => {
                          const quizData = selectedSession.quizAnswers as { answers?: Record<string, string>, timestamp?: string } | Record<string, string>
                          const answers = ('answers' in quizData && quizData.answers) ? quizData.answers : quizData as Record<string, string>
                          
                          // Perguntas do quiz (mapeamento)
                          const quizQuestions: Record<string, string> = {
                            '1': 'Qual é o principal objetivo das suas campanhas de tráfego pago?',
                            '2': 'Qual é o seu orçamento mensal de marketing digital?',
                            '3': 'Quais plataformas você já utiliza para tráfego pago?',
                            '4': 'Qual é seu maior desafio atual com campanhas de tráfego?',
                            '5': 'Qual é seu segmento de negócio?'
                          }
                          
                          return Object.entries(answers).map(([questionId, answer]) => (
                            <div key={questionId} className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">
                                Pergunta {questionId}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mb-2">
                                {quizQuestions[questionId] || `Pergunta ${questionId}`}
                              </p>
                              <p className="text-sm font-medium">{answer as string}</p>
                            </div>
                          ))
                        })()}
                        
                        {'timestamp' in (selectedSession.quizAnswers as object) && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            Respondido em {new Date((selectedSession.quizAnswers as { timestamp: string }).timestamp).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedSession.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={'flex ' + (message.sender === 'attendant' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={'max-w-[70%] rounded-lg px-4 py-2 ' + (
                      message.sender === 'attendant'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={'text-xs mt-1 ' + (
                      message.sender === 'attendant' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedSession.status === 'in_progress' && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                    <IconSend size={18} />
                  </Button>
                </div>
              </div>
            )}

            {selectedSession.status === 'waiting' && (
              <div className="p-4 border-t bg-yellow-500/10">
                <p className="text-center text-yellow-600 dark:text-yellow-400">
                  Clique em &quot;Aceitar&quot; para iniciar o atendimento
                </p>
              </div>
            )}

            {selectedSession.status === 'completed' && (
              <div className="p-4 border-t bg-muted">
                <div className="text-center">
                  <p className="text-muted-foreground">Atendimento finalizado</p>
                  {selectedSession.rating && (
                    <p className="text-sm mt-1">
                      Avaliação: {'⭐'.repeat(selectedSession.rating)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <IconUsers size={64} className="mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Selecione um atendimento</h3>
              <p className="text-muted-foreground">
                Escolha uma conversa na lista ao lado para visualizar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
