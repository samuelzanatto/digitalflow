import React from 'react'
import { PageRenderer } from '@/components/page-builder/page-renderer'
import { getSalesPage } from '@/lib/actions/pages'
import { notFound } from 'next/navigation'

interface PreviewPageProps {
  params: Promise<{
    pageId: string
  }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { pageId } = await params
  const result = await getSalesPage(pageId)

  if (!result.success || !result.data) {
    notFound()
  }

  const page = result.data as {
    id: string
    title: string
    layout: Record<string, unknown> | string | null
  }

  let layout: Record<string, unknown> | null = null
  if (typeof page.layout === 'string') {
    try {
      layout = JSON.parse(page.layout)
    } catch (error) {
      console.error('Erro ao parsear layout para prévia:', error)
    }
  } else if (page.layout && typeof page.layout === 'object' && !Array.isArray(page.layout)) {
    layout = page.layout
  }

  return (
    <div className="min-h-screen bg-white">
      <PageRenderer layout={layout} />
      
      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground bg-muted/30">
        <p>Página: {page.title}</p>
        <p className="text-xs mt-2">Criado com DigitalFlow Page Builder</p>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: PreviewPageProps) {
  const { pageId } = await params
  const result = await getSalesPage(pageId)

  if (!result.success || !result.data) {
    return {
      title: 'Página não encontrada',
    }
  }

  const page = result.data as { title: string; description?: string }

  return {
    title: `Prévia: ${page.title}`,
    description: page.description,
  }
}
