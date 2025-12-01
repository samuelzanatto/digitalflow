import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db/prisma"

// GET - Listar integrações globais
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar integrações globais (isGlobal = true)
    const integrations = await prisma.integration.findMany({
      where: { isGlobal: true },
      include: {
        _count: {
          select: { events: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error("Erro ao buscar integrações:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// POST - Criar nova integração
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, provider } = body

    if (!name || !provider) {
      return NextResponse.json({ error: "Nome e provider são obrigatórios" }, { status: 400 })
    }

    // Verificar se já existe integração global com esse provider
    const existing = await prisma.integration.findFirst({
      where: {
        provider,
        isGlobal: true
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Integração já existe" }, { status: 409 })
    }

    // Criar integração global (sem userId)
    const integration = await prisma.integration.create({
      data: {
        name,
        provider,
        isGlobal: true,
        enabled: true
      }
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar integração:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
