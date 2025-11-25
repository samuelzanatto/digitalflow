'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Editor, Frame, Element, SerializedNodes } from '@craftjs/core'
import { ComponentsToolbox } from './components-toolbox'
import { LayersPanel } from './layers-panel'
import { PropertiesPanel } from './properties-panel'
import { EditorToolbarArea } from './editor-toolbar-area'
import { SaveButton } from './editor-header'
import { 
  DevicePreviewToolbar, 
  DeviceFrame, 
  useDevicePreviewState,
  DEVICE_PRESETS,
  DevicePresetKey,
} from './device-preview'
import { ViewportProvider, useViewport, ViewportMode } from '@/contexts/viewport-context'
import { EditorViewportProvider } from '@/lib/responsive-props'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  Container,
  TextBlock,
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
  CountdownTimer,
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

function ViewportSync({ targetViewport }: { targetViewport: ViewportMode }) {
  const { currentViewport, setViewport } = useViewport()

  useEffect(() => {
    if (currentViewport !== targetViewport) {
      setViewport(targetViewport)
    }
  }, [currentViewport, targetViewport, setViewport])

  return null
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
  const { state: deviceState, updateState: updateDeviceState, calculateFitZoom } = useDevicePreviewState('desktop-1440')
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const parsedLayout = useMemo<SerializedNodes | null>(() => {
    return normalizeLayout(initialLayout as Record<string, unknown> | null)
  }, [initialLayout])

  const handleSaveSuccess = useCallback(() => {
    setIsDirty(false)
    onSavePage?.()
  }, [onSavePage])

  // Auto-fit zoom quando o container muda de tamanho
  useEffect(() => {
    const updateFitZoom = () => {
      if (!canvasContainerRef.current) return
      const { clientWidth, clientHeight } = canvasContainerRef.current
      const fitZoom = calculateFitZoom(clientWidth, clientHeight)
      updateDeviceState({ zoom: fitZoom })
    }

    // Calcula zoom inicial
    updateFitZoom()

    const observer = new ResizeObserver(updateFitZoom)
    if (canvasContainerRef.current) {
      observer.observe(canvasContainerRef.current)
    }

    return () => observer.disconnect()
  }, [calculateFitZoom, updateDeviceState])

  const viewportMode = useMemo<ViewportMode>(() => {
    if (deviceState.device === 'responsive') {
      // Map custom responsive widths to the closest viewport bucket
      if (deviceState.width <= 640) return 'mobile'
      if (deviceState.width <= 1024) return 'tablet'
      return 'desktop'
    }
    return deviceState.type
  }, [deviceState.device, deviceState.type, deviceState.width])

  return (
    <ViewportProvider>
      <ViewportSync targetViewport={viewportMode} />
      <div className="h-screen flex flex-col bg-background">
        {/* Craft.js Editor Provider - wraps entire layout */}
        <Editor
          resolver={{
            Container,
            TextBlock,
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
            CountdownTimer,
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
          {/* Minimal Header - Page Builder */}
          <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-4 gap-2">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/paginas">
                <Button variant="ghost" size="sm" className="gap-2 h-8">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              </Link>
              <div className="hidden md:flex flex-col">
                <h1 className="text-sm font-semibold leading-none">{pageTitle}</h1>
              </div>
            </div>

            <SaveButton pageId={pageId} isDirty={isDirty} onSaveSuccess={handleSaveSuccess} />
          </header>

          {/* Main Editor Area */}
          <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
            {/* Left Sidebar - Components */}
            <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
              <ComponentsToolbox />
            </ResizablePanel>

            <ResizableHandle />

            {/* Center - Canvas with Device Preview */}
            <ResizablePanel defaultSize={70} minSize={50} className="flex flex-col">
              {/* Device Preview Toolbar (como Chrome DevTools) */}
              <DevicePreviewToolbar 
                state={deviceState} 
                onChange={updateDeviceState}
              />
              
              {/* Editor Toolbar */}
              <div className="bg-card border-b px-4 py-1.5 flex items-center gap-2">
                <EditorToolbarArea />
              </div>

              {/* Canvas Area with Device Frame */}
              <div 
                ref={canvasContainerRef}
                className="flex-1 overflow-auto bg-[#525252] p-8 flex items-start justify-center"
              >
                <DeviceFrame
                  width={deviceState.width}
                  height={deviceState.height}
                  zoom={deviceState.zoom}
                  type={deviceState.type}
                  touchSimulation={deviceState.touchSimulation}
                >
                  <EditorViewportProvider viewport={viewportMode}>
                    <div 
                      className="craftjs-frame bg-white min-h-full"
                      style={{ width: '100%' }}
                    >
                      <Frame data={parsedLayout ?? undefined}>
                        <Element
                          is={Container}
                          canvas
                          id="root-container"
                          paddingTop={deviceState.type === 'mobile' ? 16 : deviceState.type === 'tablet' ? 24 : 40}
                          paddingBottom={deviceState.type === 'mobile' ? 16 : deviceState.type === 'tablet' ? 24 : 40}
                          paddingLeft={deviceState.type === 'mobile' ? 16 : deviceState.type === 'tablet' ? 24 : 40}
                          paddingRight={deviceState.type === 'mobile' ? 16 : deviceState.type === 'tablet' ? 24 : 40}
                          backgroundColor="#ffffff"
                          height={0}
                          minHeight={deviceState.height - (deviceState.type === 'mobile' ? 48 : 0)}
                          sectionId=""
                        >
                          {!parsedLayout && (
                            <TextBlock content="Arraste componentes da esquerda para começar" alignment="center" />
                          )}
                        </Element>
                      </Frame>
                    </div>
                  </EditorViewportProvider>
                </DeviceFrame>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right Sidebar - Properties & Layers */}
            <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
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
    </ViewportProvider>
  )
}
