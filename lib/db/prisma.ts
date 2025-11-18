import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const {
  POSTGRES_PRISMA_URL,
  POSTGRES_URL_NON_POOLING,
  PRISMA_FORCE_DIRECT,
  NODE_ENV,
} = process.env

const normalizedNodeEnv = NODE_ENV ?? 'development'

const shouldPreferDirectUrl =
  PRISMA_FORCE_DIRECT === 'true' ||
  (PRISMA_FORCE_DIRECT !== 'false' && normalizedNodeEnv !== 'production')

const resolvedDatabaseUrl = shouldPreferDirectUrl
  ? POSTGRES_URL_NON_POOLING || POSTGRES_PRISMA_URL
  : POSTGRES_PRISMA_URL || POSTGRES_URL_NON_POOLING

if (!resolvedDatabaseUrl) {
  throw new Error(
    'Missing database connection string. Set POSTGRES_PRISMA_URL or POSTGRES_URL_NON_POOLING in your environment.',
  )
}

if (resolvedDatabaseUrl !== POSTGRES_PRISMA_URL) {
  const modeLabel = shouldPreferDirectUrl ? 'direct (5432)' : 'pooler (6543)'
  console.info(`[prisma] Usando conexão ${modeLabel} para ambiente ${normalizedNodeEnv}`)
  process.env.POSTGRES_PRISMA_URL = resolvedDatabaseUrl
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

let prismaConnectionPromise: Promise<void> | null = null

async function ensurePrismaConnection(forceReconnect = false) {
  if (forceReconnect && prismaConnectionPromise) {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.warn('Falha ao desconectar Prisma durante reconnect forçado:', disconnectError)
    } finally {
      prismaConnectionPromise = null
    }
  }

  if (!prismaConnectionPromise) {
    prismaConnectionPromise = prisma.$connect().catch((error) => {
      prismaConnectionPromise = null
      throw error
    })
  }

  return prismaConnectionPromise
}

// Garantir que o Prisma se conecta ao iniciar
if (process.env.NODE_ENV === 'development') {
  ensurePrismaConnection()
    .then(() => console.log('✓ Prisma conectado ao banco de dados'))
    .catch((error) => console.error('✗ Erro ao conectar Prisma:', error))
}

// Função helper para retry em caso de erro de prepared statement
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await ensurePrismaConnection()
      return await fn()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = (error as Record<string, unknown>)?.code as string | undefined
      
      const isEngineNotConnectedError = errorMessage.includes('Engine is not yet connected')
      // Captura erros de prepared statement:
      // - "does not exist" (código 26000) - prepared statement foi perdido
      // - "already exists" (código 42P05) - conflito de nome de prepared statement com PgBouncer
      // - Mensagens que contenham "prepared statement"
      const isPreparedStatementError = 
        errorCode === '26000' ||
        errorCode === '42P05' ||
        (errorMessage.includes('prepared statement') && (
          errorMessage.includes('does not exist') ||
          errorMessage.includes('already exists')
        ))

      const shouldRetry = (isPreparedStatementError || isEngineNotConnectedError) && i < maxRetries - 1

      if (shouldRetry) {
        const delay = delayMs * Math.pow(2, i) // Backoff exponencial: 500ms, 1000ms, 2000ms
        console.warn(
          `[Prisma Retry] (${errorCode ?? 'no-code'}) tentativa ${i + 1}/${maxRetries} em ${delay}ms: ${errorMessage.substring(0, 120)}`
        )

        await new Promise(resolve => setTimeout(resolve, delay))

        if (isEngineNotConnectedError) {
          await ensurePrismaConnection(true)
        } else {
          // Força o Prisma a soltar a conexão atual para evitar reuso do prepared statement problemático
          try {
            await prisma.$disconnect()
          } catch (disconnectError) {
            console.warn('Falha ao desconectar Prisma depois do erro de prepared statement:', disconnectError)
          }

          await ensurePrismaConnection()
        }

        continue
      }

      throw error
    }
  }

  throw new Error('Max retries exceeded')
}
