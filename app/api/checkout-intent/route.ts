import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"

// POST - Registrar clique no botão de checkout
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      visitorId,
      email,
      name,
      phone,
      pageSlug,
      pageUrl,
      checkoutUrl,
      productName,
      productPrice,
    } = body

    if (!visitorId || !checkoutUrl) {
      return NextResponse.json(
        { error: "visitorId e checkoutUrl são obrigatórios" },
        { status: 400 }
      )
    }

    // Criar registro de intenção de checkout
    const intent = await withRetry(() =>
      prisma.checkoutIntent.create({
        data: {
          visitorId,
          email,
          name,
          phone,
          pageSlug,
          pageUrl,
          checkoutUrl,
          productName,
          productPrice,
          status: "pending",
        },
      })
    )

    // Agendar verificação de abandono (será processada pelo worker)
    // O worker vai verificar se houve conversão após X minutos

    return NextResponse.json({ 
      success: true, 
      intentId: intent.id,
      message: "Checkout intent registrado" 
    })
  } catch (error) {
    console.error("Erro ao registrar checkout intent:", error)
    return NextResponse.json(
      { error: "Erro ao processar" },
      { status: 500 }
    )
  }
}

// GET - Verificar status de uma intenção de checkout
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get("visitorId")
    const intentId = searchParams.get("intentId")

    if (!visitorId && !intentId) {
      return NextResponse.json(
        { error: "visitorId ou intentId é obrigatório" },
        { status: 400 }
      )
    }

    const intent = await withRetry(() =>
      prisma.checkoutIntent.findFirst({
        where: {
          ...(intentId && { id: intentId }),
          ...(visitorId && !intentId && { visitorId }),
        },
        orderBy: { clickedAt: "desc" },
      })
    )

    return NextResponse.json({ intent })
  } catch (error) {
    console.error("Erro ao buscar checkout intent:", error)
    return NextResponse.json(
      { error: "Erro ao buscar" },
      { status: 500 }
    )
  }
}
