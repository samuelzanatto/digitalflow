'use client'

import React, { useState } from 'react'
import { useEditor } from '@craftjs/core'
import { toast } from 'sonner'
import { Trash2, Palette, Pipette } from 'lucide-react'

export function EditorToolbarArea() {
  const { selected, actions, query } = useEditor((state) => ({
    selected: state.events.selected,
  }))
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  const selectedNode = selected.size === 1 ? Array.from(selected)[0] : null

  const handleDeleteSelected = () => {
    if (!selectedNode) {
      toast.error('Selecione um elemento para deletar')
      return
    }

    try {
      const allNodes = query.getNodes()
      const nodesList = Object.entries(allNodes)
      
      // Encontrar o nó raiz (sem parent)
      let rootNodeId: string | null = null
      for (const [nodeId, node] of nodesList) {
        const n = node as Record<string, unknown>
        if (!n.parent) {
          rootNodeId = nodeId
          break
        }
      }

      if (selectedNode === rootNodeId) {
        toast.error('Não é possível deletar o container principal da página')
        return
      }

      actions.delete(selectedNode)
      toast.success('Elemento deletado com sucesso')
    } catch (error) {
      console.error('Erro ao deletar elemento:', error)
      toast.error('Erro ao deletar elemento')
    }
  }

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color)
    
    // Encontrar o root container e mudar sua backgroundColor via setProp
    try {
      const allNodes = query.getNodes()
      const nodesList = Object.entries(allNodes)
      
      let rootNodeId: string | null = null
      for (const [nodeId, node] of nodesList) {
        const n = node as Record<string, unknown>
        if (!n.parent) {
          rootNodeId = nodeId
          break
        }
      }

      if (rootNodeId) {
        actions.setProp(rootNodeId, (props: Record<string, unknown>) => {
          props.backgroundColor = color
        })
        toast.success('Cor de fundo alterada')
      }
    } catch (error) {
      console.error('Erro ao alterar cor de fundo:', error)
      toast.error('Erro ao alterar cor de fundo')
    }
  }

  const handleColorPicker = () => {
    const colorInput = document.createElement('input')
    colorInput.type = 'color'
    colorInput.value = backgroundColor
    colorInput.onchange = (e) => {
      const color = (e.target as HTMLInputElement).value
      handleBackgroundColorChange(color)
    }
    colorInput.click()
  }

  const handleEyedropper = async () => {
    try {
      // Verifica se o browser suporta a EyeDropper API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropperAvailable = (window as any).EyeDropper
      if (!eyeDropperAvailable) {
        toast.error('Seu navegador não suporta seletor de cor')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropper = new (window as any).EyeDropper()
      const result = await eyeDropper.open()
      handleBackgroundColorChange(result.sRGBHex)
    } catch (error) {
      if ((error as Error).name !== 'NotAllowedError') {
        console.error('Erro ao usar eyedropper:', error)
        toast.error('Erro ao usar seletor de cor')
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Editor</span>

      <div className="ml-auto flex gap-2">
        {selectedNode && (
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1 text-xs rounded border hover:bg-destructive/10 text-destructive flex items-center gap-1 transition-colors"
            title="Deletar elemento"
          >
            <Trash2 className="w-4 h-4" /> Deletar
          </button>
        )}

        {/* Page Background Color Button */}
        <button
          onClick={handleColorPicker}
          className="px-3 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1 transition-colors"
          title="Alterar cor de fundo da página"
        >
          <Palette className="w-4 h-4" /> Fundo
        </button>

        {/* Eyedropper Button */}
        <button
          onClick={handleEyedropper}
          className="px-3 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1 transition-colors"
          title="Selecionar cor na tela"
        >
          <Pipette className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
