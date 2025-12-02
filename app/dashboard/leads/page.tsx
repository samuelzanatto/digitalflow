"use client"

import { useEffect, useState } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { 
  IconSearch, 
  IconPlus, 
  IconArrowUpRight, 
  IconUsers,
  IconFolder,
  IconTrash,
  IconEdit
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

interface LeadGroup {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  _count: {
    leads: number
  }
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  source: string
  status: string
  score: number
  createdAt: string
  group: {
    id: string
    name: string
    color: string
  }
}

interface Stats {
  total: number
  newLeads: number
  qualified: number
  avgScore: number
  conversionRate: number | string
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  qualified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  proposal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  discarded: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusLabels: Record<string, string> = {
  new: "Novo",
  contacted: "Em Contato",
  qualified: "Qualificado",
  proposal: "Proposta",
  discarded: "Descartado",
}

const groupColors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", 
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6"
]

export default function LeadsPage() {
  const { setPageHeader } = usePageHeader()
  const [groups, setGroups] = useState<LeadGroup[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("leads")
  
  // Form states
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [newGroupColor, setNewGroupColor] = useState("#6366f1")
  const [creatingGroup, setCreatingGroup] = useState(false)
  
  // Edit group states
  const [editingGroup, setEditingGroup] = useState<LeadGroup | null>(null)
  const [editGroupName, setEditGroupName] = useState("")
  const [editGroupDescription, setEditGroupDescription] = useState("")
  const [editGroupColor, setEditGroupColor] = useState("#6366f1")
  const [savingGroup, setSavingGroup] = useState(false)
  
  const [newLeadGroupId, setNewLeadGroupId] = useState("")
  const [newLeadName, setNewLeadName] = useState("")
  const [newLeadEmail, setNewLeadEmail] = useState("")
  const [newLeadPhone, setNewLeadPhone] = useState("")
  const [creatingLead, setCreatingLead] = useState(false)

  useEffect(() => {
    const actionButton = (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <IconPlus size={18} />
            Novo Lead
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lead</DialogTitle>
            <DialogDescription>
              Adicione um lead manualmente a um grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="lead-group">Grupo</Label>
              <select
                id="lead-group"
                className="w-full mt-2 p-2 border rounded-md bg-background"
                value={newLeadGroupId}
                onChange={(e) => setNewLeadGroupId(e.target.value)}
              >
                <option value="">Selecione um grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="lead-name">Nome</Label>
              <Input 
                id="lead-name" 
                className="mt-2"
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Email</Label>
              <Input 
                id="lead-email" 
                type="email"
                className="mt-2"
                value={newLeadEmail}
                onChange={(e) => setNewLeadEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input 
                id="lead-phone" 
                className="mt-2"
                value={newLeadPhone}
                onChange={(e) => setNewLeadPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCreateLead} disabled={creatingLead}>
              {creatingLead ? "Criando..." : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    setPageHeader("Leads", "Gerencie e qualifique seus leads", actionButton)
  }, [setPageHeader, groups, newLeadGroupId, newLeadName, newLeadEmail, newLeadPhone, creatingLead])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [groupsRes, leadsRes] = await Promise.all([
        fetch("/api/lead-groups"),
        fetch("/api/leads")
      ])
      
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(data.groups || [])
      }
      
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    
    setCreatingGroup(true)
    try {
      const response = await fetch("/api/lead-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          color: newGroupColor
        })
      })
      
      if (response.ok) {
        setNewGroupName("")
        setNewGroupDescription("")
        setNewGroupColor("#6366f1")
        loadData()
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Tem certeza? Todos os leads deste grupo serão excluídos.")) return
    
    try {
      await fetch(`/api/lead-groups/${groupId}`, { method: "DELETE" })
      loadData()
    } catch (error) {
      console.error("Erro ao deletar grupo:", error)
    }
  }

  const handleEditGroup = (group: LeadGroup) => {
    setEditingGroup(group)
    setEditGroupName(group.name)
    setEditGroupDescription(group.description || "")
    setEditGroupColor(group.color)
  }

  const handleSaveGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) return
    
    setSavingGroup(true)
    try {
      const response = await fetch(`/api/lead-groups/${editingGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName,
          description: editGroupDescription,
          color: editGroupColor
        })
      })
      
      if (response.ok) {
        setEditingGroup(null)
        loadData()
      }
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleCreateLead = async () => {
    if (!newLeadGroupId || !newLeadName.trim() || !newLeadEmail.trim()) return
    
    setCreatingLead(true)
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: newLeadGroupId,
          name: newLeadName,
          email: newLeadEmail,
          phone: newLeadPhone,
          source: "manual"
        })
      })
      
      if (response.ok) {
        setNewLeadGroupId("")
        setNewLeadName("")
        setNewLeadEmail("")
        setNewLeadPhone("")
        loadData()
      }
    } catch (error) {
      console.error("Erro ao criar lead:", error)
    } finally {
      setCreatingLead(false)
    }
  }

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Leads</p>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Novos (7 dias)</p>
          <p className="text-2xl font-bold">{stats?.newLeads || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Qualificados</p>
          <p className="text-2xl font-bold">{stats?.qualified || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Taxa Conversão</p>
          <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leads" className="gap-2">
              <IconUsers size={16} />
              Leads
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <IconFolder size={16} />
              Grupos
            </TabsTrigger>
          </TabsList>

          {/* Tab Leads */}
          <TabsContent value="leads">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap mb-4">
              <div className="relative flex-1 max-w-xs">
                <IconSearch className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar leads..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Leads Table */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold">Nome</th>
                      <th className="text-left py-4 px-6 font-semibold">Email</th>
                      <th className="text-left py-4 px-6 font-semibold">Telefone</th>
                      <th className="text-left py-4 px-6 font-semibold">Grupo</th>
                      <th className="text-left py-4 px-6 font-semibold">Origem</th>
                      <th className="text-left py-4 px-6 font-semibold">Status</th>
                      <th className="text-left py-4 px-6 font-semibold">Data</th>
                      <th className="text-left py-4 px-6 font-semibold">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          Carregando...
                        </td>
                      </tr>
                    ) : filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          <IconUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum lead encontrado</p>
                          <p className="text-xs mt-1">Crie um grupo e adicione leads ou conecte um formulário</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead, index) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + index * 0.03 }}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium">{lead.name}</td>
                          <td className="py-4 px-6 text-muted-foreground">{lead.email}</td>
                          <td className="py-4 px-6 text-muted-foreground">{lead.phone || '-'}</td>
                          <td className="py-4 px-6">
                            <Badge 
                              variant="outline" 
                              className="gap-1"
                              style={{ borderColor: lead.group.color, color: lead.group.color }}
                            >
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: lead.group.color }}
                              />
                              {lead.group.name}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 capitalize">{lead.source}</td>
                          <td className="py-4 px-6">
                            <Badge className={statusColors[lead.status]}>
                              {statusLabels[lead.status] || lead.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground text-xs">
                            {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-4 px-6">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <IconArrowUpRight size={16} />
                              Ver
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Tab Grupos */}
          <TabsContent value="groups">
            {/* Novo Grupo */}
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-4">Criar Novo Grupo</h3>
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="group-name">Nome do Grupo</Label>
                  <Input 
                    id="group-name" 
                    placeholder="Ex: Landing Page Principal"
                    className="mt-2"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="group-desc">Descrição (opcional)</Label>
                  <Input 
                    id="group-desc" 
                    placeholder="Descrição do grupo"
                    className="mt-2"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex gap-1 mt-2">
                    {groupColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newGroupColor === color ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewGroupColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupName.trim()}>
                  <IconPlus size={16} className="mr-2" />
                  {creatingGroup ? "Criando..." : "Criar Grupo"}
                </Button>
              </div>
            </Card>

            {/* Lista de Grupos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.length === 0 ? (
                <Card className="p-8 col-span-full text-center text-muted-foreground">
                  <IconFolder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum grupo criado</p>
                  <p className="text-sm mt-1">Crie um grupo para começar a organizar seus leads</p>
                </Card>
              ) : (
                groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: group.color }}
                          >
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{group.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {group._count.leads} lead{group._count.leads !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditGroup(group)}
                          >
                            <IconEdit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                      )}
                      
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground">
                          Criado em {new Date(group.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialog de Edição de Grupo */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>
              Altere as informações do grupo de leads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-group-name">Nome do Grupo</Label>
              <Input 
                id="edit-group-name" 
                className="mt-2"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-group-desc">Descrição (opcional)</Label>
              <Input 
                id="edit-group-desc" 
                className="mt-2"
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-1 mt-2 flex-wrap">
                {groupColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editGroupColor === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditGroupColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGroup} disabled={savingGroup || !editGroupName.trim()}>
              {savingGroup ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

