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
import { Plus, Pencil, Trash2, Mail, Eye } from "lucide-react"
import { toast } from "sonner"
import { MinimalTiptapEditor } from "@/components/ui/minimal-tiptap"
import type { Content } from "@tiptap/react"

interface Automation {
  id: string
  name: string
  type: string
  subject: string
  message: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export default function AutomacoesPage() {
  const { setPageHeader } = usePageHeader()
  const [automations, setAutomations] = useState<Automation[]>([])
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
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  useEffect(() => {
    fetchAutomations()
  }, [fetchAutomations])

  const handleOpenDialog = useCallback((automation?: Automation) => {
    if (automation) {
      setEditingAutomation(automation)
      setFormData({
        name: automation.name,
        type: automation.type,
        subject: automation.subject,
        message: automation.message as Content,
      })
    } else {
      setEditingAutomation(null)
      setFormData({
        name: "",
        type: "email",
        subject: "",
        message: "" as Content,
      })
    }
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
    // Processar variáveis de exemplo para preview
    let html = typeof formData.message === 'string' ? formData.message : ''
    html = html.replace(/\{\{nome\}\}/gi, 'João Silva')
    html = html.replace(/\{\{email\}\}/gi, 'joao@exemplo.com')
    setPreviewHtml(html)
    setPreviewOpen(true)
  }

  const handleSubmit = async () => {
    const messageContent = typeof formData.message === 'string' ? formData.message : ''
    
    if (!formData.name.trim() || !formData.subject.trim() || !messageContent.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
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

  return (
    <div className="flex flex-1 flex-col gap-6 bg-black rounded-b-2xl p-4 lg:p-6">
      {/* Alert Dialog de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a automação &quot;{currentDeleteTarget?.name}&quot;? Essa ação não
              pode ser desfeita.
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
                Comece criando sua primeira automação de email para disparar mensagens automáticas.
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

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="min-w-6xl w-[98vw] max-h-[95vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingAutomation ? "Editar Automação" : "Nova Automação de Email"}
            </DialogTitle>
            <DialogDescription>
              Configure uma automação que será disparada quando um formulário for enviado.
              Use o editor para criar emails profissionais com formatação rica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Automação *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Email de boas-vindas"
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
              <Label htmlFor="subject">Assunto do Email *</Label>
              <Input
                id="subject"
                placeholder="Ex: Bem-vindo ao nosso serviço, {{nome}}!"
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
              </div>
            </div>
          </div>

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

      {/* Dialog de Preview */}
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

