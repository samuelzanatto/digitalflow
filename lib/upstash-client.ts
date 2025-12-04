/**
 * Upstash QStash - Client for scheduling tasks
 * Uses the QStash REST API to schedule automation worker execution
 * 
 * Documentation: https://upstash.com/docs/qstash/api/schedules/create
 * 
 * Environment variables:
 * - QSTASH_TOKEN: Upstash authentication token
 * - NEXT_PUBLIC_APP_URL: Application base URL
 */

const QSTASH_API_BASE = 'https://qstash.upstash.io/v2'

/**
 * Schedule a cron job in Upstash QStash
 * 
 * API Documentation: https://upstash.com/docs/qstash/api/schedules/create
 * 
 * Formato correto da API:
 * POST https://qstash.upstash.io/v2/schedules/https://www.example.com/endpoint
 * Header: Upstash-Cron: (expressão cron, ex: a cada 5 min)
 */
export async function scheduleCronJob(
  destinationUrl: string,
  cronExpression: string = "*/5 * * * *",
  label: string = "automation-worker"
): Promise<{ scheduleId: string }> {
  const token = process.env.QSTASH_TOKEN?.trim()

  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured in environment variables')
  }

  if (!destinationUrl) {
    throw new Error('destinationUrl is required')
  }

  // Garantir que a URL está limpa (sem espaços ou quebras de linha)
  const cleanUrl = destinationUrl.trim()
  
  // Validar que a URL começa com http:// ou https://
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error(`Invalid destination URL: must start with http:// or https://. Got: ${cleanUrl}`)
  }

  try {
    // A API do QStash espera a URL de destino diretamente no PATH
    // POST /v2/schedules/{destination}
    // A URL de destino NÃO deve ser URL-encoded
    const endpoint = `${QSTASH_API_BASE}/schedules/${cleanUrl}`
    
    console.log('[QStash] Creating schedule with endpoint:', endpoint)
    console.log('[QStash] Cron expression:', cronExpression)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Upstash-Cron': cronExpression,
        'Upstash-Retries': '3',
        // Forward headers para a requisição de destino
        'Upstash-Forward-Authorization': `Bearer ${process.env.CRON_SECRET?.trim() || 'dev-secret'}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[QStash] API Error Response:', errorText)
      throw new Error(`QStash API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as { scheduleId?: string }

    if (!data.scheduleId) {
      console.error('[QStash] Response data:', data)
      throw new Error('scheduleId not returned from API')
    }

    console.log(`[QStash] Schedule created successfully: ${data.scheduleId}`)
    return { scheduleId: data.scheduleId }
  } catch (error) {
    console.error('[QStash] Error creating schedule:', error)
    throw error
  }
}

/**
 * List all schedules
 */
export async function listSchedules(): Promise<Array<{ scheduleId: string; cron: string; destination: string; label?: string }>> {
  const token = process.env.QSTASH_TOKEN

  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured in environment variables')
  }

  try {
    const response = await fetch(`${QSTASH_API_BASE}/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`QStash API error: ${response.status}`)
    }

    const data = await response.json() as Array<{ scheduleId: string; cron: string; destination: string; label?: string }>
    return data
  } catch (error) {
    console.error('[QStash] Error listing schedules:', error)
    throw error
  }
}

/**
 * Get schedule details
 */
export async function getSchedule(scheduleId: string) {
  const token = process.env.QSTASH_TOKEN

  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured in environment variables')
  }

  try {
    const response = await fetch(`${QSTASH_API_BASE}/schedules/${scheduleId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`QStash API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[QStash] Error getting schedule:', error)
    throw error
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  const token = process.env.QSTASH_TOKEN

  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured in environment variables')
  }

  try {
    const response = await fetch(`${QSTASH_API_BASE}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`QStash API error: ${response.status}`)
    }

    console.log(`[QStash] Schedule deleted: ${scheduleId}`)
  } catch (error) {
    console.error('[QStash] Error deleting schedule:', error)
    throw error
  }
}

/**
 * Pause a schedule
 */
export async function pauseSchedule(scheduleId: string): Promise<void> {
  const token = process.env.QSTASH_TOKEN

  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured in environment variables')
  }

  try {
    const response = await fetch(`${QSTASH_API_BASE}/schedules/${scheduleId}/pause`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`QStash API error: ${response.status}`)
    }

    console.log(`[QStash] Schedule paused: ${scheduleId}`)
  } catch (error) {
    console.error('[QStash] Error pausing schedule:', error)
    throw error
  }
}
