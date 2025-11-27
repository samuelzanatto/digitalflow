"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { useUser } from "@/contexts/user-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"
import { IconPlus, IconDots, IconGripVertical, IconTrash, IconEdit, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  getPipelineData,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  updateOpportunitiesOrder,
  type PipelineStageWithCards,
  type PipelineOpportunity,
} from "@/lib/actions/pipeline"

// UI Types (mapped from DB types)
interface PipelineCard {
  id: string
  stageId: string
  title: string
  company: string | null
  email: string | null
  phone: string | null
  value: number
  notes: string | null
  days: number
  order: number
}

interface PipelineStage {
  id: string
  title: string
  color: string
  order: number
  cards: PipelineCard[]
}

// Map DB opportunity to UI card
function mapOpportunityToCard(opp: PipelineOpportunity): PipelineCard {
  const now = new Date()
  const created = new Date(opp.createdAt)
  const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    id: opp.id,
    stageId: opp.stageId,
    title: opp.title,
    company: opp.company,
    email: opp.email,
    phone: opp.phone,
    value: opp.value,
    notes: opp.notes,
    days,
    order: opp.order,
  }
}

// Map DB stage to UI stage
function mapStageToUI(stage: PipelineStageWithCards): PipelineStage {
  return {
    id: stage.id,
    title: stage.title,
    color: stage.color,
    order: stage.order,
    cards: stage.cards.map(mapOpportunityToCard),
  }
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Sortable Card Component
function SortableCard({ 
  card, 
  onEdit,
  onDelete,
}: { 
  card: PipelineCard
  onEdit: (card: PipelineCard) => void
  onDelete: (card: PipelineCard) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card p-3 rounded-lg border hover:shadow-md transition-all group ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-primary/50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconGripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm truncate">{card.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6 p-0"
                >
                  <IconDots size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(card)}>
                  <IconEdit size={16} className="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(card)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash size={16} className="mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {card.company && (
            <p className="text-xs text-muted-foreground mb-3 truncate">{card.company}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-semibold">
              {formatCurrency(card.value)}
            </Badge>
            <span className="text-xs text-muted-foreground">{card.days} dias</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Card Overlay (shown while dragging)
function CardOverlay({ card }: { card: PipelineCard }) {
  return (
    <div className="bg-card p-3 rounded-lg border shadow-xl ring-2 ring-primary/50 w-64">
      <div className="flex items-start gap-2">
        <div className="mt-1 text-muted-foreground">
          <IconGripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm truncate">{card.title}</h4>
          </div>
          {card.company && (
            <p className="text-xs text-muted-foreground mb-3 truncate">{card.company}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-semibold">
              {formatCurrency(card.value)}
            </Badge>
            <span className="text-xs text-muted-foreground">{card.days} dias</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stage Column Component
function StageColumn({ 
  stage, 
  children,
  onAddCard,
}: { 
  stage: PipelineStage
  children: React.ReactNode
  onAddCard: (stageId: string) => void
}) {
  const cardIds = stage.cards.map((card) => card.id)

  return (
    <div className="w-72 shrink-0 flex flex-col h-full">
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
          <h3 className="font-semibold text-sm">{stage.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {stage.cards.length}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          onClick={() => onAddCard(stage.id)}
        >
          <IconPlus size={16} />
        </Button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 bg-muted/30 rounded-lg p-2 overflow-y-auto min-h-[200px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">{children}</div>
        </SortableContext>
      </div>
    </div>
  )
}

// Loading skeleton
function PipelineSkeleton() {
  return (
    <div className="flex flex-1 flex-col h-full gap-0 animate-pulse">
      <div className="space-y-4 px-4 pt-4 pb-0">
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted rounded-lg h-28" />
          ))}
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted rounded-lg h-20" />
          ))}
        </div>
      </div>
      <div className="flex-1 flex gap-3 mt-4 px-4 pb-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-72 shrink-0 bg-muted rounded-lg h-full" />
        ))}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { setPageHeader } = usePageHeader()
  const { user } = useUser()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<PipelineCard | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [deleteCard, setDeleteCard] = useState<PipelineCard | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    email: "",
    phone: "",
    value: "",
    notes: "",
  })

  // Load pipeline data
  const loadPipelineData = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const { stages: data, error } = await getPipelineData(user.id)
      if (error) {
        toast.error(error)
        return
      }
      setStages(data.map(mapStageToUI))
    } catch (error) {
      console.error("Error loading pipeline:", error)
      toast.error("Erro ao carregar pipeline")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadPipelineData()
  }, [loadPipelineData])

  // Calculate stats
  const stats = useMemo(() => {
    const allCards = stages.flatMap((s) => s.cards)
    const totalValue = allCards.reduce((acc, card) => acc + card.value, 0)
    const avgDays = allCards.length > 0
      ? Math.round(allCards.reduce((acc, card) => acc + card.days, 0) / allCards.length)
      : 0
    
    // Find closed stage (Fechado)
    const closedStage = stages.find((s) => s.title.toLowerCase().includes("fechado"))
    const closedCards = closedStage?.cards.length || 0
    const conversionRate = allCards.length > 0 ? Math.round((closedCards / allCards.length) * 100) : 0

    return {
      totalValue: formatCurrency(totalValue),
      avgDays,
      conversionRate,
    }
  }, [stages])

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const handleNewOpportunity = () => {
      const firstStage = stages[0]
      if (firstStage) {
        setSelectedStageId(firstStage.id)
        setEditingCard(null)
        setFormData({
          title: "",
          company: "",
          email: "",
          phone: "",
          value: "",
          notes: "",
        })
        setIsDialogOpen(true)
      }
    }

    const actionButton = (
      <Button className="gap-2" onClick={handleNewOpportunity}>
        <IconPlus size={18} />
        Nova Oportunidade
      </Button>
    )
    setPageHeader("Pipeline de Vendas", "Visualize e gerencie suas oportunidades", actionButton)
  }, [setPageHeader, stages])

  // Find which stage contains a card
  const findStageByCardId = (cardId: string): PipelineStage | undefined => {
    return stages.find((stage) => stage.cards.some((card) => card.id === cardId))
  }

  // Find card by id
  const findCardById = (cardId: string): PipelineCard | undefined => {
    for (const stage of stages) {
      const card = stage.cards.find((c) => c.id === cardId)
      if (card) return card
    }
    return undefined
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = findCardById(active.id as string)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeStage = findStageByCardId(activeId)
    const overStage = findStageByCardId(overId) || stages.find((s) => s.id === overId)

    if (!activeStage || !overStage || activeStage.id === overStage.id) return

    setStages((prev) => {
      const activeStageIndex = prev.findIndex((s) => s.id === activeStage.id)
      const overStageIndex = prev.findIndex((s) => s.id === overStage.id)
      const activeCardIndex = prev[activeStageIndex].cards.findIndex((c) => c.id === activeId)

      const card = prev[activeStageIndex].cards[activeCardIndex]

      // Find insertion index
      let overCardIndex = prev[overStageIndex].cards.findIndex((c) => c.id === overId)
      if (overCardIndex === -1) {
        overCardIndex = prev[overStageIndex].cards.length
      }

      const newStages = [...prev]
      
      // Remove from old stage
      newStages[activeStageIndex] = {
        ...newStages[activeStageIndex],
        cards: newStages[activeStageIndex].cards.filter((c) => c.id !== activeId),
      }
      
      // Add to new stage with updated stageId
      const movedCard = { ...card, stageId: overStage.id }
      const newCards = [...newStages[overStageIndex].cards]
      newCards.splice(overCardIndex, 0, movedCard)
      newStages[overStageIndex] = {
        ...newStages[overStageIndex],
        cards: newCards,
      }

      return newStages
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    const movedCard = activeCard
    setActiveCard(null)

    if (!over || !movedCard) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeStage = findStageByCardId(activeId)
    if (!activeStage) return

    // Check if we're reordering within the same column
    const overStage = findStageByCardId(overId)
    if (overStage && activeStage.id === overStage.id) {
      const stageIndex = stages.findIndex((s) => s.id === activeStage.id)
      const oldIndex = stages[stageIndex].cards.findIndex((c) => c.id === activeId)
      const newIndex = stages[stageIndex].cards.findIndex((c) => c.id === overId)

      if (oldIndex !== newIndex) {
        setStages((prev) => {
          const newStages = [...prev]
          newStages[stageIndex] = {
            ...newStages[stageIndex],
            cards: arrayMove(newStages[stageIndex].cards, oldIndex, newIndex),
          }
          return newStages
        })
      }
    }

    // Save changes to database
    const finalStage = findStageByCardId(activeId)
    if (finalStage) {
      // Collect all cards that need order updates
      const updates = finalStage.cards.map((card, index) => ({
        id: card.id,
        stageId: finalStage.id,
        order: index,
      }))

      try {
        const { error } = await updateOpportunitiesOrder(updates)
        if (error) {
          toast.error("Erro ao salvar posição")
          loadPipelineData() // Reload on error
          return
        }

        // Show toast only if moved to different stage
        if (movedCard && finalStage.id !== movedCard.stageId) {
          toast.success(`${movedCard.title} movido para ${finalStage.title}`)
        }
      } catch (error) {
        console.error("Error saving order:", error)
        toast.error("Erro ao salvar posição")
        loadPipelineData()
      }
    }
  }

  // Handle add card to stage
  const handleAddCard = (stageId: string) => {
    setSelectedStageId(stageId)
    setEditingCard(null)
    setFormData({
      title: "",
      company: "",
      email: "",
      phone: "",
      value: "",
      notes: "",
    })
    setIsDialogOpen(true)
  }

  // Handle edit card
  const handleEditCard = (card: PipelineCard) => {
    setEditingCard(card)
    setSelectedStageId(card.stageId)
    setFormData({
      title: card.title,
      company: card.company || "",
      email: card.email || "",
      phone: card.phone || "",
      value: card.value.toString(),
      notes: card.notes || "",
    })
    setIsDialogOpen(true)
  }

  // Handle delete card
  const handleDeleteCard = (card: PipelineCard) => {
    setDeleteCard(card)
  }

  const confirmDelete = async () => {
    if (!deleteCard) return
    
    const cardToDelete = deleteCard
    
    // Atualização otimista - remove do estado local primeiro
    setStages((prev) => 
      prev.map((stage) => ({
        ...stage,
        cards: stage.cards.filter((c) => c.id !== cardToDelete.id),
      }))
    )
    setDeleteCard(null)
    toast.success("Oportunidade excluída")

    try {
      const { error } = await deleteOpportunity(cardToDelete.id)
      if (error) {
        // Reverter em caso de erro
        toast.error(error)
        loadPipelineData()
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Erro ao excluir oportunidade")
      loadPipelineData()
    }
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!user?.id || !selectedStageId) return
    if (!formData.title.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    setIsSaving(true)
    
    const trimmedData = {
      title: formData.title.trim(),
      company: formData.company.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      value: parseFloat(formData.value) || 0,
      notes: formData.notes.trim() || null,
    }

    try {
      if (editingCard) {
        // Atualização otimista - atualiza o estado local primeiro
        setStages((prev) =>
          prev.map((stage) => ({
            ...stage,
            cards: stage.cards.map((c) =>
              c.id === editingCard.id
                ? { ...c, ...trimmedData }
                : c
            ),
          }))
        )
        setIsDialogOpen(false)
        toast.success("Oportunidade atualizada")

        // Sincroniza com o servidor
        const { error } = await updateOpportunity(editingCard.id, {
          title: trimmedData.title,
          company: trimmedData.company || undefined,
          email: trimmedData.email || undefined,
          phone: trimmedData.phone || undefined,
          value: trimmedData.value,
          notes: trimmedData.notes || undefined,
        })

        if (error) {
          toast.error(error)
          loadPipelineData() // Reverter em caso de erro
        }
      } else {
        // Cria um card temporário para atualização otimista
        const tempId = `temp-${Date.now()}`
        const tempCard: PipelineCard = {
          id: tempId,
          stageId: selectedStageId,
          ...trimmedData,
          days: 0,
          order: stages.find((s) => s.id === selectedStageId)?.cards.length || 0,
        }

        // Atualização otimista - adiciona ao estado local
        setStages((prev) =>
          prev.map((stage) =>
            stage.id === selectedStageId
              ? { ...stage, cards: [...stage.cards, tempCard] }
              : stage
          )
        )
        setIsDialogOpen(false)
        toast.success("Oportunidade criada")

        // Sincroniza com o servidor
        const { opportunity, error } = await createOpportunity({
          userId: user.id,
          stageId: selectedStageId,
          title: trimmedData.title,
          company: trimmedData.company || undefined,
          email: trimmedData.email || undefined,
          phone: trimmedData.phone || undefined,
          value: trimmedData.value,
          notes: trimmedData.notes || undefined,
        })

        if (error) {
          toast.error(error)
          loadPipelineData() // Reverter em caso de erro
        } else if (opportunity) {
          // Substitui o card temporário pelo real
          setStages((prev) =>
            prev.map((stage) =>
              stage.id === selectedStageId
                ? {
                    ...stage,
                    cards: stage.cards.map((c) =>
                      c.id === tempId ? mapOpportunityToCard(opportunity) : c
                    ),
                  }
                : stage
            )
          )
        }
      }
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Erro ao salvar oportunidade")
      loadPipelineData()
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <PipelineSkeleton />
  }

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
            <p className="text-3xl font-bold">{stats.totalValue}</p>
            <p className="text-xs text-muted-foreground mt-2">Valor total das oportunidades</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Tempo Médio</p>
            <p className="text-3xl font-bold">{stats.avgDays} dias</p>
            <p className="text-xs text-muted-foreground mt-2">Idade média das oportunidades</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Taxa de Conversão</p>
            <p className="text-3xl font-bold">{stats.conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-2">Oportunidades fechadas</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-3 grid-cols-2 md:grid-cols-5"
        >
          {stages.map((stage) => (
            <Card key={stage.id} className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                <p className="text-xs text-muted-foreground">{stage.title}</p>
              </div>
              <p className="text-2xl font-bold">{stage.cards.length}</p>
            </Card>
          ))}
        </motion.div>
      </div>

      {/* Kanban Board - Scrollable with DnD */}
      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 h-full py-2">
              {stages.map((stage, stageIndex) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + stageIndex * 0.05 }}
                  className="h-full"
                >
                  <StageColumn stage={stage} onAddCard={handleAddCard}>
                    {stage.cards.map((card) => (
                      <SortableCard 
                        key={card.id} 
                        card={card}
                        onEdit={handleEditCard}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </StageColumn>
                </motion.div>
              ))}
            </div>

            <DragOverlay>
              {activeCard ? <CardOverlay card={activeCard} /> : null}
            </DragOverlay>
          </DndContext>
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "Editar Oportunidade" : "Nova Oportunidade"}
            </DialogTitle>
            <DialogDescription>
              {editingCard 
                ? "Atualize os dados da oportunidade" 
                : "Adicione uma nova oportunidade ao pipeline"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nome *</Label>
              <Input
                id="title"
                placeholder="Nome do contato ou lead"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Nome da empresa"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                placeholder="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Anotações sobre esta oportunidade..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCard ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCard} onOpenChange={() => setDeleteCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteCard?.title}&quot;? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
