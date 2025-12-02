import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma, withRetry } from "@/lib/db/prisma"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Grupos são globais - todos os usuários veem todos os grupos
    const groups = await withRetry(() =>
      prisma.leadGroup.findMany({
        include: {
          _count: {
            select: { leads: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    )

    return NextResponse.json({ groups })
  } catch (error) {
    console.error("Erro ao buscar grupos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar grupos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    const group = await withRetry(() =>
      prisma.leadGroup.create({
        data: {
          userId: user.id, // Registra quem criou para histórico
          name,
          description,
          color: color || "#6366f1"
        }
      })
    )

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Erro ao criar grupo:", error)
    return NextResponse.json(
      { error: "Erro ao criar grupo" },
      { status: 500 }
    )
  }
}
