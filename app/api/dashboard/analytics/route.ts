import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// Cliente Supabase com service role para operações de banco
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const getServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// GET - Buscar estatísticas e feedbacks
export async function GET() {
  try {
    // Verificar autenticação
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    const supabase = getServiceClient()
    
    // Buscar todas as sessões completadas com avaliação
    const { data: sessions, error } = await supabase
      .from('ChatSession')
      .select('*')
      .eq('status', 'completed')
      .not('rating', 'is', null)
      .order('feedbackAt', { ascending: false })
    
    if (error) {
      console.error("Erro ao buscar sessões:", error)
      return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
    }
    
    // Buscar todas as sessões para estatísticas gerais
    const { data: allSessions } = await supabase
      .from('ChatSession')
      .select('id, status, createdAt, attendedAt, completedAt')
    
    // Calcular estatísticas
    const feedbacks = sessions || []
    const totalRatings = feedbacks.length
    
    let avgRating = 0
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let positiveCount = 0
    let negativeCount = 0
    
    if (totalRatings > 0) {
      feedbacks.forEach((f: { rating: number }) => {
        avgRating += f.rating
        distribution[f.rating] = (distribution[f.rating] || 0) + 1
        if (f.rating >= 4) positiveCount++
        if (f.rating <= 2) negativeCount++
      })
      avgRating = Math.round((avgRating / totalRatings) * 10) / 10
    }
    
    // Estatísticas gerais de atendimento
    const totalSessions = allSessions?.length || 0
    const completedSessions = allSessions?.filter(s => s.status === 'completed').length || 0
    const inProgressSessions = allSessions?.filter(s => s.status === 'in_progress').length || 0
    const waitingSessions = allSessions?.filter(s => s.status === 'waiting').length || 0
    
    // Calcular tempo médio de espera e atendimento
    let avgWaitTime = 0
    let avgServiceTime = 0
    let waitTimeCount = 0
    let serviceTimeCount = 0
    
    allSessions?.forEach(s => {
      if (s.createdAt && s.attendedAt) {
        const waitTime = new Date(s.attendedAt).getTime() - new Date(s.createdAt).getTime()
        avgWaitTime += waitTime
        waitTimeCount++
      }
      if (s.attendedAt && s.completedAt) {
        const serviceTime = new Date(s.completedAt).getTime() - new Date(s.attendedAt).getTime()
        avgServiceTime += serviceTime
        serviceTimeCount++
      }
    })
    
    if (waitTimeCount > 0) avgWaitTime = Math.round(avgWaitTime / waitTimeCount / 60000) // em minutos
    if (serviceTimeCount > 0) avgServiceTime = Math.round(avgServiceTime / serviceTimeCount / 60000) // em minutos
    
    return NextResponse.json({
      feedbacks: feedbacks.map((f: {
        id: string
        visitorName: string
        rating: number
        feedbackText: string | null
        feedbackAt: string
        attendantId: string | null
      }) => ({
        id: f.id,
        visitorName: f.visitorName,
        rating: f.rating,
        feedbackText: f.feedbackText,
        feedbackAt: f.feedbackAt,
        attendantId: f.attendantId
      })),
      stats: {
        totalRatings,
        avgRating,
        distribution,
        positivePercent: totalRatings > 0 ? Math.round((positiveCount / totalRatings) * 100) : 0,
        negativePercent: totalRatings > 0 ? Math.round((negativeCount / totalRatings) * 100) : 0,
        totalSessions,
        completedSessions,
        inProgressSessions,
        waitingSessions,
        avgWaitTime, // em minutos
        avgServiceTime // em minutos
      }
    })
  } catch (error) {
    console.error("Erro ao buscar analytics:", error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
