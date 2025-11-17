import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { randomUUID } from 'crypto'

const USER_ID_PLACEHOLDER = 'user-default'

export async function GET() {
  try {
    const flows = await prisma.flow.findMany({
      where: { userId: USER_ID_PLACEHOLDER },
      orderBy: { updatedAt: 'desc' },
    })

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

    const funnelId = randomUUID()

    const flow = await prisma.flow.create({
      data: {
        id: randomUUID(),
        userId: USER_ID_PLACEHOLDER,
        funnelId,
        name: rawName,
        description,
      },
    })

    return NextResponse.json({ success: true, data: flow }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar fluxo:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao criar fluxo' },
      { status: 500 }
    )
  }
}
