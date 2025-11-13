"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { IconSearch, IconPlus, IconArrowUpRight } from "@tabler/icons-react"

const clientes = [
  {
    id: 1,
    nome: "Tech Solutions",
    contato: "João Silva",
    email: "joao@techsolutions.com",
    telefone: "(11) 98765-4321",
    faturamento: "R$ 45.000",
    status: "Ativo",
    dtCadastro: "2024-01-15",
    renovacao: "2025-01-15",
  },
  {
    id: 2,
    nome: "E-commerce Plus",
    contato: "Maria Santos",
    email: "maria@ecommerceplus.com",
    telefone: "(11) 99876-5432",
    faturamento: "R$ 32.500",
    status: "Ativo",
    dtCadastro: "2024-03-20",
    renovacao: "2024-12-20",
  },
  {
    id: 3,
    nome: "Startup XYZ",
    contato: "Pedro Oliveira",
    email: "pedro@startupxyz.com",
    telefone: "(11) 97654-3210",
    faturamento: "R$ 18.000",
    status: "Ativo",
    dtCadastro: "2024-06-10",
    renovacao: "2025-06-10",
  },
  {
    id: 4,
    nome: "Consultoria ABC",
    contato: "Ana Costa",
    email: "ana@consultoriabc.com",
    telefone: "(11) 96543-2109",
    faturamento: "R$ 52.000",
    status: "Ativo",
    dtCadastro: "2023-11-05",
    renovacao: "2024-11-05",
  },
  {
    id: 5,
    nome: "Marketing Digital",
    contato: "Carlos Mendes",
    email: "carlos@marketingdigital.com",
    telefone: "(11) 95432-1098",
    faturamento: "R$ 28.000",
    status: "Inativo",
    dtCadastro: "2024-02-14",
    renovacao: "2024-09-14",
  },
]

export default function ClientesPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Novo Cliente
      </Button>
    )
    setPageHeader("Clientes", "Gerencie sua carteira de clientes", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 grid-cols-1 md:grid-cols-4"
      >
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total de Clientes</p>
          <p className="text-3xl font-bold">5</p>
          <p className="text-xs text-green-600 mt-2">4 ativos</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Faturamento Mensal</p>
          <p className="text-3xl font-bold">R$ 175.500</p>
          <p className="text-xs text-green-600 mt-2">+8% vs mês anterior</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Churn Risk</p>
          <p className="text-3xl font-bold">1</p>
          <p className="text-xs text-red-600 mt-2">Consultoria ABC</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Ticket Médio</p>
          <p className="text-3xl font-bold">R$ 35.100</p>
          <p className="text-xs text-muted-foreground mt-2">Por cliente</p>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex gap-2 flex-wrap"
      >
        <div className="relative flex-1 max-w-xs">
          <IconSearch className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar clientes..." className="pl-10" />
        </div>
        <Button variant="outline">Status</Button>
        <Button variant="outline">Faturamento</Button>
        <Button variant="outline">Data</Button>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">Empresa</th>
                  <th className="text-left py-4 px-6 font-semibold">Contato</th>
                  <th className="text-left py-4 px-6 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 font-semibold">Faturamento</th>
                  <th className="text-left py-4 px-6 font-semibold">Renovação</th>
                  <th className="text-left py-4 px-6 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente, index) => (
                  <motion.tr
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium">{cliente.nome}</td>
                    <td className="py-4 px-6 text-muted-foreground text-sm">
                      <div>{cliente.contato}</div>
                      <div className="text-xs">{cliente.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={cliente.status === "Ativo" ? "default" : "outline"}
                        className={cliente.status !== "Ativo" ? "bg-gray-100 text-gray-800" : ""}
                      >
                        {cliente.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-semibold">{cliente.faturamento}</td>
                    <td className="py-4 px-6 text-xs">
                      {new Date(cliente.renovacao).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <IconArrowUpRight size={16} />
                        Ver
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

