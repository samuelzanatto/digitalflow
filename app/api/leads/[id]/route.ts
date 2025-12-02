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
    const { name, email, phone, status, score, groupId, customFields } = body

    // Leads são globais - qualquer usuário autenticado pode atualizar
    const lead = await withRetry(() =>
      prisma.lead.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          ...(status && { status }),
          ...(score !== undefined && { score }),
          ...(groupId && { groupId }),
          ...(customFields && { customFields })
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      })
    )

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("Erro ao atualizar lead:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar lead" },
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

    // Leads são globais - qualquer usuário autenticado pode deletar
    await withRetry(() =>
      prisma.lead.delete({
        where: { id }
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar lead:", error)
    return NextResponse.json(
      { error: "Erro ao deletar lead" },
      { status: 500 }
    )
  }
}
