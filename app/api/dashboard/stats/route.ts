import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma, withRetry } from "@/lib/db/prisma"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar integração do usuário
    const integration = await withRetry(() =>
      prisma.integration.findFirst({
        where: { userId: user.id }
      })
    )

    if (!integration) {
      return NextResponse.json({
        stats: {
          totalRevenue: 0,
          totalRevenuePrevious: 0,
          revenueChange: 0,
          totalSales: 0,
          totalSalesPrevious: 0,
          salesChange: 0,
          totalCustomers: 0,
          totalCustomersPrevious: 0,
          customersChange: 0,
          abandonedCarts: 0,
          abandonedCartsPrevious: 0,
          abandonedChange: 0,
        },
        chartData: [],
        recentSales: []
      })
    }

    // Definir período atual e anterior (últimos 30 dias)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Estatísticas do período atual
    const currentStats = await withRetry(() =>
      prisma.sale.aggregate({
        where: {
          integrationId: integration.id,
          createdAt: { gte: thirtyDaysAgo },
          status: "APPROVED"
        },
        _sum: { totalPriceCents: true },
        _count: { id: true }
      })
    )

    // Estatísticas do período anterior
    const previousStats = await withRetry(() =>
      prisma.sale.aggregate({
        where: {
          integrationId: integration.id,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: "APPROVED"
        },
        _sum: { totalPriceCents: true },
        _count: { id: true }
      })
    )

    // Clientes únicos período atual
    const currentCustomers = await withRetry(() =>
      prisma.sale.groupBy({
        by: ['customerEmail'],
        where: {
          integrationId: integration.id,
          createdAt: { gte: thirtyDaysAgo },
          status: "APPROVED"
        }
      })
    )

    // Clientes únicos período anterior
    const previousCustomers = await withRetry(() =>
      prisma.sale.groupBy({
        by: ['customerEmail'],
        where: {
          integrationId: integration.id,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: "APPROVED"
        }
      })
    )

    // Carrinhos abandonados período atual
    const currentAbandoned = await withRetry(() =>
      prisma.sale.count({
        where: {
          integrationId: integration.id,
          createdAt: { gte: thirtyDaysAgo },
          event: "ABANDONED_CART"
        }
      })
    )

    // Carrinhos abandonados período anterior
    const previousAbandoned = await withRetry(() =>
      prisma.sale.count({
        where: {
          integrationId: integration.id,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          event: "ABANDONED_CART"
        }
      })
    )

    // Dados para o gráfico (últimos 90 dias, agrupado por dia)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const salesByDay = await withRetry(() =>
      prisma.sale.findMany({
        where: {
          integrationId: integration.id,
          createdAt: { gte: ninetyDaysAgo },
          status: "APPROVED"
        },
        select: {
          createdAt: true,
          totalPriceCents: true
        },
        orderBy: { createdAt: 'asc' }
      })
    )

    // Agrupar vendas por dia
    const salesMap = new Map<string, { sales: number; revenue: number }>()
    
    // Inicializar todos os dias dos últimos 90 dias
    for (let i = 0; i < 90; i++) {
      const date = new Date(ninetyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      salesMap.set(dateStr, { sales: 0, revenue: 0 })
    }
    
    // Preencher com dados reais
    for (const sale of salesByDay) {
      const dateStr = sale.createdAt.toISOString().split('T')[0]
      const existing = salesMap.get(dateStr) || { sales: 0, revenue: 0 }
      salesMap.set(dateStr, {
        sales: existing.sales + 1,
        revenue: existing.revenue + (sale.totalPriceCents || 0)
      })
    }

    const chartData = Array.from(salesMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      revenue: data.revenue / 100 // Converter centavos para reais
    }))

    // Vendas recentes para a tabela
    const recentSales = await withRetry(() =>
      prisma.sale.findMany({
        where: { integrationId: integration.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          externalId: true,
          customerName: true,
          customerEmail: true,
          status: true,
          totalPrice: true,
          totalPriceCents: true,
          paymentMethod: true,
          products: true,
          createdAt: true,
          event: true
        }
      })
    )

    // Calcular variações percentuais
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const totalRevenue = currentStats._sum.totalPriceCents || 0
    const totalRevenuePrevious = previousStats._sum.totalPriceCents || 0
    const totalSales = currentStats._count.id || 0
    const totalSalesPrevious = previousStats._count.id || 0
    const totalCustomers = currentCustomers.length
    const totalCustomersPrevious = previousCustomers.length

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalRevenuePrevious,
        revenueChange: calculateChange(totalRevenue, totalRevenuePrevious),
        totalSales,
        totalSalesPrevious,
        salesChange: calculateChange(totalSales, totalSalesPrevious),
        totalCustomers,
        totalCustomersPrevious,
        customersChange: calculateChange(totalCustomers, totalCustomersPrevious),
        abandonedCarts: currentAbandoned,
        abandonedCartsPrevious: previousAbandoned,
        abandonedChange: calculateChange(currentAbandoned, previousAbandoned),
      },
      chartData,
      recentSales
    })
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    )
  }
}
