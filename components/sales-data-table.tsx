"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconClock,
  IconX,
  IconRefresh,
  IconShoppingCart,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  APPROVED: {
    label: "Aprovada",
    icon: IconCircleCheckFilled,
    className: "text-green-600 dark:text-green-400"
  },
  PENDING: {
    label: "Pendente",
    icon: IconClock,
    className: "text-yellow-600 dark:text-yellow-400"
  },
  REFUSED: {
    label: "Recusada",
    icon: IconX,
    className: "text-red-600 dark:text-red-400"
  },
  REFUNDED: {
    label: "Reembolsada",
    icon: IconRefresh,
    className: "text-orange-600 dark:text-orange-400"
  },
  CHARGEBACK: {
    label: "Chargeback",
    icon: IconX,
    className: "text-red-600 dark:text-red-400"
  },
  CANCELED: {
    label: "Cancelada",
    icon: IconX,
    className: "text-gray-600 dark:text-gray-400"
  },
  ABANDONED: {
    label: "Abandonado",
    icon: IconShoppingCart,
    className: "text-yellow-600 dark:text-yellow-400"
  }
}

const paymentMethodLabels: Record<string, string> = {
  CREDIT_CARD: "Cartão de Crédito",
  PIX: "PIX",
  BANK_SLIP: "Boleto",
  DEBIT_CARD: "Cartão de Débito",
}

const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customerName}</span>
        <span className="text-xs text-muted-foreground">{row.original.customerEmail}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.event === "ABANDONED_CART" ? "ABANDONED" : row.original.status
      const config = statusConfig[status] || statusConfig.PENDING
      const Icon = config.icon
      return (
        <Badge variant="outline" className="gap-1">
          <Icon className={`size-3.5 ${config.className}`} />
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalPrice",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.totalPrice}
      </div>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Pagamento",
    cell: ({ row }) => (
      <span className="text-sm">
        {paymentMethodLabels[row.original.paymentMethod] || row.original.paymentMethod}
      </span>
    ),
  },
  {
    accessorKey: "products",
    header: "Produto",
    cell: ({ row }) => {
      const products = row.original.products as Array<{ name: string }>
      if (!products || products.length === 0) return "-"
      return (
        <div className="max-w-[200px] truncate" title={products.map(p => p.name).join(", ")}>
          {products[0]?.name || "-"}
          {products.length > 1 && ` +${products.length - 1}`}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}
      </span>
    ),
  },
]

interface SalesDataTableProps {
  data: Sale[]
  loading?: boolean
}

export function SalesDataTable({ data, loading }: SalesDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // TanStack Table returns imperative helpers that React Compiler cannot safely memoize yet.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Vendas Recentes</CardTitle>
        <CardDescription>
          Últimas transações da sua integração
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Buscar por cliente..."
            value={(table.getColumn("customerName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("customerName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <IconShoppingCart className="size-8" />
                      <p>Nenhuma venda ainda</p>
                      <p className="text-sm">Configure uma integração para começar a receber dados</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length} venda(s) encontrada(s)
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="rows-per-page" className="text-sm">
                  Por página
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <IconChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <IconChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
