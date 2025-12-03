import React from 'react'
import { notFound } from 'next/navigation'
import { PageRenderer } from '@/components/page-builder/page-renderer'
import { getSalesPageBySlug } from '@/lib/actions/pages'
import { prisma } from '@/lib/db/prisma'
import { VisitorTracker } from '@/components/visitor-tracker'

interface PublicPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 60 // Revalidar a cada 60 segundos (ISR)

// Gerar parâmetros estáticos para páginas publicadas
export async function generateStaticParams() {
  try {
    const pages = await prisma.salesPage.findMany({
      where: { published: true },
      select: { slug: true },
      take: 100, // Limitar para evitar build muito longo
    })
    return pages.map((page) => ({ slug: page.slug }))
  } catch (error) {
    console.error('Erro ao gerar parâmetros estáticos:', error)
    return []
  }
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params
  
  const result = await getSalesPageBySlug(slug)

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
      console.error('Erro ao parsear layout:', error)
    }
  } else if (page.layout && typeof page.layout === 'object' && !Array.isArray(page.layout)) {
    layout = page.layout
  }

  return (
    <>
      <VisitorTracker pageId={page.id} pageSlug={slug} />
      <PageRenderer layout={layout} />
    </>
  )
}

// Gerar metadados da página
export async function generateMetadata({ params }: PublicPageProps) {
  const { slug } = await params
  
  const result = await getSalesPageBySlug(slug)

  if (!result.success || !result.data) {
    return {
      title: 'Página não encontrada',
    }
  }

  const page = result.data as { title: string; description?: string }

  return {
    title: page.title,
    description: page.description || 'Criada com DigitalFlow Page Builder',
  }
}
