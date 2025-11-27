"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowRight, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardCardFooter,
  DashboardCardActions,
} from "@/components/digitalflow"
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
import { usePageHeader } from "@/hooks/usePageHeader"
import { toast } from "sonner"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"

interface ApiFlow {
  id: string
  funnelId: string
  name: string
  description?: string | null
  nodesData?: { nodes?: unknown[] } | null
  createdAt: string
  updatedAt: string
  userId: string
}

interface Funnel {
  id: string
  funnelId: string
  name: string
  description: string
  stagesCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

const mapFlowToFunnel = (flow: ApiFlow): Funnel => {
  const nodes = Array.isArray(flow.nodesData?.nodes) ? flow.nodesData?.nodes : undefined

  return {
    id: flow.id,
    funnelId: flow.funnelId,
    name: flow.name,
    description: flow.description ?? "",
    stagesCount: Array.isArray(nodes) ? nodes.length : 0,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
    createdBy: flow.userId,
  }
}

const formatUserId = (id: string) => {
  if (!id) return "-"
  if (id.length <= 10) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}

export default function FlowsPage() {
  const { setPageHeader } = usePageHeader()
  const { user, loading: isUserLoading } = useSupabaseUser()
  const router = useRouter()
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newFunnel, setNewFunnel] = useState({ name: "", description: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", description: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Funnel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const canCreateFunnel = Boolean(user?.id && !isUserLoading)

  const handleOpenDialog = useCallback(() => setIsOpen(true), [])

  const fetchFlows = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/flows", { cache: "no-store" })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Falha ao carregar fluxos")
      }

      const mapped: Funnel[] = Array.isArray(payload.data)
        ? payload.data.map(mapFlowToFunnel)
        : []

      setFunnels(mapped)
    } catch (error) {
      console.error("Erro ao carregar fluxos", error)
      toast.error("Não foi possível carregar os fluxos.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2" onClick={handleOpenDialog} disabled={!canCreateFunnel}>
        <Plus className="w-4 h-4" />
        Novo Funil
      </Button>
    )
    setPageHeader(
      "Fluxos de Vendas",
      "Crie e personalize seus funis de vendas com fluxos automáticos",
      actionButton
    )
  }, [canCreateFunnel, handleOpenDialog, setPageHeader])

  useEffect(() => {
    fetchFlows()
  }, [fetchFlows])

  const handleCreateFunnel = async () => {
    if (!newFunnel.name.trim() || isCreating) return
    if (!user?.id) {
      toast.error("Não foi possível identificar o usuário logado")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFunnel.name,
          description: newFunnel.description,
          userId: user.id,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Falha ao criar funil")
      }

      const created = mapFlowToFunnel(payload.data as ApiFlow)
      setFunnels((prev) => [created, ...prev])
      setNewFunnel({ name: "", description: "" })
      setIsOpen(false)
      toast.success("Funil criado com sucesso!")
    } catch (error) {
      console.error("Erro ao criar funil", error)
      toast.error("Não foi possível criar o funil.")
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingId(null)
      setEditForm({ name: "", description: "" })
    }
  }, [editDialogOpen])

  useEffect(() => {
    if (!deleteDialogOpen) {
      setDeleteTarget(null)
    }
  }, [deleteDialogOpen])

  const handleOpenEdit = (funnel: Funnel) => {
    setEditingId(funnel.funnelId)
    setEditForm({ name: funnel.name, description: funnel.description })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingId || isUpdating) return

    const trimmedName = editForm.name.trim()
    if (!trimmedName) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/flows/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: editForm.description,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Falha ao atualizar funil")
      }

      const updated = mapFlowToFunnel(payload.data as ApiFlow)
      setFunnels((prev) =>
        prev.map((funnel) => (funnel.funnelId === editingId ? updated : funnel)),
      )
      setEditDialogOpen(false)
      setEditingId(null)
      toast.success("Funil atualizado!")
    } catch (error) {
      console.error("Erro ao atualizar funil", error)
      toast.error("Não foi possível atualizar o funil.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenDelete = (funnel: Funnel) => {
    setDeleteTarget(funnel)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/flows/${deleteTarget.funnelId}`, {
        method: "DELETE",
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Falha ao excluir funil")
      }

      setFunnels((prev) => prev.filter((funnel) => funnel.funnelId !== deleteTarget.funnelId))
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      toast.success("Funil excluído")
    } catch (error) {
      console.error("Erro ao excluir funil", error)
      toast.error("Não foi possível excluir o funil.")
    } finally {
      setIsDeleting(false)
    }
  }

  const currentDeleteTarget = useMemo(
    () => deleteTarget,
    [deleteTarget],
  )

  return (
    <div className="flex flex-1 flex-col gap-6 bg-black rounded-b-2xl p-4 lg:p-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Funil de Vendas</DialogTitle>
            <DialogDescription>
              Defina o nome e a descrição do seu novo funil. Você poderá adicionar os estágios e fluxos depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Funil</Label>
              <Input
                id="name"
                placeholder="Ex: Funil de Vendas B2B"
                value={newFunnel.name}
                onChange={(e) => setNewFunnel({ ...newFunnel, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo deste funil..."
                value={newFunnel.description}
                onChange={(e) => setNewFunnel({ ...newFunnel, description: e.target.value })}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleCreateFunnel}
              disabled={!newFunnel.name.trim() || isCreating || !canCreateFunnel}
              className="w-full"
            >
              {!canCreateFunnel ? "Carregando usuário..." : isCreating ? "Criando..." : "Criar Funil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Funil</DialogTitle>
            <DialogDescription>
              Atualize o nome e a descrição para organizar melhor seus fluxos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSaveEdit} disabled={!editForm.name.trim() || isUpdating}>
                {isUpdating ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o funil &quot;{currentDeleteTarget?.name}&quot;? Essa ação não
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

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <video autoPlay loop muted playsInline className="w-24 h-24">
            <source src="/loading.mp4" type="video/mp4" />
          </video>
        </div>
      ) : funnels.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <Empty className="border-none bg-transparent p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>Nenhum funil criado</EmptyTitle>
              <EmptyDescription>
                Comece criando seu primeiro funil de vendas para organizar seus fluxos e processos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button className="gap-2" onClick={handleOpenDialog}>
                <Plus className="w-4 h-4" />
                Criar primeiro funil
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {funnels.map((funnel) => (
            <DashboardCard
              key={funnel.funnelId}
              onClick={() => router.push(`/dashboard/flows/${funnel.funnelId}`)}
            >
              <DashboardCardHeader
                title={funnel.name}
                description={funnel.description || "Sem descrição"}
                actions={
                  <DashboardCardActions>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleOpenEdit(funnel)
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
                        handleOpenDelete(funnel)
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
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{funnel.stagesCount}</p>
                    <p className="text-xs text-muted-foreground">Nós salvos</p>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(funnel.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">Atualizado</p>
                  </div>
                </div>
              </DashboardCardContent>

              <DashboardCardFooter
                leftContent={
                  <>
                    <span>Criado em {new Date(funnel.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span className="opacity-80">Criado por: {formatUserId(funnel.createdBy)}</span>
                  </>
                }
                rightContent={
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                }
              />
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  )
}
