'use server'

import { prisma, withRetry } from '@/lib/db/prisma'
// import { revalidatePath } from 'next/cache'

// Types
export interface ChatSession {
  id: string
  visitorName: string
  visitorEmail: string | null
  visitorPhone: string | null
  attendantId: string | null
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
  queuePosition: number
  startedAt: Date
  attendedAt: Date | null
  completedAt: Date | null
  rating: number | null
  feedbackText: string | null
  feedbackAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  sessionId: string
  sender: 'visitor' | 'attendant'
  senderId: string | null
  content: string
  createdAt: Date
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

// Criar nova sessão de chat (visitante)
export async function createChatSession(input: {
  visitorName: string
  visitorEmail?: string
  visitorPhone?: string
}): Promise<{ session?: ChatSession; queuePosition?: number; error?: string }> {
  try {
    // Contar quantos estão na fila
    const waitingCount = await withRetry(async () => {
      return await prisma.chatSession.count({
        where: { status: 'waiting' },
      })
    })

    const session = await withRetry(async () => {
      return await prisma.chatSession.create({
        data: {
          visitorName: input.visitorName,
          visitorEmail: input.visitorEmail || null,
          visitorPhone: input.visitorPhone || null,
          status: 'waiting',
          queuePosition: waitingCount + 1,
        },
      })
    })

    return { 
      session: session as ChatSession, 
      queuePosition: waitingCount + 1 
    }
  } catch (error) {
    console.error('Error in createChatSession:', error)
    return { error: 'Erro ao criar sessão de chat' }
  }
}

// Obter posição na fila
export async function getQueuePosition(sessionId: string): Promise<{ position: number; error?: string }> {
  try {
    const session = await withRetry(async () => {
      return await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })
    })

    if (!session) {
      return { position: 0, error: 'Sessão não encontrada' }
    }

    if (session.status !== 'waiting') {
      return { position: 0 }
    }

    // Contar quantos estão na frente
    const aheadCount = await withRetry(async () => {
      return await prisma.chatSession.count({
        where: {
          status: 'waiting',
          startedAt: { lt: session.startedAt },
        },
      })
    })

    return { position: aheadCount + 1 }
  } catch (error) {
    console.error('Error in getQueuePosition:', error)
    return { position: 0, error: 'Erro ao obter posição na fila' }
  }
}

// Obter sessão com mensagens
export async function getChatSession(sessionId: string): Promise<{ session?: ChatSessionWithMessages; error?: string }> {
  try {
    const session = await withRetry(async () => {
      return await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })
    })

    if (!session) {
      return { error: 'Sessão não encontrada' }
    }

    return { session: session as ChatSessionWithMessages }
  } catch (error) {
    console.error('Error in getChatSession:', error)
    return { error: 'Erro ao obter sessão' }
  }
}

// Listar sessões de chat (para dashboard)
export async function getChatSessions(filters?: {
  status?: string
  attendantId?: string
}): Promise<{ sessions: ChatSessionWithMessages[]; error?: string }> {
  try {
    const where: Record<string, unknown> = {}
    
    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.attendantId) {
      where.attendantId = filters.attendantId
    }

    const sessions = await withRetry(async () => {
      return await prisma.chatSession.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [
          { status: 'asc' }, // waiting first
          { queuePosition: 'asc' },
          { startedAt: 'desc' },
        ],
      })
    })

    return { sessions: sessions as ChatSessionWithMessages[] }
  } catch (error) {
    console.error('Error in getChatSessions:', error)
    return { sessions: [], error: 'Erro ao listar sessões' }
  }
}

// Atendente aceita um chat da fila
export async function acceptChatSession(
  sessionId: string,
  attendantId: string
): Promise<{ session?: ChatSession; error?: string }> {
  try {
    const session = await withRetry(async () => {
      return await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: 'in_progress',
          attendantId,
          attendedAt: new Date(),
          queuePosition: 0,
        },
      })
    })

    // Atualizar posições da fila
    await updateQueuePositions()

    return { session: session as ChatSession }
  } catch (error) {
    console.error('Error in acceptChatSession:', error)
    return { error: 'Erro ao aceitar chat' }
  }
}

// Enviar mensagem
export async function sendChatMessage(input: {
  sessionId: string
  sender: 'visitor' | 'attendant'
  senderId?: string
  content: string
}): Promise<{ message?: ChatMessage; error?: string }> {
  try {
    const message = await withRetry(async () => {
      return await prisma.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          sender: input.sender,
          senderId: input.senderId || null,
          content: input.content,
        },
      })
    })

    return { message: message as ChatMessage }
  } catch (error) {
    console.error('Error in sendChatMessage:', error)
    return { error: 'Erro ao enviar mensagem' }
  }
}

// Finalizar chat
export async function completeChatSession(sessionId: string): Promise<{ session?: ChatSession; error?: string }> {
  try {
    const session = await withRetry(async () => {
      return await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })
    })

    return { session: session as ChatSession }
  } catch (error) {
    console.error('Error in completeChatSession:', error)
    return { error: 'Erro ao finalizar chat' }
  }
}

// Enviar feedback
export async function submitChatFeedback(input: {
  sessionId: string
  rating: number
  feedbackText?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await withRetry(async () => {
      return await prisma.chatSession.update({
        where: { id: input.sessionId },
        data: {
          rating: input.rating,
          feedbackText: input.feedbackText || null,
          feedbackAt: new Date(),
        },
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Error in submitChatFeedback:', error)
    return { success: false, error: 'Erro ao enviar feedback' }
  }
}

// Obter estatísticas de feedback para dashboard
export async function getFeedbackStats(): Promise<{
  totalSessions: number
  completedSessions: number
  avgRating: number
  ratingDistribution: Record<number, number>
  recentFeedback: Array<{
    id: string
    visitorName: string
    rating: number
    feedbackText: string | null
    feedbackAt: Date
  }>
  error?: string
}> {
  try {
    const [totalSessions, completedSessions, sessionsWithRating, recentFeedback] = await Promise.all([
      withRetry(() => prisma.chatSession.count()),
      withRetry(() => prisma.chatSession.count({ where: { status: 'completed' } })),
      withRetry(() => prisma.chatSession.findMany({
        where: { rating: { not: null } },
        select: { rating: true },
      })),
      withRetry(() => prisma.chatSession.findMany({
        where: { rating: { not: null } },
        select: {
          id: true,
          visitorName: true,
          rating: true,
          feedbackText: true,
          feedbackAt: true,
        },
        orderBy: { feedbackAt: 'desc' },
        take: 10,
      })),
    ])

    // Calcular média e distribuição
    const ratings = sessionsWithRating.map(s => s.rating!).filter(Boolean)
    const avgRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratings.forEach(r => {
      if (r >= 1 && r <= 5) {
        ratingDistribution[r]++
      }
    })

    return {
      totalSessions,
      completedSessions,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
      recentFeedback: recentFeedback
        .filter(f => f.rating !== null)
        .map(f => ({
          id: f.id,
          visitorName: f.visitorName,
          rating: f.rating as number,
          feedbackText: f.feedbackText,
          feedbackAt: f.feedbackAt!,
        })),
    }
  } catch (error) {
    console.error('Error in getFeedbackStats:', error)
    return {
      totalSessions: 0,
      completedSessions: 0,
      avgRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentFeedback: [],
      error: 'Erro ao obter estatísticas',
    }
  }
}

// Helper para atualizar posições da fila
async function updateQueuePositions() {
  try {
    const waitingSessions = await prisma.chatSession.findMany({
      where: { status: 'waiting' },
      orderBy: { startedAt: 'asc' },
      select: { id: true },
    })

    await prisma.$transaction(
      waitingSessions.map((session, index) =>
        prisma.chatSession.update({
          where: { id: session.id },
          data: { queuePosition: index + 1 },
        })
      )
    )
  } catch (error) {
    console.error('Error updating queue positions:', error)
  }
}

// Obter contagem da fila (para dashboard)
export async function getQueueCount(): Promise<{ count: number; error?: string }> {
  try {
    const count = await withRetry(async () => {
      return await prisma.chatSession.count({
        where: { status: 'waiting' },
      })
    })

    return { count }
  } catch (error) {
    console.error('Error in getQueueCount:', error)
    return { count: 0, error: 'Erro ao contar fila' }
  }
}
