import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configurar comportamento de reconexão
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função helper para retry em caso de erro de prepared statement
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Captura erros de prepared statement:
      // - "does not exist" (código 26000) - prepared statement foi perdido
      // - "already exists" (código 42P05) - conflito de nome de prepared statement com PgBouncer
      const isPreparedStatementError = 
        errorMessage.includes('prepared statement') && (
          errorMessage.includes('does not exist') ||
          errorMessage.includes('already exists')
        )

      if (isPreparedStatementError && i < maxRetries - 1) {
        const delay = delayMs * (i + 1) // Backoff exponencial
        console.warn(
          `Prepared statement error: ${errorMessage}. Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`
        )

        // Força o Prisma a soltar a conexão atual para evitar reuso do prepared statement problemático
        try {
          await prisma.$disconnect()
        } catch (disconnectError) {
          console.warn('Falha ao desconectar Prisma depois do erro, seguindo assim mesmo.', disconnectError)
        }

        await new Promise(resolve => setTimeout(resolve, delay))

        try {
          await prisma.$connect()
        } catch (connectError) {
          console.warn('Falha ao reconectar Prisma depois do erro, tentando novamente.', connectError)
        }

        continue
      }

      throw error
    }
  }

  throw new Error('Max retries exceeded')
}
