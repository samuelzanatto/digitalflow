import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// GET - Obter automação por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const automation = await withRetry(() =>
      prisma.automation.findFirst({
        where: { 
          id,
          userId: user.id 
        },
      })
    )

    if (!automation) {
      return NextResponse.json({ error: "Automação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error("Erro ao buscar automação:", error)
    return NextResponse.json(
      { error: "Erro ao buscar automação" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar automação
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, subject, message, enabled } = body

    // Verificar se a automação pertence ao usuário
    const existing = await withRetry(() =>
      prisma.automation.findFirst({
        where: { 
          id,
          userId: user.id 
        },
      })
    )

    if (!existing) {
      return NextResponse.json({ error: "Automação não encontrada" }, { status: 404 })
    }

    const automation = await withRetry(() =>
      prisma.automation.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
          ...(subject !== undefined && { subject }),
          ...(message !== undefined && { message }),
          ...(enabled !== undefined && { enabled }),
        },
      })
    )

    return NextResponse.json({ automation })
  } catch (error) {
    console.error("Erro ao atualizar automação:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar automação" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir automação
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se a automação pertence ao usuário
    const existing = await withRetry(() =>
      prisma.automation.findFirst({
        where: { 
          id,
          userId: user.id 
        },
      })
    )

    if (!existing) {
      return NextResponse.json({ error: "Automação não encontrada" }, { status: 404 })
    }

    await withRetry(() =>
      prisma.automation.delete({
        where: { id },
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir automação:", error)
    return NextResponse.json(
      { error: "Erro ao excluir automação" },
      { status: 500 }
    )
  }
}
