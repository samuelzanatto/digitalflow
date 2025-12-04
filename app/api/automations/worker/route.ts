import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"
import { sendAutomationEmail, processTemplateVariables, hasGmailTransport } from "@/lib/email/gmail"

// Esta API é chamada por um cron job para processar automações agendadas
// Pode ser acionado por:
// - Upstash QStash (recomendado para plano gratuito) - veja UPSTASH_SETUP.md
// - Vercel Cron Jobs (requer plano Pro)
// - Serviço externo como cron-job.org

// Processar checkouts abandonados e criar jobs de automação
async function processAbandonedCheckouts() {
  try {
    // Buscar automações de carrinho abandonado ativas
    const abandonedCartAutomations = await prisma.automation.findMany({
      where: {
        enabled: true,
        triggerType: "checkout_abandoned",
      },
    })

    if (abandonedCartAutomations.length === 0) {
      return { created: 0 }
    }

    let jobsCreated = 0

    for (const automation of abandonedCartAutomations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const triggerConfig = automation.triggerConfig as any
      const abandonmentDelayMinutes = triggerConfig?.abandonmentDelay || 30 // 30 min padrão
      const targetPage = triggerConfig?.targetPage || null

      // Calcular threshold - checkout intents criados há mais de X minutos que ainda estão pendentes
      const abandonmentThreshold = new Date(Date.now() - abandonmentDelayMinutes * 60 * 1000)

      // Buscar checkout intents abandonados (pendentes há mais de X minutos)
      const abandonedCheckouts = await prisma.checkoutIntent.findMany({
        where: {
          status: "pending",
          createdAt: {
            lte: abandonmentThreshold,
          },
          // Se a automação tem página alvo específica, filtrar
          ...(targetPage && { pageSlug: targetPage }),
        },
        take: 100,
      })

      for (const checkout of abandonedCheckouts) {
        if (!checkout.email) continue

        // Verificar se já existe job pendente para este email + automação
        const existingJob = await prisma.automationJob.findFirst({
          where: {
            automationId: automation.id,
            recipientEmail: checkout.email,
            status: {
              in: ["pending", "processing"],
            },
          },
        })

        if (existingJob) continue

        // Criar job de automação
        const delaySeconds = automation.delaySeconds || 0
        const scheduledFor = new Date(Date.now() + delaySeconds * 1000)

        await prisma.automationJob.create({
          data: {
            automationId: automation.id,
            recipientEmail: checkout.email,
            recipientName: checkout.name || undefined,
            recipientData: {
              productName: checkout.productName,
              productPrice: checkout.productPrice,
              checkoutUrl: checkout.checkoutUrl,
              pageSlug: checkout.pageSlug,
              pageUrl: checkout.pageUrl,
            },
            scheduledFor,
            status: "pending",
          },
        })

        // Marcar checkout como processado
        await prisma.checkoutIntent.update({
          where: { id: checkout.id },
          data: { status: "automation_sent" },
        })

        jobsCreated++
        console.log(
          `[AutomationWorker] Job de carrinho abandonado criado: ${automation.name} -> ${checkout.email}`
        )
      }
    }

    return { created: jobsCreated }
  } catch (error) {
    console.error("[AutomationWorker] Erro ao processar checkouts abandonados:", error)
    return { created: 0, error }
  }
}

export async function GET(request: Request) {
  try {
    // Verificar token de autorização (para segurança do cron)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Primeiro, processar checkouts abandonados para criar novos jobs
    const abandonedResult = await processAbandonedCheckouts()

    // Buscar jobs pendentes que devem ser processados
    const pendingJobs = await withRetry(() =>
      prisma.automationJob.findMany({
        where: {
          status: "pending",
          scheduledFor: {
            lte: new Date(), // Já passou do horário agendado
          },
          attempts: {
            lt: 3, // Máximo 3 tentativas
          },
        },
        include: {
          automation: true,
        },
        take: 50, // Processar em lotes
        orderBy: { scheduledFor: "asc" },
      })
    )

    if (pendingJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum job pendente",
        processed: 0,
        abandonedCheckoutsProcessed: abandonedResult.created,
      })
    }

    let processed = 0
    let failed = 0

    for (const job of pendingJobs) {
      try {
        // Marcar como processando
        await prisma.automationJob.update({
          where: { id: job.id },
          data: {
            status: "processing",
            attempts: { increment: 1 },
          },
        })

        // Verificar se a automação ainda está ativa
        if (!job.automation.enabled) {
          await prisma.automationJob.update({
            where: { id: job.id },
            data: {
              status: "cancelled",
              errorMessage: "Automação desabilitada",
              processedAt: new Date(),
            },
          })
          continue
        }

        // Verificar se SMTP está configurado
        if (!hasGmailTransport) {
          await prisma.automationJob.update({
            where: { id: job.id },
            data: {
              status: "failed",
              errorMessage: "SMTP não configurado",
              processedAt: new Date(),
            },
          })
          failed++
          continue
        }

        // Preparar variáveis para o template
        const recipientData = job.recipientData as Record<string, unknown>
        const variables = {
          nome: job.recipientName || "",
          email: job.recipientEmail,
          ...recipientData,
        }

        // Processar subject e message com variáveis
        const subject = processTemplateVariables(
          job.automation.subject,
          variables as Record<string, string | undefined>
        )
        const htmlContent = processTemplateVariables(
          job.automation.message,
          variables as Record<string, string | undefined>
        )

        // Enviar email
        await sendAutomationEmail({
          to: job.recipientEmail,
          subject,
          htmlContent,
        })

        // Marcar como concluído
        await prisma.automationJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            processedAt: new Date(),
          },
        })

        processed++
        console.log(
          `[AutomationWorker] Email enviado: ${job.automation.name} -> ${job.recipientEmail}`
        )
      } catch (error) {
        console.error(`[AutomationWorker] Erro no job ${job.id}:`, error)

        // Marcar como falhou ou pendente para retry
        const newStatus = job.attempts >= 2 ? "failed" : "pending"

        await prisma.automationJob.update({
          where: { id: job.id },
          data: {
            status: newStatus,
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
            ...(newStatus === "failed" && { processedAt: new Date() }),
          },
        })

        if (newStatus === "failed") {
          failed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído`,
      total: pendingJobs.length,
      processed,
      failed,
    })
  } catch (error) {
    console.error("[AutomationWorker] Erro geral:", error)
    return NextResponse.json(
      { error: "Erro ao processar automações" },
      { status: 500 }
    )
  }
}

// POST - Manualmente disparar processamento (para testes)
export async function POST(request: Request) {
  // Redirecionar para GET
  return GET(request)
}
