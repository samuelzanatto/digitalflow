'use client'

import React from 'react'
import { Editor, Frame, Element, SerializedNodes } from '@craftjs/core'
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

type LayoutData = Record<string, unknown> | SerializedNodes | null | undefined

interface PageRendererProps {
  layout: LayoutData
}

const isSerializedLayout = (data: LayoutData): data is SerializedNodes => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  return Object.prototype.hasOwnProperty.call(data, 'ROOT')
}

export function PageRenderer({ layout }: PageRendererProps) {
  const isValid = isSerializedLayout(layout)
  const hasNodes = isValid && Object.keys(layout).length > 0

  return (
    <Editor
      enabled={false}
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
      }}
    >
      <Frame data={isValid && hasNodes ? layout : undefined}>
        {!hasNodes && (
          <Element is={Container} canvas padding={40} backgroundColor="#ffffff">
            <TextBlock content="Arraste componentes e publique a página para visualizar aqui." alignment="center" />
          </Element>
        )}
      </Frame>
    </Editor>
  )
}

