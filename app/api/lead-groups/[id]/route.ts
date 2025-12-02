import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma, withRetry } from "@/lib/db/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, color } = body

    // Grupos são globais - qualquer usuário autenticado pode atualizar
    const group = await withRetry(() =>
      prisma.leadGroup.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color })
        }
      })
    )

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Erro ao atualizar grupo:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar grupo" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Grupos são globais - qualquer usuário autenticado pode deletar
    await withRetry(() =>
      prisma.leadGroup.delete({
        where: { id }
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar grupo:", error)
    return NextResponse.json(
      { error: "Erro ao deletar grupo" },
      { status: 500 }
    )
  }
}
