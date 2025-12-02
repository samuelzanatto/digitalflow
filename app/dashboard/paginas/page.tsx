'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePageHeader } from '@/hooks/usePageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit2, Eye, Plus, MoreHorizontal, RefreshCcw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  createSalesPage,
  deleteSalesPage,
  getUserPages,
  refreshPagePreviewImage,
  togglePagePublish,
} from '@/lib/actions/pages'
import { cn } from '@/lib/utils'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { useCollaboration } from '@/contexts/collaboration-context'

interface SectionPreview {
  id: string
  type: string
  props: Record<string, unknown> | null
}

interface SalesPage {
  id: string
  title: string
  slug: string
  description: string
  userId: string
  thumbnail?: string | null
  published: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  sections?: SectionPreview[]
}

interface CreateDialogHandle {
  open: () => void
  close: () => void
}

const CreatePageDialog = React.forwardRef<CreateDialogHandle, {
  onCreatePage: (title: string, description: string) => Promise<void>
  isCreating: boolean
  canCreate: boolean
}>(({ onCreatePage, isCreating, canCreate }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  React.useImperativeHandle(
    ref,
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [],
  )

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    if (!canCreate) {
      toast.error('Aguarde o carregamento do usuário logado')
      return
    }

    await onCreatePage(title, description)
    setTitle('')
    setDescription('')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Página</DialogTitle>
          <DialogDescription>
            Crie uma nova página de vendas para começar a converter
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Página</Label>
            <Input
              id="title"
              placeholder="Ex: Webinar de Marketing"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isCreating || !canCreate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o objetivo desta página..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isCreating || !canCreate}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !canCreate}>
            {!canCreate ? 'Carregando usuário...' : isCreating ? 'Criando...' : 'Criar Página'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
CreatePageDialog.displayName = 'CreatePageDialog'

const MAX_PREVIEW_DEPTH = 4

const isValidImageValue = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('blob:')
  )
}

const findFirstImageSource = (value: unknown, depth = 0): string | null => {
  if (value == null || depth > MAX_PREVIEW_DEPTH) return null
  if (isValidImageValue(value)) {
    return value.trim()
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFirstImageSource(entry, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const found = findFirstImageSource(entry, depth + 1)
      if (found) return found
    }
  }

  return null
}

const getPagePreviewImage = (page: SalesPage): string | null => {
  if (isValidImageValue(page.thumbnail)) {
    return page.thumbnail.trim()
  }

  const firstSectionPreview = findFirstImageSource(page.sections?.[0]?.props ?? null)
  if (firstSectionPreview) {
    return firstSectionPreview
  }

  const versionToken = page.sections?.[0]?.id ?? page.updatedAt ?? page.id
  return `/api/pages/${page.id}/preview?ver=${encodeURIComponent(versionToken)}`
}

const formatUserId = (id: string) => {
  if (!id) return '-'
  if (id.length <= 10) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}

export default function PaginasPage() {
  const { setPageHeader } = usePageHeader()
  const { user, loading: isUserLoading } = useSupabaseUser()
  const { collaborators } = useCollaboration()
  const [pages, setPages] = useState<SalesPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [refreshingPageId, setRefreshingPageId] = useState<string | null>(null)
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null)
  const dialogRef = useRef<CreateDialogHandle>(null)

  // Função para obter colaboradores editando uma página específica
  const getEditingCollaborators = useCallback((pageId: string) => {
    const editorPath = `/editor/${pageId}`
    return collaborators.filter((c) => c.currentPath === editorPath)
  }, [collaborators])

  const loadPages = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await getUserPages()
      if (result.success && result.data) {
        setPages(result.data as unknown as SalesPage[])
      }
    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
      toast.error('Erro ao carregar páginas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const onCreatePage = useCallback(
    async (title: string, description: string) => {
      if (!user?.id) {
        toast.error('Não foi possível identificar o usuário logado')
        return
      }
      setIsCreating(true)
      try {
        const result = await createSalesPage({
          title,
          description,
          userId: user.id,
        })

        if (result.success) {
          toast.success('Página criada com sucesso!')
          await loadPages()
        } else {
          toast.error(result.error || 'Erro ao criar página')
        }
      } catch (error) {
        console.error('Erro ao criar página:', error)
        toast.error('Erro ao criar página')
      } finally {
        setIsCreating(false)
      }
    },
    [loadPages, user?.id],
  )

  const canCreatePage = Boolean(user?.id && !isUserLoading)

  const handleDeletePage = useCallback(
    async (id: string) => {
      const confirmed = confirm('Tem certeza que deseja deletar esta página?')
      if (!confirmed) return

      setDeletingPageId(id)
      try {
        const result = await deleteSalesPage(id)
        if (result.success) {
          setPages((prev) => prev.filter((p) => p.id !== id))
          toast.success('Página deletada')
        } else {
          toast.error(result.error || 'Falha ao deletar página')
        }
      } catch (error) {
        console.error('Erro ao deletar página:', error)
        toast.error('Erro ao deletar página')
      } finally {
        setDeletingPageId(null)
      }
    },
    [],
  )

  const handleTogglePublish = useCallback(
    async (id: string) => {
      try {
        const result = await togglePagePublish(id)
        if (result.success && result.data) {
          setPages((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, published: (result.data as unknown as SalesPage).published } : p,
            ),
          )
          const published = (result.data as unknown as SalesPage).published
          toast.success(published ? 'Página publicada!' : 'Página despublicada')
        } else {
          toast.error(result.error || 'Falha ao publicar página')
        }
      } catch (error) {
        console.error('Erro ao publicar página:', error)
        toast.error('Erro ao publicar página')
      }
    },
    [],
  )

  const handleRefreshPreview = useCallback(async (id: string) => {
    setRefreshingPageId(id)
    try {
      const result = await refreshPagePreviewImage(id)
      if (result.success && result.data) {
        setPages((prev) =>
          prev.map((page) =>
            page.id === id ? { ...page, thumbnail: result.data.thumbnail } : page,
          ),
        )
        toast.success('Prévia atualizada')
      } else {
        toast.error(result.error || 'Falha ao atualizar prévia')
      }
    } catch (error) {
      console.error('Erro ao atualizar prévia:', error)
      toast.error('Erro ao atualizar prévia')
    } finally {
      setRefreshingPageId(null)
    }
  }, [])

  useEffect(() => {
    const actionButton = (
      <Button
        onClick={() => dialogRef.current?.open()}
        className="gap-2"
        disabled={!canCreatePage}
      >
        <Plus className="w-4 h-4" />
        Nova Página
      </Button>
    )
    setPageHeader(
      'Páginas de Vendas',
      'Crie e gerencie suas páginas de vendas de forma visual',
      actionButton,
    )
  }, [canCreatePage, setPageHeader])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <video autoPlay loop muted playsInline className="h-24 w-24">
          <source src="/loading.mp4" type="video/mp4" />
        </video>
      </div>
    )
  }

  return (
    <>
      <CreatePageDialog
        ref={dialogRef}
        onCreatePage={onCreatePage}
        isCreating={isCreating}
        canCreate={canCreatePage}
      />
      <div className="flex flex-1 flex-col gap-6 rounded-b-2xl bg-black p-4 lg:p-6">
        {pages.length === 0 ? (
          <Card className="border-2 border-dashed border-white/15 bg-black/30 text-center">
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="text-4xl">📄</div>
              <h3 className="text-lg font-semibold">Nenhuma página criada</h3>
              <p className="text-muted-foreground">
                Crie sua primeira página de vendas para começar
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {pages.map((page) => {
              const previewImage = getPagePreviewImage(page)
              const editingCollaborators = getEditingCollaborators(page.id)

              return (
                <div key={page.id} className="relative">
                  {/* Avatares dos colaboradores editando esta página - fora do card para não ser cortado */}
                  {editingCollaborators.length > 0 && (
                    <div className="absolute -top-2 -right-2 z-50 flex -space-x-2">
                      <TooltipProvider>
                        {editingCollaborators.slice(0, 3).map((collaborator) => (
                          <Tooltip key={collaborator.id}>
                            <TooltipTrigger asChild>
                              <Avatar 
                                className="h-7 w-7 border-2 border-background ring-2 shadow-lg cursor-default"
                                style={{ "--tw-ring-color": collaborator.color } as React.CSSProperties}
                              >
                                <AvatarImage src={collaborator.avatarUrl ?? undefined} alt={collaborator.name} />
                                <AvatarFallback 
                                  className="text-xs font-medium text-white"
                                  style={{ backgroundColor: collaborator.color }}
                                >
                                  {collaborator.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {collaborator.name} está editando
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {editingCollaborators.length > 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium shadow-lg">
                                +{editingCollaborators.length - 3}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {editingCollaborators.slice(3).map((c) => c.name).join(", ")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  )}
                  
                  <Card
                    className={cn(
                      "group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(80,80,120,0.35),rgba(0,0,0,0.9))] p-0 transition-all duration-300 hover:border-primary/50 hover:shadow-xl",
                      editingCollaborators.length > 0 && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={editingCollaborators.length > 0 ? { 
                      "--tw-ring-color": editingCollaborators[0]?.color 
                    } as React.CSSProperties : undefined}
                  >
                  <div className="relative aspect-video w-full">
                    {previewImage ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${previewImage})` }}
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/60">
                          Prévia indisponível
                        </div>
                        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                      </>
                    )}
                    <span className="absolute bottom-3 left-4 text-[11px] font-semibold tracking-[0.2em] text-white/80">
                      Prévia
                    </span>
                  </div>

                  <div className="flex h-full flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="line-clamp-2 text-lg font-semibold text-white">
                          {page.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">/{page.slug}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Criado por: {formatUserId(page.userId)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-full border border-white/10 p-1.5 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações da página</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleRefreshPreview(page.id)} disabled={refreshingPageId === page.id}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            {refreshingPageId === page.id ? 'Atualizando...' : 'Atualizar prévia'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(page.id)}>
                            {page.published ? 'Despublicar' : 'Publicar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeletePage(page.id)}
                            disabled={deletingPageId === page.id}
                          >
                            {deletingPageId === page.id ? 'Deletando...' : 'Deletar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {page.description || 'Adicione uma descrição para esta página.'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Visualizações: {page.viewCount}</span>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          page.published
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-200',
                        )}
                      >
                        {page.published ? 'Publicada' : 'Rascunho'}
                      </span>
                    </div>

                    <div className="mt-auto flex gap-2 border-t border-white/5 pt-4">
                      <Button size="sm" className="flex-1 gap-2" asChild>
                        <Link
                          href={`/editor/${page.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 gap-2 border border-white/20 bg-white/5 text-white shadow-inner"
                        asChild
                      >
                        <Link
                          href={`/preview/${page.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Ver</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
