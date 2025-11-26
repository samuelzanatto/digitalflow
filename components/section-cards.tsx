import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

interface SectionCardsProps {
  stats: DashboardStats | null
  loading?: boolean
}

export function SectionCards({ stats, loading }: SectionCardsProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32 mt-2" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  const revenueChange = stats?.revenueChange ?? 0
  const salesChange = stats?.salesChange ?? 0
  const customersChange = stats?.customersChange ?? 0
  const abandonedChange = stats?.abandonedChange ?? 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Receita Total</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats?.totalRevenue ?? 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revenueChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {revenueChange >= 0 ? "+" : ""}{revenueChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueChange >= 0 ? "Crescimento neste mês" : "Queda neste mês"}
            {revenueChange >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Comparado aos últimos 30 dias
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Vendas Aprovadas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalSales ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {salesChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {salesChange >= 0 ? "+" : ""}{salesChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {salesChange >= 0 ? "Vendas em alta" : "Vendas em queda"}
            {salesChange >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Comparado aos últimos 30 dias
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Novos Clientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalCustomers ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {customersChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {customersChange >= 0 ? "+" : ""}{customersChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {customersChange >= 0 ? "Base crescendo" : "Aquisição precisa de atenção"}
            {customersChange >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Clientes únicos nos últimos 30 dias
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Carrinhos Abandonados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.abandonedCarts ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {abandonedChange <= 0 ? <IconTrendingDown /> : <IconTrendingUp />}
              {abandonedChange >= 0 ? "+" : ""}{abandonedChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {abandonedChange <= 0 ? "Menos abandonos" : "Abandonos aumentaram"}
            {abandonedChange <= 0 ? <IconTrendingDown className="size-4" /> : <IconTrendingUp className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Comparado aos últimos 30 dias
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
