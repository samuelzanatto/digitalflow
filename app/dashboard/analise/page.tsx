"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { IconThumbUp, IconMessageCircle, IconTrash } from "@tabler/icons-react"

const feedback = [
  { id: 1, cliente: "João Silva", tipo: "Sugestão", mensagem: "Gostaríamos de adicionar mais relatórios customizáveis", data: "2h", status: "Aberto" },
  { id: 2, cliente: "Maria Santos", tipo: "Feedback", mensagem: "Excelente atendimento da equipe!", data: "1 dia", status: "Respondido" },
  { id: 3, cliente: "Pedro Costa", tipo: "Ticket", mensagem: "Bug no dashboard ao carregar gráficos", data: "2 dias", status: "Em Progresso" },
]

export default function AnalisePage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader("Análise & Feedback", "Feedback dos clientes e tickets de suporte")
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid gap-4 grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">24</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Abertos</p>
          <p className="text-2xl font-bold">8</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Resolvidos</p>
          <p className="text-2xl font-bold">16</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-3">
        {feedback.map((item) => (
          <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{item.cliente}</h3>
                  <Badge variant="outline">{item.tipo}</Badge>
                  <Badge variant={item.status === "Aberto" ? "default" : "outline"}>{item.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{item.mensagem}</p>
                <p className="text-xs text-muted-foreground">{item.data}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <IconThumbUp size={16} />
                </Button>
                <Button variant="ghost" size="sm">
                  <IconMessageCircle size={16} />
                </Button>
                <Button variant="ghost" size="sm">
                  <IconTrash size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </motion.div>
      </div>
    )
  }

