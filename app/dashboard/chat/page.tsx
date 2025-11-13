"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { IconSearch, IconSend } from "@tabler/icons-react"

const conversas = [
  {
    id: 1,
    nome: "João Silva",
    empresa: "Tech Solutions",
    ultimaMensagem: "Qual é o próximo passo?",
    data: "Agora",
    naoLidas: 2,
  },
  {
    id: 2,
    nome: "Maria Santos",
    empresa: "E-commerce Plus",
    ultimaMensagem: "Perfeito, vamos começar!",
    data: "5 min",
    naoLidas: 0,
  },
  {
    id: 3,
    nome: "Pedro Costa",
    empresa: "Startup XYZ",
    ultimaMensagem: "Enviaste o orçamento?",
    data: "30 min",
    naoLidas: 1,
  },
  {
    id: 4,
    nome: "Ana Oliveira",
    empresa: "Consultoria ABC",
    ultimaMensagem: "Estou com dúvidas no planejamento",
    data: "2h",
    naoLidas: 0,
  },
  {
    id: 5,
    nome: "Bruno Mendes",
    empresa: "Growth Hacking",
    ultimaMensagem: "Muito obrigado pela ajuda!",
    data: "1 dia",
    naoLidas: 0,
  },
]

const mensagens = [
  {
    id: 1,
    autor: "João Silva",
    texto: "Olá, tudo bem? Gostaria de tirar algumas dúvidas sobre o projeto.",
    data: "14:25",
    de: true,
  },
  {
    id: 2,
    autor: "Você",
    texto: "Oi João! Claro, fico feliz em ajudar. Qual é sua dúvida?",
    data: "14:30",
    de: false,
  },
  {
    id: 3,
    autor: "João Silva",
    texto: "Qual é o próximo passo?",
    data: "Agora",
    de: true,
  },
]

export default function ChatPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader("Chat", "Comunique-se com seus leads")
  }, [setPageHeader])

  return (
    <div className="flex flex-1 gap-4 p-4 h-[calc(100vh-var(--header-height)-var(--spacing)*2)]">
      {/* Chat List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-80 flex flex-col gap-4"
      >
        <div className="relative">
          <IconSearch className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar conversa..." className="pl-10" />
        </div>

        <div className="space-y-2 overflow-y-auto flex-1">
          {conversas.map((conversa, index) => (
            <motion.div
              key={conversa.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group bg-card"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{conversa.nome}</h3>
                  <p className="text-xs text-muted-foreground">{conversa.empresa}</p>
                </div>
                {conversa.naoLidas > 0 && (
                  <Badge className="bg-red-500">{conversa.naoLidas}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">
                {conversa.ultimaMensagem}
              </p>
              <p className="text-xs text-muted-foreground">{conversa.data}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chat Window */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden md:flex flex-col flex-1"
      >
        <Card className="p-6 border-b rounded-b-none">
          <div>
            <h2 className="text-xl font-bold">João Silva</h2>
            <p className="text-sm text-muted-foreground">Tech Solutions</p>
          </div>
        </Card>

        <div className="flex-1 overflow-y-auto border-l border-r p-6 space-y-4 bg-muted/30">
          {mensagens.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex ${msg.de ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs rounded-lg p-4 ${
                  msg.de ? "bg-muted text-left" : "bg-primary text-primary-foreground text-right"
                }`}
              >
                <p className="text-sm">{msg.texto}</p>
                <p className="text-xs opacity-70 mt-2">{msg.data}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Card className="p-4 border-t rounded-t-none">
          <div className="flex gap-2">
            <Input placeholder="Digite sua mensagem..." />
            <Button size="sm" className="gap-2">
              <IconSend size={16} />
              Enviar
            </Button>
          </div>
        </Card>
      </motion.div>
      </div>
    )
  }

