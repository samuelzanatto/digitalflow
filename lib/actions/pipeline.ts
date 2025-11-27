'use server'

import { prisma, withRetry } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

// Types
export interface PipelineStage {
  id: string
  userId: string
  title: string
  color: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface PipelineOpportunity {
  id: string
  userId: string
  stageId: string
  title: string
  company: string | null
  email: string | null
  phone: string | null
  value: number
  order: number
  notes: string | null
  leadId: string | null
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PipelineStageWithCards extends PipelineStage {
  cards: PipelineOpportunity[]
}

// Default stages for new users
const defaultStages = [
  { title: 'Novo', color: 'bg-blue-500', order: 0 },
  { title: 'Em Contato', color: 'bg-yellow-500', order: 1 },
  { title: 'Qualificado', color: 'bg-purple-500', order: 2 },
  { title: 'Proposta', color: 'bg-orange-500', order: 3 },
  { title: 'Fechado', color: 'bg-green-500', order: 4 },
]

// Helper to convert Decimal to number
function decimalToNumber(value: Decimal | null): number {
  if (value === null) return 0
  return value.toNumber()
}

// Helper to map DB opportunity to our type
function mapOpportunity(opp: {
  id: string
  userId: string
  stageId: string
  title: string
  company: string | null
  email: string | null
  phone: string | null
  value: Decimal
  order: number
  notes: string | null
  leadId: string | null
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): PipelineOpportunity {
  return {
    ...opp,
    value: decimalToNumber(opp.value),
  }
}

// Get all stages with their cards
export async function getPipelineData(userId: string): Promise<{ stages: PipelineStageWithCards[], error?: string }> {
  try {
    // Get stages with opportunities
    const stages = await withRetry(async () => {
      return await prisma.pipelineStage.findMany({
        where: { userId },
        orderBy: { order: 'asc' },
        include: {
          opportunities: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    // If no stages, create default ones
    if (!stages || stages.length === 0) {
      const { stages: newStages, error } = await createDefaultStages(userId)
      if (error) return { stages: [], error }
      
      // Return empty cards for new stages
      return {
        stages: newStages.map(stage => ({ ...stage, cards: [] }))
      }
    }

    // Map to our types
    const stagesWithCards: PipelineStageWithCards[] = stages.map(stage => ({
      id: stage.id,
      userId: stage.userId,
      title: stage.title,
      color: stage.color,
      order: stage.order,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt,
      cards: stage.opportunities.map(mapOpportunity),
    }))

    return { stages: stagesWithCards }
  } catch (error) {
    console.error('Error in getPipelineData:', error)
    return { stages: [], error: 'Erro ao carregar dados do pipeline' }
  }
}

// Create default stages
async function createDefaultStages(userId: string): Promise<{ stages: PipelineStage[], error?: string }> {
  try {
    const stages = await withRetry(async () => {
      return await prisma.$transaction(
        defaultStages.map(stage =>
          prisma.pipelineStage.create({
            data: {
              userId,
              title: stage.title,
              color: stage.color,
              order: stage.order,
            },
          })
        )
      )
    })

    return { stages }
  } catch (error) {
    console.error('Error in createDefaultStages:', error)
    return { stages: [], error: 'Erro ao criar stages padrão' }
  }
}

// Create a new opportunity
export async function createOpportunity(input: {
  userId: string
  stageId: string
  title: string
  company?: string
  email?: string
  phone?: string
  value?: number
  notes?: string
}): Promise<{ opportunity?: PipelineOpportunity, error?: string }> {
  try {
    // Get the max order in the stage
    const maxOrder = await withRetry(async () => {
      const result = await prisma.pipelineOpportunity.aggregate({
        where: { stageId: input.stageId },
        _max: { order: true },
      })
      return result._max.order ?? -1
    })

    const opportunity = await withRetry(async () => {
      return await prisma.pipelineOpportunity.create({
        data: {
          userId: input.userId,
          stageId: input.stageId,
          title: input.title,
          company: input.company || null,
          email: input.email || null,
          phone: input.phone || null,
          value: input.value || 0,
          notes: input.notes || null,
          order: maxOrder + 1,
        },
      })
    })

    // Não usar revalidatePath para permitir atualização otimista no cliente
    return { opportunity: mapOpportunity(opportunity) }
  } catch (error) {
    console.error('Error in createOpportunity:', error)
    return { error: 'Erro ao criar oportunidade' }
  }
}

// Update an opportunity
export async function updateOpportunity(
  id: string,
  input: Partial<{
    stageId: string
    title: string
    company: string
    email: string
    phone: string
    value: number
    notes: string
    order: number
    closedAt: Date | null
  }>
): Promise<{ opportunity?: PipelineOpportunity, error?: string }> {
  try {
    const opportunity = await withRetry(async () => {
      return await prisma.pipelineOpportunity.update({
        where: { id },
        data: {
          ...input,
          value: input.value !== undefined ? input.value : undefined,
        },
      })
    })

    // Não usar revalidatePath para permitir atualização otimista no cliente
    return { opportunity: mapOpportunity(opportunity) }
  } catch (error) {
    console.error('Error in updateOpportunity:', error)
    return { error: 'Erro ao atualizar oportunidade' }
  }
}

// Delete an opportunity
export async function deleteOpportunity(id: string): Promise<{ success: boolean, error?: string }> {
  try {
    await withRetry(async () => {
      return await prisma.pipelineOpportunity.delete({
        where: { id },
      })
    })

    // Não usar revalidatePath para permitir atualização otimista no cliente
    return { success: true }
  } catch (error) {
    console.error('Error in deleteOpportunity:', error)
    return { success: false, error: 'Erro ao excluir oportunidade' }
  }
}

// Move opportunity to another stage or reorder
export async function moveOpportunity(input: {
  opportunityId: string
  targetStageId: string
  newOrder: number
}): Promise<{ success: boolean, error?: string }> {
  try {
    await withRetry(async () => {
      return await prisma.pipelineOpportunity.update({
        where: { id: input.opportunityId },
        data: {
          stageId: input.targetStageId,
          order: input.newOrder,
        },
      })
    })

    // Não usar revalidatePath para permitir atualização otimista no cliente
    return { success: true }
  } catch (error) {
    console.error('Error in moveOpportunity:', error)
    return { success: false, error: 'Erro ao mover oportunidade' }
  }
}

// Batch update orders (for drag and drop)
export async function updateOpportunitiesOrder(
  updates: Array<{ id: string; stageId: string; order: number }>
): Promise<{ success: boolean, error?: string }> {
  try {
    await withRetry(async () => {
      return await prisma.$transaction(
        updates.map(update =>
          prisma.pipelineOpportunity.update({
            where: { id: update.id },
            data: {
              stageId: update.stageId,
              order: update.order,
            },
          })
        )
      )
    })

    // Não usar revalidatePath para permitir atualização otimista no cliente
    return { success: true }
  } catch (error) {
    console.error('Error in updateOpportunitiesOrder:', error)
    return { success: false, error: 'Erro ao atualizar ordem das oportunidades' }
  }
}

// Create a new stage
export async function createStage(input: {
  userId: string
  title: string
  color?: string
}): Promise<{ stage?: PipelineStage, error?: string }> {
  try {
    // Get the max order
    const maxOrder = await withRetry(async () => {
      const result = await prisma.pipelineStage.aggregate({
        where: { userId: input.userId },
        _max: { order: true },
      })
      return result._max.order ?? -1
    })

    const stage = await withRetry(async () => {
      return await prisma.pipelineStage.create({
        data: {
          userId: input.userId,
          title: input.title,
          color: input.color || 'bg-gray-500',
          order: maxOrder + 1,
        },
      })
    })

    revalidatePath('/dashboard/pipeline')
    return { stage }
  } catch (error) {
    console.error('Error in createStage:', error)
    return { error: 'Erro ao criar stage' }
  }
}

// Update a stage
export async function updateStage(
  id: string,
  input: Partial<{
    title: string
    color: string
    order: number
  }>
): Promise<{ stage?: PipelineStage, error?: string }> {
  try {
    const stage = await withRetry(async () => {
      return await prisma.pipelineStage.update({
        where: { id },
        data: input,
      })
    })

    revalidatePath('/dashboard/pipeline')
    return { stage }
  } catch (error) {
    console.error('Error in updateStage:', error)
    return { error: 'Erro ao atualizar stage' }
  }
}

// Delete a stage
export async function deleteStage(id: string): Promise<{ success: boolean, error?: string }> {
  try {
    await withRetry(async () => {
      return await prisma.pipelineStage.delete({
        where: { id },
      })
    })

    revalidatePath('/dashboard/pipeline')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteStage:', error)
    return { success: false, error: 'Erro ao excluir stage' }
  }
}

// Get pipeline statistics
export async function getPipelineStats(userId: string): Promise<{
  totalValue: number
  avgDays: number
  conversionRate: number
  countByStage: Record<string, number>
  error?: string
}> {
  try {
    // Get all stages with opportunities
    const stages = await withRetry(async () => {
      return await prisma.pipelineStage.findMany({
        where: { userId },
        include: {
          opportunities: true,
        },
      })
    })

    // Calculate stats
    const allOpportunities = stages.flatMap(s => s.opportunities)
    const totalValue = allOpportunities.reduce((acc, opp) => acc + decimalToNumber(opp.value), 0)
    
    // Calculate average days since creation
    const now = new Date()
    const totalDays = allOpportunities.reduce((acc, opp) => {
      const created = new Date(opp.createdAt)
      const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return acc + days
    }, 0)
    const avgDays = allOpportunities.length > 0 ? Math.round(totalDays / allOpportunities.length) : 0

    // Calculate conversion rate (closed / total)
    const closedStage = stages.find(s => s.title.toLowerCase().includes('fechado'))
    const closedCount = closedStage?.opportunities.length || 0
    const conversionRate = allOpportunities.length > 0 
      ? Math.round((closedCount / allOpportunities.length) * 100) 
      : 0

    // Count by stage
    const countByStage: Record<string, number> = {}
    for (const stage of stages) {
      countByStage[stage.id] = stage.opportunities.length
    }

    return { totalValue, avgDays, conversionRate, countByStage }
  } catch (error) {
    console.error('Error in getPipelineStats:', error)
    return { totalValue: 0, avgDays: 0, conversionRate: 0, countByStage: {}, error: 'Erro ao carregar estatísticas' }
  }
}
