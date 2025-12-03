import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"

// POST - Registrar/atualizar sessão de visitante
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      visitorId,
      email,
      name,
      pageId,
      pageSlug,
      pageUrl,
      timeOnPage,
      scrollDepth,
      exitIntent,
      convertedTo,
      referrer,
      userAgent,
      deviceType,
      action, // 'enter', 'update', 'exit'
    } = body

    if (!visitorId || !pageUrl) {
      return NextResponse.json(
        { error: "visitorId e pageUrl são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar sessão existente do visitante nesta página (nas últimas 24h)
    const existingSession = await withRetry(() =>
      prisma.visitorSession.findFirst({
        where: {
          visitorId,
          pageUrl,
          exitedAt: null, // Sessão ainda ativa
          enteredAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
          },
        },
        orderBy: { enteredAt: "desc" },
      })
    )

    let session

    if (action === "enter" || !existingSession) {
      // Criar nova sessão
      session = await withRetry(() =>
        prisma.visitorSession.create({
          data: {
            visitorId,
            email,
            name,
            pageId,
            pageSlug,
            pageUrl,
            referrer,
            userAgent,
            deviceType,
          },
        })
      )
    } else if (action === "exit" || action === "update") {
      // Atualizar sessão existente
      session = await withRetry(() =>
        prisma.visitorSession.update({
          where: { id: existingSession.id },
          data: {
            ...(email && { email }),
            ...(name && { name }),
            ...(timeOnPage !== undefined && { timeOnPage }),
            ...(scrollDepth !== undefined && { scrollDepth }),
            ...(exitIntent !== undefined && { exitIntent }),
            ...(convertedTo && { convertedTo }),
            ...(action === "exit" && { exitedAt: new Date() }),
          },
        })
      )

      // Se for exit com exitIntent e tiver email, verificar automações
      if (action === "exit" && exitIntent && existingSession.email) {
        await checkAndTriggerBehaviorAutomations({
          visitorId,
          email: existingSession.email,
          name: existingSession.name,
          pageSlug: existingSession.pageSlug,
          pageUrl: existingSession.pageUrl || pageUrl,
          timeOnPage: timeOnPage || existingSession.timeOnPage,
          exitIntent: true,
          convertedTo,
        })
      }
    }

    return NextResponse.json({ success: true, sessionId: session?.id })
  } catch (error) {
    console.error("Erro no tracking:", error)
    return NextResponse.json(
      { error: "Erro ao processar tracking" },
      { status: 500 }
    )
  }
}

// Função para verificar e disparar automações comportamentais
async function checkAndTriggerBehaviorAutomations(data: {
  visitorId: string
  email: string
  name?: string | null
  pageSlug?: string | null
  pageUrl: string
  timeOnPage: number
  exitIntent: boolean
  convertedTo?: string | null
}) {
  try {
    // Buscar automações comportamentais ativas
    const automations = await prisma.automation.findMany({
      where: {
        enabled: true,
        triggerType: {
          in: ["page_exit", "time_on_page", "exit_without_conversion"],
        },
      },
    })

    for (const automation of automations) {
      const config = automation.triggerConfig as {
        pageSlug?: string
        minTimeOnPage?: number
        exitPages?: string[]
        requiredConversion?: string
      }

      let shouldTrigger = false

      // Verificar condições do gatilho
      switch (automation.triggerType) {
        case "page_exit":
          // Saiu da página específica
          if (config.pageSlug && data.pageSlug === config.pageSlug) {
            shouldTrigger = true
          }
          break

        case "time_on_page":
          // Ficou X segundos na página e saiu
          if (
            config.minTimeOnPage &&
            data.timeOnPage >= config.minTimeOnPage &&
            (!config.pageSlug || data.pageSlug === config.pageSlug)
          ) {
            shouldTrigger = true
          }
          break

        case "exit_without_conversion":
          // Saiu sem converter (ex: sem ir pro checkout)
          if (
            config.requiredConversion &&
            data.convertedTo !== config.requiredConversion &&
            (!config.pageSlug || data.pageSlug === config.pageSlug)
          ) {
            // Verificar tempo mínimo se configurado
            if (!config.minTimeOnPage || data.timeOnPage >= config.minTimeOnPage) {
              shouldTrigger = true
            }
          }
          break
      }

      if (shouldTrigger) {
        // Verificar se já não existe um job pendente para este email/automação
        const existingJob = await prisma.automationJob.findFirst({
          where: {
            automationId: automation.id,
            recipientEmail: data.email,
            status: "pending",
          },
        })

        if (!existingJob) {
          // Criar job agendado
          const scheduledFor = new Date(
            Date.now() + automation.delaySeconds * 1000
          )

          await prisma.automationJob.create({
            data: {
              automationId: automation.id,
              recipientEmail: data.email,
              recipientName: data.name,
              recipientData: {
                pageSlug: data.pageSlug,
                pageUrl: data.pageUrl,
                timeOnPage: data.timeOnPage,
                visitorId: data.visitorId,
              },
              scheduledFor,
            },
          })

          console.log(
            `[Automation] Job agendado: ${automation.name} para ${data.email} em ${scheduledFor}`
          )
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar automações:", error)
  }
}
