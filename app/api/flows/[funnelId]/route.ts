import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const USER_ID_PLACEHOLDER = 'user-default'

type RouteParams = Promise<{ funnelId?: string }>

function missingFunnelResponse() {
  return NextResponse.json(
    { success: false, error: 'FunnelId é obrigatório' },
    { status: 400 }
  )
}

export async function GET(
  request: Request,
  { params }: { params: RouteParams }
) {
  const resolvedParams = await params
  const funnelId = resolvedParams?.funnelId
  if (!funnelId) {
    return missingFunnelResponse()
  }

  const userId = USER_ID_PLACEHOLDER

  try {
    const flow = await prisma.flow.findUnique({
      where: {
        userId_funnelId: {
          userId,
          funnelId,
        },
      },
    })

    return NextResponse.json({ success: true, data: flow ?? null })
  } catch (error) {
    console.error('Erro ao buscar fluxo via API:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar fluxo' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams }
) {
  const resolvedParams = await params
  const funnelId = resolvedParams?.funnelId
  if (!funnelId) {
    return missingFunnelResponse()
  }

  const userId = USER_ID_PLACEHOLDER

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Payload inválido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (typeof body.name === 'string') {
      const trimmed = body.name.trim()
      if (!trimmed) {
        return NextResponse.json(
          { success: false, error: 'Nome é obrigatório' },
          { status: 400 }
        )
      }
      updateData.name = trimmed
    }
    if (body.description !== undefined) {
      if (body.description === null) {
        updateData.description = null
      } else if (typeof body.description === 'string') {
        updateData.description = body.description.trim()
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    const updatedFlow = await prisma.flow.update({
      where: {
        userId_funnelId: {
          userId,
          funnelId,
        },
      },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updatedFlow })
  } catch (error) {
    console.error('Erro ao atualizar fluxo via API:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar fluxo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  const resolvedParams = await params
  const funnelId = resolvedParams?.funnelId
  if (!funnelId) {
    return missingFunnelResponse()
  }

  const userId = USER_ID_PLACEHOLDER

  try {
    await prisma.flow.delete({
      where: {
        userId_funnelId: {
          userId,
          funnelId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar fluxo via API:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao deletar fluxo' },
      { status: 500 }
    )
  }
}
