'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useEditor } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ChevronDown } from 'lucide-react'
import { AVAILABLE_FONTS } from '@/lib/fonts'
import { getUserPages } from '@/lib/actions/pages'

export function PropertiesPanel() {
  const { selectedNodeId } = useEditor((state) => {
    const selected = Array.from(state.events.selected)
    return {
      selectedNodeId: selected.length > 0 ? selected[0] : null,
    }
  })

  if (!selectedNodeId) {
    return (
      <div className="h-full flex flex-col border-l bg-card">
        <div className="px-4 py-3 border-b bg-background">
          <h2 className="text-sm font-semibold">Propriedades</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Selecione um elemento para editar</p>
        </div>
      </div>
    )
  }

  return <PropertyPanelContent nodeId={selectedNodeId} />
}

interface PropertyPanelContentProps {
  nodeId: string
}

type PageOption = {
  id: string
  title: string
  slug: string
}

// Categorizar propriedades em seções
function categorizeProps(props: Record<string, unknown>) {
  const sections: Record<string, Record<string, unknown>> = {
    'Conteúdo': {},
    'Dimensões': {},
    'Padding': {},
    'Margens': {},
    'Layout': {},
    'Cores & Estilos': {},
    'Outro': {},
  }

  const dimensionKeys = ['width', 'height', 'minHeight', 'margin', 'flex', 'playerWidth']
  const paddingKeys = ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingLinked']
  const marginKeys = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginLinked']
  const layoutKeys = ['display', 'flexDirection', 'gap', 'justifyContent', 'alignItems']
  const colorKeys = ['backgroundColor', 'textColor', 'color', 'borderColor']
  const contentKeys = ['text', 'content', 'title', 'subtitle', 'link', 'linkType', 'linkUrl', 'linkPageSlug', 'openInNewTab']
  const styleKeys = ['fontSize', 'borderRadius', 'borderWidth', 'alignment', 'fontFamily', 'fontWeight']

  Object.entries(props).forEach(([key, value]) => {
    if (contentKeys.includes(key)) sections['Conteúdo'][key] = value
    else if (paddingKeys.includes(key)) sections['Padding'][key] = value
    else if (marginKeys.includes(key)) sections['Margens'][key] = value
    else if (dimensionKeys.includes(key)) sections['Dimensões'][key] = value
    else if (layoutKeys.includes(key)) sections['Layout'][key] = value
    else if (colorKeys.includes(key)) sections['Cores & Estilos'][key] = value
    else if (styleKeys.includes(key)) sections['Cores & Estilos'][key] = value
    else sections['Outro'][key] = value
  })

  return Object.fromEntries(Object.entries(sections).filter(([, v]) => Object.keys(v).length > 0))
}

function PropertyPanelContent({ nodeId }: PropertyPanelContentProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [availablePages, setAvailablePages] = useState<PageOption[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const hasLoadedPagesRef = useRef(false)

  const { actions: { setProp }, nodes } = useEditor((state) => ({
    nodes: state.nodes,
  }))

  const node = nodes[nodeId]
  const props = node?.data.props || {}
  const data = node?.data || {}

  const displayName = (data as Record<string, unknown>)?.displayName || 'Componente'
  const isRootContainer = nodeId === 'root-container'
  const finalDisplayName = isRootContainer ? `${displayName} (Raiz)` : displayName
  const sections = categorizeProps(props as Record<string, unknown>)

  useEffect(() => {
    if (hasLoadedPagesRef.current) return
    hasLoadedPagesRef.current = true

    const fetchPages = async () => {
      setIsLoadingPages(true)
      try {
  const result = await getUserPages()
        if (result.success && Array.isArray(result.data)) {
          const mapped = (result.data as Array<{ id: string; title: string; slug: string }>).
            map((page) => ({ id: page.id, title: page.title, slug: page.slug }))
          setAvailablePages(mapped)
        }
      } catch (error) {
        console.error('Erro ao carregar páginas disponíveis:', error)
      } finally {
        setIsLoadingPages(false)
      }
    }

    fetchPages()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Renderizar seção de Padding com UI visual
  const renderPaddingSection = (paddingProps: Record<string, unknown>) => {
    const paddingTop = (paddingProps.paddingTop as number) || 0
    const paddingBottom = (paddingProps.paddingBottom as number) || 0
    const paddingLeft = (paddingProps.paddingLeft as number) || 0
    const paddingRight = (paddingProps.paddingRight as number) || 0
    const paddingLinked = (paddingProps.paddingLinked as boolean) ?? true

    const handlePaddingChange = (side: 'Top' | 'Bottom' | 'Left' | 'Right', value: number) => {
      // Sempre ler o valor atual de paddingLinked do props para evitar stale closure
      const currentLinked = (paddingProps.paddingLinked as boolean) ?? true
      const key = `padding${side}`
      
      setProp(nodeId, (pr: Record<string, unknown>) => {
        if (currentLinked) {
          // Se vinculado, muda todos os 4
          pr.paddingTop = value
          pr.paddingBottom = value
          pr.paddingLeft = value
          pr.paddingRight = value
        } else {
          // Se desvinculado, muda apenas o lado específico
          pr[key] = value
        }
      })
    }

    return (
      <div className="space-y-3 p-2 bg-muted/20 rounded border">
        {/* Switch de Vincular/Desvincular */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Vincular Paddings</Label>
          <Switch
            checked={paddingLinked}
            onCheckedChange={(checked) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.paddingLinked = checked
              })
            }
          />
        </div>

        {/* Representação visual tipo Figma */}
        <div className="flex flex-col items-center gap-2 py-2">
          {/* Top */}
          <div className="flex justify-center">
            <div className="w-16 h-6 flex items-center justify-center bg-blue-500/30 rounded text-xs font-mono text-muted-foreground border border-blue-500/50">
              {paddingTop}
            </div>
          </div>

          {/* Left, Center, Right */}
          <div className="flex gap-2 justify-center">
            <div className="w-6 h-12 flex items-center justify-center bg-blue-500/30 rounded text-xs font-mono text-muted-foreground border border-blue-500/50">
              {paddingLeft}
            </div>
            <div className="w-24 h-12 flex items-center justify-center bg-gray-300/30 rounded text-xs font-mono text-muted-foreground border border-dashed border-gray-400">
              box
            </div>
            <div className="w-6 h-12 flex items-center justify-center bg-blue-500/30 rounded text-xs font-mono text-muted-foreground border border-blue-500/50">
              {paddingRight}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex justify-center">
            <div className="w-16 h-6 flex items-center justify-center bg-blue-500/30 rounded text-xs font-mono text-muted-foreground border border-blue-500/50">
              {paddingBottom}
            </div>
          </div>
        </div>

        {/* Sliders individuais */}
        <div className="space-y-2 pt-2 border-t">
          {/* Top */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Topo</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={paddingTop}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    handlePaddingChange('Top', Math.min(Math.max(val, 0), 500))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={500}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={500}
              step={1}
              value={[paddingTop]}
              onValueChange={(v) => handlePaddingChange('Top', v[0])}
            />
          </div>

          {/* Right */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Direita</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={paddingRight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    handlePaddingChange('Right', Math.min(Math.max(val, 0), 500))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={500}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={500}
              step={1}
              value={[paddingRight]}
              onValueChange={(v) => handlePaddingChange('Right', v[0])}
            />
          </div>

          {/* Bottom */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Base</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={paddingBottom}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    handlePaddingChange('Bottom', Math.min(Math.max(val, 0), 500))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={500}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={500}
              step={1}
              value={[paddingBottom]}
              onValueChange={(v) => handlePaddingChange('Bottom', v[0])}
            />
          </div>

          {/* Left */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Esquerda</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={paddingLeft}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    handlePaddingChange('Left', Math.min(Math.max(val, 0), 500))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={500}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={500}
              step={1}
              value={[paddingLeft]}
              onValueChange={(v) => handlePaddingChange('Left', v[0])}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderMarginSection = (marginProps: Record<string, unknown>) => {
    const marginTop = (marginProps.marginTop as number) || 0
    const marginBottom = (marginProps.marginBottom as number) || 0
    const marginLeft = (marginProps.marginLeft as number) || 0
    const marginRight = (marginProps.marginRight as number) || 0
    const marginLinked = (marginProps.marginLinked as boolean) ?? true

    const handleMarginChange = (side: 'Top' | 'Bottom' | 'Left' | 'Right', value: number) => {
      const currentLinked = (marginProps.marginLinked as boolean) ?? true
      const key = `margin${side}`

      setProp(nodeId, (pr: Record<string, unknown>) => {
        if (currentLinked) {
          pr.marginTop = value
          pr.marginBottom = value
          pr.marginLeft = value
          pr.marginRight = value
        } else {
          pr[key] = value
        }
      })
    }

    const clampMargin = (val: number) => Math.max(Math.min(val, 500), -500)

    return (
      <div className="space-y-3 p-2 bg-muted/20 rounded border">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Vincular Margens</Label>
          <Switch
            checked={marginLinked}
            onCheckedChange={(checked) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.marginLinked = checked
              })
            }
          />
        </div>

        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex justify-center">
            <div className="w-16 h-6 flex items-center justify-center bg-emerald-500/30 rounded text-xs font-mono text-muted-foreground border border-emerald-500/50">
              {marginTop}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <div className="w-6 h-12 flex items-center justify-center bg-emerald-500/30 rounded text-xs font-mono text-muted-foreground border border-emerald-500/50">
              {marginLeft}
            </div>
            <div className="w-24 h-12 flex items-center justify-center bg-muted rounded text-xs font-mono text-muted-foreground border border-dashed border-gray-400">
              outer
            </div>
            <div className="w-6 h-12 flex items-center justify-center bg-emerald-500/30 rounded text-xs font-mono text-muted-foreground border border-emerald-500/50">
              {marginRight}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-16 h-6 flex items-center justify-center bg-emerald-500/30 rounded text-xs font-mono text-muted-foreground border border-emerald-500/50">
              {marginBottom}
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          {[
            { label: 'Topo', value: marginTop, side: 'Top' },
            { label: 'Direita', value: marginRight, side: 'Right' },
            { label: 'Base', value: marginBottom, side: 'Bottom' },
            { label: 'Esquerda', value: marginLeft, side: 'Left' },
          ].map(({ label, value, side }) => (
            <div className="space-y-1" key={label}>
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium">{label}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      handleMarginChange(side as 'Top' | 'Bottom' | 'Left' | 'Right', clampMargin(val))
                    }}
                    className="text-xs w-16 px-2 py-1"
                    min={-500}
                    max={500}
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <Slider
                min={-500}
                max={500}
                step={1}
                value={[value]}
                onValueChange={(v) => handleMarginChange(side as 'Top' | 'Bottom' | 'Left' | 'Right', clampMargin(v[0]))}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPropertyInput = (key: string, value: unknown, allProps: Record<string, unknown>) => {
    // Pular renderização de paddings individuais (já renderizados na seção especial)
    if (['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingLinked'].includes(key)) {
      return null
    }

    if (['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginLinked'].includes(key)) {
      return null
    }

    if (['linkUrl', 'linkPageSlug', 'openInNewTab'].includes(key)) {
      return null
    }

    if (key === 'linkType') {
      const linkTypeValue = (value as 'url' | 'page') ?? 'url'
      const legacyLink = (allProps.link as string) || ''
      const linkUrlFromProps = (allProps.linkUrl as string) || ''
      const linkPageFromProps = (allProps.linkPageSlug as string) || ''
      const linkUrl = linkUrlFromProps || (!legacyLink.startsWith('/page/') ? legacyLink : '')
      const linkPageSlug = linkPageFromProps || (legacyLink.startsWith('/page/') ? legacyLink.replace('/page/', '') : '')
      const openInNewTab = Boolean(allProps.openInNewTab)
      const NO_PAGE_SELECTED_VALUE = '__no_page_selected__'

      return (
        <div key="cta-link-settings" className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Destino</Label>
            <Select
              value={linkTypeValue}
              onValueChange={(next) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.linkType = next
                })
              }
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL externa</SelectItem>
                <SelectItem value="page">Página interna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {linkTypeValue === 'url' ? (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Link (https://...)</Label>
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.linkUrl = e.target.value
                    pr.link = e.target.value
                  })
                }
                placeholder="https://"
                className="text-xs"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Página</Label>
              <Select
                value={linkPageSlug || NO_PAGE_SELECTED_VALUE}
                onValueChange={(slug) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    const normalizedSlug = slug === NO_PAGE_SELECTED_VALUE ? '' : slug
                    pr.linkPageSlug = normalizedSlug
                    pr.link = normalizedSlug ? `/page/${normalizedSlug}` : ''
                  })
                }
                disabled={isLoadingPages || availablePages.length === 0}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={isLoadingPages ? 'Carregando...' : 'Selecione uma página'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PAGE_SELECTED_VALUE}>Nenhum destino</SelectItem>
                  {isLoadingPages && <SelectItem value="__loading" disabled>Carregando páginas...</SelectItem>}
                  {!isLoadingPages && availablePages.length === 0 && (
                    <SelectItem value="__empty" disabled>Nenhuma página encontrada</SelectItem>
                  )}
                  {availablePages.map((page) => (
                    <SelectItem key={page.id} value={page.slug}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linkPageSlug && (
                <p className="text-[11px] text-muted-foreground">/page/{linkPageSlug}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Abrir em nova aba</Label>
            <Switch
              checked={openInNewTab}
              onCheckedChange={(checked) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.openInNewTab = checked
                })
              }
            />
          </div>
        </div>
      )
    }

    // Também pular padding geral se estiver na seção de Padding
    if (key === 'padding') {
      return null
    }

    // Criar uma cópia mutável das props para evitar "read only property" error
    const mutableProps = { ...allProps }
    
    // File upload para videoUrl
    if (key === 'videoUrl') {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  const url = event.target?.result as string
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr[key] = url
                  })
                }
                reader.readAsDataURL(file)
              }
            }}
            className="text-xs w-full"
          />
          {typeof value === 'string' && value.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">✓ Vídeo carregado</p>
          )}
        </div>
      )
    }
    
    // Propriedades de texto que devem ser renderizadas como textarea/input text
    const textProperties = ['content', 'text', 'title', 'subtitle', 'link', 'placeholder', 'label', 'youtubeUrl', 'thumbnailUrl']
    
    if (textProperties.includes(key)) {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <textarea
            value={String(value) || ''}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr[key] = e.target.value
              })
            }
            className="text-xs w-full p-2 rounded border bg-background min-h-20 resize-none"
            placeholder={`${key}...`}
          />
        </div>
      )
    }
    
    // Converter strings que deveriam ser números
    let processedValue = value
    if (typeof value === 'string') {
      // Se é um número como string, converte
      if (!isNaN(Number(value))) {
        processedValue = Number(value)
      }
      // Se é "auto" ou "100%", trata como height/width especial
      if ((key === 'height' && value === 'auto') || (key === 'width' && value === '100%')) {
        if (key === 'height') {
          processedValue = 0 // auto = 0
        }
        if (key === 'width') {
          processedValue = 400 // valor padrão, mas fullWidth será true
          mutableProps.fullWidth = true
        }
      }
    }
    
    // Cores
    if (typeof processedValue === 'string' && processedValue.startsWith('#')) {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={processedValue || '#000000'}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = e.target.value
                })
              }
              className="w-12 h-8 rounded border cursor-pointer"
            />
            <Input
              value={processedValue || '#000000'}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = e.target.value
                })
              }
              className="flex-1 text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      )
    }

    // Números (sliders para propriedades específicas)
    if (typeof processedValue === 'number') {
      const isSlider = [
        'fontSize',
        'padding',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'margin',
        'borderRadius',
        'borderWidth',
        'gap',
        'flex',
        'width',
        'height',
        'minHeight',
        'playerWidth',
      ].includes(key)

      if (isSlider) {
        const maxValues: Record<string, number> = {
          fontSize: 72,
          padding: 500,
          paddingTop: 500,
          paddingBottom: 500,
          paddingLeft: 500,
          paddingRight: 500,
          margin: 500,
          borderRadius: 50,
          borderWidth: 10,
          gap: 200,
          flex: 10,
          width: 1200,
          height: 800,
          minHeight: 1600,
          playerWidth: 2000,
        }

        // Se width e fullWidth está ativo, desabilita o controle
        const widthIsFullWidth = key === 'width' && (mutableProps.fullWidth as boolean)
        const widthIsFullBleed = key === 'width' && (mutableProps.fullBleed as boolean)
        const isWidthLocked = widthIsFullWidth || widthIsFullBleed
        const widthLockMessage = widthIsFullBleed
          ? 'Full Bleed ativado'
          : widthIsFullWidth
            ? 'Full Width ativado'
            : null

        const sliderContent = (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={processedValue}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0
                    const max = maxValues[key] || 100
                    const clampedValue = Math.min(Math.max(newValue, 0), max)
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr[key] = clampedValue
                    })
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={maxValues[key] || 100}
                  disabled={isWidthLocked}
                />
                {(key === 'width' || key === 'height' || key === 'padding' || key === 'paddingTop' || key === 'paddingBottom' || key === 'paddingLeft' || key === 'paddingRight' || key === 'margin' || key === 'gap' || key === 'playerWidth') && (
                  <span className="text-xs text-muted-foreground">px</span>
                )}
              </div>
            </div>
            {!isWidthLocked && (
              <Slider
                min={0}
                max={maxValues[key] || 100}
                step={key === 'flex' ? 0.1 : 1}
                value={[processedValue as number]}
                onValueChange={(v) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr[key] = v[0]
                  })
                }
              />
            )}
            {isWidthLocked && widthLockMessage && (
              <p className="text-xs text-muted-foreground italic">{widthLockMessage}</p>
            )}
            {/* Mostrar Full Width checkbox abaixo do width slider */}
            {key === 'width' && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Full Width</Label>
                  <input
                    type="checkbox"
                    checked={mutableProps.fullWidth as boolean}
                    onChange={(e) =>
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        pr.fullWidth = e.target.checked
                        if (e.target.checked) {
                          pr.fullBleed = false
                        }
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Full Bleed</Label>
                  <input
                    type="checkbox"
                    checked={mutableProps.fullBleed as boolean}
                    onChange={(e) =>
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        pr.fullBleed = e.target.checked
                        if (e.target.checked) {
                          pr.fullWidth = false
                        }
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Full Bleed força o container a ocupar 100% da viewport e ignora o padding lateral do container raiz.
                </p>
              </div>
            )}
            {/* Mostrar Auto Height checkbox abaixo do height slider */}
            {key === 'height' && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs font-medium">Auto Height</Label>
                <input
                  type="checkbox"
                  checked={(value as number) === 0}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.height = e.target.checked ? 0 : 200
                    })
                  }
                  className="w-4 h-4 rounded cursor-pointer"
                />
              </div>
            )}
            {key === 'minHeight' && (
              <p className="text-[11px] text-muted-foreground">
                Define o espaço mínimo, mas cresce automaticamente se o conteúdo for maior.
              </p>
            )}
          </div>
        )

        return sliderContent
      }

      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <Input
            type="number"
            value={processedValue}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr[key] = parseInt(e.target.value)
              })
            }
            className="text-xs"
          />
        </div>
      )
    }

    // Selects para enum
    if (
      key === 'alignment' ||
      key === 'display' ||
      key === 'flexDirection' ||
      key === 'justifyContent' ||
      key === 'alignItems' ||
      key === 'fontFamily' ||
      key === 'fontWeight' ||
      key === 'videoSource' ||
      key === 'aspectRatio'
    ) {
      const options: Record<string, string[]> = {
        alignment: ['left', 'center', 'right'],
        display: ['block', 'flex', 'grid'],
        flexDirection: ['row', 'column'],
        justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
        alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
        fontFamily: AVAILABLE_FONTS.map(f => `${f.variable}|${f.label}`),
        fontWeight: ['normal', 'bold', '400', '500', '600', '700', '800', '900'],
        videoSource: ['youtube', 'upload'],
        aspectRatio: ['16 / 9', '4 / 3', '1 / 1', '9 / 16', '21 / 9'],
      }

      // Especial para fontFamily: mostrar label em vez do valor
      if (key === 'fontFamily') {
        const selectedFont = AVAILABLE_FONTS.find(f => f.variable === processedValue)
        const displayValue = selectedFont?.label || 'Selecionar fonte...'
        
        return (
          <div key={key} className="space-y-2">
            <Label className="text-xs font-medium capitalize">Fonte</Label>
            <Select 
              value={processedValue as string} 
              onValueChange={(v) => setProp(nodeId, (pr: Record<string, unknown>) => { 
                pr[key] = v 
              })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue>{displayValue}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem key={font.id} value={font.variable}>
                    <span style={{ fontFamily: font.fontFamily }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <Select value={processedValue as string} onValueChange={(v) => setProp(nodeId, (pr: Record<string, unknown>) => { pr[key] = v })}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options[key]?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Booleans (checkboxes)
    if (typeof value === 'boolean') {
      // Não renderizar fullWidth aqui, pois já está renderizado com o width
      if (key === 'fullWidth' || key === 'fullBleed') {
        return null
      }

      return (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr[key] = e.target.checked
              })
            }
            className="w-4 h-4 rounded cursor-pointer"
          />
        </div>
      )
    }

    // Texto genérico
    return (
      <div key={key} className="space-y-2">
        <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
        <Input
          type="text"
          value={String(value) || ''}
          onChange={(e) =>
            setProp(nodeId, (pr: Record<string, unknown>) => {
              pr[key] = e.target.value
            })
          }
          className="text-xs"
          placeholder={`${key}...`}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-l bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-background sticky top-0">
        <h2 className="text-sm font-semibold">Propriedades</h2>
        <p className="text-xs text-muted-foreground">{String(finalDisplayName)}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {Object.entries(sections).map(([sectionName, sectionProps]) => {
          const isExpanded = expandedSections[sectionName] ?? true
          return (
            <div key={sectionName} className="border rounded">
              <button
                onClick={() => toggleSection(sectionName)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                />
                <span className="text-xs font-semibold">{sectionName}</span>
              </button>

              {isExpanded && (
                <div className="px-3 py-2 space-y-3 border-t bg-muted/30">
                  {sectionName === 'Padding' ? (
                    renderPaddingSection(sectionProps as Record<string, unknown>)
                  ) : sectionName === 'Margens' ? (
                    renderMarginSection(sectionProps as Record<string, unknown>)
                  ) : (
                    Object.entries(sectionProps).map(([key, value]) => renderPropertyInput(key, value, props as Record<string, unknown>))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
