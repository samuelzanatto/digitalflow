"use client"

import { useEffect, useState } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { motion } from "framer-motion"
import { IconPlus, IconEdit, IconTrash, IconMail, IconEye } from "@tabler/icons-react"
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

  const fetchAutomations = async () => {
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
  }

  useEffect(() => {
    fetchAutomations()
  }, [])

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2" onClick={() => handleOpenDialog()}>
        <IconPlus size={18} />
        Nova Automação
      </Button>
    )
    setPageHeader("Automações", "Configure workflows e gatilhos automáticos de email", actionButton)
  }, [setPageHeader])

  const handleOpenDialog = (automation?: Automation) => {
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
  }

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

  const handleDelete = async (automation: Automation) => {
    if (!confirm(`Deseja excluir a automação "${automation.name}"?`)) return

    try {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Automação excluída!")
        fetchAutomations()
      } else {
        toast.error("Erro ao excluir automação")
      }
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast.error("Erro ao excluir automação")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando automações...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <IconMail size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma automação criada ainda</p>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <IconPlus size={18} />
            Criar primeira automação
          </Button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }} 
          className="space-y-3"
        >
          {automations.map((automation) => (
            <Card key={automation.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <IconMail size={20} className="text-primary" />
                    <h3 className="font-semibold">{automation.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    📧 Assunto: {automation.subject}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    💬 {automation.message.substring(0, 100)}...
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Switch
                    checked={automation.enabled}
                    onCheckedChange={() => handleToggleEnabled(automation)}
                  />
                  <Badge variant={automation.enabled ? "default" : "outline"}>
                    {automation.enabled ? "Ativa" : "Inativa"}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog(automation)}
                  >
                    <IconEdit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(automation)}
                    className="text-destructive hover:text-destructive"
                  >
                    <IconTrash size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
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
                  <IconEye size={16} />
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

