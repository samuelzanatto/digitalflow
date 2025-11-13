"use client"

import { useEffect } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import { IconDeviceFloppy } from "@tabler/icons-react"

export default function ConfiguracoesPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader("Configurações", "Gerencie suas preferências e integrações")
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-6">
        {/* Perfil */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Perfil</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" defaultValue="Gestor Flow" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="gestor@flow.com" className="mt-2" />
            </div>
            <Button className="gap-2">
              <IconDeviceFloppy size={16} />
              Salvar Alterações
            </Button>
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notificações</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novo Lead</p>
                <p className="text-sm text-muted-foreground">Notificar quando um novo lead chegar</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Mensagens Chat</p>
                <p className="text-sm text-muted-foreground">Notificar quando receber mensagens</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium">Agendamentos</p>
                <p className="text-sm text-muted-foreground">Lembrete 30 min antes de agendamentos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Integrações */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Integrações</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">Google Ads</p>
                <p className="text-sm text-muted-foreground">Sincronize dados do Google Ads</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">Meta Ads</p>
                <p className="text-sm text-muted-foreground">Sincronize dados do Meta Ads</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">Google Analytics</p>
                <p className="text-sm text-muted-foreground">Sincronize dados de comportamento</p>
              </div>
              <Button variant="outline" size="sm">Conectar</Button>
            </div>
          </div>
        </Card>

        {/* Tema */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Aparência</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo Escuro</p>
                <p className="text-sm text-muted-foreground">Usar tema escuro por padrão</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
        </motion.div>
      </div>
    )
  }

