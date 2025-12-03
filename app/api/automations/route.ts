import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// GET - Listar automações (globais)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Automações são globais - todos os usuários veem todas
    const automations = await withRetry(() =>
      prisma.automation.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              scheduledJobs: {
                where: { status: "pending" },
              },
            },
          },
        },
      })
    )

    // Formatar resposta
    const formattedAutomations = automations.map((automation) => ({
      ...automation,
      pendingJobs: automation._count.scheduledJobs,
      _count: undefined,
    }))

    return NextResponse.json({ automations: formattedAutomations })
  } catch (error) {
    console.error("Erro ao listar automações:", error)
    return NextResponse.json(
      { error: "Erro ao carregar automações" },
      { status: 500 }
    )
  }
}

// POST - Criar nova automação (global)
export async function POST(request: Request) {
  try {
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
      triggerType,
      triggerConfig,
      delaySeconds,
    } = body

    if (!name || !subject || !message) {
      return NextResponse.json(
        { error: "Nome, assunto e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    const automation = await withRetry(() =>
      prisma.automation.create({
        data: {
          userId: user.id, // Registra quem criou para histórico
          name,
          type: type || "email",
          subject,
          message,
          triggerType: triggerType || "form_submit",
          triggerConfig: triggerConfig || {},
          delaySeconds: delaySeconds || 0,
          enabled: true,
        },
      })
    )

    return NextResponse.json({ automation })
  } catch (error) {
    console.error("Erro ao criar automação:", error)
    return NextResponse.json(
      { error: "Erro ao criar automação" },
      { status: 500 }
    )
  }
}
