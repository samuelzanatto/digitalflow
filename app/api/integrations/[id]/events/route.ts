import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db/prisma"

// GET - Listar eventos de uma integração
export async function GET(
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

    // Verificar se a integração existe (global)
    const integration = await prisma.integration.findFirst({
      where: { id, isGlobal: true }
    })

    if (!integration) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })
    }

    const events = await prisma.webhookEvent.findMany({
      where: { integrationId: id },
      orderBy: { processedAt: "desc" },
      take: 50
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Erro ao buscar eventos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
