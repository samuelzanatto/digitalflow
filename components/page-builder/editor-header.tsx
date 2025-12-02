'use client'

import React, { useState, useCallback } from 'react'
import { useEditor } from '@craftjs/core'
import { updateSalesPage, deleteSalesPage } from '@/lib/actions/pages'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePageBuilderCollaborationContext } from '@/contexts/page-builder-collaboration-context'

interface EditorHeaderProps {
  pageId: string
  title: string
  isDirty: boolean
  onSaveSuccess?: () => void
}

/**
 * Valida se CaptureForm tem os campos obrigatórios (nome, email, telefone)
 */
function validateCaptureFormFields(layout: Record<string, unknown>): { valid: boolean; error?: string } {
  // Percorre todos os nós buscando CaptureForm
  for (const nodeKey of Object.keys(layout)) {
    const node = layout[nodeKey] as Record<string, unknown>
    if (!node || typeof node !== 'object') continue
    
    // Na estrutura serializada do CraftJS, displayName e props estão diretamente no nó
    const displayName = node.displayName as string | undefined
    const typeObj = node.type as Record<string, unknown> | undefined
    const typeName = typeObj?.resolvedName as string | undefined
    
    // Verifica se é um CaptureForm
    if (displayName === 'Capture Form' || typeName === 'CaptureForm') {
      const props = node.props as Record<string, unknown> | undefined
      if (!props) continue
      
      const inputFields = props.inputFields as Array<{
        id: string
        type: string
        label: string
      }> | undefined
      
      if (!inputFields || inputFields.length === 0) {
        return { valid: false, error: 'Formulário de captura precisa ter pelo menos os campos: Nome, Email e Telefone' }
      }
      
      // Verifica se tem campo de texto (nome)
      const hasNameField = inputFields.some(f => 
        f.type === 'text' && (f.label.toLowerCase().includes('nome') || f.label.toLowerCase().includes('name'))
      )
      
      // Verifica se tem campo de email
      const hasEmailField = inputFields.some(f => f.type === 'email')
      
      // Verifica se tem campo de telefone
      const hasPhoneField = inputFields.some(f => f.type === 'phone')
      
      if (!hasNameField) {
        return { valid: false, error: 'Formulário de captura precisa ter um campo de Nome (tipo: Texto, label contendo "nome")' }
      }
      
      if (!hasEmailField) {
        return { valid: false, error: 'Formulário de captura precisa ter um campo de Email' }
      }
      
      if (!hasPhoneField) {
        return { valid: false, error: 'Formulário de captura precisa ter um campo de Telefone' }
      }
      
      // Verifica se tem grupo de leads configurado
      const leadGroupId = props.leadGroupId as string | undefined
      if (!leadGroupId) {
        return { valid: false, error: 'Formulário de captura precisa ter um Grupo de Leads selecionado' }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Normaliza o layout serializado para garantir tipos corretos
 */
function normalizeLayoutForSave(layout: Record<string, unknown>): Record<string, unknown> {
  // Validação: verifica se layout contém ROOT
  if (!('ROOT' in layout)) {
    throw new Error('Layout não contém nó ROOT')
  }

  // Percorre todos os nós e valida as props
  const normalizeNode = (node: Record<string, unknown>) => {
    if (node && typeof node === 'object') {
      if ('data' in node && node.data) {
        const data = node.data as Record<string, unknown>
        if ('props' in data && data.props) {
          const props = data.props as Record<string, unknown>
          
          // Converte width/height strings em números quando apropriado
          if (typeof props.width === 'string' && !props.width.includes('%')) {
            const num = parseInt(props.width as string)
            if (!isNaN(num)) props.width = num
          }
          if (typeof props.height === 'string') {
            const h = props.height as string
            props.height = h === 'auto' ? 0 : parseInt(h) || 0
          }
        }
      }
      // Normaliza filhos recursivamente
      if ('nodes' in node && Array.isArray(node.nodes)) {
        (node.nodes as Record<string, unknown>[]).forEach((n) => normalizeNode(n))
      }
    }
  }

  // Normaliza o ROOT node
  normalizeNode(layout.ROOT as Record<string, unknown>)
  
  return layout
}

export function EditorHeader({
  pageId,
  title,
  isDirty,
  onSaveSuccess,
}: EditorHeaderProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { query } = useEditor()

  const handleSave = useCallback(async () => {
    if (!isDirty) return

    setIsSaving(true)
    try {
      const serialized = query.serialize()
      let parsedLayout: Record<string, unknown>

      try {
        parsedLayout = JSON.parse(serialized)
      } catch (error) {
        console.error('Erro ao serializar layout do Craft:', error)
        toast.error('Falha ao preparar layout para salvar')
        return
      }

      // Valida CaptureForm antes de salvar
      const validation = validateCaptureFormFields(parsedLayout)
      if (!validation.valid) {
        toast.error(validation.error || 'Erro de validação no formulário')
        return
      }

      // Normaliza o layout antes de salvar
      const normalizedLayout = normalizeLayoutForSave(parsedLayout)

      const result = await updateSalesPage({
        id: pageId,
        layout: normalizedLayout,
      })

      if (result.success) {
        toast.success('Página salva com sucesso!')
        onSaveSuccess?.()
      } else {
        toast.error(result.error || 'Erro ao salvar página')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar página')
    } finally {
      setIsSaving(false)
    }
  }, [pageId, query, isDirty, onSaveSuccess])

  const handlePreview = useCallback(() => {
    window.open(`/preview/${pageId}`, '_blank')
  }, [pageId])

  return (
    <div className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            ID: {pageId} {isDirty && <span className="ml-2 text-warning">● Não salvo</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
          >
            Prévia
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente de save button que usa useEditor
 * Deve ser renderizado DENTRO do <Editor />
 */
export function SaveButton({
  pageId,
  isDirty,
  onSaveSuccess,
}: Omit<EditorHeaderProps, 'title'>) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { query } = useEditor()
  const router = useRouter()
  const { broadcastPageSaved } = usePageBuilderCollaborationContext()

  const handleSave = useCallback(async () => {
    if (!isDirty) return

    setIsSaving(true)
    try {
      const serialized = query.serialize()
      let parsedLayout: Record<string, unknown>

      try {
        parsedLayout = JSON.parse(serialized)
      } catch (error) {
        console.error('Erro ao serializar layout do Craft:', error)
        toast.error('Falha ao preparar layout para salvar')
        return
      }

      // Valida CaptureForm antes de salvar
      const validation = validateCaptureFormFields(parsedLayout)
      if (!validation.valid) {
        toast.error(validation.error || 'Erro de validação no formulário')
        return
      }

      // Normaliza o layout antes de salvar
      const normalizedLayout = normalizeLayoutForSave(parsedLayout)

      const result = await updateSalesPage({
        id: pageId,
        layout: normalizedLayout,
      })

      if (result.success) {
        toast.success('Página salva com sucesso!')
        onSaveSuccess?.()
        // Notifica outros colaboradores que a página foi salva
        broadcastPageSaved()
      } else {
        toast.error(result.error || 'Erro ao salvar página')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar página')
    } finally {
      setIsSaving(false)
    }
  }, [pageId, query, isDirty, onSaveSuccess, broadcastPageSaved])

  const handlePreview = useCallback(() => {
    window.open(`/preview/${pageId}`, '_blank')
  }, [pageId])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const result = await deleteSalesPage(pageId)

      if (result.success) {
        toast.success('Página removida com sucesso!')
        router.push('/dashboard/paginas')
      } else {
        toast.error(result.error || 'Erro ao remover página')
      }
    } catch (error) {
      console.error('Erro ao remover página:', error)
      toast.error('Erro ao remover página')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }, [pageId, router])

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
        >
          Prévia
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          className="gap-2"
        >
          {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDeleting ? 'Removendo...' : 'Remover'}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Página</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta página? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
