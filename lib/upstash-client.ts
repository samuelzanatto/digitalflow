/**
 * Upstash QStash - Cliente para agendamento de tarefas
 * 
 * Este cliente é usado para agendar a execução do automation worker
 * usando o serviço gratuito Upstash QStash.
 * 
 * Documentação: https://upstash.com/docs/qstash/overall/getstarted
 * 
 * Variáveis de ambiente necessárias:
 * - QSTASH_TOKEN: Token de autenticação do Upstash (get from https://console.upstash.com)
 * - AUTOMATION_WORKER_URL: URL da API do worker (ex: https://seu-app.vercel.app/api/automations/worker)
 */

const QSTASH_API_BASE = 'https://qstash.upstash.io/v2'

interface ScheduleJobOptions {
  delay?: number // delay em segundos
  cron?: string // expressão cron
  headers?: Record<string, string>
}

/**
 * Agenda um job no Upstash QStash
 */
export async function scheduleJob(
  url: string,
  options: ScheduleJobOptions = {}
): Promise<{ messageId: string }> {
  const qstashToken = process.env.QSTASH_TOKEN

  if (!qstashToken) {
    throw new Error('QSTASH_TOKEN não está configurado nas variáveis de ambiente')
  }

  if (!url) {
    throw new Error('URL do job é obrigatória')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${qstashToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Se é um cron job
  if (options.cron) {
    headers['Upstash-Cron'] = options.cron
  }

  // Se é um delay (em segundos)
  if (options.delay) {
    headers['Upstash-Delay'] = `${options.delay}s`
  }

  try {
    const response = await fetch(`${QSTASH_API_BASE}/publish/${btoa(url).toString()}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // Body pode estar vazio ou conter dados
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Upstash error: ${response.status} - ${error}`)
    }

    const data = (await response.json()) as { messageId?: string }
    return {
      messageId: data.messageId || 'unknown',
    }
  } catch (error) {
    console.error('[Upstash] Erro ao agendar job:', error)
    throw error
  }
}

/**
 * Cron job helper - agenda uma tarefa para executar em um intervalo regular
 * usando Upstash QStash
 */
export async function scheduleCronJob(
  url: string,
  cronExpression: string = '*/5 * * * *' // padrão: a cada 5 minutos
): Promise<{ messageId: string }> {
  return scheduleJob(url, { cron: cronExpression })
}

/**
 * Valida se a URL é válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
