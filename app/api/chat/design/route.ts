import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

// ============================================
// ASSISTENTE IA - Chat de Conversação
// Especialista em criação de conteúdo e copywriting
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
      model: google('gemini-2.0-flash'),
      temperature: 0.7,
      system: ASSISTANT_PROMPT,
      messages: convertToModelMessages(messages),
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
