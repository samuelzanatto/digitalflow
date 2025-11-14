'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Editor, Frame, Element, SerializedNodes } from '@craftjs/core'
import { ComponentsToolbox } from './components-toolbox'
import { LayersPanel } from './layers-panel'
import { PropertiesPanel } from './properties-panel'
import { EditorToolbarArea } from './editor-toolbar-area'
import { EditorHeader } from './editor-header'
import {
  Container,
  TextBlock,
  HeroSection,
  CTAButton,
  Divider,
  PricingCard,
  TestimonialCard,
  FeatureCard,
  CaptureForm,
  VideoSection,
  StatsCounter,
  FAQItem,
  TrustBadges,
  ImageComponent,
} from '@/components/craft-components'

interface EditorLayoutProps {
  pageId: string
  pageTitle: string
  onSavePage?: () => void
  initialLayout?: Record<string, unknown> | null
  components?: Record<string, unknown>
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
    if (!initialLayout || Array.isArray(initialLayout)) {
      return null
    }

    if ('ROOT' in initialLayout) {
      return initialLayout as SerializedNodes
    }

    return null
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
          HeroSection,
          CTAButton,
          Divider,
          PricingCard,
          TestimonialCard,
          FeatureCard,
          CaptureForm,
          VideoSection,
          StatsCounter,
          FAQItem,
          TrustBadges,
          ImageComponent,
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
        {/* Header */}
        <EditorHeader 
          pageId={pageId}
          title={pageTitle}
          isDirty={isDirty}
          onSaveSuccess={handleSaveSuccess}
        />

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
            <div className="flex-1 overflow-y-auto craftjs-frame bg-white">
              <Frame data={parsedLayout ?? undefined}>
                {!parsedLayout && (
                  <Element is={Container} canvas padding={40} backgroundColor="#ffffff">
                    <TextBlock content="Arraste componentes da esquerda para começar" alignment="center" />
                  </Element>
                )}
              </Frame>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Properties & Layers */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Layers */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <LayersPanel />
              </ResizablePanel>

              <ResizableHandle />

              {/* Properties */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <PropertiesPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Editor>
    </div>
  )
}
