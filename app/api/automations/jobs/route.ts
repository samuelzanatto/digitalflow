import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// GET - Listar jobs de automação
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const automationId = searchParams.get("automationId")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const jobs = await withRetry(() =>
      prisma.automationJob.findMany({
        where: {
          ...(automationId && { automationId }),
          ...(status && { status }),
        },
        include: {
          automation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { scheduledFor: "desc" },
        take: limit,
      })
    )

    // Estatísticas
    const stats = await withRetry(() =>
      prisma.automationJob.groupBy({
        by: ["status"],
        _count: true,
        ...(automationId && {
          where: { automationId },
        }),
      })
    )

    return NextResponse.json({ 
      jobs,
      stats: stats.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error("Erro ao listar jobs:", error)
    return NextResponse.json(
      { error: "Erro ao carregar jobs" },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar jobs pendentes
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    const automationId = searchParams.get("automationId")

    if (jobId) {
      // Cancelar job específico
      await withRetry(() =>
        prisma.automationJob.update({
          where: { id: jobId },
          data: { status: "cancelled" },
        })
      )
    } else if (automationId) {
      // Cancelar todos os jobs pendentes de uma automação
      await withRetry(() =>
        prisma.automationJob.updateMany({
          where: {
            automationId,
            status: "pending",
          },
          data: { status: "cancelled" },
        })
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao cancelar jobs:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar jobs" },
      { status: 500 }
    )
  }
}
