'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePageHeader } from '@/hooks/usePageHeader'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { feature as topojsonFeature } from 'topojson-client'
import countries from 'world-countries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type GeoJSONPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

type GeoJSONMultiPolygon = {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

type GeoJSONFeature = {
  type: 'Feature'
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon
}

type GeoJSONFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

const RADIUS = 2.5

const progressStyles = `
  @keyframes progressBorder {
    from {
      stroke-dashoffset: 1000;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
  .progress-border {
    animation: progressBorder 5s linear forwards;
  }
`

type TrendPost = {
  title: string
  url: string
  score: number
  comments: number
}

type TrendMarker = {
  geo: string
  subreddit: string
  countryName: string
  posts: TrendPost[]
  lat: number
  lon: number
}

type WorldCountry = {
  cca2?: string
  latlng?: [number, number]
  name?: { common?: string }
}

const DEFAULT_TRENDS_GEOS = [
  'BR',
  'US',
  'CA',
  'MX',
  'AR',
  'CL',
  'CO',
  'GB',
  'DE',
  'FR',
  'ES',
  'IT',
  'PT',
  'NL',
  'SE',
  'NO',
  'PL',
  'TR',
  'ZA',
  'EG',
  'NG',
  'SA',
  'AE',
  'IN',
  'JP',
]

const SUBREDDIT_BY_GEO: Record<string, string> = {
  BR: 'brasil',
  US: 'unitedstates',
  CA: 'canada',
  MX: 'mexico',
  AR: 'argentina',
  CL: 'chile',
  CO: 'colombia',
  GB: 'unitedkingdom',
  DE: 'de',
  FR: 'france',
  ES: 'spain',
  IT: 'italy',
  PT: 'portugal',
  NL: 'thenetherlands',
  SE: 'sweden',
  NO: 'norway',
  PL: 'poland',
  TR: 'Turkey',
  ZA: 'southafrica',
  EG: 'Egypt',
  NG: 'Nigeria',
  SA: 'saudiarabia',
  AE: 'UAE',
  IN: 'india',
  JP: 'japan',
}

function lonLatToVector3(lon: number, lat: number, radius: number) {
  // Converte coordenadas geográficas (graus) para XYZ em esfera.
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

function OutlinedGlobe() {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const baseSphereRef = useRef<THREE.Mesh>(null)
  const [geojson, setGeojson] = useState<GeoJSONFeatureCollection | null>(null)
  const [trendMarkers, setTrendMarkers] = useState<TrendMarker[]>([])
  const [selectedMarker, setSelectedMarker] = useState<TrendMarker | null>(null)

  const [cardMarker, setCardMarker] = useState<TrendMarker | null>(null)
  const [cardVisible, setCardVisible] = useState(false)
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedCountryGeo, setLockedCountryGeo] = useState<string | null>(null)
  const postIndexByGeoRef = useRef<Map<string, number>>(new Map())
  const lockedGeoRef = useRef<string | null>(null)
  const hideCardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swapCardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cardVisibleRef = useRef(false)
  const cardGeoRef = useRef<string | null>(null)
  const pendingGeoRef = useRef<string | null>(null)

  const candidateRef = useRef<TrendMarker | null>(null)
  const candidateSinceRef = useRef<number>(0)
  const hideSinceRef = useRef<number>(0)

  const selectedRef = useRef(selectedMarker)
  useEffect(() => {
    selectedRef.current = selectedMarker
  }, [selectedMarker])

  // Carrossel automático: troca de post a cada 5 segundos com fade suave
  useEffect(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current)
      carouselIntervalRef.current = null
    }

    if (!cardMarker || !cardMarker.posts || cardMarker.posts.length <= 1) {
      return
    }

    // Se país está fixado, não avança automaticamente
    if (lockedGeoRef.current === cardMarker.geo) {
      return
    }

    // Recupera o índice atual deste país ou começa do próximo
    const currentGeo = cardMarker.geo
    const lastIndex = postIndexByGeoRef.current.get(currentGeo) ?? -1
    const startIndex = (lastIndex + 1) % cardMarker.posts.length
    
    // Atualiza para o índice inicial
    const updateIndex = () => {
      setCurrentPostIndex(startIndex)
      postIndexByGeoRef.current.set(currentGeo, startIndex)
    }
    requestAnimationFrame(updateIndex)

    carouselIntervalRef.current = setInterval(() => {
      setCurrentPostIndex((prev) => {
        if (!cardMarker) return 0
        const nextIndex = (prev + 1) % cardMarker.posts.length
        
        // Salva o novo índice para este país
        postIndexByGeoRef.current.set(currentGeo, nextIndex)
        
        // Fade out/in suave ao trocar
        setCardVisible(false)
        setTimeout(() => {
          setCardVisible(true)
        }, 200)
        
        return nextIndex
      })
    }, 5000) // Troca a cada 5 segundos

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current)
        carouselIntervalRef.current = null
      }
    }
  }, [cardMarker])

  // Carregar contornos de países (Natural Earth 110m via world-atlas)
  useEffect(() => {
    let cancelled = false

    async function load() {
      const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      const topo = await res.json()

      const countriesObject = topo?.objects?.countries
      if (!countriesObject) return

      const fc = topojsonFeature(topo, countriesObject) as unknown as GeoJSONFeatureCollection
      if (!cancelled) setGeojson(fc)
    }

    load().catch(() => {
      // Silencioso: se falhar a rede, apenas não renderiza as linhas.
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Manter a esfera opaca, mas com o “cinza suave” (sem transparência).
  useEffect(() => {
    const mesh = baseSphereRef.current
    const material = mesh?.material as THREE.MeshBasicMaterial | undefined
    if (!mesh || !material) return

    material.color = new THREE.Color('#e5e7eb').multiplyScalar(0.02)
  }, [])

  // Rotação contínua do globo
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0012
    }

    // Seleção automática: marcador mais central na face visível.
    // A face visível é definida pelo hemisfério voltado para a câmera.
    const group = groupRef.current
    if (!group || trendMarkers.length === 0) return

    const front = camera.position.clone().normalize()
    const yAxis = new THREE.Vector3(0, 1, 0)
    const rotationY = group.rotation.y

    // Se há país fixado, força a seleção daquele país E centraliza no globo
    if (lockedGeoRef.current) {
      const lockedMarker = trendMarkers.find(m => m.geo === lockedGeoRef.current)
      if (lockedMarker && selectedRef.current?.geo !== lockedGeoRef.current) {
        setSelectedMarker(lockedMarker)
        if (cardGeoRef.current !== lockedGeoRef.current) {
          setCardMarker(lockedMarker)
          cardGeoRef.current = lockedGeoRef.current
          requestAnimationFrame(() => {
            setCardVisible(true)
            cardVisibleRef.current = true
          })
        }
      }
      
      // Rotaciona o globo para centralizar o país fixado
      if (lockedMarker) {
        // Calcula qual rotação Y levaria o país para o front (0 radianos)
        const targetRotationY = -lockedMarker.lon * (Math.PI / 180)
        const diff = targetRotationY - rotationY
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff))
        
        // Interpolação suave na direção do alvo (velocidade: 0.05 radianos por frame)
        const rotationSpeed = 0.05
        const newRotation = rotationY + Math.max(-rotationSpeed, Math.min(rotationSpeed, normalizedDiff))
        
        if (group) {
          group.rotation.y = newRotation
        }
      }
      return
    }

    let best: { m: TrendMarker; dot: number } | null = null
    for (const m of trendMarkers) {
      // Direção unitária do marcador (em coordenadas locais) e aplicada rotação do grupo.
      const dir = lonLatToVector3(m.lon, m.lat, 1).normalize().applyAxisAngle(yAxis, rotationY)
      const dot = dir.dot(front)
      if (dot <= 0) continue // lado de trás
      if (!best || dot > best.dot) best = { m, dot }
    }

    // Threshold: só mostra card quando estiver razoavelmente centralizado.
    const threshold = 0.62
    const lockMs = 280
    const hideMs = 220
    const now = performance.now()

    const current = selectedRef.current

    if (!best || best.dot < threshold) {
      candidateRef.current = null
      candidateSinceRef.current = 0

      if (current) {
        if (!hideSinceRef.current) hideSinceRef.current = now
        if (now - hideSinceRef.current >= hideMs) {
          setSelectedMarker(null)
          hideSinceRef.current = 0
        }
      }

      // Fade out suave do card, e só remove do DOM após a transição.
      if (cardVisibleRef.current) {
        setCardVisible(false)
        cardVisibleRef.current = false

        if (swapCardTimeoutRef.current) {
          clearTimeout(swapCardTimeoutRef.current)
          swapCardTimeoutRef.current = null
        }
        pendingGeoRef.current = null

        if (hideCardTimeoutRef.current) clearTimeout(hideCardTimeoutRef.current)
        hideCardTimeoutRef.current = setTimeout(() => {
          setCardMarker(null)
          cardGeoRef.current = null
          hideCardTimeoutRef.current = null
        }, 220)
      }
      return
    }

    // voltou a ter candidato visível, cancela contagem de hide
    hideSinceRef.current = 0

    // Se há candidato visível, cancela qualquer limpeza pendente.
    if (hideCardTimeoutRef.current) {
      clearTimeout(hideCardTimeoutRef.current)
      hideCardTimeoutRef.current = null
    }

    const candidate = candidateRef.current
    if (!candidate || candidate.geo !== best.m.geo) {
      candidateRef.current = best.m
      candidateSinceRef.current = now
      return
    }

    if (!current || current.geo !== best.m.geo) {
      if (now - candidateSinceRef.current >= lockMs) {
        setSelectedMarker(best.m)

        // Troca/mostra o card apenas quando realmente mudou.
        if (cardGeoRef.current !== best.m.geo) {
          const nextGeo = best.m.geo

          // Evita re-agendar o mesmo swap a cada frame.
          if (pendingGeoRef.current !== nextGeo) {
            pendingGeoRef.current = nextGeo

            // Se já está visível, faz crossfade (saída -> troca -> entrada).
            if (cardVisibleRef.current) {
              setCardVisible(false)
              cardVisibleRef.current = false

              if (swapCardTimeoutRef.current) clearTimeout(swapCardTimeoutRef.current)
              swapCardTimeoutRef.current = setTimeout(() => {
                setCardMarker(best.m)
                cardGeoRef.current = nextGeo
                pendingGeoRef.current = null

                requestAnimationFrame(() => {
                  setCardVisible(true)
                  cardVisibleRef.current = true
                })

                swapCardTimeoutRef.current = null
              }, 160)
            } else {
              // Se está oculto, apenas troca e mostra.
              setCardMarker(best.m)
              cardGeoRef.current = nextGeo
              pendingGeoRef.current = null
              requestAnimationFrame(() => {
                setCardVisible(true)
                cardVisibleRef.current = true
              })
            }
          }
        } else if (!cardVisibleRef.current) {
          // Mesmo marker, mas card estava invisível: reaparece suave.
          requestAnimationFrame(() => {
            setCardVisible(true)
            cardVisibleRef.current = true
          })
        }
      }
    }
  })

  // Buscar tendências (top 1 por país) e mapear para coordenadas aproximadas.
  useEffect(() => {
    let cancelled = false

    const countryByCca2 = new Map<string, { lat: number; lon: number }>()
    const countryNameByCca2 = new Map<string, string>()
    for (const c of countries as unknown as WorldCountry[]) {
      const cca2 = String(c.cca2 || '').toUpperCase()
      const latlng = c.latlng
      if (!cca2 || !Array.isArray(latlng) || latlng.length < 2) continue
      const lat = Number(latlng[0])
      const lon = Number(latlng[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      countryByCca2.set(cca2, { lat, lon })

      const commonName = c?.name?.common
      if (typeof commonName === 'string' && commonName.trim()) {
        countryNameByCca2.set(cca2, commonName.trim())
      }
    }

    async function loadTrends() {
      const geos = DEFAULT_TRENDS_GEOS
        .map((g) => String(g || '').toUpperCase())
        .filter((g) => Boolean(SUBREDDIT_BY_GEO[g]))

      const subreddits = geos.map((g) => SUBREDDIT_BY_GEO[g])
      const res = await fetch(
        `/api/reddit?subreddit=${encodeURIComponent(subreddits.join(','))}&time=day&limit=10`
      )
      if (!res.ok) return
      const json = await res.json()

      const posts = Array.isArray(json?.data) ? json.data : []
      const postsBySubreddit = new Map<string, TrendPost[]>()

      for (const p of posts) {
        const subreddit = typeof p?.subreddit === 'string' ? p.subreddit : null
        const title = typeof p?.title === 'string' ? p.title : null
        const score = typeof p?.score === 'number' ? p.score : null
        const url = typeof p?.url === 'string' ? p.url : null
        const comments = typeof p?.comments === 'number' ? p.comments : 0
        if (!subreddit || !title || score === null || !url) continue

        const existing = postsBySubreddit.get(subreddit) || []
        existing.push({ title, url, score, comments })
        postsBySubreddit.set(subreddit, existing)
      }

      const markers: TrendMarker[] = []

      for (const geo of geos) {
        const subreddit = SUBREDDIT_BY_GEO[geo]
        const subredditPosts = postsBySubreddit.get(subreddit)
        if (!subredditPosts || subredditPosts.length === 0) continue
        const coord = countryByCca2.get(geo)
        if (!coord) continue

        const countryName = countryNameByCca2.get(geo) || geo
        markers.push({
          geo,
          subreddit,
          countryName,
          posts: subredditPosts,
          lat: coord.lat,
          lon: coord.lon,
        })
      }

      if (!cancelled) setTrendMarkers(markers)
    }

    loadTrends().catch(() => {
      // Silencioso se a API falhar.
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Atualizar o header via evento global (sem criar UI extra aqui dentro).
  useEffect(() => {
    if (!selectedMarker || !selectedMarker.posts || selectedMarker.posts.length === 0) return
    const currentPost = selectedMarker.posts[0]
    window.dispatchEvent(
      new CustomEvent('digitalflow:trend-selected', {
        detail: { geo: selectedMarker.geo, title: currentPost.title },
      })
    )
  }, [selectedMarker])

  const markerGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.04, 12, 12)
    return geometry
  }, [])

  const markerMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({ color: '#e5e7eb' })
  }, [])

  const linesGeometry = useMemo(() => {
    if (!geojson) return null

    const positions: number[] = []

    const pushRing = (ring: number[][]) => {
      if (!ring || ring.length < 2) return

      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i]
        const [lon2, lat2] = ring[i + 1]

        const p1 = lonLatToVector3(lon1, lat1, RADIUS)
        const p2 = lonLatToVector3(lon2, lat2, RADIUS)

        positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
      }
    }

    for (const f of geojson.features) {
      const geom = f.geometry
      if (!geom) continue

      if (geom.type === 'Polygon') {
        for (const ring of geom.coordinates) pushRing(ring)
      }

      if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          for (const ring of poly) pushRing(ring)
        }
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [geojson])

  return (
    <group
      ref={groupRef}
      onPointerDown={(e) => {
        // Clique fora do card = desseleciona/libera o país fixado
        if ((e.target as HTMLElement)?.tagName !== 'A') {
          lockedGeoRef.current = null
          setLockedCountryGeo(null)
          setIsLocked(false)
        }
      }}
    >
      {/* Esfera base sutil para dar volume ao globo */}
      <mesh ref={baseSphereRef}>
        <sphereGeometry args={[RADIUS - 0.02, 64, 64]} />
        <meshBasicMaterial color="#e5e7eb" />
      </mesh>

      {linesGeometry && (
        <lineSegments geometry={linesGeometry}>
          <lineBasicMaterial color="#e5e7eb" linewidth={1} transparent opacity={0.5} />
        </lineSegments>
      )}

      {/* Marcadores de tendências */}
      {trendMarkers.map((m) => {
        const p = lonLatToVector3(m.lon, m.lat, RADIUS + 0.03)
        return (
          <mesh
            key={m.geo}
            geometry={markerGeometry}
            material={markerMaterial}
            position={[p.x, p.y, p.z]}
          />
        )
      })}

      {/* Card flutuante conectado ao ponto selecionado */}
      {useMemo(
        () => {
          if (!cardMarker || !cardMarker.posts || cardMarker.posts.length === 0) {
            return null
          }

          const p = lonLatToVector3(cardMarker.lon, cardMarker.lat, RADIUS + 0.03)
          const currentPost = cardMarker.posts[currentPostIndex] || cardMarker.posts[0]

          return (
            <Html
              position={[p.x, p.y, p.z]}
              sprite
              zIndexRange={[10, 0]}
              onPointerDown={(e) => {
                e.stopPropagation()
              }}
            >
              {/* Wrapper fixo: ancora o card acima do ponto */}
              <div className="relative -translate-x-1/2 -translate-y-full -mt-3">
                {/* SVG de progresso ao redor do card */}
                {cardMarker.posts.length > 1 && (
                  <svg
                    key={`${cardMarker.geo}-${currentPostIndex}`}
                    className="absolute inset-0 pointer-events-none z-10"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="none"
                  >
                    <style>{progressStyles}</style>
                    <rect
                      className="progress-border"
                      x="1.5"
                      y="1.5"
                      width="calc(100% - 3px)"
                      height="calc(100% - 3px)"
                      rx="8"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="1000"
                      opacity="0.8"
                    />
                  </svg>
                )}
                
                {/* Wrapper animado: faz fade/slide sem mexer na ancoragem */}
                <div
                  className="relative"
                  onClick={(e) => {
                    // Clique no card (fora do link) = fixa o país
                    if ((e.target as HTMLElement)?.tagName !== 'A') {
                      lockedGeoRef.current = cardMarker.geo
                      setLockedCountryGeo(cardMarker.geo)
                      setIsLocked(true)
                    }
                  }}
                >
                  <Card className="w-80 bg-background/90 backdrop-blur cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>
                          {cardMarker.countryName}
                          {isLocked && lockedCountryGeo === cardMarker.geo && (
                            <span className="text-xs ml-2 text-amber-400">📌</span>
                          )}
                        </span>
                        {cardMarker.posts.length > 1 && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {currentPostIndex + 1}/{cardMarker.posts.length}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent 
                      key={`${cardMarker.geo}-post-${currentPostIndex}`}
                      className={
                        'pt-0 transition-opacity duration-300 ' +
                        (cardVisible ? 'opacity-100' : 'opacity-0')
                      }
                    >
                      <a
                        href={currentPost.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm hover:underline"
                      >
                        {currentPost.title}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        score {currentPost.score} · {currentPost.comments} comentários
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Html>
          )
        },
        [cardMarker, currentPostIndex, cardVisible, isLocked, lockedCountryGeo]
      )}
    </group>
  )
}

export default function MapaPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader('Mapa de Trends', 'Contornos de países e continentes')
  }, [setPageHeader])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { geo?: string; title?: string } | undefined
      if (!detail?.geo || !detail?.title) return
      setPageHeader('Mapa de Trends', `${detail.geo}: ${detail.title}`)
    }

    window.addEventListener('digitalflow:trend-selected', handler)
    return () => window.removeEventListener('digitalflow:trend-selected', handler)
  }, [setPageHeader])

  return (
    <div className="flex flex-1 h-full bg-black overflow-hidden relative">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true }}
      >
        {/* Iluminação (sutil, para dar profundidade nas linhas) */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        
        {/* Estrelas de fundo */}
        <Stars 
          radius={300} 
          depth={60} 
          count={20000} 
          factor={7} 
          saturation={0} 
          fade 
          speed={1}
        />
        
        {/* Contornos (sem preenchimento) */}
        <OutlinedGlobe />
        
        {/* Controles de órbita (arrastar, zoom) */}
        <OrbitControls 
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
