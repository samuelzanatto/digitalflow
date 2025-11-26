import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db/prisma"
import { randomUUID } from "crypto"

// POST - Regenerar token do webhook
export async function POST(
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

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        webhookToken: randomUUID()
      }
    })

    return NextResponse.json({ integration })
  } catch (error) {
    console.error("Erro ao regenerar token:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
