"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { IconSearch, IconPlus, IconArrowUpRight } from "@tabler/icons-react"

const leads = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@example.com",
    telefone: "(11) 98765-4321",
    origem: "Google Ads",
    status: "Novo",
    dataContato: "2024-11-13",
    score: 85,
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria@example.com",
    telefone: "(11) 99876-5432",
    origem: "Meta Ads",
    status: "Qualificado",
    dataContato: "2024-11-12",
    score: 92,
  },
  {
    id: 3,
    name: "Pedro Costa",
    email: "pedro@example.com",
    telefone: "(11) 97654-3210",
    origem: "Indicação",
    status: "Em Contato",
    dataContato: "2024-11-10",
    score: 78,
  },
  {
    id: 4,
    name: "Ana Oliveira",
    email: "ana@example.com",
    telefone: "(11) 96543-2109",
    origem: "Google Ads",
    status: "Proposta",
    dataContato: "2024-11-08",
    score: 95,
  },
  {
    id: 5,
    name: "Carlos Mendes",
    email: "carlos@example.com",
    telefone: "(11) 95432-1098",
    origem: "Meta Ads",
    status: "Novo",
    dataContato: "2024-11-07",
    score: 72,
  },
]

const statusColors: Record<string, string> = {
  Novo: "bg-blue-100 text-blue-800",
  "Em Contato": "bg-yellow-100 text-yellow-800",
  Qualificado: "bg-green-100 text-green-800",
  Proposta: "bg-purple-100 text-purple-800",
  Descartado: "bg-red-100 text-red-800",
}

export default function LeadsPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Novo Lead
      </Button>
    )
    setPageHeader("Leads", "Gerencie e qualifique seus leads", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Leads</p>
          <p className="text-2xl font-bold">248</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Novos (7 dias)</p>
          <p className="text-2xl font-bold">24</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Taxa Conversão</p>
          <p className="text-2xl font-bold">12.9%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Score Médio</p>
          <p className="text-2xl font-bold">84.4</p>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-2 flex-wrap"
      >
        <div className="relative flex-1 max-w-xs">
          <IconSearch className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." className="pl-10" />
        </div>
        <Button variant="outline">Status</Button>
        <Button variant="outline">Origem</Button>
        <Button variant="outline">Data</Button>
      </motion.div>

      {/* Leads Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">Nome</th>
                  <th className="text-left py-4 px-6 font-semibold">Email</th>
                  <th className="text-left py-4 px-6 font-semibold">Origem</th>
                  <th className="text-left py-4 px-6 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 font-semibold">Score</th>
                  <th className="text-left py-4 px-6 font-semibold">Data</th>
                  <th className="text-left py-4 px-6 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium">{lead.name}</td>
                    <td className="py-4 px-6 text-muted-foreground">{lead.email}</td>
                    <td className="py-4 px-6">{lead.origem}</td>
                    <td className="py-4 px-6">
                      <Badge className={statusColors[lead.status]}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${lead.score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold">{lead.score}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-xs">
                      {new Date(lead.dataContato).toLocaleDateString("pt-BR")}
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

