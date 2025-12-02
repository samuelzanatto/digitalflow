'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePageHeader } from '@/hooks/usePageHeader'
import {
  Map,
  MapMarker,
  MapPopup,
  MapTileLayer,
  MapZoomControl,
} from '@/components/ui/map'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  IconSend, 
  IconMapPin, 
  IconPhone, 
  IconWorld, 
  IconClock,
  IconSparkles,
  IconX,
  IconChevronRight,
  IconSearch,
  IconLoader2,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  name: string
  address: string
  phone?: string | null
  website?: string | null
  openingHours?: string | null
  distance?: number
  position: [number, number]
}

// Centro padrão: Campo Grande MS
const DEFAULT_CENTER: [number, number] = [-20.4697, -54.6087]

export default function MapaPage() {
  const { setPageHeader } = usePageHeader()
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(14)
  const [markers, setMarkers] = useState<SearchResult[]>([])
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/map',
      body: {
        location: {
          lat: mapCenter[0],
          lon: mapCenter[1],
          city: 'Campo Grande MS',
        },
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Helper para extrair texto das mensagens
  const getMessageContent = useCallback((message: typeof messages[0]): string => {
    if (message.parts) {
      return message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('')
    }
    return ''
  }, [])

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setPageHeader('Mapa Inteligente', 'Busque estabelecimentos usando IA')
  }, [setPageHeader])

  // Processar tool calls das mensagens para extrair marcadores
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.parts) {
      for (const part of lastMessage.parts) {
        if (part.type === 'tool-invocation' && 'output' in part && part.output) {
          const result = part.output as { success?: boolean; results?: SearchResult[] }
          if (result.success && result.results && result.results.length > 0) {
            // Usar setTimeout para evitar cascading renders
            setTimeout(() => {
              setMarkers(result.results!)
              if (result.results![0]?.position) {
                setMapCenter(result.results![0].position)
                setMapZoom(14)
              }
            }, 0)
          }
        }
      }
    }
  }, [messages])

  // Quick actions
  const quickActions = [
    { label: 'Restaurantes', query: 'busque restaurantes próximos' },
    { label: 'Farmácias', query: 'encontre farmácias na região' },
    { label: 'Supermercados', query: 'supermercados perto de mim' },
    { label: 'Postos', query: 'postos de combustível próximos' },
  ]

  const handleQuickAction = (query: string) => {
    sendMessage({ text: query })
  }

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue('')
  }, [inputValue, isLoading, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-1 h-full bg-black overflow-hidden relative">
      {/* Mapa */}
      <div className="flex-1 h-full">
        <Map 
          center={mapCenter} 
          zoom={mapZoom}
          className="h-full w-full brightness-125"
        >
          <MapTileLayer />
          <MapZoomControl className="absolute top-4 left-4" />
          
          {/* Marcadores de busca */}
          {markers.map((marker, index) => (
            <MapMarker 
              key={`${marker.name}-${index}`}
              position={marker.position}
            >
              <MapPopup>
                <div className="p-2 min-w-[220px] max-w-[280px]">
                  <h3 className="font-semibold text-base mb-2">{marker.name}</h3>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-start gap-2 text-zinc-600">
                      <IconMapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{marker.address || 'Endereço não disponível'}</span>
                    </p>
                    {marker.phone && (
                      <p className="flex items-center gap-2 text-zinc-600">
                        <IconPhone className="w-4 h-4 shrink-0" />
                        <a href={`tel:${marker.phone}`} className="hover:text-blue-500">
                          {marker.phone}
                        </a>
                      </p>
                    )}
                    {marker.website && (
                      <p className="flex items-center gap-2 text-zinc-600">
                        <IconWorld className="w-4 h-4 shrink-0" />
                        <a 
                          href={marker.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-500 truncate"
                        >
                          Website
                        </a>
                      </p>
                    )}
                    {marker.openingHours && (
                      <p className="flex items-center gap-2 text-zinc-600">
                        <IconClock className="w-4 h-4 shrink-0" />
                        <span className="truncate">{marker.openingHours}</span>
                      </p>
                    )}
                    {marker.distance !== undefined && (
                      <Badge variant="secondary" className="mt-2">
                        📏 {marker.distance.toFixed(1)} km
                      </Badge>
                    )}
                  </div>
                </div>
              </MapPopup>
            </MapMarker>
          ))}
        </Map>
      </div>

      {/* Chat com IA - Sidebar */}
      <div 
        className={cn(
          "absolute top-0 right-0 h-full bg-zinc-950/95 backdrop-blur-sm border-l border-zinc-800 transition-all duration-300 flex flex-col",
          isChatOpen ? "w-[400px]" : "w-0"
        )}
      >
        {isChatOpen && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <IconSparkles className="w-5 h-5 text-violet-500" />
                <span className="font-medium text-zinc-100">Assistente de Busca</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsChatOpen(false)}
              >
                <IconX className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Busca rápida:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                    onClick={() => handleQuickAction(action.query)}
                    disabled={isLoading}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-500 mt-8">
                  <IconSearch className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                  <p className="text-sm">Pergunte sobre estabelecimentos,</p>
                  <p className="text-sm">endereços ou locais na região.</p>
                  <p className="text-xs mt-4 text-zinc-600">
                    Ex: &quot;Encontre restaurantes em Campo Grande&quot;
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                          message.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-zinc-800 text-zinc-100'
                        )}
                      >
                        {getMessageContent(message)}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 flex items-center gap-2">
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        Buscando...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar estabelecimentos..."
                  className="flex-1 bg-zinc-900 border-zinc-700 focus:border-violet-500"
                  disabled={isLoading}
                />
                <Button 
                  type="button"
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <IconSend className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-600 mt-2 text-center">
                Powered by OpenStreetMap • 100% Gratuito
              </p>
            </div>
          </>
        )}
      </div>

      {/* Toggle Chat Button */}
      {!isChatOpen && (
        <Button
          className="absolute top-4 right-4 bg-violet-600 hover:bg-violet-700 shadow-lg"
          onClick={() => setIsChatOpen(true)}
        >
          <IconSparkles className="w-4 h-4 mr-2" />
          Buscar com IA
          <IconChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}

      {/* Markers count badge */}
      {markers.length > 0 && (
        <Badge 
          className="absolute bottom-4 left-4 bg-violet-600 text-white shadow-lg"
        >
          {markers.length} estabelecimentos encontrados
        </Badge>
      )}
    </div>
  )
}
