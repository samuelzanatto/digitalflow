"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { IconPlus, IconClock, IconPhone } from "@tabler/icons-react"

const agendamentos = [
  {
    id: 1,
    titulo: "Apresentação Projeto A",
    cliente: "João Silva",
    tipo: "Reunião",
    data: "2024-11-15",
    hora: "14:00",
    duracao: "1h",
    gestores: ["Carlos", "Ana"],
    status: "Confirmado",
  },
  {
    id: 2,
    titulo: "Follow-up com Maria",
    cliente: "Maria Santos",
    tipo: "Chamada",
    data: "2024-11-15",
    hora: "15:30",
    duracao: "30m",
    gestores: ["Pedro"],
    status: "Pendente",
  },
  {
    id: 3,
    titulo: "Briefing Cliente B",
    cliente: "Pedro Costa",
    tipo: "Reunião",
    data: "2024-11-16",
    hora: "10:00",
    duracao: "1.5h",
    gestores: ["Carlos", "Paulo"],
    status: "Confirmado",
  },
  {
    id: 4,
    titulo: "Apresentação Proposta",
    cliente: "Ana Oliveira",
    tipo: "Reunião",
    data: "2024-11-16",
    hora: "16:00",
    duracao: "1h",
    gestores: ["Sofia"],
    status: "Confirmado",
  },
  {
    id: 5,
    titulo: "Reunião Estratégia",
    cliente: "Bruno Mendes",
    tipo: "Reunião",
    data: "2024-11-17",
    hora: "09:00",
    duracao: "2h",
    gestores: ["Carlos", "Ana", "Paulo"],
    status: "Pendente",
  },
]

const dias = [
  { data: "15/11", dia: "Quarta", agendamentos: 2 },
  { data: "16/11", dia: "Quinta", agendamentos: 2 },
  { data: "17/11", dia: "Sexta", agendamentos: 1 },
]

export default function AgendamentosPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Novo Agendamento
      </Button>
    )
    setPageHeader("Agendamentos", "Gerencias suas reuniões e chamadas", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Calendar Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-3 grid-cols-3 md:grid-cols-6 lg:grid-cols-7"
      >
        {dias.map((dia) => (
          <Card key={dia.data} className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-xs font-semibold text-muted-foreground mb-1">{dia.dia}</p>
            <p className="text-lg font-bold">{dia.data}</p>
            <p className="text-xs text-primary mt-2">{dia.agendamentos} evento{dia.agendamentos !== 1 ? "s" : ""}</p>
          </Card>
        ))}
      </motion.div>

      {/* Upcoming */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Próximos Agendamentos</h2>
            </div>
            <div className="divide-y">
              {agendamentos.map((agendamento, index) => (
                <motion.div
                  key={agendamento.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  className="p-6 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{agendamento.titulo}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{agendamento.cliente}</p>
                    </div>
                    <Badge
                      variant={agendamento.status === "Confirmado" ? "default" : "outline"}
                    >
                      {agendamento.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconClock size={16} />
                      <span>{agendamento.data} às {agendamento.hora}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconPhone size={16} />
                      <span>{agendamento.tipo} · {agendamento.duracao}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Gestores:</span>
                    <div className="flex gap-1">
                      {agendamento.gestores.map((gestor) => (
                        <Badge key={gestor} variant="secondary" className="text-xs">
                          {gestor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Ver Detalhes
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar - Disponibilidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Disponibilidade da Equipe</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Carlos</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Disponível</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ana</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Ocupada</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Paulo</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Disponível</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sofia</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Disponível</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pedro</span>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">Offline</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Resumo</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hoje</span>
                <span className="font-semibold">3 encontros</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Esta Semana</span>
                <span className="font-semibold">12 encontros</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Próxima Semana</span>
                <span className="font-semibold">8 encontros</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

