import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma, withRetry } from "@/lib/db/prisma"

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const leads = await withRetry(() =>
      prisma.lead.findMany({
        where: {
          userId: user.id,
          ...(groupId && { groupId }),
          ...(status && { status }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    )

    // Estatísticas
    const stats = await withRetry(async () => {
      const [total, newLeads, qualified] = await Promise.all([
        prisma.lead.count({ where: { userId: user.id } }),
        prisma.lead.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.lead.count({
          where: { userId: user.id, status: 'qualified' }
        })
      ])

      const avgScore = await prisma.lead.aggregate({
        where: { userId: user.id },
        _avg: { score: true }
      })

      return {
        total,
        newLeads,
        qualified,
        avgScore: avgScore._avg.score || 0,
        conversionRate: total > 0 ? ((qualified / total) * 100).toFixed(1) : 0
      }
    })

    return NextResponse.json({ leads, stats })
  } catch (error) {
    console.error("Erro ao buscar leads:", error)
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
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
    const { groupId, name, email, phone, source, customFields } = body

    if (!groupId || !name || !email) {
      return NextResponse.json(
        { error: "Grupo, nome e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o grupo pertence ao usuário
    const group = await withRetry(() =>
      prisma.leadGroup.findFirst({
        where: { id: groupId, userId: user.id }
      })
    )

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      )
    }

    const lead = await withRetry(() =>
      prisma.lead.create({
        data: {
          userId: user.id,
          groupId,
          name,
          email,
          phone,
          source: source || "manual",
          customFields: customFields || {}
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      })
    )

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("Erro ao criar lead:", error)
    return NextResponse.json(
      { error: "Erro ao criar lead" },
      { status: 500 }
    )
  }
}
