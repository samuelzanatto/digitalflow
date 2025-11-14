import React from 'react'
import { notFound } from 'next/navigation'
import { PageRenderer } from '@/components/page-builder/page-renderer'

interface PublicPageProps {
  params: {
    slug: string
  }
}

interface PageData {
  id: string
  title: string
  slug: string
  description: string
  layout: Record<string, unknown>
  published: boolean
  viewCount: number
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = params

  // Mockado por enquanto - seria buscado do banco em produção
  const mockPages: Record<string, PageData> = {
    'exemplo-pagina': {
      id: '1',
      title: 'Página Exemplo',
      slug: 'exemplo-pagina',
      description: 'Uma página de exemplo',
      layout: {
        'hero-1': {
          type: 'hero-section',
          props: {
            title: 'Bem-vindo ao Page Builder',
            subtitle: 'Crie páginas incríveis sem código',
            backgroundColor: '#f0f9ff',
          },
        },
        'text-1': {
          type: 'text-block',
          props: {
            content: 'Este é um exemplo de página criada com o nosso page builder.',
            fontSize: 16,
            color: '#333333',
          },
        },
        'button-1': {
          type: 'cta-button',
          props: {
            text: 'Comece Agora',
            link: '/dashboard/paginas',
            backgroundColor: '#0070f3',
          },
        },
      },
      published: true,
      viewCount: 42,
    },
  }

  const page = mockPages[slug]
  
  if (!page) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <PageRenderer layout={page.layout} />
      
      {/* Footer com info */}
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>Página criada com DigitalFlow Page Builder</p>
      </footer>
    </main>
  )
}

// Gerar metadados da página
export async function generateMetadata({ params }: PublicPageProps) {
  const mockPages: Record<string, PageData> = {
    'exemplo-pagina': {
      id: '1',
      title: 'Página Exemplo',
      slug: 'exemplo-pagina',
      description: 'Uma página de exemplo criada com Page Builder',
      layout: {},
      published: true,
      viewCount: 42,
    },
  }

  const page = mockPages[params.slug]
  
  if (!page) {
    return {
      title: 'Página não encontrada',
    }
  }

  return {
    title: page.title,
    description: page.description,
  }
}
