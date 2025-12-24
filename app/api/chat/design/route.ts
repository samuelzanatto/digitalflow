import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

// Inicializar Groq
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// ASSISTENTE IA - Chat de Conversação
// Especialista em criação de conteúdo e copywriting
// Com capacidade de redirecionar para busca no mapa
// ============================================

const ASSISTANT_PROMPT = `Você é um assistente especialista em marketing digital e copywriting. Você ajuda a criar:

- Copies persuasivas para vendas
- Posts para redes sociais (Instagram, LinkedIn, Twitter/X, TikTok)
- Emails marketing e sequências de email
- Headlines e CTAs impactantes
- Scripts para vídeos
- Descrições de produtos
- Conteúdo para blogs e artigos
- Brainstorms de ideias criativas

## Capacidade Especial - Busca de Lugares:
Quando o usuário pedir para buscar lugares, estabelecimentos, restaurantes, farmácias, hospitais, bancos, lojas, supermercados ou qualquer tipo de local físico, você DEVE usar a ferramenta "redirectToMap" para redirecioná-lo ao mapa inteligente.

Exemplos de quando usar redirectToMap:
- "encontre restaurantes perto de mim"
- "busque farmácias próximas"
- "quero achar um supermercado"
- "onde fica o hospital mais próximo"
- "procure postos de gasolina"
- "me mostre cafeterias na região"

## Suas características:
- Respostas diretas e práticas
- Use linguagem natural em português brasileiro
- Seja criativo mas objetivo
- Adapte o tom conforme o contexto (formal, casual, técnico, etc)
- Forneça opções e variações quando apropriado
- Use emojis com moderação quando fizer sentido

## Formatação:
- Use markdown para estruturar suas respostas
- Destaque pontos importantes com **negrito**
- Use listas quando apropriado
- Separe seções com títulos quando a resposta for longa

Responda de forma útil e engajadora.`;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      temperature: 0.7,
      system: ASSISTANT_PROMPT,
      messages: convertToModelMessages(messages),
      tools: {
        redirectToMap: {
          description: 'Redireciona o usuário para o mapa inteligente quando ele quer buscar estabelecimentos, lugares físicos, restaurantes, farmácias, hospitais, lojas, supermercados, postos de gasolina, cafés, bares, hotéis, escolas, academias ou qualquer local. Use SEMPRE que o usuário mencionar busca de lugares.',
          inputSchema: z.object({
            query: z.string().describe('A busca que o usuário quer fazer (ex: "restaurantes", "farmácias próximas", "supermercados")'),
            message: z.string().describe('Uma mensagem amigável explicando que você vai redirecionar para o mapa'),
          }),
          execute: async ({ query, message }: { query: string; message: string }) => {
            return {
              action: 'REDIRECT_TO_MAP',
              query,
              message,
              url: '/dashboard/mapa',
            };
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

