import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db/prisma"

// GET - Listar integrações do usuário
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const integrations = await prisma.integration.findMany({
      where: { userId: user.id },
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

    // Verificar se já existe integração com esse provider
    const existing = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Integração já existe" }, { status: 409 })
    }

    const integration = await prisma.integration.create({
      data: {
        userId: user.id,
        name,
        provider,
        enabled: true
      }
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar integração:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
