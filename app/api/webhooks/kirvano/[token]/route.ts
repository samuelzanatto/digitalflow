import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// Interface para o payload do webhook da Kirvano
interface KirvanoWebhookPayload {
  event: string
  event_description: string
  checkout_id?: string
  checkout_url?: string
  sale_id?: string
  payment_method?: string
  total_price?: string
  type?: string // ONE_TIME, RECURRING
  status?: string
  created_at?: string
  customer?: {
    name: string
    document: string
    email: string
    phone_number: string
  }
  payment?: {
    method: string
    brand?: string
    installments?: number
    finished_at?: string
    link?: string
    digitable_line?: string
    barcode?: string
    expires_at?: string
    qrcode?: string
    qrcode_image?: string
  }
  plan?: {
    name: string
    charge_frequency: string
    next_charge_date: string
  }
  products?: Array<{
    id: string
    name: string
    offer_id: string
    offer_name: string
    description: string
    price: string
    photo: string
    is_order_bump: boolean
  }>
  utm?: {
    src?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
}

// Função para converter preço formatado em centavos
function parsePriceToCents(priceString: string): number {
  if (!priceString) return 0
  // Remove "R$ " e converte "169,80" para 16980
  const cleanPrice = priceString
    .replace(/[^\d,.-]/g, "")
    .replace(".", "")
    .replace(",", ".")
  return Math.round(parseFloat(cleanPrice) * 100) || 0
}

// POST - Receber webhook da Kirvano
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Buscar integração pelo token
    const integration = await prisma.integration.findUnique({
      where: { webhookToken: token }
    })

    if (!integration) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    if (!integration.enabled) {
      return NextResponse.json({ error: "Integração desabilitada" }, { status: 403 })
    }

    const payload: KirvanoWebhookPayload = await request.json()

    // Registrar o evento
    await prisma.webhookEvent.create({
      data: {
        integrationId: integration.id,
        event: payload.event,
        payload: JSON.parse(JSON.stringify(payload)),
        status: "received"
      }
    })

    // Processar o evento e salvar/atualizar venda
    if (payload.sale_id && payload.customer) {
      const saleData = {
        integrationId: integration.id,
        externalId: payload.sale_id,
        checkoutId: payload.checkout_id,
        event: payload.event,
        status: payload.status || "PENDING",
        paymentMethod: payload.payment_method || payload.payment?.method || "UNKNOWN",
        totalPrice: payload.total_price || "R$ 0,00",
        totalPriceCents: parsePriceToCents(payload.total_price || "0"),
        type: payload.type || "ONE_TIME",
        customerName: payload.customer.name,
        customerEmail: payload.customer.email,
        customerPhone: payload.customer.phone_number,
        customerDocument: payload.customer.document,
        paymentBrand: payload.payment?.brand,
        installments: payload.payment?.installments,
        finishedAt: payload.payment?.finished_at ? new Date(payload.payment.finished_at) : null,
        planName: payload.plan?.name,
        chargeFrequency: payload.plan?.charge_frequency,
        nextChargeDate: payload.plan?.next_charge_date ? new Date(payload.plan.next_charge_date) : null,
        products: payload.products || [],
        utmSource: payload.utm?.utm_source || payload.utm?.src,
        utmMedium: payload.utm?.utm_medium,
        utmCampaign: payload.utm?.utm_campaign,
        utmTerm: payload.utm?.utm_term,
        utmContent: payload.utm?.utm_content
      }

      // Upsert - atualizar se já existir ou criar novo
      await prisma.sale.upsert({
        where: {
          integrationId_externalId: {
            integrationId: integration.id,
            externalId: payload.sale_id
          }
        },
        update: {
          event: saleData.event,
          status: saleData.status,
          paymentBrand: saleData.paymentBrand,
          installments: saleData.installments,
          finishedAt: saleData.finishedAt,
          planName: saleData.planName,
          chargeFrequency: saleData.chargeFrequency,
          nextChargeDate: saleData.nextChargeDate,
          updatedAt: new Date()
        },
        create: saleData
      })
    } else if (payload.event === "ABANDONED_CART" && payload.customer) {
      // Para carrinhos abandonados, não temos sale_id, usar checkout_id
      const abandonedCartId = payload.checkout_id || `cart_${Date.now()}`
      
      await prisma.sale.upsert({
        where: {
          integrationId_externalId: {
            integrationId: integration.id,
            externalId: abandonedCartId
          }
        },
        update: {
          event: payload.event,
          status: "ABANDONED_CART",
          updatedAt: new Date()
        },
        create: {
          integrationId: integration.id,
          externalId: abandonedCartId,
          checkoutId: payload.checkout_id,
          event: payload.event,
          status: "ABANDONED_CART",
          paymentMethod: "NONE",
          totalPrice: payload.total_price || "R$ 0,00",
          totalPriceCents: parsePriceToCents(payload.total_price || "0"),
          type: payload.type || "ONE_TIME",
          customerName: payload.customer.name,
          customerEmail: payload.customer.email,
          customerPhone: payload.customer.phone_number,
          customerDocument: payload.customer.document,
          products: payload.products || [],
          utmSource: payload.utm?.utm_source || payload.utm?.src,
          utmMedium: payload.utm?.utm_medium,
          utmCampaign: payload.utm?.utm_campaign,
          utmTerm: payload.utm?.utm_term,
          utmContent: payload.utm?.utm_content
        }
      })
    }

    // Atualizar status do evento para processado
    await prisma.webhookEvent.updateMany({
      where: {
        integrationId: integration.id,
        event: payload.event,
        status: "received"
      },
      data: { status: "processed" }
    })

    return NextResponse.json({ success: true, event: payload.event })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// GET - Verificação de saúde do endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  
  const integration = await prisma.integration.findUnique({
    where: { webhookToken: token }
  })

  if (!integration) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }

  return NextResponse.json({ 
    status: "ok", 
    provider: integration.provider,
    enabled: integration.enabled 
  })
}
