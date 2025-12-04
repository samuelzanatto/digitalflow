/**
 * API para inicializar o agendamento de cron jobs no Upstash QStash
 * 
 * Esta rota deve ser chamada UMA VEZ durante o setup ou quando necessário
 * para agendar os cron jobs no Upstash QStash.
 * 
 * GET /api/automations/schedule - Inicializa o agendamento
 */

import { NextResponse } from 'next/server'
import { scheduleCronJob } from '@/lib/upstash-client'

export async function GET(request: Request) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization')
    const scheduleSecret = process.env.SCHEDULE_SECRET || 'dev-secret'

    if (authHeader !== `Bearer ${scheduleSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // URL da API de worker
    // Prioridade: NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
    let appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    if (!appUrl && process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL.trim()}`
    }
    if (!appUrl) {
      appUrl = 'http://localhost:3000'
    }
    const workerUrl = `${appUrl}/api/automations/worker`

    // Validar se a URL é válida
    if (!workerUrl.startsWith('http://') && !workerUrl.startsWith('https://')) {
      return NextResponse.json({
        error: 'URL inválida - deve começar com http:// ou https://',
      }, { status: 400 })
    }

    // Agendar o cron job no Upstash (a cada 5 minutos)
    const result = await scheduleCronJob(workerUrl, '*/5 * * * *')

    return NextResponse.json({
      success: true,
      message: 'Cron job agendado com sucesso no Upstash QStash',
      scheduleId: result.scheduleId,
      workerUrl,
      schedule: '*/5 * * * * (a cada 5 minutos)',
    })
  } catch (error) {
    console.error('[Schedule] Erro ao agendar cron job:', error)
    return NextResponse.json(
      {
        error: 'Erro ao agendar cron job',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Webhook que recebe do Upstash QStash
 * 
 * Este endpoint é acionado pelo Upstash QStash de acordo com o cron job configurado.
 * Simplesmente chama o automation worker.
 */
export async function POST(request: Request) {
  try {
    // Verificar se veio do Upstash
    const upstashSignature = request.headers.get('upstash-signature')
    const upstashTimestamp = request.headers.get('upstash-timestamp')

    if (!upstashSignature || !upstashTimestamp) {
      console.warn('[Schedule] Request sem headers do Upstash')
    }

    // Chamar o automation worker
    let appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    if (!appUrl && process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL.trim()}`
    }
    if (!appUrl) {
      appUrl = 'http://localhost:3000'
    }
    const workerUrl = `${appUrl}/api/automations/worker`
    
    const response = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
      },
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Automation worker executado',
      workerResult: result,
    })
  } catch (error) {
    console.error('[Schedule] Erro ao executar worker:', error)
    return NextResponse.json(
      {
        error: 'Erro ao executar automation worker',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
