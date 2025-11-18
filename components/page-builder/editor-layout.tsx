'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Editor, Frame, Element, SerializedNodes } from '@craftjs/core'
import { ComponentsToolbox } from './components-toolbox'
import { LayersPanel } from './layers-panel'
import { PropertiesPanel } from './properties-panel'
import { EditorToolbarArea } from './editor-toolbar-area'
import { SaveButton } from './editor-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  Container,
  TextBlock,
  RotatingText,
  HeroSection,
  CTAButton,
  Divider,
  Footer,
  PricingCard,
  TestimonialCard,
  FeatureCard,
  CaptureForm,
  StatsCounter,
  FAQItem,
  TrustBadges,
  ImageComponent,
  VSL,
} from '@/components/craft-components'

interface EditorLayoutProps {
  pageId: string
  pageTitle: string
  onSavePage?: () => void
  initialLayout?: Record<string, unknown> | null
  components?: Record<string, unknown>
}

/**
 * Garante que o layout tem um Container como ROOT editável
 * e migra propriedades antigas para o novo formato
 */
function normalizeLayout(layout: Record<string, unknown> | null): SerializedNodes | null {
  if (!layout || Array.isArray(layout)) {
    return null
  }

  if (!('ROOT' in layout)) {
    return null
  }

  const serialized = layout as SerializedNodes
  
  // Migra propriedades antigas do ROOT node para o novo formato
  const rootNode = serialized.ROOT as Record<string, unknown>
  if (rootNode && typeof rootNode === 'object' && 'data' in rootNode) {
    const data = rootNode.data as Record<string, unknown>
    if (data && typeof data === 'object' && 'props' in data) {
      const props = data.props as Record<string, unknown>
      
      // Migração de propriedades antigas
      // Se width é um número sem ser em %, converte para número
      if (typeof props.width === 'string' && props.width.endsWith('%')) {
        props.width = parseInt(props.width as string)
        props.fullWidth = true
      }
      
      // Se height é 'auto' (string), converte para 0 (number)
      if (props.height === 'auto' || props.height === '100%') {
        props.height = 0
      }
      
      // Se display não está definido, define como 'flex'
      if (!props.display) {
        props.display = 'flex'
      }
      
      // Se flexDirection não está definido, define como 'column'
      if (!props.flexDirection) {
        props.flexDirection = 'column'
      }

      if (typeof props.minHeight !== 'number') {
        const numericHeight = typeof props.height === 'number' ? props.height : 0
        props.minHeight = numericHeight > 0 ? numericHeight : 200
      }
    }
  }
  
  return serialized
}

export function EditorLayout({ 
  pageId, 
  pageTitle,
  initialLayout,
  onSavePage,
  components = {},
}: EditorLayoutProps) {
  const [isDirty, setIsDirty] = useState(false)
  const hasHydratedRef = useRef(false)

  const parsedLayout = useMemo<SerializedNodes | null>(() => {
    return normalizeLayout(initialLayout as Record<string, unknown> | null)
  }, [initialLayout])

  const handleSaveSuccess = useCallback(() => {
    setIsDirty(false)
    onSavePage?.()
  }, [onSavePage])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Craft.js Editor Provider - wraps entire layout */}
      <Editor
        resolver={{
          Container,
          TextBlock,
          RotatingText,
          HeroSection,
          CTAButton,
          Divider,
          Footer,
          PricingCard,
          TestimonialCard,
          FeatureCard,
          CaptureForm,
          StatsCounter,
          FAQItem,
          TrustBadges,
          ImageComponent,
          VSL,
          ...components,
        }}
        onNodesChange={() => {
          if (!hasHydratedRef.current) {
            hasHydratedRef.current = true
            return
          }
          setIsDirty(true)
        }}
      >
        {/* Minimal Header - Page Builder Fullscreen (INSIDE Editor for useEditor context) */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 gap-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/paginas">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-sm font-semibold">{pageTitle}</h1>
              <p className="text-xs text-muted-foreground">{pageId}</p>
            </div>
          </div>
          <SaveButton pageId={pageId} isDirty={isDirty} onSaveSuccess={handleSaveSuccess} />
        </header>
        {/* Main Editor Area */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Left Sidebar - Components */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <ComponentsToolbox />
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Canvas */}
          <ResizablePanel defaultSize={60} minSize={40} className="flex flex-col">
            {/* Toolbar */}
            <div className="bg-card border-b px-4 py-2 flex items-center gap-2 sticky top-0 z-20">
              <EditorToolbarArea />
            </div>

            {/* Canvas Area with Frame */}
            <div className="flex-1 overflow-y-auto craftjs-frame bg-white min-h-auto">
              <Frame data={parsedLayout ?? undefined}>
                {/*
                  IMPORTANTE: O Container com `canvas` prop garante que:
                  1. O elemento é selecionável e editável via useNode
                  2. Suas propriedades (height, width, padding, etc) podem ser alteradas no painel
                  3. Quando data={parsedLayout} é fornecido, o Frame renderiza o estado salvo,
                     mas os elementos filhos ainda podem ser adicionados/removidos
                  
                  O `id="root-container"` mantém referência consistente ao ROOT container.
                  Documentação: https://craft.js.org/docs/concepts/nodes#canvas-node
                */}
                <Element
                  is={Container}
                  canvas
                  id="root-container"
                  paddingTop={40}
                  paddingBottom={40}
                  paddingLeft={40}
                  paddingRight={40}
                  backgroundColor="#ffffff"
                  height={0}
                  minHeight={800}
                >
                  {!parsedLayout && (
                    <TextBlock content="Arraste componentes da esquerda para começar" alignment="center" />
                  )}
                </Element>
              </Frame>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Properties & Layers */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Properties */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <PropertiesPanel />
              </ResizablePanel>

              <ResizableHandle />

              {/* Layers */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <LayersPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Editor>
    </div>
  )
}
