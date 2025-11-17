import type { NextRequest } from 'next/server'
import { generatePreviewImage } from '@/lib/preview/page-preview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await context.params

  if (!pageId) {
    return new Response('Missing pageId', { status: 400 })
  }

  try {
    const image = await generatePreviewImage(pageId)
    if (!image) {
      return new Response('Página não encontrada', { status: 404 })
    }
    return image
  } catch (error) {
    console.error('Erro ao gerar preview da página', error)
    return new Response('Falha ao gerar preview', { status: 500 })
  }
}
