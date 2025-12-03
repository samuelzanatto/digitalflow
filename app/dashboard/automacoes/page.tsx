"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TooltipProvider } from "@/components/ui/tooltip"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardCardFooter,
  DashboardCardActions,
} from "@/components/digitalflow"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Mail, Eye, Clock, MousePointerClick, Timer, LogOut } from "lucide-react"
import { toast } from "sonner"
import { MinimalTiptapEditor } from "@/components/ui/minimal-tiptap"
import type { Content } from "@tiptap/react"

// Tipos de gatilho disponíveis
const TRIGGER_TYPES = [
  { 
    value: "form_submit", 
    label: "Formulário enviado", 
    icon: MousePointerClick,
    description: "Dispara quando um formulário de captura é enviado",
  },
  { 
    value: "time_on_page", 
    label: "Tempo na página", 
    icon: Timer,
    description: "Dispara após o visitante ficar X segundos em uma página e sair",
  },
  { 
    value: "page_exit", 
    label: "Saída da página", 
    icon: LogOut,
    description: "Dispara quando o visitante sai de uma página específica",
  },
  { 
    value: "exit_without_conversion", 
    label: "Saiu sem converter", 
    icon: LogOut,
    description: "Dispara quando o visitante sai sem ir para outra página (ex: checkout)",
  },
  { 
    value: "checkout_abandoned", 
    label: "Carrinho abandonado", 
    icon: Clock,
    description: "Dispara quando o visitante clica no checkout mas não finaliza a compra",
  },
]

interface Automation {
  id: string
  name: string
  type: string
  subject: string
  message: string
  enabled: boolean
  triggerType: string
  triggerConfig: {
    pageSlug?: string
    minTimeOnPage?: number
    requiredConversion?: string
    abandonmentDelay?: number // minutos para considerar carrinho abandonado
  }
  delaySeconds: number
  pendingJobs?: number
  createdAt: string
  updatedAt: string
}

interface SalesPage {
  id: string
  slug: string
  title: string
}

export default function AutomacoesPage() {
  const { setPageHeader } = usePageHeader()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [pages, setPages] = useState<SalesPage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "email",
    subject: "",
    message: "" as Content,
    triggerType: "form_submit",
    triggerConfig: {
      pageSlug: "",
      minTimeOnPage: 30,
      requiredConversion: "",
      abandonmentDelay: 30, // 30 minutos padrão
    },
    delaySeconds: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("config")

  const fetchAutomations = useCallback(async () => {
    try {
      const response = await fetch("/api/automations")
      if (response.ok) {
        const data = await response.json()
        setAutomations(data.automations || [])
      }
    } catch (error) {
      console.error("Erro ao carregar automações:", error)
      toast.error("Erro ao carregar automações")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPages = useCallback(async () => {
    try {
      const response = await fetch("/api/pages")
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error("Erro ao carregar páginas:", error)
    }
  }, [])

  useEffect(() => {
    fetchAutomations()
    fetchPages()
  }, [fetchAutomations, fetchPages])

  const handleOpenDialog = useCallback((automation?: Automation) => {
    if (automation) {
      setEditingAutomation(automation)
      setFormData({
        name: automation.name,
        type: automation.type,
        subject: automation.subject,
        message: automation.message as Content,
        triggerType: automation.triggerType || "form_submit",
        triggerConfig: {
          pageSlug: automation.triggerConfig?.pageSlug || "",
          minTimeOnPage: automation.triggerConfig?.minTimeOnPage || 30,
          requiredConversion: automation.triggerConfig?.requiredConversion || "",
          abandonmentDelay: automation.triggerConfig?.abandonmentDelay || 30,
        },
        delaySeconds: automation.delaySeconds || 0,
      })
    } else {
      setEditingAutomation(null)
      setFormData({
        name: "",
        type: "email",
        subject: "",
        message: "" as Content,
        triggerType: "form_submit",
        triggerConfig: {
          pageSlug: "",
          minTimeOnPage: 30,
          requiredConversion: "",
          abandonmentDelay: 30,
        },
        delaySeconds: 0,
      })
    }
    setActiveTab("config")
    setDialogOpen(true)
  }, [])

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2" onClick={() => handleOpenDialog()}>
        <Plus className="w-4 h-4" />
        Nova Automação
      </Button>
    )
    setPageHeader("Automações", "Configure workflows e gatilhos automáticos de email", actionButton)
  }, [setPageHeader, handleOpenDialog])

  const handlePreview = () => {
    let html = typeof formData.message === 'string' ? formData.message : ''
    html = html.replace(/\{\{nome\}\}/gi, 'João Silva')
    html = html.replace(/\{\{email\}\}/gi, 'joao@exemplo.com')
    html = html.replace(/\{\{pageSlug\}\}/gi, 'minha-pagina')
    setPreviewHtml(html)
    setPreviewOpen(true)
  }

  const handleSubmit = async () => {
    const messageContent = typeof formData.message === 'string' ? formData.message : ''
    
    if (!formData.name.trim() || !formData.subject.trim() || !messageContent.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (formData.triggerType === "time_on_page" && !formData.triggerConfig.minTimeOnPage) {
      toast.error("Defina o tempo mínimo na página")
      return
    }

    if (formData.triggerType === "exit_without_conversion" && !formData.triggerConfig.requiredConversion) {
      toast.error("Defina a página de conversão esperada")
      return
    }

    setSubmitting(true)
    try {
      const url = editingAutomation 
        ? `/api/automations/${editingAutomation.id}` 
        : "/api/automations"
      
      const response = await fetch(url, {
        method: editingAutomation ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          message: messageContent,
          triggerConfig: {
            ...(formData.triggerConfig.pageSlug && { pageSlug: formData.triggerConfig.pageSlug }),
            ...(formData.triggerConfig.minTimeOnPage && { minTimeOnPage: formData.triggerConfig.minTimeOnPage }),
            ...(formData.triggerConfig.requiredConversion && { requiredConversion: formData.triggerConfig.requiredConversion }),
            ...(formData.triggerConfig.abandonmentDelay && { abandonmentDelay: formData.triggerConfig.abandonmentDelay }),
          },
        }),
      })

      if (response.ok) {
        toast.success(editingAutomation ? "Automação atualizada!" : "Automação criada!")
        setDialogOpen(false)
        fetchAutomations()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao salvar automação")
      }
    } catch (error) {
      console.error("Erro ao salvar automação:", error)
      toast.error("Erro ao salvar automação")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleEnabled = async (automation: Automation) => {
    try {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !automation.enabled }),
      })

      if (response.ok) {
        toast.success(automation.enabled ? "Automação desativada" : "Automação ativada")
        fetchAutomations()
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast.error("Erro ao alterar status")
    }
  }

  const handleOpenDelete = (automation: Automation) => {
    setDeleteTarget(automation)
    setDeleteDialogOpen(true)
  }

  useEffect(() => {
    if (!deleteDialogOpen) {
      setDeleteTarget(null)
    }
  }, [deleteDialogOpen])

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/automations/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Automação excluída!")
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        fetchAutomations()
      } else {
        toast.error("Erro ao excluir automação")
      }
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast.error("Erro ao excluir automação")
    } finally {
      setIsDeleting(false)
    }
  }

  const currentDeleteTarget = useMemo(() => deleteTarget, [deleteTarget])
  
  const getTriggerLabel = (triggerType: string) => {
    return TRIGGER_TYPES.find(t => t.value === triggerType)?.label || triggerType
  }

  const getTriggerIcon = (triggerType: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType)
    const Icon = trigger?.icon || MousePointerClick
    return <Icon className="w-4 h-4" />
  }

  const formatDelay = (seconds: number) => {
    if (seconds === 0) return "Imediato"
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
    return `${Math.floor(seconds / 3600)}h`
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-black rounded-b-2xl p-4 lg:p-6">
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a automação &quot;{currentDeleteTarget?.name}&quot;? Essa ação não
              pode ser desfeita e cancelará todos os envios pendentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-white" disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <video autoPlay loop muted playsInline className="w-24 h-24">
            <source src="/loading.mp4" type="video/mp4" />
          </video>
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Empty className="border-none bg-transparent p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Mail className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma automação criada</EmptyTitle>
              <EmptyDescription>
                Comece criando sua primeira automação de email para disparar mensagens automáticas baseadas no comportamento dos visitantes.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                Criar primeira automação
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {automations.map((automation) => (
            <DashboardCard key={automation.id}>
              <DashboardCardHeader
                icon={<Mail className="w-4 h-4" />}
                title={automation.name}
                description={automation.subject || "Sem assunto"}
                actions={
                  <DashboardCardActions>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleOpenDialog(automation)
                      }}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleOpenDelete(automation)
                      }}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DashboardCardActions>
                }
              />

              <DashboardCardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={automation.enabled}
                      onCheckedChange={() => handleToggleEnabled(automation)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Badge variant={automation.enabled ? "default" : "outline"} className="text-xs">
                      {automation.enabled ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      {getTriggerIcon(automation.triggerType)}
                      {getTriggerLabel(automation.triggerType)}
                    </Badge>
                    {automation.delaySeconds > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDelay(automation.delaySeconds)}
                      </Badge>
                    )}
                    {automation.pendingJobs && automation.pendingJobs > 0 && (
                      <Badge variant="default" className="text-xs bg-amber-600">
                        {automation.pendingJobs} pendentes
                      </Badge>
                    )}
                  </div>
                </div>
              </DashboardCardContent>

              <DashboardCardFooter
                leftContent={
                  <>
                    <span>Criada em {new Date(automation.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span className="opacity-80">
                      Atualizada em {new Date(automation.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </>
                }
                rightContent={
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDialog(automation)
                    }}
                    className="gap-1 text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </Button>
                }
              />
            </DashboardCard>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="min-w-6xl w-[98vw] max-h-[95vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingAutomation ? "Editar Automação" : "Nova Automação de Email"}
            </DialogTitle>
            <DialogDescription>
              Configure gatilhos comportamentais para enviar emails automáticos.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="trigger">Gatilho</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto py-4">
              <TabsContent value="config" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Automação *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Recuperação de carrinho"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Input
                      id="type"
                      value="Email"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delay">Delay antes do envio</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="delay"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.delaySeconds}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        delaySeconds: parseInt(e.target.value) || 0 
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">segundos</span>
                    <div className="ml-4 flex gap-2">
                      {[0, 300, 1800, 3600, 86400].map((seconds) => (
                        <Button
                          key={seconds}
                          type="button"
                          variant={formData.delaySeconds === seconds ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData({ ...formData, delaySeconds: seconds })}
                        >
                          {formatDelay(seconds)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tempo de espera antes de enviar o email após o gatilho ser acionado
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="trigger" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Tipo de Gatilho *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {TRIGGER_TYPES.map((trigger) => {
                      const Icon = trigger.icon
                      return (
                        <div
                          key={trigger.value}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.triggerType === trigger.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, triggerType: trigger.value })}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{trigger.label}</p>
                              <p className="text-xs text-muted-foreground">{trigger.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {formData.triggerType !== "form_submit" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium">Configurações do Gatilho</h4>
                    
                    <div className="space-y-2">
                      <Label>Página (opcional)</Label>
                      <Select
                        value={formData.triggerConfig.pageSlug || "any"}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          triggerConfig: {
                            ...formData.triggerConfig,
                            pageSlug: value === "any" ? "" : value,
                          },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer página" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Qualquer página</SelectItem>
                          {pages.map((page) => (
                            <SelectItem key={page.id} value={page.slug}>
                              {page.title} ({page.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para aplicar a todas as páginas
                      </p>
                    </div>

                    {(formData.triggerType === "time_on_page" || formData.triggerType === "exit_without_conversion") && (
                      <div className="space-y-2">
                        <Label>Tempo mínimo na página (segundos) *</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min={1}
                            value={formData.triggerConfig.minTimeOnPage || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              triggerConfig: {
                                ...formData.triggerConfig,
                                minTimeOnPage: parseInt(e.target.value) || 0,
                              },
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">segundos</span>
                          <div className="ml-4 flex gap-2">
                            {[10, 30, 60, 120, 300].map((seconds) => (
                              <Button
                                key={seconds}
                                type="button"
                                variant={formData.triggerConfig.minTimeOnPage === seconds ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFormData({
                                  ...formData,
                                  triggerConfig: {
                                    ...formData.triggerConfig,
                                    minTimeOnPage: seconds,
                                  },
                                })}
                              >
                                {seconds}s
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.triggerType === "exit_without_conversion" && (
                      <div className="space-y-2">
                        <Label>Página de conversão esperada *</Label>
                        <Select
                          value={formData.triggerConfig.requiredConversion || ""}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            triggerConfig: {
                              ...formData.triggerConfig,
                              requiredConversion: value,
                            },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a página de conversão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checkout">Checkout</SelectItem>
                            <SelectItem value="obrigado">Página de obrigado</SelectItem>
                            {pages.map((page) => (
                              <SelectItem key={page.id} value={page.slug}>
                                {page.title} ({page.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          O email será enviado se o visitante sair sem acessar esta página
                        </p>
                      </div>
                    )}

                    {formData.triggerType === "checkout_abandoned" && (
                      <div className="space-y-2">
                        <Label>Tempo para considerar abandonado (minutos) *</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min={5}
                            value={formData.triggerConfig.abandonmentDelay || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              triggerConfig: {
                                ...formData.triggerConfig,
                                abandonmentDelay: parseInt(e.target.value) || 0,
                              },
                            })}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">minutos</span>
                          <div className="ml-4 flex gap-2">
                            {[15, 30, 60, 120, 1440].map((minutes) => (
                              <Button
                                key={minutes}
                                type="button"
                                variant={formData.triggerConfig.abandonmentDelay === minutes ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFormData({
                                  ...formData,
                                  triggerConfig: {
                                    ...formData.triggerConfig,
                                    abandonmentDelay: minutes,
                                  },
                                })}
                              >
                                {minutes >= 60 ? `${minutes / 60}h` : `${minutes}min`}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O email será enviado se o cliente clicar no checkout e não finalizar a compra neste tempo
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {formData.triggerType === "form_submit" && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                      💡 Este gatilho é acionado quando um formulário de captura de leads é enviado. 
                      Configure a automação no componente de formulário do Page Builder.
                    </p>
                  </div>
                )}

                {formData.triggerType === "checkout_abandoned" && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-sm text-orange-400">
                      🛒 Este gatilho é acionado quando um visitante clica em um link de checkout 
                      (como Kirvano) mas não finaliza a compra dentro do tempo configurado.
                      <br /><br />
                      <strong>Variáveis disponíveis no email:</strong><br />
                      <code className="text-xs">{"{{nome}}"}</code> - Nome do visitante<br />
                      <code className="text-xs">{"{{email}}"}</code> - Email do visitante<br />
                      <code className="text-xs">{"{{productName}}"}</code> - Nome do produto<br />
                      <code className="text-xs">{"{{productPrice}}"}</code> - Preço do produto<br />
                      <code className="text-xs">{"{{checkoutUrl}}"}</code> - Link do checkout
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto do Email *</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Você esqueceu algo, {{nome}}!"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Use {"{{nome}}"} e {"{{email}}"} para personalizar o assunto
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Corpo do Email *</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePreview}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </Button>
                  </div>
                  <TooltipProvider>
                    <MinimalTiptapEditor
                      value={formData.message}
                      onChange={(value) => setFormData({ ...formData, message: value })}
                      className="min-h-[300px] border rounded-md"
                      editorContentClassName="p-4"
                      output="html"
                      placeholder="Escreva o corpo do email aqui..."
                      autofocus={false}
                      editable={true}
                      editorClassName="focus:outline-none"
                    />
                  </TooltipProvider>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded">{"{{nome}}"} = Nome do lead</span>
                    <span className="bg-muted px-2 py-1 rounded">{"{{email}}"} = Email do lead</span>
                    <span className="bg-muted px-2 py-1 rounded">{"{{pageSlug}}"} = Página visitada</span>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : editingAutomation ? "Atualizar" : "Criar Automação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Email</DialogTitle>
            <DialogDescription>
              Visualização de como o email será exibido para o destinatário.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white text-black">
            <div className="border-b pb-3 mb-4">
              <p className="text-sm text-gray-500">Assunto:</p>
              <p className="font-semibold">
                {formData.subject
                  .replace(/\{\{nome\}\}/gi, 'João Silva')
                  .replace(/\{\{email\}\}/gi, 'joao@exemplo.com')}
              </p>
            </div>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

