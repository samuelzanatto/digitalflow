"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { IconPlus, IconTrash } from "@tabler/icons-react"

const tarefas = [
  { id: 1, titulo: "Criar briefing para Cliente A", projeto: "Sprint 1", prioridade: "Alta", status: "Em Progresso", atribuido: "Carlos" },
  { id: 2, titulo: "Revisar campanhas Meta Ads", projeto: "Sprint 1", prioridade: "Alta", status: "Pendente", atribuido: "Ana" },
  { id: 3, titulo: "Relatório de performance", projeto: "Sprint 1", prioridade: "Média", status: "Concluído", atribuido: "Paulo" },
  { id: 4, titulo: "Otimização de Google Ads", projeto: "Sprint 2", prioridade: "Média", status: "Pendente", atribuido: "Sofia" },
]

export default function TarefasPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Nova Tarefa
      </Button>
    )
    setPageHeader("Tarefas & Projetos", "Gerencie tarefas e sprints da equipe", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-3">
        {tarefas.map((tarefa) => (
          <Card key={tarefa.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <Checkbox />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{tarefa.titulo}</h3>
                <p className="text-sm text-muted-foreground">{tarefa.projeto}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{tarefa.prioridade}</Badge>
                  <Badge variant={tarefa.status === "Concluído" ? "default" : "outline"}>{tarefa.status}</Badge>
                  <Badge variant="secondary">{tarefa.atribuido}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <IconTrash size={16} className="text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
        </motion.div>
      </div>
    )
  }

