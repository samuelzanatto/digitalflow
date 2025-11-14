'use client'

import React, { useState, useCallback } from 'react'
import { useEditor } from '@craftjs/core'
import { updateSalesPage } from '@/lib/actions/pages'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface EditorHeaderProps {
  pageId: string
  title: string
  isDirty: boolean
  onSaveSuccess?: () => void
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

      const result = await updateSalesPage({
        id: pageId,
        layout: parsedLayout,
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
