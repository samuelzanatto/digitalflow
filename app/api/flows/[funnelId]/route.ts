import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/db/prisma'

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

  try {
      const flow = await withRetry(() =>
        prisma.flow.findFirst({
          where: { funnelId },
        }),
      )

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

      const existingFlow = await withRetry(() =>
        prisma.flow.findFirst({
          where: { funnelId },
        }),
      )

    if (!existingFlow) {
      return NextResponse.json(
        { success: false, error: 'Fluxo não encontrado' },
        { status: 404 },
      )
    }

      const updatedFlow = await withRetry(() =>
        prisma.flow.update({
          where: { id: existingFlow.id },
          data: updateData,
        }),
      )

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

  try {
      const existingFlow = await withRetry(() =>
        prisma.flow.findFirst({
          where: { funnelId },
          select: { id: true },
        }),
      )

    if (!existingFlow) {
      return NextResponse.json(
        { success: false, error: 'Fluxo não encontrado' },
        { status: 404 },
      )
    }

      await withRetry(() =>
        prisma.flow.delete({
          where: { id: existingFlow.id },
        }),
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar fluxo via API:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao deletar fluxo' },
      { status: 500 }
    )
  }
}
