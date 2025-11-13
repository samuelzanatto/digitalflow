"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { IconPlus, IconDots } from "@tabler/icons-react"

const pipelineStages = [
  {
    id: "novo",
    title: "Novo",
    color: "bg-blue-500",
    count: 12,
    cards: [
      { id: 1, title: "João Silva", empresa: "Tech Solutions", valor: "R$ 15.000" },
      { id: 2, title: "Ana Costa", empresa: "E-commerce Plus", valor: "R$ 8.500" },
      { id: 3, title: "Rafael Martins", empresa: "Digital Agency", valor: "R$ 12.000" },
    ],
  },
  {
    id: "contato",
    title: "Em Contato",
    color: "bg-yellow-500",
    count: 8,
    cards: [
      { id: 4, title: "Maria Santos", empresa: "Startup XYZ", valor: "R$ 25.000" },
      { id: 5, title: "Pedro Oliveira", empresa: "Consultoria ABC", valor: "R$ 18.500" },
    ],
  },
  {
    id: "qualificado",
    title: "Qualificado",
    color: "bg-purple-500",
    count: 6,
    cards: [
      { id: 6, title: "Carla Silva", empresa: "E-learning Pro", valor: "R$ 35.000" },
      { id: 7, title: "Bruno Costa", empresa: "Marketing Digital", valor: "R$ 22.000" },
    ],
  },
  {
    id: "proposta",
    title: "Proposta",
    color: "bg-orange-500",
    count: 4,
    cards: [
      { id: 8, title: "Fernanda Lima", empresa: "Tech Inovação", valor: "R$ 45.000" },
      { id: 9, title: "Lucas Alves", empresa: "Growth Hacking", valor: "R$ 32.000" },
    ],
  },
  {
    id: "fechado",
    title: "Fechado",
    color: "bg-green-500",
    count: 24,
    cards: [
      { id: 10, title: "Cliente 1", empresa: "Success Story", valor: "R$ 50.000" },
      { id: 11, title: "Cliente 2", empresa: "Growth Expert", valor: "R$ 42.000" },
    ],
  },
]

export default function PipelinePage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Nova Oportunidade
      </Button>
    )
    setPageHeader("Pipeline de Vendas", "Visualize e gerencie suas oportunidades", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col h-full gap-0">
      {/* Summary Stats - Fixed */}
      <div className="space-y-4 px-4 pt-4 pb-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-3 md:grid-cols-3"
        >
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Pipeline Total</p>
            <p className="text-3xl font-bold">R$ 437.500</p>
            <p className="text-xs text-green-600 mt-2">+5% desde o mês passado</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Tempo Médio</p>
            <p className="text-3xl font-bold">18 dias</p>
            <p className="text-xs text-muted-foreground mt-2">Até fechamento</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Taxa de Conversão</p>
            <p className="text-3xl font-bold">32%</p>
            <p className="text-xs text-green-600 mt-2">+3% vs ano anterior</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-3 grid-cols-2 md:grid-cols-5"
        >
          {pipelineStages.map((stage) => (
            <Card key={stage.id} className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{stage.title}</p>
              <p className="text-2xl font-bold">{stage.count}</p>
            </Card>
          ))}
        </motion.div>
      </div>

      {/* Kanban Board - Scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 overflow-x-auto overflow-y-hidden px-4"
        >
          <div className="flex gap-3 py-4">
            {pipelineStages.map((stage, stageIndex) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + stageIndex * 0.05 }}
                className="w-72 shrink-0 flex flex-col"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h3 className="font-semibold text-sm">{stage.title}</h3>
                    <Badge variant="secondary" className="text-xs">{stage.count}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <IconPlus size={16} />
                  </Button>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 bg-muted/30 rounded-lg p-2 flex-1 overflow-y-auto">
                  {stage.cards.map((card, cardIndex) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.2 + stageIndex * 0.05 + cardIndex * 0.02 }}
                      className="bg-card p-3 rounded-lg border cursor-move hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{card.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IconDots size={16} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{card.empresa}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {card.valor}
                        </Badge>
                        <span className="text-xs text-muted-foreground">2 dias</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
