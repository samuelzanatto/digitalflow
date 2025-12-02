import { NextRequest, NextResponse } from 'next/server'

// ============================================
// API de Busca de Estabelecimentos
// Usando Nominatim (OpenStreetMap) - Gratuito
// ============================================

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  class: string
  type: string
  place_rank: number
  importance: number
  addresstype: string
  name: string
  display_name: string
  address: {
    road?: string
    suburb?: string
    city?: string
    municipality?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
    [key: string]: string | undefined
  }
  boundingbox: string[]
  extratags?: {
    phone?: string
    website?: string
    opening_hours?: string
    [key: string]: string | undefined
  }
}

interface SearchResult {
  id: string
  name: string
  position: [number, number]
  address: string
  type: string
  category: string
  phone?: string
  website?: string
  openingHours?: string
  distance?: number
}

// Mapeamento de categorias OSM para português
const categoryMap: Record<string, string> = {
  restaurant: 'Restaurante',
  cafe: 'Café',
  bar: 'Bar',
  fast_food: 'Fast Food',
  pub: 'Pub',
  bank: 'Banco',
  pharmacy: 'Farmácia',
  hospital: 'Hospital',
  clinic: 'Clínica',
  doctors: 'Consultório Médico',
  dentist: 'Dentista',
  fuel: 'Posto de Combustível',
  supermarket: 'Supermercado',
  convenience: 'Conveniência',
  clothes: 'Loja de Roupas',
  shoes: 'Loja de Calçados',
  electronics: 'Eletrônicos',
  furniture: 'Móveis',
  hairdresser: 'Cabeleireiro',
  beauty: 'Salão de Beleza',
  gym: 'Academia',
  hotel: 'Hotel',
  hostel: 'Hostel',
  school: 'Escola',
  university: 'Universidade',
  library: 'Biblioteca',
  parking: 'Estacionamento',
  car_repair: 'Oficina Mecânica',
  car_wash: 'Lava-Jato',
  veterinary: 'Veterinário',
  pet: 'Pet Shop',
  bakery: 'Padaria',
  butcher: 'Açougue',
  mall: 'Shopping',
  department_store: 'Loja de Departamentos',
  marketplace: 'Mercado',
}

function getCategoryName(osmType: string): string {
  return categoryMap[osmType] || osmType.replace(/_/g, ' ')
}

// Calcular distância em km usando Haversine
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const radius = searchParams.get('radius') || '10' // km
  const limit = searchParams.get('limit') || '20'

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    )
  }

  try {
    // Construir URL de busca no Nominatim
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search')
    nominatimUrl.searchParams.set('q', query)
    nominatimUrl.searchParams.set('format', 'json')
    nominatimUrl.searchParams.set('addressdetails', '1')
    nominatimUrl.searchParams.set('extratags', '1')
    nominatimUrl.searchParams.set('limit', limit)
    nominatimUrl.searchParams.set('countrycodes', 'br') // Foco no Brasil
    
    // Se tiver coordenadas de centro, usar viewbox para priorizar área
    if (lat && lon) {
      const latNum = parseFloat(lat)
      const lonNum = parseFloat(lon)
      const radiusNum = parseFloat(radius)
      // Converter km para graus (aproximado)
      const latDelta = radiusNum / 111 // ~111 km por grau de latitude
      const lonDelta = radiusNum / (111 * Math.cos(latNum * Math.PI / 180))
      
      nominatimUrl.searchParams.set('viewbox', 
        `${lonNum - lonDelta},${latNum + latDelta},${lonNum + lonDelta},${latNum - latDelta}`
      )
      nominatimUrl.searchParams.set('bounded', '0') // Priorizar mas não limitar
    }

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'DigitalFlow/1.0 (https://digitalflow.app)', // Obrigatório pelo Nominatim
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data: NominatimResult[] = await response.json()

    // Transformar resultados
    const results: SearchResult[] = data.map((item) => {
      const result: SearchResult = {
        id: `${item.osm_type}-${item.osm_id}`,
        name: item.name || item.display_name.split(',')[0],
        position: [parseFloat(item.lat), parseFloat(item.lon)],
        address: item.display_name,
        type: item.type,
        category: getCategoryName(item.type),
        phone: item.extratags?.phone,
        website: item.extratags?.website,
        openingHours: item.extratags?.opening_hours,
      }

      // Calcular distância se tiver coordenadas de referência
      if (lat && lon) {
        result.distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lon),
          parseFloat(item.lat),
          parseFloat(item.lon)
        )
      }

      return result
    })

    // Ordenar por distância se disponível
    if (lat && lon) {
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      query,
    })

  } catch (error) {
    console.error('Map Search Error:', error)
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    )
  }
}
