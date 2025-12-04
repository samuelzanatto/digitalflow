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
 */
export async function scheduleCronJob(
  destinationUrl: string,
  cronExpression: string = "*/5 * * * *",
  label: string = "automation-worker"
): Promise<{ scheduleId: string }> {
  const token = process.env.QSTASH_TOKEN

  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured in environment variables')
  }

  if (!destinationUrl) {
    throw new Error('destinationUrl is required')
  }

  try {
    const response = await fetch(`${QSTASH_API_BASE}/schedules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: destinationUrl,
        cron: cronExpression,
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
        },
        label,
        retries: 3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`QStash API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as { scheduleId?: string }

    if (!data.scheduleId) {
      throw new Error('scheduleId not returned from API')
    }

    console.log(`[QStash] Schedule created: ${data.scheduleId}`)
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
