'use client'

import React from 'react'
import { Layers } from '@craftjs/layers'
import styled from 'styled-components'
import 'styled-components'

/**
 * LayersPanel - Renderiza a árvore de elementos com drag-and-drop nativo
 * 
 * Usa o componente oficial @craftjs/layers que oferece:
 * - Árvore completa de elementos (root + filhos aninhados)
 * - Drag-and-drop para reorganizar camadas
 * - Collapse/expand automático
 * - Seleção integrada com o editor
 */

// Styled container to override @craftjs/layers default styles
const LayersContainer = styled.div`
  /* Override hover state - cor um pouco mais clara que card background */
  & [class*="craft-layer-node"] > div {
    background: var(--card) !important;
    transition: background-color 0.2s ease !important;

    &:hover {
      background: hsl(var(--card) / 0.8) !important;
    }
  }

  /* Mantém seleção azul */
  & div[style*="background: rgb(38, 128, 235)"] {
    background: rgb(38, 128, 235) !important;
  }

  & div[style*="background: rgb(38, 128, 235)"] * {
    color: white !important;
  }

  & div[style*="background: rgb(38, 128, 235)"] svg {
    fill: white !important;
  }

  /* Layer children background */
  & [class*="craft-layer-children"] {
    background: var(--card) !important;
  }
`

export function LayersPanel() {
  return (
    <div className="h-full flex flex-col border-r bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-background">
        <h2 className="text-sm font-semibold">Camadas</h2>
        <p className="text-xs text-muted-foreground mt-1">Arraste para reorganizar</p>
      </div>

      {/* 
        Layers component do Craft.js renderiza a árvore completa com:
        - Ícones indicativos de tipo de componente
        - Drag-and-drop automático entre Canvas Nodes
        - Seleção em clique
        - Botões de ação (delete, etc)
      */}
      <LayersContainer className="flex-1 overflow-y-auto overflow-x-hidden">
        <Layers />
      </LayersContainer>
    </div>
  )
}
