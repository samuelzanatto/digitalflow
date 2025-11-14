'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit2, Eye, Plus, MoreHorizontal } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { toast } from 'sonner'
import { createSalesPage, getUserPages } from '@/lib/actions/pages'

interface SalesPage {
  id: string
  title: string
  slug: string
  description: string
  thumbnail?: string
  published: boolean
  viewCount: number
  createdAt: string
}

export default function PaginasPage() {
  const [pages, setPages] = useState<SalesPage[]>([])
  const [, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [, setIsCreating] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageDescription, setNewPageDescription] = useState('')

  // Carregar páginas ao montar
  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      setIsLoading(true)
      const result = await getUserPages('user-demo')
      if (result.success && result.data) {
        setPages(result.data as unknown as SalesPage[])
      }
    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
      toast.error('Erro ao carregar páginas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    setIsCreating(true)
    try {
      const result = await createSalesPage({
        title: newPageTitle,
        description: newPageDescription,
        userId: 'user-demo',
      })

      if (result.success) {
        toast.success('Página criada com sucesso!')
        setNewPageTitle('')
        setNewPageDescription('')
        setIsCreateOpen(false)
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
  }

  const handleDeletePage = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta página?')) {
      setPages(pages.filter((p) => p.id !== id))
      toast.success('Página deletada')
    }
  }

  const handleTogglePublish = (id: string) => {
    setPages(
      pages.map((p) =>
        p.id === id ? { ...p, published: !p.published } : p
      )
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header com botão criar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Páginas de Vendas</h1>
              <p className="text-muted-foreground">
                Crie e gerencie suas páginas de vendas de forma visual
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Página
                </Button>
              </DialogTrigger>
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
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o objetivo desta página..."
                      value={newPageDescription}
                      onChange={(e) => setNewPageDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePage}>Criar Página</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pages Grid */}
          {pages.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma página criada</h3>
                <p className="text-muted-foreground mb-6">
                  Crie sua primeira página de vendas para começar
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  Criar Primeira Página
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <Card key={page.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Thumbnail / Preview */}
                  <div className="h-40 bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center border-b">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🖼️</div>
                      <p className="text-xs text-muted-foreground">Prévia</p>
                    </div>
                  </div>

                  {/* Content */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">
                          {page.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          /{page.slug}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleTogglePublish(page.id)}
                          >
                            {page.published ? 'Despublicar' : 'Publicar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeletePage(page.id)}
                          >
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  {/* Description */}
                  <CardContent className="pb-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {page.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Visualizações: {page.viewCount}</span>
                      <span className={page.published ? 'text-green-600 font-medium' : ''}>
                        {page.published ? '✓ Publicada' : '○ Rascunho'}
                      </span>
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link href={`/dashboard/paginas/${page.id}/editor`} className="flex-1">
                      <Button size="sm" className="w-full gap-2" variant="default">
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
