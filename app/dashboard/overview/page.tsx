"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { motion } from "framer-motion"
import { IconTrendingUp, IconUsers, IconMessageDots, IconCalendar } from "@tabler/icons-react"

const stats = [
  {
    title: "Leads Este Mês",
    value: "248",
    change: "+12%",
    icon: IconUsers,
  },
  {
    title: "Conversões",
    value: "32",
    change: "+8%",
    icon: IconTrendingUp,
  },
  {
    title: "Chat Ativo",
    value: "12",
    change: "5 novos",
    icon: IconMessageDots,
  },
  {
    title: "Agendamentos",
    value: "8",
    change: "Esta semana",
    icon: IconCalendar,
  },
]

const recentLeads = [
  { id: 1, name: "João Silva", email: "joao@example.com", origem: "Google Ads", status: "Novo" },
  { id: 2, name: "Maria Santos", email: "maria@example.com", origem: "Meta Ads", status: "Qualificado" },
  { id: 3, name: "Pedro Costa", email: "pedro@example.com", origem: "Indicação", status: "Em Contato" },
]

export default function DashboardPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader("Dashboard", "Bem-vindo de volta! Aqui está sua visão geral")
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts & Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <div className="md:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tendência de Leads</h2>
            <ChartAreaInteractive />
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Leads por Origem</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Google Ads</span>
              <span className="font-semibold">45%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "45%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Meta Ads</span>
              <span className="font-semibold">35%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: "35%" }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Indicação</span>
              <span className="font-semibold">20%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "20%" }}></div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Leads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Leads Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Nome</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Origem</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{lead.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.email}</td>
                    <td className="py-3 px-4">{lead.origem}</td>
                    <td className="py-3 px-4">
                      <Badge variant={lead.status === "Novo" ? "default" : "outline"}>
                        {lead.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
