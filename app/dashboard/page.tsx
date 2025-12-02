"use client"

import { useEffect, useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SalesDataTable } from "@/components/sales-data-table"
import { SectionCards } from "@/components/section-cards"
import { useAuroraBanner } from "@/contexts/aurora-banner-context"
import { usePageHeader } from "@/hooks/usePageHeader"

interface DashboardStats {
  totalRevenue: number
  totalRevenuePrevious: number
  revenueChange: number
  totalSales: number
  totalSalesPrevious: number
  salesChange: number
  totalCustomers: number
  totalCustomersPrevious: number
  customersChange: number
  abandonedCarts: number
  abandonedCartsPrevious: number
  abandonedChange: number
}

interface ChartDataPoint {
  date: string
  sales: number
  revenue: number
}

interface Sale {
  id: string
  externalId: string
  customerName: string
  customerEmail: string
  status: string
  totalPrice: string
  totalPriceCents: number | null
  paymentMethod: string
  products: Array<{ name: string; price: string }>
  createdAt: string
  event: string
}

export default function Page() {
  const { setPageHeader } = usePageHeader()
  const { setShowAurora } = useAuroraBanner()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPageHeader("Dashboard", "Visão geral do seu negócio")
    setShowAurora(true)
    return () => setShowAurora(false)
  }, [setPageHeader, setShowAurora])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setChartData(data.chartData)
          setSales(data.recentSales)
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards stats={stats} loading={loading} />
        <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={chartData} loading={loading} />
          </div>
          <SalesDataTable data={sales} loading={loading} />
        </div>
      </div>
  )
}
