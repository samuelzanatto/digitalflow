"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { IconPlus, IconEdit } from "@tabler/icons-react"

const automacoes = [
  { id: 1, titulo: "Email boas-vindas", gatilho: "Novo lead", acao: "Enviar email", status: "Ativa" },
  { id: 2, titulo: "Notificação abandono", gatilho: "Chat inativo 24h", acao: "Notificar gestor", status: "Ativa" },
  { id: 3, titulo: "Follow-up automático", gatilho: "Proposta enviada", acao: "Lembrete em 7 dias", status: "Ativa" },
  { id: 4, titulo: "Descartamento", gatilho: "Sem resposta 15 dias", acao: "Descartar lead", status: "Inativa" },
]

export default function AutomacoesPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Nova Automação
      </Button>
    )
    setPageHeader("Automações", "Configure workflows e gatilhos automáticos", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-3">
        {automacoes.map((auto) => (
          <Card key={auto.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-2">{auto.titulo}</h3>
                <p className="text-sm text-muted-foreground mb-1">📌 Gatilho: {auto.gatilho}</p>
                <p className="text-sm text-muted-foreground">⚙️ Ação: {auto.acao}</p>
              </div>
              <div className="flex gap-2 items-start">
                <Badge variant={auto.status === "Ativa" ? "default" : "outline"}>{auto.status}</Badge>
                <Button variant="ghost" size="sm">
                  <IconEdit size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </motion.div>
      </div>
    )
  }

