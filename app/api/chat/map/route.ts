import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'

// Inicializar Groq
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// ============================================
// ASSISTENTE IA - Integrado com Busca no Mapa
// Busca estabelecimentos usando múltiplas APIs
// ============================================

// Tipos para as respostas da API
interface NominatimResult {
  lat: string
  lon: string
  name?: string
  display_name: string
  type?: string
  class?: string
  address?: {
    city?: string
    municipality?: string
    state?: string
  }
  extratags?: {
    phone?: string
    website?: string
    opening_hours?: string
    cuisine?: string
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
    'addr:postcode'?: string
    phone?: string
    'contact:phone'?: string
    website?: string
    'contact:website'?: string
    opening_hours?: string
    cuisine?: string
    brand?: string
    operator?: string
    description?: string
  }
}

interface FormattedPlace {
  name: string
  address: string
  phone: string | null
  website: string | null
  openingHours?: string | null
  cuisine?: string | null
  distance: number
  position: [number, number]
  source: 'overpass' | 'nominatim' | 'foursquare'
}

// Função para buscar no Nominatim (melhorada)
async function searchNominatim(query: string, lat?: number, lon?: number): Promise<NominatimResult[]> {
  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search')
  nominatimUrl.searchParams.set('q', query)
  nominatimUrl.searchParams.set('format', 'json')
  nominatimUrl.searchParams.set('addressdetails', '1')
  nominatimUrl.searchParams.set('extratags', '1')
  nominatimUrl.searchParams.set('namedetails', '1')
  nominatimUrl.searchParams.set('limit', '20')
  nominatimUrl.searchParams.set('countrycodes', 'br')
  nominatimUrl.searchParams.set('dedupe', '1')
  
  if (lat && lon) {
    // Usar viewbox maior para capturar mais resultados
    const latDelta = 0.5 // ~55km
    const lonDelta = 0.5
    nominatimUrl.searchParams.set('viewbox', 
      `${lon - lonDelta},${lat + latDelta},${lon + lonDelta},${lat - latDelta}`
    )
    nominatimUrl.searchParams.set('bounded', '0') // Não limitar estritamente ao viewbox
  }

  const response = await fetch(nominatimUrl.toString(), {
    headers: {
      'User-Agent': 'DigitalFlow/1.0 (contact@digitalflow.com.br)',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  })

  if (!response.ok) throw new Error('Nominatim error')
  return response.json()
}

// Função para buscar POIs no Overpass (melhorada)
async function searchOverpass(
  category: string, 
  lat: number, 
  lon: number, 
  radius: number = 5000
): Promise<OverpassElement[]> {
  const normalizedCategory = category.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
  
  console.log('[OVERPASS] Categoria normalizada:', normalizedCategory)
  
  // Mapeamento direto de categorias para queries Overpass
  const categoryQueries: Record<string, string> = {
    restaurante: `["amenity"="restaurant"]`,
    restaurantes: `["amenity"="restaurant"]`,
    comida: `["amenity"~"restaurant|fast_food|food_court"]`,
    lanchonete: `["amenity"="fast_food"]`,
    lanchonetes: `["amenity"="fast_food"]`,
    pizzaria: `["amenity"="restaurant"]["cuisine"~"pizza",i]`,
    pizzarias: `["amenity"="restaurant"]["cuisine"~"pizza",i]`,
    hamburgueria: `["amenity"~"restaurant|fast_food"]["cuisine"~"burger",i]`,
    hamburguerias: `["amenity"~"restaurant|fast_food"]["cuisine"~"burger",i]`,
    cafe: `["amenity"="cafe"]`,
    cafes: `["amenity"="cafe"]`,
    cafeteria: `["amenity"="cafe"]`,
    bar: `["amenity"~"bar|pub"]`,
    bares: `["amenity"~"bar|pub"]`,
    padaria: `["shop"="bakery"]`,
    padarias: `["shop"="bakery"]`,
    farmacia: `["amenity"="pharmacy"]`,
    farmacias: `["amenity"="pharmacy"]`,
    drogaria: `["amenity"="pharmacy"]`,
    hospital: `["amenity"~"hospital|clinic"]`,
    hospitais: `["amenity"~"hospital|clinic"]`,
    clinica: `["amenity"="clinic"]`,
    clinicas: `["amenity"="clinic"]`,
    banco: `["amenity"="bank"]`,
    bancos: `["amenity"="bank"]`,
    supermercado: `["shop"~"supermarket|convenience"]`,
    supermercados: `["shop"~"supermarket|convenience"]`,
    mercado: `["shop"~"supermarket|convenience|greengrocer"]`,
    mercados: `["shop"~"supermarket|convenience|greengrocer"]`,
    posto: `["amenity"="fuel"]`,
    postos: `["amenity"="fuel"]`,
    gasolina: `["amenity"="fuel"]`,
    hotel: `["tourism"~"hotel|motel"]`,
    hoteis: `["tourism"~"hotel|motel"]`,
    pousada: `["tourism"~"guest_house|hostel"]`,
    escola: `["amenity"="school"]`,
    escolas: `["amenity"="school"]`,
    academia: `["leisure"~"fitness_centre|sports_centre"]`,
    academias: `["leisure"~"fitness_centre|sports_centre"]`,
    shopping: `["shop"~"mall|department_store"]`,
    shoppings: `["shop"~"mall|department_store"]`,
    loja: `["shop"]`,
    lojas: `["shop"]`,
    petshop: `["shop"~"pet|pet_grooming"]`,
    petshops: `["shop"~"pet|pet_grooming"]`,
    pet: `["shop"~"pet|pet_grooming"]`,
    oficina: `["shop"="car_repair"]`,
    oficinas: `["shop"="car_repair"]`,
    salao: `["shop"~"hairdresser|beauty"]`,
    saloes: `["shop"~"hairdresser|beauty"]`,
    barbearia: `["shop"="hairdresser"]`,
    barbearias: `["shop"="hairdresser"]`,
    dentista: `["amenity"="dentist"]`,
    dentistas: `["amenity"="dentist"]`,
    otica: `["shop"="optician"]`,
    oticas: `["shop"="optician"]`,
    sorveteria: `["amenity"="ice_cream"]`,
    sorveterias: `["amenity"="ice_cream"]`,
    acai: `["amenity"="ice_cream"]`,
    igreja: `["amenity"="place_of_worship"]`,
    igrejas: `["amenity"="place_of_worship"]`,
    parque: `["leisure"="park"]`,
    parques: `["leisure"="park"]`,
    praca: `["leisure"="park"]`,
    pracas: `["leisure"="park"]`,
    estacionamento: `["amenity"="parking"]`,
    cinema: `["amenity"="cinema"]`,
    cinemas: `["amenity"="cinema"]`,
  }
  
  // Encontrar query correspondente
  let queryFilter = ''
  
  // Buscar correspondência direta ou parcial
  for (const [key, value] of Object.entries(categoryQueries)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      queryFilter = value
      console.log('[OVERPASS] Match encontrado:', key, '->', value)
      break
    }
  }
  
  // Se não encontrou, fazer busca por nome genérica
  if (!queryFilter) {
    queryFilter = `["name"~"${category}",i]`
    console.log('[OVERPASS] Usando busca por nome:', queryFilter)
  }

  // Query Overpass otimizada - buscar nodes e ways separadamente
  const query = `
[out:json][timeout:60];
(
  node${queryFilter}(around:${radius},${lat},${lon});
  way${queryFilter}(around:${radius},${lat},${lon});
);
out center tags;
`

  console.log('[OVERPASS] Query completa:', query)

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DigitalFlow/1.0',
      },
      body: `data=${encodeURIComponent(query)}`,
    })

    if (!response.ok) {
      console.error('[OVERPASS] Error:', response.status, response.statusText)
      const text = await response.text()
      console.error('[OVERPASS] Response:', text.substring(0, 500))
      throw new Error('Overpass error')
    }
    
    const data = await response.json()
    console.log('[OVERPASS] Resultados brutos:', data.elements?.length || 0)
    
    // Filtrar apenas elementos com nome
    const filtered = (data.elements || []).filter((el: OverpassElement) => el.tags?.name)
    console.log('[OVERPASS] Resultados com nome:', filtered.length)
    
    return filtered
  } catch (error) {
    console.error('[OVERPASS] Fetch error:', error)
    return []
  }
}

// Buscar POIs específicos por nome usando Nominatim com filtros
async function searchPOIsNominatim(query: string, lat: number, lon: number, city?: string): Promise<NominatimResult[]> {
  // Busca usando Nominatim em modo POI
  const searchTerms = [
    `${query} ${city || ''}`,
    `${query}`,
  ]
  
  const allResults: NominatimResult[] = []
  
  for (const term of searchTerms) {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', term.trim())
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('extratags', '1')
    url.searchParams.set('limit', '30')
    url.searchParams.set('countrycodes', 'br')
    
    // Definir área de busca
    const latDelta = 0.3 // ~33km
    const lonDelta = 0.3
    url.searchParams.set('viewbox', 
      `${lon - lonDelta},${lat + latDelta},${lon + lonDelta},${lat - latDelta}`
    )
    
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'DigitalFlow/1.0 (contact@digitalflow.com.br)',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      })
      
      if (response.ok) {
        const results = await response.json()
        allResults.push(...results)
      }
    } catch (e) {
      console.error('[NOMINATIM] Error:', e)
    }
    
    // Pequena pausa para respeitar rate limit
    await new Promise(r => setTimeout(r, 100))
  }
  
  // Remover duplicatas por lat/lon
  const unique = allResults.filter((item, index, self) =>
    index === self.findIndex(t => t.lat === item.lat && t.lon === item.lon)
  )
  
  console.log('[NOMINATIM] Resultados únicos:', unique.length)
  return unique
}

// Calcular distância
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const ASSISTANT_PROMPT = `Você é um assistente de busca de lugares no mapa. Sua ÚNICA função é usar ferramentas para buscar estabelecimentos.

## REGRA OBRIGATÓRIA:
Quando o usuário pedir para buscar QUALQUER tipo de lugar (restaurantes, farmácias, hospitais, supermercados, postos, cafés, bares, hotéis, escolas, academias, padarias, lojas, bancos, etc), você DEVE OBRIGATORIAMENTE usar a ferramenta "searchPlaces" para fazer a busca. NUNCA responda sem usar a ferramenta primeiro.

## Exemplos de quando usar searchPlaces:
- "restaurantes próximos" → use searchPlaces com query="restaurantes"
- "busque farmácias" → use searchPlaces com query="farmácias"
- "encontre supermercados" → use searchPlaces com query="supermercados"
- "postos de gasolina" → use searchPlaces com query="postos"
- "cafeterias na região" → use searchPlaces com query="cafés"

## Após receber os resultados da ferramenta:
Responda de forma MUITO BREVE, apenas confirmando a busca. NÃO liste os estabelecimentos pois eles já aparecem como marcadores no mapa.

Exemplos de resposta:
- "Encontrei 25 restaurantes na região! Os marcadores estão no mapa. 📍"
- "Pronto! 15 farmácias encontradas. Clique nos marcadores para ver detalhes."
- "Busca concluída: 8 supermercados próximos. Veja no mapa!"

NUNCA faça uma lista dos resultados. Apenas confirme quantos foram encontrados.
Responda sempre em português brasileiro.`

export async function POST(req: Request) {
  try {
    const { messages, location }: { 
      messages: UIMessage[]
      location?: { lat: number; lon: number; city?: string }
    } = await req.json()

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      temperature: 0.7,
      system: ASSISTANT_PROMPT,
      messages: convertToModelMessages(messages),
      maxSteps: 3,
      tools: {
        searchPlaces: {
          description: 'Busca estabelecimentos ou lugares por nome ou tipo (restaurantes, farmácias, hospitais, bancos, supermercados, etc). Use quando o usuário quiser encontrar lugares específicos. Sempre busca em um raio de 15km para encontrar mais resultados.',
          inputSchema: z.object({
            query: z.string().describe('O que buscar (ex: "restaurantes", "farmácia", "hospital são lucas", "padaria perto")'),
            city: z.string().optional().describe('Cidade para buscar (ex: "Campo Grande MS", "São Paulo")'),
            latitude: z.number().optional().describe('Latitude do centro da busca'),
            longitude: z.number().optional().describe('Longitude do centro da busca'),
          }),
          execute: async ({ query, city, latitude, longitude }: {
            query: string
            city?: string
            latitude?: number
            longitude?: number
          }) => {
            // Usar localização do contexto se não fornecida
            const lat = latitude || location?.lat || -20.4697
            const lon = longitude || location?.lon || -54.6087
            const searchCity = city || location?.city || 'Campo Grande MS'
            const searchRadius = 15000 // Sempre 15km para cobrir área grande

            console.log(`[SEARCH] Buscando "${query}" em ${searchCity} (${lat}, ${lon}) raio: ${searchRadius}m`)

            try {
              // Buscar em paralelo no Overpass e Nominatim
              const [overpassResults, nominatimResults] = await Promise.allSettled([
                searchOverpass(query, lat, lon, searchRadius),
                searchPOIsNominatim(query, lat, lon, searchCity)
              ])
              
              const allResults: FormattedPlace[] = []
              
              // Processar resultados do Overpass
              if (overpassResults.status === 'fulfilled' && overpassResults.value.length > 0) {
                const overpassFormatted = overpassResults.value
                  .filter((p) => p.tags?.name)
                  .map((p) => {
                    const pLat = p.lat || p.center?.lat || 0
                    const pLon = p.lon || p.center?.lon || 0
                    const distance = haversineDistance(lat, lon, pLat, pLon)
                    
                    // Construir endereço mais completo
                    const addressParts = [
                      p.tags?.['addr:street'],
                      p.tags?.['addr:housenumber'],
                      p.tags?.['addr:city'] || searchCity,
                      p.tags?.['addr:postcode']
                    ].filter(Boolean)
                    
                    return {
                      name: p.tags!.name!,
                      address: addressParts.length > 0 ? addressParts.join(', ') : `${searchCity}`,
                      phone: p.tags?.phone || p.tags?.['contact:phone'] || null,
                      website: p.tags?.website || p.tags?.['contact:website'] || null,
                      openingHours: p.tags?.opening_hours || null,
                      cuisine: p.tags?.cuisine || null,
                      distance: Math.round(distance * 10) / 10,
                      position: [pLat, pLon] as [number, number],
                      source: 'overpass' as const,
                    }
                  })
                
                allResults.push(...overpassFormatted)
                console.log(`[OVERPASS] Adicionados ${overpassFormatted.length} resultados`)
              }
              
              // Processar resultados do Nominatim
              if (nominatimResults.status === 'fulfilled' && nominatimResults.value.length > 0) {
                const nominatimFormatted = nominatimResults.value
                  .filter(r => {
                    // Filtrar apenas POIs relevantes
                    const validClasses = ['amenity', 'shop', 'tourism', 'leisure', 'healthcare', 'office']
                    return r.class && validClasses.includes(r.class)
                  })
                  .map((r) => ({
                    name: r.name || r.display_name.split(',')[0],
                    address: r.display_name,
                    phone: r.extratags?.phone || null,
                    website: r.extratags?.website || null,
                    openingHours: r.extratags?.opening_hours || null,
                    cuisine: r.extratags?.cuisine || null,
                    distance: Math.round(haversineDistance(lat, lon, parseFloat(r.lat), parseFloat(r.lon)) * 10) / 10,
                    position: [parseFloat(r.lat), parseFloat(r.lon)] as [number, number],
                    source: 'nominatim' as const,
                  }))
                
                // Adicionar apenas resultados que não estão duplicados
                for (const nr of nominatimFormatted) {
                  const isDuplicate = allResults.some(existing => {
                    // Verificar se é duplicata por proximidade (< 50m)
                    const dist = haversineDistance(
                      existing.position[0], existing.position[1],
                      nr.position[0], nr.position[1]
                    )
                    return dist < 0.05 || existing.name.toLowerCase() === nr.name.toLowerCase()
                  })
                  
                  if (!isDuplicate) {
                    allResults.push(nr)
                  }
                }
                
                console.log(`[NOMINATIM] Adicionados resultados únicos`)
              }
              
              // Se ainda não tem resultados, fazer busca genérica
              if (allResults.length === 0) {
                console.log('[SEARCH] Nenhum resultado, fazendo busca genérica...')
                const genericResults = await searchNominatim(`${query} ${searchCity}`, lat, lon)
                
                const genericFormatted = genericResults.slice(0, 15).map((r) => ({
                  name: r.name || r.display_name.split(',')[0],
                  address: r.display_name,
                  phone: r.extratags?.phone || null,
                  website: r.extratags?.website || null,
                  openingHours: r.extratags?.opening_hours || null,
                  cuisine: r.extratags?.cuisine || null,
                  distance: Math.round(haversineDistance(lat, lon, parseFloat(r.lat), parseFloat(r.lon)) * 10) / 10,
                  position: [parseFloat(r.lat), parseFloat(r.lon)] as [number, number],
                  source: 'nominatim' as const,
                }))
                
                allResults.push(...genericFormatted)
              }
              
              // Ordenar por distância e limitar
              const sortedResults = allResults
                .filter(r => r.distance <= searchRadius / 1000) // Filtrar pelo raio
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 25) // Aumentado para 25 resultados
              
              console.log(`[SEARCH] Total final: ${sortedResults.length} resultados`)

              return {
                success: true,
                type: 'combined',
                query,
                city: searchCity,
                total: sortedResults.length,
                results: sortedResults,
                searchedAt: new Date().toISOString(),
              }

            } catch (error) {
              console.error('[SEARCH] Error:', error)
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
                { id: 'restaurantes', name: '🍽️ Restaurantes', aliases: ['comida', 'alimentação', 'comer'] },
                { id: 'lanchonetes', name: '🍔 Lanchonetes/Fast Food', aliases: ['lanche', 'hamburguer', 'pizza'] },
                { id: 'cafes', name: '☕ Cafés', aliases: ['cafeteria', 'café'] },
                { id: 'bares', name: '🍺 Bares', aliases: ['bar', 'pub', 'balada'] },
                { id: 'padarias', name: '🥖 Padarias', aliases: ['padaria', 'confeitaria'] },
                { id: 'farmacias', name: '💊 Farmácias', aliases: ['drogaria', 'medicamento'] },
                { id: 'hospitais', name: '🏥 Hospitais/Clínicas', aliases: ['hospital', 'clinica', 'médico'] },
                { id: 'bancos', name: '🏦 Bancos', aliases: ['banco', 'caixa', 'lotérica'] },
                { id: 'supermercados', name: '🛒 Supermercados', aliases: ['mercado', 'compras'] },
                { id: 'postos', name: '⛽ Postos de Combustível', aliases: ['gasolina', 'combustível'] },
                { id: 'hoteis', name: '🏨 Hotéis/Pousadas', aliases: ['hospedagem', 'hotel'] },
                { id: 'escolas', name: '🏫 Escolas', aliases: ['educação', 'faculdade'] },
                { id: 'academias', name: '💪 Academias', aliases: ['fitness', 'esporte'] },
                { id: 'petshops', name: '🐕 Pet Shops', aliases: ['pet', 'animais'] },
                { id: 'saloes', name: '💇 Salões de Beleza', aliases: ['cabelo', 'beleza', 'barbearia'] },
                { id: 'oficinas', name: '🔧 Oficinas Mecânicas', aliases: ['carro', 'mecânico'] },
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
