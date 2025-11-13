"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { IconPlus, IconDownload, IconEye } from "@tabler/icons-react"

const documentos = [
  { id: 1, titulo: "Template Brief Projeto", tipo: "Template", criacao: "05/11/2024", tamanho: "2.4 MB" },
  { id: 2, titulo: "Guia de Boas Práticas", tipo: "Documentação", criacao: "01/11/2024", tamanho: "1.8 MB" },
  { id: 3, titulo: "Case Study - Cliente A", tipo: "Case", criacao: "15/10/2024", tamanho: "3.2 MB" },
  { id: 4, titulo: "Proposta Padrão", tipo: "Template", criacao: "10/10/2024", tamanho: "2.1 MB" },
]

export default function DocumentosPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2">
        <IconPlus size={18} />
        Upload Documento
      </Button>
    )
    setPageHeader("Documentos", "Banco de briefs, templates e documentações", actionButton)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-3">
        {documentos.map((doc) => (
          <Card key={doc.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">{doc.titulo}</h3>
                <p className="text-sm text-muted-foreground">{doc.criacao} · {doc.tamanho}</p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant="outline">{doc.tipo}</Badge>
                <Button variant="ghost" size="sm">
                  <IconEye size={16} />
                </Button>
                <Button variant="ghost" size="sm">
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

