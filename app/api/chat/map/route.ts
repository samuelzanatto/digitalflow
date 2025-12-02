import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

// ============================================
// ASSISTENTE IA - Integrado com Busca no Mapa
// Busca estabelecimentos usando APIs gratuitas
// ============================================

// Tipos para as respostas da API
interface NominatimResult {
  lat: string
  lon: string
  name?: string
  display_name: string
  type?: string
  address?: {
    city?: string
    municipality?: string
    state?: string
  }
  extratags?: {
    phone?: string
    website?: string
  }
}

interface OverpassElement {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: {
    name?: string
    'addr:street'?: string
    'addr:housenumber'?: string
    'addr:city'?: string
    phone?: string
    website?: string
    opening_hours?: string
  }
}

interface FormattedPlace {
  name: string
  address: string
  phone: string | null
  website: string | null
  openingHours?: string | null
  distance: number
  position: [number, number]
}

// Função para buscar no Nominatim
async function searchNominatim(query: string, lat?: number, lon?: number): Promise<NominatimResult[]> {
  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search')
  nominatimUrl.searchParams.set('q', query)
  nominatimUrl.searchParams.set('format', 'json')
  nominatimUrl.searchParams.set('addressdetails', '1')
  nominatimUrl.searchParams.set('extratags', '1')
  nominatimUrl.searchParams.set('limit', '10')
  nominatimUrl.searchParams.set('countrycodes', 'br')
  
  if (lat && lon) {
    const latDelta = 50 / 111
    const lonDelta = 50 / (111 * Math.cos(lat * Math.PI / 180))
    nominatimUrl.searchParams.set('viewbox', 
      `${lon - lonDelta},${lat + latDelta},${lon + lonDelta},${lat - latDelta}`
    )
  }

  const response = await fetch(nominatimUrl.toString(), {
    headers: {
      'User-Agent': 'DigitalFlow/1.0',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  })

  if (!response.ok) throw new Error('Nominatim error')
  return response.json()
}

// Função para buscar POIs no Overpass
async function searchOverpass(
  category: string, 
  lat: number, 
  lon: number, 
  radius: number = 5000
): Promise<OverpassElement[]> {
  const categoryTags: Record<string, string> = {
    restaurante: 'amenity=restaurant',
    restaurantes: 'amenity=restaurant',
    cafe: 'amenity=cafe',
    cafes: 'amenity=cafe',
    bar: 'amenity=bar',
    bares: 'amenity=bar',
    farmacia: 'amenity=pharmacy',
    farmacias: 'amenity=pharmacy',
    hospital: 'amenity=hospital',
    hospitais: 'amenity=hospital',
    banco: 'amenity=bank',
    bancos: 'amenity=bank',
    supermercado: 'shop=supermarket',
    supermercados: 'shop=supermarket',
    posto: 'amenity=fuel',
    postos: 'amenity=fuel',
    hotel: 'tourism=hotel',
    hoteis: 'tourism=hotel',
    escola: 'amenity=school',
    escolas: 'amenity=school',
    academia: 'leisure=fitness_centre',
    academias: 'leisure=fitness_centre',
    padaria: 'shop=bakery',
    padarias: 'shop=bakery',
    loja: 'shop',
    lojas: 'shop',
    mercado: 'shop=supermarket',
    mercados: 'shop=supermarket',
  }

  const tag = categoryTags[category.toLowerCase()] || `name~"${category}",i`

  const query = `
    [out:json][timeout:25];
    (
      node[${tag}](around:${radius},${lat},${lon});
      way[${tag}](around:${radius},${lat},${lon});
    );
    out center tags;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) throw new Error('Overpass error')
  const data = await response.json()
  return data.elements || []
}

// Calcular distância
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const ASSISTANT_PROMPT = `Você é um assistente inteligente especializado em buscas geográficas e análise de dados.

## Suas Capacidades:
1. **Buscar Estabelecimentos**: Você pode buscar restaurantes, farmácias, hospitais, bancos, supermercados, hotéis, escolas, academias, padarias, postos de combustível e muito mais.

2. **Buscar Endereços**: Você pode encontrar endereços específicos, ruas, bairros e cidades.

3. **Análise de Dados**: Você pode analisar os resultados encontrados e fornecer insights.

## Instruções:
- Quando o usuário pedir para buscar estabelecimentos, use a ferramenta de busca.
- Sempre informe a quantidade de resultados encontrados.
- Formate os resultados de forma clara e organizada.
- Se o usuário não especificar uma localização, pergunte qual cidade ou região ele deseja pesquisar.
- Inclua informações relevantes como nome, endereço, telefone e distância quando disponíveis.
- Use emojis para tornar a resposta mais visual: 📍 para localização, 📞 para telefone, 🌐 para website, ⏰ para horário.

## Formato de Resposta:
Quando apresentar resultados de busca, use este formato:

**🔍 Encontrei X estabelecimentos:**

1. **Nome do Local**
   📍 Endereço
   📞 Telefone (se disponível)
   📏 X.X km de distância

Responda sempre em português brasileiro de forma amigável e útil.`

export async function POST(req: Request) {
  try {
    const { messages, location }: { 
      messages: UIMessage[]
      location?: { lat: number; lon: number; city?: string }
    } = await req.json()

    const result = streamText({
      model: google('gemini-2.0-flash'),
      temperature: 0.7,
      system: ASSISTANT_PROMPT,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(3),
      tools: {
        searchPlaces: {
          description: 'Busca estabelecimentos ou lugares por nome ou tipo (restaurantes, farmácias, hospitais, bancos, supermercados, etc). Use quando o usuário quiser encontrar lugares específicos.',
          inputSchema: z.object({
            query: z.string().describe('O que buscar (ex: "restaurantes", "farmácia", "hospital são lucas", "padaria perto")'),
            city: z.string().optional().describe('Cidade para buscar (ex: "Campo Grande MS", "São Paulo")'),
            latitude: z.number().optional().describe('Latitude do centro da busca'),
            longitude: z.number().optional().describe('Longitude do centro da busca'),
            radius: z.number().optional().default(5000).describe('Raio da busca em metros'),
          }),
          execute: async ({ query, city, latitude, longitude, radius }: {
            query: string
            city?: string
            latitude?: number
            longitude?: number
            radius?: number
          }) => {
            // Usar localização do contexto se não fornecida
            const lat = latitude || location?.lat || -20.4697
            const lon = longitude || location?.lon || -54.6087
            const searchCity = city || location?.city || 'Campo Grande MS'

            try {
              // Primeiro tenta buscar por categoria no Overpass
              const poiResults = await searchOverpass(query, lat, lon, radius || 5000)
              
              if (poiResults.length > 0) {
                const formatted: FormattedPlace[] = poiResults
                  .filter((p) => p.tags?.name)
                  .slice(0, 15)
                  .map((p) => {
                    const pLat = p.lat || p.center?.lat || 0
                    const pLon = p.lon || p.center?.lon || 0
                    const distance = haversineDistance(lat, lon, pLat, pLon)
                    
                    return {
                      name: p.tags!.name!,
                      address: [
                        p.tags?.['addr:street'],
                        p.tags?.['addr:housenumber'],
                        p.tags?.['addr:city']
                      ].filter(Boolean).join(', ') || 'Endereço não disponível',
                      phone: p.tags?.phone || null,
                      website: p.tags?.website || null,
                      openingHours: p.tags?.opening_hours || null,
                      distance: Math.round(distance * 10) / 10,
                      position: [pLat, pLon] as [number, number],
                    }
                  })
                  .sort((a, b) => a.distance - b.distance)

                return {
                  success: true,
                  type: 'pois',
                  query,
                  city: searchCity,
                  total: formatted.length,
                  results: formatted,
                }
              }

              // Fallback para Nominatim se Overpass não encontrar
              const searchQuery = city ? `${query} ${city}` : `${query} ${searchCity}`
              const nominatimResults = await searchNominatim(searchQuery, lat, lon)

              const formatted: FormattedPlace[] = nominatimResults.slice(0, 10).map((r) => ({
                name: r.name || r.display_name.split(',')[0],
                address: r.display_name,
                phone: r.extratags?.phone || null,
                website: r.extratags?.website || null,
                distance: Math.round(haversineDistance(lat, lon, parseFloat(r.lat), parseFloat(r.lon)) * 10) / 10,
                position: [parseFloat(r.lat), parseFloat(r.lon)] as [number, number],
              }))

              return {
                success: true,
                type: 'search',
                query,
                city: searchCity,
                total: formatted.length,
                results: formatted,
              }

            } catch (error) {
              console.error('Search error:', error)
              return {
                success: false,
                error: 'Erro ao buscar estabelecimentos. Tente novamente.',
              }
            }
          },
        },

        searchAddress: {
          description: 'Busca um endereço específico ou localização. Use para encontrar ruas, bairros, cidades ou endereços completos.',
          inputSchema: z.object({
            address: z.string().describe('O endereço a buscar (ex: "Avenida Afonso Pena, Campo Grande")'),
          }),
          execute: async ({ address }: { address: string }) => {
            try {
              const results = await searchNominatim(address)
              
              if (results.length === 0) {
                return { success: false, error: 'Endereço não encontrado.' }
              }

              const formatted = results.slice(0, 5).map((r) => ({
                name: r.name || r.display_name.split(',')[0],
                fullAddress: r.display_name,
                type: r.type,
                position: [parseFloat(r.lat), parseFloat(r.lon)] as [number, number],
                city: r.address?.city || r.address?.municipality,
                state: r.address?.state,
              }))

              return {
                success: true,
                type: 'address',
                total: formatted.length,
                results: formatted,
              }

            } catch (error) {
              console.error('Address search error:', error)
              return { success: false, error: 'Erro ao buscar endereço.' }
            }
          },
        },

        getAvailableCategories: {
          description: 'Lista as categorias de estabelecimentos disponíveis para busca.',
          inputSchema: z.object({}),
          execute: async () => {
            return {
              categories: [
                { id: 'restaurantes', name: '🍽️ Restaurantes' },
                { id: 'cafes', name: '☕ Cafés' },
                { id: 'bares', name: '🍺 Bares' },
                { id: 'farmacias', name: '💊 Farmácias' },
                { id: 'hospitais', name: '🏥 Hospitais' },
                { id: 'bancos', name: '🏦 Bancos' },
                { id: 'supermercados', name: '🛒 Supermercados' },
                { id: 'postos', name: '⛽ Postos de Combustível' },
                { id: 'hoteis', name: '🏨 Hotéis' },
                { id: 'escolas', name: '🏫 Escolas' },
                { id: 'academias', name: '💪 Academias' },
                { id: 'padarias', name: '🥖 Padarias' },
              ],
            }
          },
        },
      },
    })

    return result.toUIMessageStreamResponse()

  } catch (error) {
    console.error('Map Chat API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
