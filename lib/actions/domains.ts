'use server'

import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'

export interface AddCustomDomainInput {
  pageId: string
  domain: string
}

/**
 * Adicionar domínio customizado
 */
export async function addCustomDomain(input: AddCustomDomainInput) {
  try {
    // Validar formato do domínio
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
    
    if (!domainRegex.test(input.domain)) {
      return { success: false, error: 'Domínio inválido' }
    }

    // Verificar se domínio já existe
    const existing = await prisma.customDomain.findUnique({
      where: { domain: input.domain },
    })

    if (existing) {
      return { success: false, error: 'Domínio já está em uso' }
    }

    // Verificar se página já tem domínio
    const existingPageDomain = await prisma.customDomain.findUnique({
      where: { pageId: input.pageId },
    })

    if (existingPageDomain) {
      return { success: false, error: 'Página já possui um domínio customizado' }
    }

    // Criar registre de domínio
    const customDomain = await prisma.customDomain.create({
      data: {
        pageId: input.pageId,
        domain: input.domain.toLowerCase(),
        dnsRecord: `CNAME ${input.domain} seu-site.vercel.app`,
      },
    })

    revalidatePath('/dashboard/paginas')
    return { success: true, data: customDomain }
  } catch (error) {
    console.error('Error adding custom domain:', error)
    return { success: false, error: 'Falha ao adicionar domínio' }
  }
}

/**
 * Remover domínio customizado
 */
export async function removeCustomDomain(pageId: string) {
  try {
    await prisma.customDomain.deleteMany({
      where: { pageId },
    })

    revalidatePath('/dashboard/paginas')
    return { success: true }
  } catch (error) {
    console.error('Error removing custom domain:', error)
    return { success: false, error: 'Falha ao remover domínio' }
  }
}

/**
 * Obter domínio por página
 */
export async function getCustomDomain(pageId: string) {
  try {
    const customDomain = await prisma.customDomain.findUnique({
      where: { pageId },
    })

    return { success: true, data: customDomain }
  } catch (error) {
    console.error('Error fetching custom domain:', error)
    return { success: false, error: 'Falha ao buscar domínio' }
  }
}

/**
 * Verificar domínio (verificar DNS)
 */
export async function verifyCustomDomain(domain: string) {
  try {
    // Aqui você faria uma verificação real com seu DNS provider
    // Por enquanto, apenas marcamos como verificado após um tempo
    const customDomain = await prisma.customDomain.update({
      where: { domain },
      data: { verified: true },
    })

    revalidatePath('/dashboard/paginas')
    return { success: true, data: customDomain }
  } catch (error) {
    console.error('Error verifying domain:', error)
    return { success: false, error: 'Falha ao verificar domínio' }
  }
}
