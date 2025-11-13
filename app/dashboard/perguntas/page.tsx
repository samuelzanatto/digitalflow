"use client"

import { useEffect, useState, useRef } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { IconEdit, IconTrash, IconEye, IconEyeOff, IconPlus, IconGripVertical } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"

interface Resposta {
  id: number
  texto: string
}

interface Pergunta {
  id: number
  titulo: string
  respostas: Resposta[]
  tipo: "unica" | "multipla"
  ativo: boolean
}

const initialQuestions: Pergunta[] = [
  {
    id: 1,
    titulo: "Qual seu orçamento?",
    tipo: "unica",
    respostas: [
      { id: 1, texto: "Até R$ 1.000" },
      { id: 2, texto: "R$ 1.000 - R$ 5.000" },
      { id: 3, texto: "R$ 5.000 - R$ 10.000" },
      { id: 4, texto: "Acima de R$ 10.000" },
    ],
    ativo: true,
  },
  {
    id: 2,
    titulo: "Quais são seus principais objetivos?",
    tipo: "multipla",
    respostas: [
      { id: 1, texto: "Aumentar vendas" },
      { id: 2, texto: "Melhorar marca" },
      { id: 3, texto: "Expandir mercado" },
      { id: 4, texto: "Reduzir custos" },
    ],
    ativo: true,
  },
  {
    id: 3,
    titulo: "Tem experiência anterior com transformação digital?",
    tipo: "unica",
    respostas: [
      { id: 1, texto: "Sim" },
      { id: 2, texto: "Não" },
      { id: 3, texto: "Parcialmente" },
    ],
    ativo: true,
  },
  {
    id: 4,
    titulo: "Em qual segmento sua empresa atua?",
    tipo: "unica",
    respostas: [
      { id: 1, texto: "Tecnologia" },
      { id: 2, texto: "Varejo" },
      { id: 3, texto: "Serviços" },
      { id: 4, texto: "Manufatura" },
      { id: 5, texto: "Outro" },
    ],
    ativo: false,
  },
  {
    id: 5,
    titulo: "Quais ferramentas você já utiliza?",
    tipo: "multipla",
    respostas: [
      { id: 1, texto: "CRM" },
      { id: 2, texto: "ERP" },
      { id: 3, texto: "Business Intelligence" },
      { id: 4, texto: "Automação" },
    ],
    ativo: true,
  },
]

// Componente SortableItem
function SortableItem({
  question,
  index,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  question: Pergunta
  index: number
  onEdit: (q: Pergunta) => void
  onDelete: (id: number) => void
  onToggleActive: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all"
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-start gap-3 flex-1">
            <button
              {...attributes}
              {...listeners}
              className="flex items-center justify-center w-6 h-6 rounded bg-muted text-muted-foreground shrink-0 mt-0.5 hover:bg-primary/20 transition-colors cursor-grab active:cursor-grabbing select-none touch-none"
              title="Pressione e segure para reordenar (mobile) ou arraste (desktop)"
            >
              <IconGripVertical size={16} />
            </button>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black bg-primary rounded px-2 py-1">
                  #{index + 1}
                </span>
                <h3 className="font-semibold text-sm line-clamp-2">{question.titulo}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={question.ativo ? "default" : "secondary"}
                  className="text-xs"
                >
                  {question.ativo ? "Ativa" : "Inativa"}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                >
                  {question.tipo === "unica" ? "Única" : "Múltipla"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(question.id)}
              title={question.ativo ? "Desativar" : "Ativar"}
            >
              {question.ativo ? (
                <IconEye size={16} />
              ) : (
                <IconEyeOff size={16} />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(question)}
            >
              <IconEdit size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(question.id)}
              className="text-destructive hover:text-destructive"
            >
              <IconTrash size={16} />
            </Button>
          </div>
        </div>

        {/* Respostas */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Respostas:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {question.respostas.map((resposta) => (
              <div key={resposta.id} className="text-xs bg-muted/50 rounded px-2 py-1.5 line-clamp-2">
                {resposta.texto}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function PerguntasPage() {
  const { setPageHeader } = usePageHeader()
  const [questions, setQuestions] = useState(initialQuestions)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "unica" as "unica" | "multipla",
    respostas: [{ id: 1, texto: "" }],
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const actionButton = (
      <Button className="gap-2" onClick={() => {
        setEditingId(null)
        setFormData({
          titulo: "",
          tipo: "unica",
          respostas: [{ id: 1, texto: "" }],
        })
        setIsDialogOpen(true)
      }}>
        <IconPlus size={18} />
        Nova Pergunta
      </Button>
    )
    setPageHeader("Perguntas para Especialistas", "Gerencie as perguntas do formulário de contato", actionButton)
  }, [setPageHeader])

  const filteredQuestions = questions.filter(q =>
    q.titulo.toLowerCase().includes(search.toLowerCase())
  )

  const handleDragStart = () => {
    // Desativa scroll durante o drag
    if (scrollableRef.current) {
      scrollableRef.current.style.overflowY = "hidden"
    }
    document.body.style.overflow = "hidden"
    setActiveId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // Reativa scroll após drag
    if (scrollableRef.current) {
      scrollableRef.current.style.overflowY = "auto"
    }
    document.body.style.overflow = "auto"
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id)
      const newIndex = questions.findIndex(q => q.id === over.id)

      setQuestions(arrayMove(questions, oldIndex, newIndex))
    }
  }

  const handleDelete = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleEdit = (question: Pergunta) => {
    setEditingId(question.id)
    setFormData({
      titulo: question.titulo,
      tipo: question.tipo,
      respostas: question.respostas,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.titulo.trim() || formData.respostas.some(r => !r.texto.trim())) {
      alert("Preencha a pergunta e todas as respostas")
      return
    }

    if (editingId) {
      setQuestions(
        questions.map(q =>
          q.id === editingId
            ? { ...q, ...formData }
            : q
        )
      )
    } else {
      setQuestions([
        ...questions,
        {
          id: Math.max(...questions.map(q => q.id), 0) + 1,
          ...formData,
          ativo: true,
        },
      ])
    }
    setIsDialogOpen(false)
    setFormData({
      titulo: "",
      tipo: "unica",
      respostas: [{ id: 1, texto: "" }],
    })
  }

  const toggleActive = (id: number) => {
    setQuestions(
      questions.map(q =>
        q.id === id ? { ...q, ativo: !q.ativo } : q
      )
    )
  }

  const handleAddResposta = () => {
    const newId = Math.max(...formData.respostas.map(r => r.id), 0) + 1
    setFormData({
      ...formData,
      respostas: [...formData.respostas, { id: newId, texto: "" }],
    })
  }

  const handleRemoveResposta = (id: number) => {
    if (formData.respostas.length > 1) {
      setFormData({
        ...formData,
        respostas: formData.respostas.filter(r => r.id !== id),
      })
    }
  }

  const handleUpdateResposta = (id: number, texto: string) => {
    setFormData({
      ...formData,
      respostas: formData.respostas.map(r =>
        r.id === id ? { ...r, texto } : r
      ),
    })
  }

  return (
    <div ref={scrollableRef} className="flex flex-1 flex-col gap-4 p-3 sm:p-4 overflow-y-auto">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3"
      >
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Perguntas</p>
          <p className="text-2xl font-bold">{questions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Ativas</p>
          <p className="text-2xl font-bold">{questions.filter(q => q.ativo).length}</p>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Inativas</p>
          <p className="text-2xl font-bold">{questions.filter(q => !q.ativo).length}</p>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Input
            placeholder="Buscar..."
            className="text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Questions List with DnD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        {filteredQuestions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={(event) => {
              handleDragStart()
              setActiveId(event.active.id as number)
            }}
          >
            <SortableContext
              items={filteredQuestions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {filteredQuestions.map((question, index) => (
                  <SortableItem
                    key={question.id}
                    question={question}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={toggleActive}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId && (
                <div className="bg-card border rounded-lg p-3 sm:p-4 shadow-2xl rotate-3 opacity-95">
                  <div className="flex flex-col gap-3 max-w-sm">
                    {(() => {
                      const draggedQuestion = questions.find(q => q.id === activeId)
                      if (!draggedQuestion) return null

                      return (
                        <>
                          {/* Header */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-black bg-primary rounded px-2 py-1">
                                #{filteredQuestions.findIndex(q => q.id === activeId) + 1}
                              </span>
                              <h3 className="font-semibold text-sm line-clamp-2">{draggedQuestion.titulo}</h3>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant={draggedQuestion.ativo ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {draggedQuestion.ativo ? "Ativa" : "Inativa"}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {draggedQuestion.tipo === "unica" ? "Única" : "Múltipla"}
                              </Badge>
                            </div>
                          </div>

                          {/* Respostas */}
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground">Respostas:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {draggedQuestion.respostas.slice(0, 4).map((resposta: Resposta) => (
                                <div key={resposta.id} className="text-xs bg-muted/50 rounded px-2 py-1.5 line-clamp-2">
                                  {resposta.texto}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </motion.div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingId ? "Editar Pergunta" : "Nova Pergunta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Titulo */}
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-sm">Pergunta *</Label>
              <Input
                id="titulo"
                placeholder="Digite a pergunta"
                className="text-sm"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm">Tipo de Resposta *</Label>
              <Select value={formData.tipo} onValueChange={(value) =>
                setFormData({
                  ...formData,
                  tipo: value as "unica" | "multipla",
                })
              }>
                <SelectTrigger id="tipo" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unica">Escolha Única</SelectItem>
                  <SelectItem value="multipla">Múltipla Escolha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Respostas */}
            <div className="space-y-2">
              <Label className="text-sm">Respostas *</Label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {formData.respostas.map((resposta) => (
                  <div key={resposta.id} className="flex gap-2">
                    <Input
                      placeholder="Digite a resposta"
                      className="text-sm"
                      value={resposta.texto}
                      onChange={(e) =>
                        handleUpdateResposta(resposta.id, e.target.value)
                      }
                    />
                    {formData.respostas.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveResposta(resposta.id)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <IconTrash size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddResposta}
                className="w-full text-sm"
              >
                <IconPlus size={16} className="mr-2" />
                Adicionar Resposta
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="w-full sm:w-auto text-sm"
            >
              {editingId ? "Salvar Alterações" : "Criar Pergunta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
