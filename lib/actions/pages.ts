'use server'

import { prisma, withRetry } from '@/lib/db/prisma'
import { generatePreviewImagePath } from '@/lib/preview/page-preview'
import { revalidatePath } from 'next/cache'

export interface CreatePageInput {
  title: string
  description?: string
  userId: string
}

export interface UpdatePageInput {
  id: string
  title?: string
  description?: string
  layout?: Record<string, unknown>
  published?: boolean
}

export interface UpdatePageLayoutInput {
  id: string
  layout: Record<string, unknown>
}

async function persistGeneratedThumbnail(pageId: string) {
  const previewPath = await generatePreviewImagePath(pageId)
  if (!previewPath) {
    throw new Error('Não foi possível gerar a prévia')
  }

  return await withRetry(async () => {
    return await prisma.salesPage.update({
      where: { id: pageId },
      data: {
        thumbnail: previewPath,
      },
      select: {
        id: true,
        thumbnail: true,
        updatedAt: true,
      },
    })
  })
}

/**
 * Criar nova página de vendas
 */
export async function createSalesPage(input: CreatePageInput) {
  try {
    const slug = input.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')

    const page = await withRetry(async () => {
      return await prisma.salesPage.create({
        data: {
          title: input.title,
          description: input.description,
          slug,
          userId: input.userId,
          layout: [],
        },
      })
    })

    revalidatePath('/dashboard/paginas')
    return { success: true, data: page }
  } catch (error) {
    console.error('Error creating page:', error)
    return { success: false, error: 'Falha ao criar página' }
  }
}

/**
 * Obter todas as páginas do usuário
 */
export async function getUserPages(userId: string) {
  try {
    const pages = await withRetry(async () => {
      return await prisma.salesPage.findMany({
        where: { userId },
        include: {
          customDomain: true,
          sections: {
            orderBy: { order: 'asc' },
            take: 1,
            select: {
              id: true,
              type: true,
              props: true,
            },
          },
          _count: {
            select: { analytics: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    return { success: true, data: pages }
  } catch (error) {
    console.error('Error fetching pages:', error)
    return { success: false, error: 'Falha ao buscar páginas' }
  }
}

/**
 * Obter página por ID
 */
export async function getSalesPage(pageId: string) {
  try {
    const page = await withRetry(async () => {
      return await prisma.salesPage.findUnique({
        where: { id: pageId },
        include: {
          customDomain: true,
        },
      })
    })

    if (!page) {
      return { success: false, error: 'Página não encontrada' }
    }

    const sections = await withRetry(async () => {
      return await prisma.pageSection.findMany({
        where: { pageId },
        orderBy: { order: 'asc' },
      })
    })

    return { success: true, data: { ...page, sections } }
  } catch (error) {
    console.error('Error fetching page:', error)
    return { success: false, error: 'Falha ao buscar página' }
  }
}

/**
 * Buscar página pelo slug (para página pública)
 */
export async function getSalesPageBySlug(slug: string) {
  try {
    const page = await withRetry(async () => {
      return await prisma.salesPage.findUnique({
        where: { slug },
      })
    })

    if (!page) {
      return { success: false, error: 'Página não encontrada' }
    }

    return { success: true, data: page }
  } catch (error) {
    console.error('Error fetching page by slug:', error)
    return { success: false, error: 'Falha ao buscar página' }
  }
}

/**
 * Atualizar página
 */
export async function updateSalesPage(input: UpdatePageInput) {
  try {
    const updateData: Record<string, unknown> = {}

    if (input.title) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.layout) {
      // Validação: verifica se layout tem ROOT
      if ('ROOT' in input.layout) {
        // Prisma já serializa automaticamente para JSONB
        updateData.layout = input.layout
      } else {
        return { success: false, error: 'Layout deve conter nó ROOT' }
      }
    }
    if (input.published !== undefined) updateData.published = input.published

    const page = await withRetry(async () => {
      return await prisma.salesPage.update({
        where: { id: input.id },
        data: updateData,
      })
    })

    // Log para debug
    if (input.layout) {
      console.log(`Página ${input.id} atualizada com novo layout`)
    }

    revalidatePath('/dashboard/paginas')
    revalidatePath(`/dashboard/paginas/${input.id}/editor`)

    void persistGeneratedThumbnail(input.id).catch((error) => {
      console.error('Falha ao regenerar thumbnail após atualização de página:', error)
    })
    return { success: true, data: page }
  } catch (error) {
    console.error('Error updating page:', error)
    return { success: false, error: 'Falha ao atualizar página' }
  }
}

/**
 * Atualizar layout da página (Craft.js state)
 */
export async function updatePageLayout(input: UpdatePageLayoutInput) {
  try {
    // Validação básica do layout
    if (!input.layout || typeof input.layout !== 'object') {
      return { success: false, error: 'Layout inválido' }
    }

    // Verifica se o ROOT existe no layout
    if (!('ROOT' in input.layout)) {
      return { success: false, error: 'Layout deve conter nó ROOT' }
    }

    const page = await withRetry(async () => {
      return await prisma.salesPage.update({
        where: { id: input.id },
        data: {
          // Prisma já serializa automaticamente para JSONB
          layout: JSON.parse(JSON.stringify(input.layout)),
        },
      })
    })

    // Log para debug - remove em produção
    console.log(`Layout salvo com sucesso para página ${input.id}:`, {
      rootExists: 'ROOT' in (page.layout as Record<string, unknown>),
      layoutSize: JSON.stringify(page.layout).length,
    })

    void persistGeneratedThumbnail(input.id).catch((error) => {
      console.error('Falha ao regenerar thumbnail após salvar layout:', error)
    })

    return { success: true, data: page }
  } catch (error) {
    console.error('Error updating layout:', error)
    return { success: false, error: 'Falha ao salvar layout' }
  }
}

/**
 * Deletar página
 */
export async function deleteSalesPage(pageId: string) {
  try {
    await prisma.salesPage.delete({
      where: { id: pageId },
    })

    revalidatePath('/dashboard/paginas')
    return { success: true }
  } catch (error) {
    console.error('Error deleting page:', error)
    return { success: false, error: 'Falha ao deletar página' }
  }
}

/**
 * Publicar/Despublicar página
 */
export async function togglePagePublish(pageId: string) {
  try {
    const page = await prisma.salesPage.findUnique({
      where: { id: pageId },
      select: { published: true },
    })

    if (!page) {
      return { success: false, error: 'Página não encontrada' }
    }

    const updated = await prisma.salesPage.update({
      where: { id: pageId },
      data: { published: !page.published },
    })

    revalidatePath('/dashboard/paginas')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Error toggling publish:', error)
    return { success: false, error: 'Falha ao publicar página' }
  }
}

export async function refreshPagePreviewImage(pageId: string) {
  try {
    const updated = await persistGeneratedThumbnail(pageId)
    revalidatePath('/dashboard/paginas')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Error refreshing preview:', error)
    return { success: false, error: 'Falha ao regenerar prévia' }
  }
}
