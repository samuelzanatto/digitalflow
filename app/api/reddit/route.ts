import { NextRequest, NextResponse } from 'next/server';

interface RedditPost {
  title: string;
  score: number;
  url: string;
  image: string | null;
  comments: number;
  subreddit: string;
  created_utc: number;
  author: string;
}

interface RedditChild {
  data: {
    title: string;
    score: number;
    permalink: string;
    thumbnail: string;
    num_comments: number;
    subreddit: string;
    created_utc: number;
    author: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditChild[];
  };
}

/**
 * Valida se o título é adequado (não apenas emoji ou caracteres especiais)
 */
function isValidTitle(title: string): boolean {
  if (!title || title.trim().length < 15) return false;
  
  // Remove emojis completamente
  const withoutEmojis = title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '').trim();
  
  // Deve ter pelo menos 12 caracteres após remover emojis
  if (withoutEmojis.length < 12) return false;
  
  // Deve ter pelo menos uma palavra com 4+ letras (palavra significativa)
  const hasRealWord = /[a-zA-ZáéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]{4,}/.test(withoutEmojis);
  if (!hasRealWord) return false;
  
  // Deve ter pelo menos 3 palavras (frase mais completa)
  const words = withoutEmojis.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return false;
  
  // Pelo menos 2 palavras devem ter 3+ caracteres (evita "é que a")
  const substantialWords = words.filter(w => w.length >= 3).length;
  
  return substantialWords >= 2;
}

/**
 * Traduz texto para português usando MyMemory API (gratuita)
 */
async function translateToPortuguese(text: string): Promise<string> {
  try {
    // Evita traduzir textos muito curtos ou já em português
    if (!text || text.length < 3) return text;

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-BR`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DigitalFlow/1.0.0'
      }
    });

    if (!res.ok) return text;

    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    
    return typeof translated === 'string' && translated.trim() ? translated.trim() : text;
  } catch {
    return text; // Se falhar, retorna texto original
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subreddit = searchParams.get('subreddit') || 'brasil';
    const time = searchParams.get('time') || 'day'; // hour, day, week, month, year, all
    // `limit` é interpretado como limite POR subreddit (não global)
    const perSubredditLimit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Permite múltiplos subreddits separados por vírgula
    const subreddits = subreddit.split(',').map(s => s.trim()).filter(Boolean);
    
    const allTrends: RedditPost[] = [];

    // Proteção simples: evita respostas gigantes em caso de muitos subreddits
    const maxTotal = Math.min(subreddits.length * perSubredditLimit, 1000);

    // Busca trends de cada subreddit
    for (const sub of subreddits) {
      const url = `https://www.reddit.com/r/${sub}/top.json?t=${time}&limit=${perSubredditLimit}`;
      
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DigitalFlow/1.0.0'
        },
        next: { revalidate: 3600 } // Cache por 1 hora
      });

      if (!res.ok) {
        console.error(`Falha ao buscar r/${sub}: ${res.status}`);
        continue;
      }

      const data = await res.json() as RedditResponse;
      
      const trends = data.data.children
        .map((post) => ({
          title: post.data.title,
          score: post.data.score,
          url: `https://reddit.com${post.data.permalink}`,
          image: post.data.thumbnail && 
                 post.data.thumbnail !== 'self' && 
                 post.data.thumbnail !== 'default' && 
                 post.data.thumbnail.startsWith('http') 
            ? post.data.thumbnail 
            : null,
          comments: post.data.num_comments,
          subreddit: post.data.subreddit,
          created_utc: post.data.created_utc,
          author: post.data.author
        }))
        .filter(trend => isValidTitle(trend.title)); // Filtra posts sem título válido

      allTrends.push(...trends);
    }

    // Ordena por score (popularidade)
    allTrends.sort((a, b) => b.score - a.score);

    // Traduz títulos para português (em batch, com limite de rate)
    const sliced = allTrends.slice(0, maxTotal);
    const translationPromises = sliced.map(async (trend) => {
      const translatedTitle = await translateToPortuguese(trend.title);
      return { ...trend, title: translatedTitle };
    });

    // Executa traduções com pequeno delay para respeitar rate limits
    const translated: RedditPost[] = [];
    for (let i = 0; i < translationPromises.length; i++) {
      translated.push(await translationPromises[i]);
      // Pequeno delay para não sobrecarregar a API gratuita
      if (i < translationPromises.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({ 
      source: 'Reddit',
      subreddits: subreddits,
      time,
      total: sliced.length,
      data: translated
    });

  } catch (error) {
    console.error('Erro ao buscar Reddit:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar trends do Reddit' }, 
      { status: 500 }
    );
  }
}
