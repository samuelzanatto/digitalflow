import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db/prisma"

// PATCH - Atualizar integração
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verificar se a integração pertence ao usuário
    const existing = await prisma.integration.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })
    }

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
        config: body.config !== undefined ? body.config : existing.config
      }
    })

    return NextResponse.json({ integration })
  } catch (error) {
    console.error("Erro ao atualizar integração:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE - Remover integração
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se a integração pertence ao usuário
    const existing = await prisma.integration.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })
    }

    await prisma.integration.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar integração:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
