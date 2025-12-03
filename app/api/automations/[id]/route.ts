import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// GET - Obter automação por ID (global)
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

    // Automações são globais - qualquer usuário autenticado pode acessar
    const automation = await withRetry(() =>
      prisma.automation.findUnique({
        where: { id },
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

// PUT - Atualizar automação (global)
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
    const { 
      name, 
      type, 
      subject, 
      message, 
      enabled, 
      triggerType, 
      triggerConfig, 
      delaySeconds 
    } = body

    // Automações são globais - qualquer usuário autenticado pode editar
    const automation = await withRetry(() =>
      prisma.automation.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
          ...(subject !== undefined && { subject }),
          ...(message !== undefined && { message }),
          ...(enabled !== undefined && { enabled }),
          ...(triggerType !== undefined && { triggerType }),
          ...(triggerConfig !== undefined && { triggerConfig }),
          ...(delaySeconds !== undefined && { delaySeconds }),
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

// DELETE - Excluir automação (global)
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

    // Automações são globais - qualquer usuário autenticado pode deletar
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
