"use client"

import { useEffect, useState, useCallback } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import { 
  IconPlug, 
  IconCopy, 
  IconCheck, 
  IconRefresh,
  IconExternalLink,
  IconShoppingCart,
  IconCreditCard,
  IconAlertCircle,
  IconBell
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Integration {
  id: string
  name: string
  provider: string
  webhookToken: string
  enabled: boolean
  createdAt: string
  _count?: {
    events: number
  }
}

interface WebhookEvent {
  id: string
  integrationId: string
  event: string
  status: string
  processedAt: string
  payload: Record<string, unknown>
}

interface SaleStats {
  totalSales: number
  approvedSales: number
  pendingSales: number
  refundedSales: number
  totalRevenue: number
  abandonedCarts: number
}

const eventDescriptions: Record<string, string> = {
  SALE_APPROVED: "Compra aprovada",
  SALE_REFUSED: "Compra recusada",
  SALE_REFUNDED: "Reembolso",
  SALE_CHARGEBACK: "Chargeback",
  ABANDONED_CART: "Carrinho abandonado",
  PIX_GENERATED: "PIX gerado",
  PIX_EXPIRED: "PIX expirado",
  BANK_SLIP_GENERATED: "Boleto gerado",
  BANK_SLIP_EXPIRED: "Boleto expirado",
  SUBSCRIPTION_CANCELED: "Assinatura cancelada",
  SUBSCRIPTION_EXPIRED: "Assinatura atrasada",
  SUBSCRIPTION_RENEWED: "Assinatura renovada",
}

const eventColors: Record<string, string> = {
  SALE_APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SALE_REFUSED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  SALE_REFUNDED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  SALE_CHARGEBACK: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ABANDONED_CART: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PIX_GENERATED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PIX_EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  BANK_SLIP_GENERATED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  BANK_SLIP_EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  SUBSCRIPTION_CANCELED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  SUBSCRIPTION_EXPIRED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  SUBSCRIPTION_RENEWED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export default function IntegracoesPage() {
  const { setPageHeader } = usePageHeader()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [stats, setStats] = useState<SaleStats | null>(null)
  const [, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [, setSelectedIntegration] = useState<Integration | null>(null)
  const [creatingKirvano, setCreatingKirvano] = useState(false)
  const [newEventIndicator, setNewEventIndicator] = useState(false)

  const loadIntegrations = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations")
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error("Erro ao carregar integrações:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }, [])

  useEffect(() => {
    setPageHeader("Integrações", "Conecte plataformas externas para sincronizar dados")
    loadIntegrations()
    loadStats()

    // Configurar Supabase Realtime para escutar novos eventos de webhook
    const supabase = createSupabaseBrowserClient()
    
    const channel = supabase
      .channel('webhook-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'WebhookEvent',
        },
        (payload) => {
          console.log('[Realtime] Novo evento de webhook recebido:', payload)
          
          // Adicionar novo evento na lista em tempo real
          const newEvent = payload.new as WebhookEvent
          setEvents((prevEvents) => [newEvent, ...prevEvents].slice(0, 50))
          
          // Atualizar contador de eventos na integração
          setIntegrations((prevIntegrations) => 
            prevIntegrations.map((integration) => {
              if (integration.id === newEvent.integrationId) {
                return {
                  ...integration,
                  _count: {
                    events: (integration._count?.events || 0) + 1
                  }
                }
              }
              return integration
            })
          )
          
          // Atualizar estatísticas
          loadStats()
          
          // Mostrar indicador visual e toast
          setNewEventIndicator(true)
          setTimeout(() => setNewEventIndicator(false), 3000)
          
          const eventName = eventDescriptions[newEvent.event] || newEvent.event
          toast.success(`Novo evento: ${eventName}`, {
            description: `Evento recebido da Kirvano`,
            duration: 5000,
          })
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status da conexão:', status)
      })

    // Cleanup: remover subscription ao desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [setPageHeader, loadIntegrations, loadStats])

  const loadEvents = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/events`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    }
  }

  const createKirvanoIntegration = async () => {
    setCreatingKirvano(true)
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Kirvano",
          provider: "kirvano"
        })
      })
      if (response.ok) {
        await loadIntegrations()
      }
    } catch (error) {
      console.error("Erro ao criar integração:", error)
    } finally {
      setCreatingKirvano(false)
    }
  }

  const toggleIntegration = async (integration: Integration) => {
    try {
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !integration.enabled })
      })
      if (response.ok) {
        await loadIntegrations()
      }
    } catch (error) {
      console.error("Erro ao atualizar integração:", error)
    }
  }

  const regenerateToken = async (integration: Integration) => {
    try {
      const response = await fetch(`/api/integrations/${integration.id}/regenerate-token`, {
        method: "POST"
      })
      if (response.ok) {
        await loadIntegrations()
      }
    } catch (error) {
      console.error("Erro ao regenerar token:", error)
    }
  }

  const copyWebhookUrl = (token: string) => {
    const url = `${window.location.origin}/api/webhooks/kirvano/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const kirvanoIntegration = integrations.find(i => i.provider === "kirvano")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value / 100)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <IconCreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas Aprovadas</p>
                <p className="text-2xl font-bold">{stats.approvedSales}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IconShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <IconAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carrinhos Abandonados</p>
                <p className="text-2xl font-bold">{stats.abandonedCarts}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <IconRefresh className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reembolsos</p>
                <p className="text-2xl font-bold">{stats.refundedSales}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Realtime Event Indicator */}
      <AnimatePresence>
        {newEventIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 right-4 z-50"
          >
            <Card className="p-3 bg-green-500/10 border-green-500/50 shadow-lg">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <IconBell className="w-5 h-5 animate-bounce" />
                <span className="font-medium text-sm">Novo evento recebido!</span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Kirvano Integration Card */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://app.kirvano.com/favicon.ico" 
                  alt="Kirvano" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold">Kirvano</h3>
                <p className="text-sm text-muted-foreground">
                  Plataforma de vendas e checkout
                </p>
              </div>
            </div>
            
            {kirvanoIntegration ? (
              <div className="flex items-center gap-4">
                <Badge variant={kirvanoIntegration.enabled ? "default" : "secondary"}>
                  {kirvanoIntegration.enabled ? "Ativo" : "Inativo"}
                </Badge>
                <Switch
                  checked={kirvanoIntegration.enabled}
                  onCheckedChange={() => toggleIntegration(kirvanoIntegration)}
                />
              </div>
            ) : (
              <Button 
                onClick={createKirvanoIntegration}
                disabled={creatingKirvano}
              >
                {creatingKirvano ? "Conectando..." : "Conectar"}
              </Button>
            )}
          </div>

          {kirvanoIntegration && (
            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-lg">
                <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/kirvano/${kirvanoIntegration.webhookToken}`}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyWebhookUrl(kirvanoIntegration.webhookToken)}
                  >
                    {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => regenerateToken(kirvanoIntegration)}
                    title="Regenerar token"
                  >
                    <IconRefresh className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {kirvanoIntegration._count?.events || 0} eventos recebidos
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedIntegration(kirvanoIntegration)
                        loadEvents(kirvanoIntegration.id)
                      }}
                    >
                      Ver Logs
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Logs de Webhook - Kirvano</DialogTitle>
                      <DialogDescription>
                        Últimos eventos recebidos da integração
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 mt-4">
                      {events.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum evento recebido ainda
                        </p>
                      ) : (
                        events.map((event) => (
                          <div 
                            key={event.id} 
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <Badge className={eventColors[event.event] || "bg-gray-100 text-gray-800"}>
                                {eventDescriptions[event.event] || event.event}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.processedAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Ver payload
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </details>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Como configurar:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Acesse o painel da Kirvano em <a href="https://app.kirvano.com/extensions/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Integrações → Webhooks <IconExternalLink className="w-3 h-3" /></a></li>
                  <li>Clique em &quot;Criar Webhook&quot;</li>
                  <li>Cole a URL do webhook acima no campo &quot;URL do Webhook&quot;</li>
                  <li>Selecione os produtos e eventos que deseja receber</li>
                  <li>Salve a configuração</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Eventos suportados:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(eventDescriptions).map(([event, description]) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {description}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
