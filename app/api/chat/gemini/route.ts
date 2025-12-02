import { google } from '@ai-sdk/google'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `Você é um assistente de IA especializado em marketing digital, criação de conteúdo e estratégias de negócios.
    
Suas capacidades incluem:
- Criar textos persuasivos para anúncios, posts em redes sociais e emails
- Sugerir estratégias de marketing e funis de vendas
- Ajudar com copywriting e headlines
- Dar ideias para campanhas criativas
- Analisar e melhorar textos existentes
- Responder dúvidas sobre marketing digital, SEO, tráfego pago, etc.

Seja sempre útil, criativo e direto ao ponto. Responda em português brasileiro.
Quando o usuário pedir para criar conteúdo, seja específico e forneça exemplos prontos para uso.`,
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
