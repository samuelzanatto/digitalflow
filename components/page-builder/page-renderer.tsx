'use client'

import React from 'react'
import { Editor, Frame, Element, SerializedNodes } from '@craftjs/core'
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
} from '@/components/craft-components'

type LayoutData = Record<string, unknown> | SerializedNodes | null | undefined

interface PageRendererProps {
  layout: LayoutData
}

const isSerializedLayout = (data: LayoutData): data is SerializedNodes => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  return Object.prototype.hasOwnProperty.call(data, 'ROOT')
}

/**
 * Extrai o componente Footer do layout se existir
 */
function extractFooter(layout: SerializedNodes): SerializedNodes | null {
  if (!layout.ROOT) return null

  const root = layout.ROOT as Record<string, unknown>
  const nodes = root.nodes as string[] | undefined

  if (!nodes || nodes.length === 0) return null

  // Procurar por um nó Footer nos filhos diretos do ROOT
  for (const nodeId of nodes) {
    const node = layout[nodeId] as Record<string, unknown> | undefined
    if (node && (node.data as Record<string, unknown>)?.type === 'Footer') {
      return { [nodeId]: node }
    }
  }

  return null
}

/**
 * Remove o Footer do layout, retornando um novo layout sem ele
 */
function removeFooterFromLayout(layout: SerializedNodes): SerializedNodes {
  if (!layout.ROOT) return layout

  const root = layout.ROOT as Record<string, unknown>
  const nodes = (root.nodes as string[]) || []

  const filteredNodes = nodes.filter((nodeId) => {
    const node = layout[nodeId] as Record<string, unknown> | undefined
    return !(node && (node.data as Record<string, unknown>)?.type === 'Footer')
  })

  return {
    ...layout,
    ROOT: {
      ...root,
      nodes: filteredNodes,
    },
  }
}

export function PageRenderer({ layout }: PageRendererProps) {
  const isValid = isSerializedLayout(layout)
  const hasNodes = isValid && Object.keys(layout).length > 0

  // Extrair e remover Footer do layout principal
  let mainLayout = layout
  let footerNode: SerializedNodes | null = null

  if (isValid && hasNodes) {
    footerNode = extractFooter(layout as SerializedNodes)
    mainLayout = removeFooterFromLayout(layout as SerializedNodes)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Editor
        enabled={false}
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
        }}
      >
        <div className="flex-1">
          {isValid && hasNodes ? (
            <Frame data={mainLayout}>
              {/* Layout already rendered from data */}
            </Frame>
          ) : (
            <Frame>
              <Element is={Container} canvas padding={40} backgroundColor="#ffffff">
                <TextBlock content="Arraste componentes e publique a página para visualizar aqui." alignment="center" />
              </Element>
            </Frame>
          )}
        </div>

        {/* Footer fixo no final */}
        {footerNode && (
          <div className="w-full mt-auto">
            <Frame data={footerNode}>
              {/* Footer already rendered from data */}
            </Frame>
          </div>
        )}
      </Editor>
    </div>
  )
}

