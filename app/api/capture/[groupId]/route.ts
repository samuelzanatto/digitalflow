import { NextResponse } from "next/server"
import { prisma, withRetry } from "@/lib/db/prisma"
import { sendAutomationEmail, processTemplateVariables, hasGmailTransport } from "@/lib/email/gmail"

// Função para disparar automação de email (usa delay da própria automação)
async function triggerAutomation(
  automationId: string,
  leadData: { name: string; email: string }
) {
  try {
    const automation = await prisma.automation.findUnique({
      where: { id: automationId }
    })

    if (!automation || !automation.enabled) {
      console.log(`Automação ${automationId} não encontrada ou desabilitada`)
      return
    }

    // Usar o delay configurado na automação
    const delayMs = (automation.delaySeconds || 0) * 1000

    if (delayMs > 0) {
      console.log(`Automação "${automation.name}" agendada para ${delayMs / 1000}s`)
    }

    // Executar após o delay
    setTimeout(async () => {
      try {
        if (!hasGmailTransport) {
          console.error('SMTP não configurado - automação não enviada')
          return
        }

        // Processar variáveis no assunto e mensagem
        const subject = processTemplateVariables(automation.subject, {
          nome: leadData.name,
          email: leadData.email,
        })

        const message = processTemplateVariables(automation.message, {
          nome: leadData.name,
          email: leadData.email,
        })

        // Enviar email
        await sendAutomationEmail({
          to: leadData.email,
          subject,
          htmlContent: message,
        })

        console.log(`Automação "${automation.name}" enviada para ${leadData.email}`)
      } catch (error) {
        console.error(`Erro ao disparar automação ${automationId}:`, error)
      }
    }, delayMs)
  } catch (error) {
    console.error(`Erro ao buscar automação ${automationId}:`, error)
  }
}

// API pública para receber leads do formulário de captura
export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { name, email, phone, source, customFields, automationId } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar o grupo para obter o userId
    const group = await withRetry(() =>
      prisma.leadGroup.findUnique({
        where: { id: groupId }
      })
    )

    if (!group) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já existe um lead com esse email no grupo
    const existingLead = await withRetry(() =>
      prisma.lead.findFirst({
        where: {
          groupId,
          email: email.toLowerCase()
        }
      })
    )

    let lead

    if (existingLead) {
      // Atualizar lead existente
      lead = await withRetry(() =>
        prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            name,
            ...(phone && { phone }),
            ...(customFields && { 
              customFields: {
                ...(existingLead.customFields as object || {}),
                ...customFields
              }
            }),
            updatedAt: new Date()
          }
        })
      )
    } else {
      // Criar novo lead
      lead = await withRetry(() =>
        prisma.lead.create({
          data: {
            userId: group.userId,
            groupId,
            name,
            email: email.toLowerCase(),
            phone,
            source: source || "form",
            customFields: customFields || {}
          }
        })
      )
    }

    // Disparar automação se configurada
    if (automationId) {
      triggerAutomation(automationId, { name, email })
    }

    return NextResponse.json({ 
      success: true, 
      lead: { id: lead.id },
      updated: !!existingLead,
      created: !existingLead
    })
  } catch (error) {
    console.error("Erro ao capturar lead:", error)
    return NextResponse.json(
      { error: "Erro ao processar cadastro" },
      { status: 500 }
    )
  }
}
