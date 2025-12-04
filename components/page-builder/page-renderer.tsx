'use client'

import React from 'react'
import { Editor, Frame, Element, SerializedNodes, SerializedNode } from '@craftjs/core'
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
import { EditorViewportProvider } from '@/lib/responsive-props'

type LayoutData = Record<string, unknown> | SerializedNodes | null | undefined

interface PageRendererProps {
  layout: LayoutData
}

const isSerializedLayout = (data: LayoutData): data is SerializedNodes => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  return Object.prototype.hasOwnProperty.call(data, 'ROOT')
}

const getSerializedNodeType = (node?: SerializedNode): string | undefined => {
  if (!node) return undefined
  const nodeData = node as unknown as { data?: { type?: string } }
  return nodeData?.data?.type
}

/**
 * Extrai o componente Footer do layout se existir
 */
function extractFooter(layout: SerializedNodes): SerializedNodes | null {
  if (!layout.ROOT) return null

  const rootNode = layout.ROOT as SerializedNode
  const nodes = rootNode.nodes as string[] | undefined

  if (!nodes || nodes.length === 0) return null

  // Procurar por um nó Footer nos filhos diretos do ROOT
  for (const nodeId of nodes) {
    const node = layout[nodeId] as SerializedNode | undefined
    if (getSerializedNodeType(node) === 'Footer') {
      return {
        ...layout,
        ROOT: {
          ...rootNode,
          nodes: [nodeId],
        },
      }
    }
  }

  return null
}

/**
 * Remove o Footer do layout, retornando um novo layout sem ele
 */
function removeFooterFromLayout(layout: SerializedNodes): SerializedNodes {
  if (!layout.ROOT) return layout

  const root = layout.ROOT as SerializedNode
  const nodes = root.nodes || []

  const filteredNodes = nodes.filter((nodeId) => {
    const node = layout[nodeId] as SerializedNode | undefined
    return getSerializedNodeType(node) !== 'Footer'
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

  const serializedMainLayout = isValid && hasNodes ? (mainLayout as SerializedNodes) : undefined

  return (
    <EditorViewportProvider autoDetect>
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
            CountdownTimer,
          }}
        >
          <div className="flex-1">
            {serializedMainLayout ? (
              <Frame data={serializedMainLayout}>
                {/* Layout already rendered from data */}
              </Frame>
            ) : (
              <Frame>
                <Element
                  is={Container}
                  canvas
                  paddingTop={40}
                  paddingBottom={40}
                  paddingLeft={40}
                  paddingRight={40}
                  backgroundColor="#ffffff"
                  sectionId=""
                >
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
    </EditorViewportProvider>
  )
}

