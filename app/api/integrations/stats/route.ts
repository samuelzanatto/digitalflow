import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db/prisma"

// GET - Estatísticas de vendas
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar integrações globais
    const integrations = await prisma.integration.findMany({
      where: { isGlobal: true },
      select: { id: true }
    })

    const integrationIds = integrations.map(i => i.id)

    if (integrationIds.length === 0) {
      return NextResponse.json({
        totalSales: 0,
        approvedSales: 0,
        pendingSales: 0,
        refundedSales: 0,
        totalRevenue: 0,
        abandonedCarts: 0
      })
    }

    // Contar vendas por status
    const [approved, pending, refunded, abandoned, revenue] = await Promise.all([
      prisma.sale.count({
        where: { integrationId: { in: integrationIds }, status: "APPROVED" }
      }),
      prisma.sale.count({
        where: { integrationId: { in: integrationIds }, status: "PENDING" }
      }),
      prisma.sale.count({
        where: { integrationId: { in: integrationIds }, status: "REFUNDED" }
      }),
      prisma.sale.count({
        where: { integrationId: { in: integrationIds }, event: "ABANDONED_CART" }
      }),
      prisma.sale.aggregate({
        where: { integrationId: { in: integrationIds }, status: "APPROVED" },
        _sum: { totalPriceCents: true }
      })
    ])

    const totalSales = approved + pending + refunded

    return NextResponse.json({
      totalSales,
      approvedSales: approved,
      pendingSales: pending,
      refundedSales: refunded,
      totalRevenue: revenue._sum.totalPriceCents || 0,
      abandonedCarts: abandoned
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
