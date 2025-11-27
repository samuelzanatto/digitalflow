import { NextRequest, NextResponse } from "next/server"
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

// GET - Listar sessões e mensagens
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  
  try {
    // Verificar autenticação usando o cliente com cookies
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    // Usar service client para operações de banco
    const supabase = getServiceClient()
    
    if (sessionId) {
      // Buscar sessão específica com mensagens
      const { data: session, error: sessionError } = await supabase
        .from('ChatSession')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (sessionError || !session) {
        return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
      }
      
      const { data: messages } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('sessionId', sessionId)
        .order('createdAt', { ascending: true })
      
      return NextResponse.json({ session: { ...session, messages: messages || [] } })
    }
    
    // Listar todas as sessões com mensagens
    const { data: sessions, error: sessionsError } = await supabase
      .from('ChatSession')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (sessionsError) {
      console.error("Erro ao buscar sessões:", sessionsError)
      return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
    }
    
    // Buscar mensagens para cada sessão
    const sessionsWithMessages = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: messages } = await supabase
          .from('ChatMessage')
          .select('*')
          .eq('sessionId', session.id)
          .order('createdAt', { ascending: true })
        
        return { ...session, messages: messages || [] }
      })
    )
    
    return NextResponse.json({ sessions: sessionsWithMessages })
  } catch (error) {
    console.error("Erro ao buscar dados:", error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}

// POST - Enviar mensagem como atendente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    const body = await request.json()
    const { sessionId, content } = body
    
    if (!sessionId || !content) {
      return NextResponse.json(
        { error: "sessionId e content são obrigatórios" },
        { status: 400 }
      )
    }
    
    const supabase = getServiceClient()
    
    // Verificar se a sessão existe e está ativa
    const { data: session, error: sessionError } = await supabase
      .from('ChatSession')
      .select('status')
      .eq('id', sessionId)
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
    
    // Criar mensagem como atendente usando Supabase (dispara Realtime)
    const { data: message, error: messageError } = await supabase
      .from('ChatMessage')
      .insert({
        sessionId,
        sender: "attendant",
        senderId: user.id,
        content
      })
      .select()
      .single()
    
    if (messageError) {
      console.error("Erro ao criar mensagem:", messageError)
      return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
    }
    
    return NextResponse.json({ message })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}

// PATCH - Aceitar/Finalizar sessão
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    const body = await request.json()
    const { sessionId, action, attendantName } = body
    
    if (!sessionId || !action) {
      return NextResponse.json(
        { error: "sessionId e action são obrigatórios" },
        { status: 400 }
      )
    }
    
    const supabase = getServiceClient()
    
    if (action === "accept") {
      // Aceitar sessão da fila
      const { data: session, error: updateError } = await supabase
        .from('ChatSession')
        .update({
          status: "in_progress",
          attendantId: user.id,
          attendedAt: new Date().toISOString(),
          queuePosition: 0
        })
        .eq('id', sessionId)
        .select()
        .single()
      
      if (updateError) {
        console.error("Erro ao aceitar sessão:", updateError)
        return NextResponse.json({ error: "Erro ao aceitar sessão" }, { status: 500 })
      }
      
      // Buscar nome do visitante
      const visitorName = session?.visitorName || "visitante"
      
      // Enviar mensagem de boas-vindas
      await supabase
        .from('ChatMessage')
        .insert({
          sessionId,
          sender: "attendant",
          senderId: user.id,
          content: `Olá ${visitorName}! Sou ${attendantName || "o atendente"} e vou te ajudar. Como posso auxiliar?`
        })
      
      // Atualizar posições da fila
      const { data: waitingSessions } = await supabase
        .from('ChatSession')
        .select('id')
        .eq('status', 'waiting')
        .order('queuePosition', { ascending: true })
      
      if (waitingSessions) {
        for (let i = 0; i < waitingSessions.length; i++) {
          await supabase
            .from('ChatSession')
            .update({ queuePosition: i + 1 })
            .eq('id', waitingSessions[i].id)
        }
      }
      
      return NextResponse.json({ session })
    } else if (action === "close") {
      // Finalizar sessão
      const { data: session, error: updateError } = await supabase
        .from('ChatSession')
        .update({
          status: "completed",
          completedAt: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()
      
      if (updateError) {
        console.error("Erro ao finalizar sessão:", updateError)
        return NextResponse.json({ error: "Erro ao finalizar sessão" }, { status: 500 })
      }
      
      return NextResponse.json({ session })
    }
    
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error)
    return NextResponse.json({ error: "Erro ao atualizar sessão" }, { status: 500 })
  }
}
