import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente Supabase com service role para operações públicas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug: verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Chat API] Variáveis de ambiente não configuradas:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    serviceKeyPrefix: supabaseServiceKey?.substring(0, 10)
  })
}

const getServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// GET - Buscar sessão ou mensagens
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  const type = searchParams.get("type") || "session"

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  try {
    const supabase = getServiceClient()
    
    if (type === "messages") {
      const { data: messages, error } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('sessionId', sessionId)
        .order('createdAt', { ascending: true })
      
      if (error) throw error
      return NextResponse.json({ messages })
    } else {
      const { data: session, error } = await supabase
        .from('ChatSession')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (error || !session) {
        return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
      }
      
      return NextResponse.json({ session })
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}

// POST - Criar sessão ou mensagem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body
    const supabase = getServiceClient()

    if (type === "session") {
      // Validar dados obrigatórios
      if (!data.name) {
        return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
      }

      // Contar sessões em espera para determinar posição na fila
      const { count } = await supabase
        .from('ChatSession')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')

      const queuePosition = (count || 0) + 1

      // Criar nova sessão usando Supabase (dispara Realtime)
      const { data: session, error: sessionError } = await supabase
        .from('ChatSession')
        .insert({
          visitorName: data.name,
          visitorEmail: data.email || null,
          visitorPhone: data.phone || null,
          quizAnswers: data.quizAnswers || {},
          status: "waiting",
          queuePosition
        })
        .select()
        .single()

      if (sessionError) {
        console.error("Erro ao criar sessão:", sessionError)
        return NextResponse.json({ error: "Erro ao criar sessão" }, { status: 500 })
      }

      // Enviar mensagem automática do sistema
      await supabase
        .from('ChatMessage')
        .insert({
          sessionId: session.id,
          sender: "system",
          content: `Olá ${data.name}! Você está na posição ${queuePosition} da fila. Em breve um atendente irá te ajudar.`
        })

      return NextResponse.json({ session, queuePosition })
    } else if (type === "message") {
      // Validar dados
      if (!data.sessionId || !data.content) {
        return NextResponse.json(
          { error: "sessionId e content são obrigatórios" },
          { status: 400 }
        )
      }

      // Verificar se a sessão existe e está ativa
      const { data: session, error: sessionError } = await supabase
        .from('ChatSession')
        .select('status')
        .eq('id', data.sessionId)
        .single()

      if (sessionError || !session) {
        return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
      }

      if (session.status !== "in_progress") {
        return NextResponse.json(
          { error: "Sessão não está em atendimento" },
          { status: 400 }
        )
      }

      // Criar mensagem usando Supabase (dispara Realtime)
      const { data: message, error: messageError } = await supabase
        .from('ChatMessage')
        .insert({
          sessionId: data.sessionId,
          sender: data.sender || "visitor",
          content: data.content
        })
        .select()
        .single()

      if (messageError) {
        console.error("Erro ao criar mensagem:", messageError)
        return NextResponse.json({ error: "Erro ao criar mensagem" }, { status: 500 })
      }

      return NextResponse.json({ message })
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao criar:", error)
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 })
  }
}

// PATCH - Atualizar sessão (rating, feedback, encerrar)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, ...updates } = body
    const supabase = getServiceClient()

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId é obrigatório" }, { status: 400 })
    }

    // Campos permitidos para atualização pelo visitante
    const allowedFields = ["rating", "feedbackText", "status"]
    const filteredUpdates: Record<string, unknown> = {}

    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }

    // Mapear feedback para feedbackText
    if ("feedback" in updates) {
      filteredUpdates.feedbackText = updates.feedback
    }

    // Se estiver encerrando, adicionar timestamp
    if (filteredUpdates.status === "completed" || filteredUpdates.status === "abandoned") {
      filteredUpdates.completedAt = new Date().toISOString()
    }

    // Se tiver rating, adicionar timestamp do feedback
    if (filteredUpdates.rating) {
      filteredUpdates.feedbackAt = new Date().toISOString()
    }

    const { data: session, error } = await supabase
      .from('ChatSession')
      .update(filteredUpdates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar sessão:", error)
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Erro ao atualizar:", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}
