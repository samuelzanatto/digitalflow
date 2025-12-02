import { NextRequest, NextResponse } from 'next/server'

// ============================================
// API de Busca por Categoria - Overpass API
// Busca estabelecimentos por tipo em uma área
// Totalmente gratuito usando OpenStreetMap
// ============================================

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
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
    website?: string
    opening_hours?: string
    cuisine?: string
    brand?: string
    [key: string]: string | undefined
  }
}

interface POIResult {
  id: string
  name: string
  position: [number, number]
  address: string
  category: string
  subcategory?: string
  phone?: string
  website?: string
  openingHours?: string
  brand?: string
  distance?: number
}

// Mapeamento de categorias para tags OSM
const categoryToOsmTags: Record<string, string> = {
  // Alimentação
  restaurantes: 'amenity=restaurant',
  cafes: 'amenity=cafe',
  bares: 'amenity=bar',
  fastfood: 'amenity=fast_food',
  padarias: 'shop=bakery',
  acougues: 'shop=butcher',
  pizzarias: 'amenity=restaurant][cuisine=pizza',
  
  // Saúde
  farmacias: 'amenity=pharmacy',
  hospitais: 'amenity=hospital',
  clinicas: 'amenity=clinic',
  medicos: 'amenity=doctors',
  dentistas: 'amenity=dentist',
  veterinarios: 'amenity=veterinary',
  
  // Compras
  supermercados: 'shop=supermarket',
  conveniencias: 'shop=convenience',
  shoppings: 'shop=mall',
  roupas: 'shop=clothes',
  eletronicos: 'shop=electronics',
  moveis: 'shop=furniture',
  petshops: 'shop=pet',
  
  // Serviços
  bancos: 'amenity=bank',
  postos: 'amenity=fuel',
  oficinas: 'shop=car_repair',
  cabeleireiros: 'shop=hairdresser',
  academias: 'leisure=fitness_centre',
  estacionamentos: 'amenity=parking',
  
  // Hospedagem
  hoteis: 'tourism=hotel',
  hostels: 'tourism=hostel',
  pousadas: 'tourism=guest_house',
  
  // Educação
  escolas: 'amenity=school',
  universidades: 'amenity=university',
  bibliotecas: 'amenity=library',
}

// Mapeamento de nomes de categorias
const categoryNames: Record<string, string> = {
  restaurantes: 'Restaurante',
  cafes: 'Café',
  bares: 'Bar',
  fastfood: 'Fast Food',
  padarias: 'Padaria',
  acougues: 'Açougue',
  pizzarias: 'Pizzaria',
  farmacias: 'Farmácia',
  hospitais: 'Hospital',
  clinicas: 'Clínica',
  medicos: 'Consultório Médico',
  dentistas: 'Dentista',
  veterinarios: 'Veterinário',
  supermercados: 'Supermercado',
  conveniencias: 'Conveniência',
  shoppings: 'Shopping',
  roupas: 'Loja de Roupas',
  eletronicos: 'Eletrônicos',
  moveis: 'Móveis',
  petshops: 'Pet Shop',
  bancos: 'Banco',
  postos: 'Posto de Combustível',
  oficinas: 'Oficina Mecânica',
  cabeleireiros: 'Cabeleireiro',
  academias: 'Academia',
  estacionamentos: 'Estacionamento',
  hoteis: 'Hotel',
  hostels: 'Hostel',
  pousadas: 'Pousada',
  escolas: 'Escola',
  universidades: 'Universidade',
  bibliotecas: 'Biblioteca',
}

// Calcular distância em km usando Haversine
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function buildAddress(tags: OverpassElement['tags']): string {
  if (!tags) return ''
  const parts = []
  if (tags['addr:street']) {
    let street = tags['addr:street']
    if (tags['addr:housenumber']) {
      street += `, ${tags['addr:housenumber']}`
    }
    parts.push(street)
  }
  if (tags['addr:city']) parts.push(tags['addr:city'])
  if (tags['addr:postcode']) parts.push(tags['addr:postcode'])
  return parts.join(' - ')
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get('category')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const radius = searchParams.get('radius') || '5000' // metros
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!category || !lat || !lon) {
    return NextResponse.json(
      { 
        error: 'Parameters "category", "lat" and "lon" are required',
        availableCategories: Object.keys(categoryToOsmTags),
      },
      { status: 400 }
    )
  }

  const osmTag = categoryToOsmTags[category.toLowerCase()]
  if (!osmTag) {
    return NextResponse.json(
      { 
        error: `Invalid category: ${category}`,
        availableCategories: Object.keys(categoryToOsmTags),
      },
      { status: 400 }
    )
  }

  try {
    // Construir query Overpass QL
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node[${osmTag}](around:${radius},${lat},${lon});
        way[${osmTag}](around:${radius},${lat},${lon});
      );
      out center tags;
    `

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data = await response.json()
    const elements: OverpassElement[] = data.elements || []

    // Transformar resultados
    const results: POIResult[] = elements
      .filter(el => el.tags?.name) // Filtrar apenas elementos com nome
      .map((item) => {
        const itemLat = item.lat || item.center?.lat || 0
        const itemLon = item.lon || item.center?.lon || 0
        
        const result: POIResult = {
          id: `${item.type}-${item.id}`,
          name: item.tags?.name || 'Sem nome',
          position: [itemLat, itemLon],
          address: buildAddress(item.tags),
          category: categoryNames[category.toLowerCase()] || category,
          subcategory: item.tags?.cuisine,
          phone: item.tags?.phone,
          website: item.tags?.website,
          openingHours: item.tags?.opening_hours,
          brand: item.tags?.brand,
          distance: calculateDistance(
            parseFloat(lat),
            parseFloat(lon),
            itemLat,
            itemLon
          ),
        }

        return result
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      category: categoryNames[category.toLowerCase()] || category,
      center: { lat: parseFloat(lat), lon: parseFloat(lon) },
      radius: parseInt(radius),
    })

  } catch (error) {
    console.error('Overpass API Error:', error)
    return NextResponse.json(
      { error: 'Failed to search POIs' },
      { status: 500 }
    )
  }
}

// Endpoint para listar categorias disponíveis
export async function OPTIONS() {
  return NextResponse.json({
    categories: Object.entries(categoryNames).map(([key, name]) => ({
      id: key,
      name,
    })),
  })
}
