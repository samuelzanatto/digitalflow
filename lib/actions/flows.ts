'use server'

import { prisma, withRetry } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export interface CreateFlowInput {
  funnelId: string
  userId: string
  name?: string
  description?: string
}

export interface UpdateFlowInput {
  funnelId: string
  userId: string
  name?: string
  description?: string
  nodesData?: Record<string, unknown>
  flowData?: Record<string, unknown>
  published?: boolean
}

export interface SaveFlowNodesInput {
  funnelId: string
  userId?: string
  nodesData: {
    nodes: Array<Record<string, unknown>>
    edges: Array<Record<string, unknown>>
  }
}

/**
 * Criar novo flow
 */
export async function createFlow(input: CreateFlowInput) {
  try {
    const flow = await withRetry(async () => {
      return await prisma.flow.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          funnelId: input.funnelId,
          name: input.name || `Fluxo #${input.funnelId}`,
          description: input.description,
          nodesData: {
            nodes: [],
            edges: [],
          },
        },
      })
    })

    revalidatePath(`/dashboard/flows/${input.funnelId}`)
    return { success: true, data: flow }
  } catch (error) {
    console.error('Error creating flow:', error)
    return { success: false, error: 'Falha ao criar fluxo' }
  }
}

/**
 * Obter flow por funnelId
 */
export async function getFlow(funnelId: string) {
  try {
    const flow = await withRetry(async () => {
      return await prisma.flow.findFirst({
        where: {
          funnelId,
        },
      })
    })

    if (!flow) {
      return { success: false, error: 'Fluxo não encontrado', data: null }
    }

    return { success: true, data: flow }
  } catch (error) {
    console.error('Error fetching flow:', error)
    return { success: false, error: 'Falha ao buscar fluxo' }
  }
}

/**
 * Salvar nós e conexões do flow
 */
export async function saveFlowNodes(input: SaveFlowNodesInput) {
  try {
    const nodesData = {
      nodes: Array.isArray(input.nodesData.nodes) ? input.nodesData.nodes : [],
      edges: Array.isArray(input.nodesData.edges) ? input.nodesData.edges : [],
    }

    // Verificar se o flow existe
    const existingFlow = await withRetry(async () => {
      return await prisma.flow.findFirst({
        where: {
          funnelId: input.funnelId,
        },
      })
    })

    if (!existingFlow) {
      // Criar um novo flow herdando o userId informado ou reaproveitando placeholder
      const ownerId = input.userId ?? 'user-default'
      const flow = await withRetry(async () => {
        return await prisma.flow.create({
          data: {
            id: randomUUID(),
            userId: ownerId,
            funnelId: input.funnelId,
            name: `Fluxo #${input.funnelId}`,
            nodesData: JSON.parse(JSON.stringify(nodesData)),
          },
        })
      })

      return { success: true, data: flow }
    }

    const flow = await withRetry(async () => {
      return await prisma.flow.update({
        where: {
          userId_funnelId: {
            userId: existingFlow.userId,
            funnelId: existingFlow.funnelId,
          },
        },
        data: {
          nodesData: JSON.parse(JSON.stringify(nodesData)),
          updatedAt: new Date(),
        },
      })
    })

    // Log para debug
    console.log(`Flow salvo com sucesso para funnelId ${input.funnelId}:`, {
      nodesCount: nodesData.nodes.length,
      edgesCount: nodesData.edges.length,
    })

    revalidatePath(`/dashboard/flows/${input.funnelId}`)
    return { success: true, data: flow }
  } catch (error) {
    console.error('Error saving flow nodes:', error)
    return { success: false, error: 'Falha ao salvar nós do fluxo' }
  }
}

/**
 * Atualizar flow completo
 */
export async function updateFlow(input: UpdateFlowInput) {
  try {
    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.nodesData !== undefined) {
      updateData.nodesData = {
        nodes: Array.isArray(input.nodesData.nodes) ? input.nodesData.nodes : [],
        edges: Array.isArray(input.nodesData.edges) ? input.nodesData.edges : [],
      }
    }
    if (input.flowData !== undefined) updateData.flowData = input.flowData
    if (input.published !== undefined) updateData.published = input.published

    const flow = await withRetry(async () => {
      return await prisma.flow.update({
        where: {
          userId_funnelId: {
            userId: input.userId,
            funnelId: input.funnelId,
          },
        },
        data: JSON.parse(JSON.stringify(updateData)),
      })
    })

    revalidatePath(`/dashboard/flows/${input.funnelId}`)
    return { success: true, data: flow }
  } catch (error) {
    console.error('Error updating flow:', error)
    return { success: false, error: 'Falha ao atualizar fluxo' }
  }
}

/**
 * Deletar flow
 */
export async function deleteFlow(funnelId: string, userId: string) {
  try {
    await prisma.flow.delete({
      where: {
        userId_funnelId: {
          userId,
          funnelId,
        },
      },
    })

    revalidatePath('/dashboard/flows')
    return { success: true }
  } catch (error) {
    console.error('Error deleting flow:', error)
    return { success: false, error: 'Falha ao deletar fluxo' }
  }
}
