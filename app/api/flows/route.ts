import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/db/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const flows = await withRetry(() =>
      prisma.flow.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
    )

    return NextResponse.json({ success: true, data: flows })
  } catch (error) {
    console.error('Erro ao listar fluxos:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao listar fluxos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Payload inválido' },
        { status: 400 }
      )
    }

    const rawName = typeof body.name === 'string' ? body.name.trim() : ''
    if (!rawName) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const description =
      typeof body.description === 'string' && body.description.trim().length > 0
        ? body.description.trim()
        : null

    const userId =
      typeof body.userId === 'string' && body.userId.trim().length > 0 ? body.userId.trim() : null

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário autenticado é obrigatório' },
        { status: 400 },
      )
    }

    const funnelId = randomUUID()

    const flow = await withRetry(() =>
      prisma.flow.create({
        data: {
          id: randomUUID(),
          userId,
          funnelId,
          name: rawName,
          description,
        },
      }),
    )

    return NextResponse.json({ success: true, data: flow }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar fluxo:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao criar fluxo' },
      { status: 500 }
    )
  }
}
