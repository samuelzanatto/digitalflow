"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { IconPlus, IconDownload, IconEye } from "@tabler/icons-react"

const relatorios = [
  { id: 1, titulo: "Relatório Mensal - Novembro", data: "13/11/2024", clientes: 5, status: "Pronto" },
  { id: 2, titulo: "Performance de Campanhas", data: "10/11/2024", clientes: 3, status: "Processando" },
  { id: 3, titulo: "ROI por Cliente - Q4", data: "01/11/2024", clientes: 5, status: "Pronto" },
]

export default function RelatoriosPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Novo Relatório
      </Button>
    )
    setPageHeader("Relatórios", "Gere e compartilhe relatórios customizados", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex gap-2">
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-3">
          {relatorios.map((rel) => (
            <Card key={rel.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{rel.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{rel.data} · {rel.clientes} clientes</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={rel.status === "Pronto" ? "default" : "outline"}>{rel.status}</Badge>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <IconEye size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <IconDownload size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </div>
    )
  }

