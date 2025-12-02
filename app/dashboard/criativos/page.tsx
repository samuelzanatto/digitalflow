'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import { 
  IconSend, 
  IconLoader2,
  IconCopy,
  IconCheck,
  IconPencil,
  IconMail,
  IconBrandInstagram,
  IconTrash,
  IconSparkles,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useRef, useEffect, useState, useCallback } from 'react'
import { usePageHeader } from '@/hooks/usePageHeader'
import { motion } from 'framer-motion'

// Sugestões de prompts para inspiração
const promptSuggestions = [
  {
    icon: IconPencil,
    title: "Criar Copy de Vendas",
    prompt: "Crie uma copy persuasiva para vender um curso online de marketing digital"
  },
  {
    icon: IconBrandInstagram,
    title: "Post para Instagram",
    prompt: "Crie um post engajador para Instagram sobre dicas de produtividade para empreendedores"
  },
  {
    icon: IconMail,
    title: "Email Marketing",
    prompt: "Escreva um email de lançamento para um novo produto digital com headline impactante"
  },
  {
    icon: IconSparkles,
    title: "Brainstorm de Ideias",
    prompt: "Me ajude a fazer um brainstorm de ideias para uma campanha de marketing para minha marca"
  },
]

export default function AssistenteIAPage() {
  const { setPageHeader } = usePageHeader()
  const [inputValue, setInputValue] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/design',
    }),
  })
  
  const isLoading = status === 'streaming' || status === 'submitted'

  const handleClearChat = useCallback(() => {
    setMessages([])
  }, [setMessages])

  useEffect(() => {
    setPageHeader(
      "Assistente IA",
      "Criador de conteúdo e copies",
      messages.length > 0 ? (
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-zinc-400 hover:text-zinc-100"
          onClick={handleClearChat}
        >
          <IconTrash className="h-4 w-4" />
          Limpar Chat
        </Button>
      ) : null
    )
  }, [setPageHeader, messages.length, handleClearChat])

  // Verificar se há mensagem pendente do dashboard (AIInput)
  useEffect(() => {
    const pendingMessage = sessionStorage.getItem("pendingAIMessage")
    if (pendingMessage) {
      // Limpar a mensagem do sessionStorage
      sessionStorage.removeItem("pendingAIMessage")
      // Enviar a mensagem automaticamente
      sendMessage({ text: pendingMessage })
    }
  }, [sendMessage])

  // Helper para extrair texto das mensagens
  const getMessageContent = useCallback((message: typeof messages[0]): string => {
    if (message.parts) {
      return message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('');
    }
    return '';
  }, []);

  // Scroll automático
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue('')
  }, [inputValue, isLoading, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    setInputValue(prompt)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  const handleCopyMessage = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-1 flex-col rounded-b-2xl bg-black overflow-hidden h-0">
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Chat Panel */}
        <div className="flex flex-col overflow-hidden h-full flex-1">
          {/* Messages Area */}
          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 h-0"
          >
          {messages.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="DigitalFlow" 
                    width={48} 
                    height={48}
                    className="object-contain"
                  />
                </div>
                <h2 className="text-lg font-medium text-zinc-100 mb-2">
                  Olá! Como posso ajudar?
                </h2>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  Posso criar copies, posts, emails e conteúdos persuasivos para suas campanhas.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider px-1">
                  Sugestões
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {promptSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-left group"
                      onClick={() => handleSuggestionClick(suggestion.prompt)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <suggestion.icon className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-medium text-zinc-200">
                          {suggestion.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {suggestion.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const content = getMessageContent(message);
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                      <AvatarImage src="/logo.png" alt="DigitalFlow" className="object-contain p-1" />
                      <AvatarFallback className="bg-zinc-800 text-white text-xs">
                        DF
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm",
                        message.role === 'user'
                          ? "bg-violet-600 text-white"
                          : "bg-zinc-800 text-zinc-200"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{content || 'Gerando...'}</div>
                    </div>
                    
                    {/* Ações da mensagem */}
                    {message.role === 'assistant' && content && (
                      <div className="flex items-center gap-1 px-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
                          onClick={() => handleCopyMessage(content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <IconCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <IconCopy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                      <AvatarFallback className="bg-violet-600 text-white text-xs">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              );
            })
          )}
          
          {/* Loading indicator */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                <AvatarImage src="/logo.png" alt="DigitalFlow" className="object-contain p-1" />
                <AvatarFallback className="bg-zinc-800 text-white text-xs">
                  DF
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-2.5 bg-zinc-800">
                <div className="flex items-center gap-2">
                  <IconLoader2 className="h-4 w-4 animate-spin text-violet-400" />
                  <span className="text-sm text-zinc-400">Pensando...</span>
                </div>
              </div>
            </motion.div>
          )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-zinc-800 shrink-0">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-20 max-h-[200px] pr-12 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none rounded-xl"
                disabled={isLoading}
              />
              <Button
                type="button"
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-violet-600 hover:bg-violet-700"
                disabled={isLoading || !inputValue.trim()}
                onClick={handleSendMessage}
              >
                {isLoading ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconSend className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
