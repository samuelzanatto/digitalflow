'use server'

import { prisma } from '@/lib/db/prisma'
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

    const page = await prisma.salesPage.create({
      data: {
        title: input.title,
        description: input.description,
        slug,
        userId: input.userId,
        layout: [],
      },
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
    const pages = await prisma.salesPage.findMany({
      where: { userId },
      include: {
        customDomain: true,
        _count: {
          select: { analytics: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
    const page = await prisma.salesPage.findUnique({
      where: { id: pageId },
      include: {
        customDomain: true,
      },
    })

    if (!page) {
      return { success: false, error: 'Página não encontrada' }
    }

    const sections = await prisma.pageSection.findMany({
      where: { pageId },
      orderBy: { order: 'asc' },
    })

    return { success: true, data: { ...page, sections } }
  } catch (error) {
    console.error('Error fetching page:', error)
    return { success: false, error: 'Falha ao buscar página' }
  }
}

/**
 * Atualizar página
 */
export async function updateSalesPage(input: UpdatePageInput) {
  try {
    const page = await prisma.salesPage.update({
      where: { id: input.id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.layout && { layout: JSON.parse(JSON.stringify(input.layout)) }),
        ...(input.published !== undefined && { published: input.published }),
      },
    })

    revalidatePath('/dashboard/paginas')
    revalidatePath(`/dashboard/paginas/${input.id}/editor`)
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
    const page = await prisma.salesPage.update({
      where: { id: input.id },
      data: {
        layout: JSON.parse(JSON.stringify(input.layout)),
      },
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
