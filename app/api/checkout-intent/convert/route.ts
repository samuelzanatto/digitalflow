import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"

// POST - Marcar uma intenção de checkout como convertida
// Chamado quando o webhook da Kirvano recebe uma venda aprovada
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, visitorId, checkoutId } = body

    if (!email && !visitorId && !checkoutId) {
      return NextResponse.json(
        { error: "email, visitorId ou checkoutId é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar intenções pendentes deste usuário
    const updatedIntents = await withRetry(() =>
      prisma.checkoutIntent.updateMany({
        where: {
          status: "pending",
          OR: [
            ...(email ? [{ email }] : []),
            ...(visitorId ? [{ visitorId }] : []),
          ],
        },
        data: {
          status: "converted",
          convertedAt: new Date(),
        },
      })
    )

    // Cancelar jobs de automação pendentes para este email
    if (email) {
      await withRetry(() =>
        prisma.automationJob.updateMany({
          where: {
            recipientEmail: email,
            status: "pending",
            automation: {
              triggerType: "checkout_abandoned",
            },
          },
          data: {
            status: "cancelled",
          },
        })
      )
    }

    return NextResponse.json({
      success: true,
      converted: updatedIntents.count,
      message: `${updatedIntents.count} checkout intent(s) marcado(s) como convertido`,
    })
  } catch (error) {
    console.error("Erro ao marcar conversão:", error)
    return NextResponse.json(
      { error: "Erro ao processar" },
      { status: 500 }
    )
  }
}
