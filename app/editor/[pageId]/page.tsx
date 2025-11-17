import React from 'react'
import { EditorLayout } from '@/components/page-builder/editor-layout'
import { getSalesPage } from '@/lib/actions/pages'
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

interface PageData {
  id: string
  title: string
  slug: string
  description?: string | null
  layout: Record<string, unknown> | string | null
  published: boolean
  viewCount: number
}

interface PageEditorProps {
  params: Promise<{
    pageId: string
  }>
}

export default async function PageEditor({ params }: PageEditorProps) {
  const { pageId } = await params
  
  const result = await getSalesPage(pageId)

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">A página que você está procurando não existe.</p>
        </div>
      </div>
    )
  }

  const page = result.data as PageData

  let initialLayout: Record<string, unknown> | null = null
  if (typeof page.layout === 'string') {
    try {
      initialLayout = JSON.parse(page.layout) as Record<string, unknown>
    } catch (error) {
      console.error('Erro ao parsear layout salvo:', error)
    }
  } else if (page.layout && typeof page.layout === 'object' && !Array.isArray(page.layout)) {
    initialLayout = page.layout
  }

  return (
    <EditorLayout 
      pageId={pageId}
      pageTitle={page.title}
      initialLayout={initialLayout}
      components={{
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
    />
  )
}
