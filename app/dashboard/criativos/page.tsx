'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  IconSend, 
  IconSparkles, 
  IconLoader2,
  IconCopy,
  IconCheck,
  IconBulb,
  IconPencil,
  IconMail,
  IconBrandInstagram,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useRef, useEffect, useState } from 'react'
import { usePageHeader } from '@/hooks/usePageHeader'
import Image from 'next/image'

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
    icon: IconBulb,
    title: "Ideias de Conteúdo",
    prompt: "Me dê 10 ideias de conteúdo para uma marca de cosméticos naturais"
  },
]

// Helper para extrair texto das parts da mensagem
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => part.text)
    .join('')
}

export default function AssistenteIAPage() {
  const { setPageHeader } = usePageHeader()
  const [input, setInput] = useState('')
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/gemini',
    }),
  })
  
  const isLoading = status === 'streaming' || status === 'submitted'
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Definir header da página
  useEffect(() => {
    setPageHeader(
      "Assistente IA", 
      "IA para criação de conteúdo e estratégias de marketing",
      <Badge variant="secondary" className="gap-1">
        <IconSparkles className="h-3 w-3" />
        Gemini 2.5 Flash
      </Badge>
    )
  }, [setPageHeader])

  // Auto scroll para última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    sendMessage({
      parts: [{ type: 'text', text: input }],
    })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col h-0 min-h-full overflow-hidden rounded-b-2xl">
      {/* Chat Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 lg:px-6">
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center">
                  <Image src="/logo.png" alt="DigitalFlow" width={64} height={64} className="object-contain" />
                </div>
                <h2 className="text-2xl font-bold">Como posso ajudar?</h2>
                <p className="text-muted-foreground max-w-md">
                  Sou seu assistente de marketing digital. Posso criar copies, posts, emails, estratégias e muito mais.
                </p>
              </div>

              {/* Sugestões */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {promptSuggestions.map((suggestion, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:bg-accent/50 transition-colors group"
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
                        <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-sm">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.prompt}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => {
            const messageText = getMessageText(message.parts as Array<{ type: string; text?: string }>)
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === 'user' ? (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      EU
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src="/logo.png" alt="DigitalFlow" className="object-contain" />
                      <AvatarFallback className="bg-muted">
                        <IconSparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[80%]",
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{messageText}</div>
                  </div>
                  
                  {/* Botão de copiar para mensagens do assistente */}
                  {message.role === 'assistant' && messageText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(messageText, message.id)}
                    >
                      {copiedId === message.id ? (
                        <>
                          <IconCheck className="h-3 w-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <IconCopy className="h-3 w-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Loading State */}
          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="/logo.png" alt="DigitalFlow" className="object-contain" />
                <AvatarFallback className="bg-muted">
                  <IconSparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pensando...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-white/10 bg-black px-4 lg:px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Peça para criar uma copy, post, email ou tire suas dúvidas..."
                className="min-h-[52px] max-h-[200px] resize-none pr-12 rounded-xl"
                disabled={isLoading}
                rows={1}
              />
              <div className="absolute right-2 bottom-2">
                <Badge variant="outline" className="text-[10px] opacity-50">
                  Enter ↵
                </Badge>
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon"
              className="h-[52px] w-[52px] rounded-xl"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <IconLoader2 className="h-5 w-5 animate-spin" />
              ) : (
                <IconSend className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
