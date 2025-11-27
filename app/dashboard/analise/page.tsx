"use client"

import { useEffect, useState } from "react"
import { usePageHeader } from "@/hooks/usePageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { 
  IconStar, 
  IconStarFilled, 
  IconMessageCircle, 
  IconThumbUp, 
  IconUsers,
  IconMoodSmile,
  IconMoodSad,
  IconClock,
  IconHeadset,
  IconRefresh,
} from "@tabler/icons-react"

interface Feedback {
  id: string
  visitorName: string
  rating: number
  feedbackText: string | null
  feedbackAt: string
  attendantId: string | null
}

interface Stats {
  totalRatings: number
  avgRating: number
  distribution: Record<number, number>
  positivePercent: number
  negativePercent: number
  totalSessions: number
  completedSessions: number
  inProgressSessions: number
  waitingSessions: number
  avgWaitTime: number
  avgServiceTime: number
}

export default function AnalisePage() {
  const { setPageHeader } = usePageHeader()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<Stats>({
    totalRatings: 0,
    avgRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    positivePercent: 0,
    negativePercent: 0,
    totalSessions: 0,
    completedSessions: 0,
    inProgressSessions: 0,
    waitingSessions: 0,
    avgWaitTime: 0,
    avgServiceTime: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/analytics')
      const data = await response.json()
      
      if (data.feedbacks) {
        setFeedbacks(data.feedbacks)
      }
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Definir header com botão de atualizar
  useEffect(() => {
    setPageHeader(
      "Análise & Feedback", 
      "Avaliações dos atendimentos de chat",
      <Button variant="outline" size="sm" onClick={loadData}>
        <IconRefresh size={16} className="mr-2" />
        Atualizar
      </Button>
    )
  }, [setPageHeader])

  const filteredFeedback = feedbacks.filter(f => {
    if (selectedFilter === 'positive') return f.rating >= 4
    if (selectedFilter === 'negative') return f.rating <= 2
    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Agora há pouco'
    if (hours < 24) return `${hours}h atrás`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Ontem'
    return `${days} dias atrás`
  }

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          star <= rating 
            ? <IconStarFilled key={star} size={size} className="text-yellow-500" />
            : <IconStar key={star} size={size} className="text-muted-foreground/30" />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando análises...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="grid gap-4 md:grid-cols-4"
      >
        {/* Média Geral */}
        <Card className="p-6 bg-linear-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Avaliação Média</p>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <IconStarFilled size={20} className="text-yellow-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold">{stats.avgRating || '-'}</p>
            <p className="text-muted-foreground">/5</p>
          </div>
          {stats.avgRating > 0 && renderStars(Math.round(stats.avgRating), 20)}
        </Card>

        {/* Total de Avaliações */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Total de Avaliações</p>
            <div className="p-2 bg-primary/20 rounded-lg">
              <IconUsers size={20} className="text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold">{stats.totalRatings}</p>
          <p className="text-sm text-muted-foreground mt-1">
            de {stats.completedSessions} atendimentos
          </p>
        </Card>

        {/* Satisfação Positiva */}
        <Card className="p-6 bg-linear-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Satisfeitos</p>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <IconMoodSmile size={20} className="text-green-500" />
            </div>
          </div>
          <p className="text-4xl font-bold text-green-500">{stats.positivePercent}%</p>
          <p className="text-sm text-muted-foreground mt-1">4-5 estrelas</p>
        </Card>

        {/* Insatisfação */}
        <Card className="p-6 bg-linear-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Insatisfeitos</p>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <IconMoodSad size={20} className="text-red-500" />
            </div>
          </div>
          <p className="text-4xl font-bold text-red-500">{stats.negativePercent}%</p>
          <p className="text-sm text-muted-foreground mt-1">1-2 estrelas</p>
        </Card>
      </motion.div>

      {/* Tempo médio de atendimento */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Tempo Médio de Espera</p>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <IconClock size={20} className="text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            {stats.avgWaitTime > 0 ? `${stats.avgWaitTime} min` : '-'}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Tempo Médio de Atendimento</p>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <IconHeadset size={20} className="text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            {stats.avgServiceTime > 0 ? `${stats.avgServiceTime} min` : '-'}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Total de Atendimentos</p>
            <div className="p-2 bg-primary/20 rounded-lg">
              <IconMessageCircle size={20} className="text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.totalSessions}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              {stats.completedSessions} finalizados
            </Badge>
            {stats.inProgressSessions > 0 && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                {stats.inProgressSessions} em andamento
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Rating Distribution */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Distribuição das Avaliações</h3>
          {stats.totalRatings > 0 ? (
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.distribution[rating] || 0
                const percent = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-medium">{rating}</span>
                      <IconStarFilled size={14} className="text-yellow-500" />
                    </div>
                    <Progress value={percent} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma avaliação recebida ainda
            </p>
          )}
        </Card>
      </motion.div>

      {/* Feedback List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Avaliações Recentes</h3>
          <div className="flex gap-2">
            <Button 
              variant={selectedFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              Todas
            </Button>
            <Button 
              variant={selectedFilter === 'positive' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedFilter('positive')}
              className={selectedFilter === 'positive' ? '' : 'text-green-500 border-green-500/30 hover:bg-green-500/10'}
            >
              <IconMoodSmile size={16} className="mr-1" />
              Positivas
            </Button>
            <Button 
              variant={selectedFilter === 'negative' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedFilter('negative')}
              className={selectedFilter === 'negative' ? '' : 'text-red-500 border-red-500/30 hover:bg-red-500/10'}
            >
              <IconMoodSad size={16} className="mr-1" />
              Negativas
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFeedback.length === 0 ? (
            <Card className="p-8 text-center">
              <IconMessageCircle size={48} className="mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {feedbacks.length === 0 
                  ? 'Nenhuma avaliação recebida ainda. Finalize um atendimento e peça feedback!'
                  : 'Nenhuma avaliação encontrada com esse filtro.'}
              </p>
            </Card>
          ) : (
            filteredFeedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {item.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.visitorName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {item.feedbackAt && formatDate(item.feedbackAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-[52px]">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(item.rating)}
                          <Badge 
                            variant="outline" 
                            className={
                              item.rating >= 4 
                                ? 'text-green-500 border-green-500/30' 
                                : item.rating <= 2 
                                  ? 'text-red-500 border-red-500/30'
                                  : 'text-yellow-500 border-yellow-500/30'
                            }
                          >
                            {item.rating >= 4 ? 'Satisfeito' : item.rating <= 2 ? 'Insatisfeito' : 'Neutro'}
                          </Badge>
                        </div>
                        
                        {item.feedbackText && (
                          <p className="text-sm text-muted-foreground italic">
                            &quot;{item.feedbackText}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <IconThumbUp size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <IconMessageCircle size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}

