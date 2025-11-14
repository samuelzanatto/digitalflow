'use client'

import React, { useState } from 'react'
import { useEditor } from '@craftjs/core'
import { toast } from 'sonner'
import { Plus, Trash2, Palette } from 'lucide-react'
import { HeroSection, TextBlock, CTAButton, Divider } from '@/components/craft-components'

export function EditorToolbarArea() {
  const { selected, actions, query } = useEditor((state) => ({
    selected: state.events.selected,
  }))
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  const selectedNode = selected.size === 1 ? Array.from(selected)[0] : null

  const handleAddComponent = (type: string) => {
    let component: React.ReactNode = null

    switch (type) {
      case 'hero-section':
        component = (
          <HeroSection
            title="Novo Hero"
            subtitle="Subtítulo"
            backgroundColor="#f0f9ff"
          />
        )
        break
      case 'text-block':
        component = (
          <TextBlock content="Novo texto" fontSize={16} color="#000000" />
        )
        break
      case 'cta-button':
        component = (
          <CTAButton text="Clique aqui" link="#" backgroundColor="#0070f3" />
        )
        break
      case 'divider':
        component = <Divider height={2} color="#e0e0e0" margin={20} />
        break
    }

    if (component) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actions.add(component as any)
      } catch (error) {
        console.error('Erro ao adicionar componente:', error)
      }
    }
  }

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

  return (
    <>
      <span className="text-xs text-muted-foreground">Craft.js Editor</span>

      <div className="ml-auto flex gap-1">
        <button
          onClick={() => handleAddComponent('hero-section')}
          className="px-2 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1"
          title="Adicionar Hero"
        >
          <Plus className="w-3 h-3" /> Hero
        </button>
        <button
          onClick={() => handleAddComponent('text-block')}
          className="px-2 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1"
          title="Adicionar Texto"
        >
          <Plus className="w-3 h-3" /> Texto
        </button>
        <button
          onClick={() => handleAddComponent('cta-button')}
          className="px-2 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1"
          title="Adicionar Botão"
        >
          <Plus className="w-3 h-3" /> CTA
        </button>
        <button
          onClick={() => handleAddComponent('divider')}
          className="px-2 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1"
          title="Adicionar Divisor"
        >
          <Plus className="w-3 h-3" /> Linha
        </button>

        {selectedNode && (
          <button
            onClick={handleDeleteSelected}
            className="px-2 py-1 text-xs rounded border hover:bg-destructive/10 text-destructive flex items-center gap-1 ml-2"
            title="Deletar elemento"
          >
            <Trash2 className="w-3 h-3" /> Deletar
          </button>
        )}

        {/* Page Background Color Button */}
        <div className="ml-2 pl-2 border-l">
          <button
            onClick={() => {
              const colorInput = document.createElement('input')
              colorInput.type = 'color'
              colorInput.value = backgroundColor
              colorInput.onchange = (e) => {
                const color = (e.target as HTMLInputElement).value
                setBackgroundColor(color)
                const frame = document.querySelector('.craftjs-frame') as HTMLDivElement
                if (frame) {
                  frame.style.backgroundColor = color
                }
              }
              colorInput.click()
            }}
            className="px-2 py-1 text-xs rounded border hover:bg-accent flex items-center gap-1"
            title="Alterar cor de fundo"
          >
            <Palette className="w-3 h-3" /> Fundo
          </button>
        </div>
      </div>
    </>
  )
}
