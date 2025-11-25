'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useEditor } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown, Calendar as CalendarIcon, Monitor, Tablet, Smartphone, Link2, Link2Off } from 'lucide-react'
import { AVAILABLE_FONTS } from '@/lib/fonts'
import { getUserPages } from '@/lib/actions/pages'
import { useViewport, ViewportMode, isResponsiveValue, ResponsiveValue, ResponsiveProp } from '@/contexts/viewport-context'
import { setResponsiveValue, getViewportValue, hasViewportOverride, RESPONSIVE_PROPS, isResponsivePropName } from '@/lib/responsive-props'
import { cn } from '@/lib/utils'

/**
 * Indicador do viewport atual no painel de propriedades
 */
function ViewportIndicator() {
  const { currentViewport, config } = useViewport()
  
  const icons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  }
  
  const Icon = icons[currentViewport]
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md text-xs">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="text-muted-foreground">
        Editando para <span className="font-medium text-foreground">{config.label}</span>
      </span>
    </div>
  )
}

/**
 * Componente de input numérico responsivo
 * Permite editar valores diferentes para cada viewport
 */
interface ResponsiveNumberInputProps {
  label: string
  value: ResponsiveProp<number> | undefined
  onChange: (newValue: ResponsiveProp<number>) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  showSlider?: boolean
}

function ResponsiveNumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = 'px',
  showSlider = true,
}: ResponsiveNumberInputProps) {
  const { currentViewport } = useViewport()
  
  // Obtém o valor atual para o viewport selecionado
  const currentValue = getViewportValue(value, currentViewport, 0)
  
  // Verifica quais viewports têm valores customizados
  const hasDesktopOverride = hasViewportOverride(value, 'desktop')
  const hasTabletOverride = hasViewportOverride(value, 'tablet')
  const hasMobileOverride = hasViewportOverride(value, 'mobile')
  
  // Ícones para indicação
  const viewportIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  }
  
  const handleValueChange = (newValue: number) => {
    const updated = setResponsiveValue(value, newValue, currentViewport)
    onChange(updated)
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          {/* Indicadores de viewports com valores customizados */}
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-0.5 mr-2">
              {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((vp) => {
                const Icon = viewportIcons[vp]
                const hasOverride = vp === 'desktop' ? hasDesktopOverride : vp === 'tablet' ? hasTabletOverride : hasMobileOverride
                const vpValue = getViewportValue(value, vp, 0)
                
                return (
                  <Tooltip key={vp}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "p-0.5 rounded cursor-pointer transition-colors",
                          hasOverride 
                            ? "bg-primary/20 text-primary" 
                            : "text-muted-foreground/40 hover:text-muted-foreground/60",
                          currentViewport === vp && "ring-1 ring-primary"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="capitalize">{vp}: {hasOverride ? `${vpValue}${unit}` : 'herda'}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>
          
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(parseInt(e.target.value) || 0)}
            className="text-xs w-16 px-2 py-1"
            min={min}
            max={max}
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      
      {showSlider && (
        <Slider
          min={min}
          max={max}
          step={step}
          value={[currentValue]}
          onValueChange={(v) => handleValueChange(v[0])}
        />
      )}
    </div>
  )
}

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

interface DateTimePickerProps {
  value: string
  onChange: (isoValue: string) => void
}

function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const isoValue = String(value) || ''
  const [isOpen, setIsOpen] = useState(false)
  
  // Converter ISO (UTC) para hora local do navegador (formato brasileiro)
  const convertIsoToBr = (iso: string): string => {
    if (!iso) return ''
    try {
      const date = new Date(iso)
      if (isNaN(date.getTime())) return ''
      
      // Usar getDate(), getMonth(), etc (hora local) em vez de UTC
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    } catch {
      return ''
    }
  }

  const displayValue = convertIsoToBr(isoValue)
  const currentDate = isoValue ? new Date(isoValue) : new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [hours, setHours] = useState(String(currentDate.getHours()).padStart(2, '0'))
  const [minutes, setMinutes] = useState(String(currentDate.getMinutes()).padStart(2, '0'))
  const [seconds, setSeconds] = useState(String(currentDate.getSeconds()).padStart(2, '0'))

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleConfirm = () => {
    // Criar data no horário local e converter para ISO (UTC)
    const localDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      parseInt(hours, 10),
      parseInt(minutes, 10),
      parseInt(seconds, 10)
    )
    onChange(localDate.toISOString())
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Data e Hora (horário local)</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          value={displayValue}
          placeholder="18/11/2025 18:00:00"
          disabled
          className="text-xs font-mono flex-1"
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={() => setIsOpen(true)}
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-4">
            <div className="space-y-4">
              {/* Calendar */}
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) =>
                    date.getFullYear() < 2020 || date.getFullYear() > 2099
                  }
                  className="rounded-md border"
                />
              </div>

              {/* Time Inputs */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Horas</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={hours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setHours(String(Math.min(23, Math.max(0, val))).padStart(2, '0'))
                      }}
                      className="text-xs text-center"
                    />
                  </div>
                  <span className="text-lg font-semibold mt-4">:</span>
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Minutos</Label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setMinutes(String(Math.min(59, Math.max(0, val))).padStart(2, '0'))
                      }}
                      className="text-xs text-center"
                    />
                  </div>
                  <span className="text-lg font-semibold mt-4">:</span>
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Segundos</Label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setSeconds(String(Math.min(59, Math.max(0, val))).padStart(2, '0'))
                      }}
                      className="text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleConfirm}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Clique no botão ao lado para selecionar data e hora
      </p>
    </div>
  )
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
    'Border Radius': {},
    'Desconto': {},
    'Imagem': {},
    'Layout': {},
    'Cores & Estilos': {},
    'Visibilidade': {},
    'Campos de Formulário': {},
    'Outro': {},
  }

  const dimensionKeys = ['width', 'height', 'minHeight', 'margin', 'flex', 'playerWidth', 'cardFullWidth', 'cardAutoHeight', 'fullWidth', 'autoHeight']
  const paddingKeys = ['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingLinked', 'formPaddingTop', 'formPaddingBottom', 'formPaddingLeft', 'formPaddingRight']
  const marginKeys = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginLinked']
  const borderRadiusKeys = ['borderRadius', 'borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft', 'borderRadiusLinked', 'formContainerBorderRadius', 'buttonBorderRadius']
  const discountKeys = ['showDiscount', 'originalPrice', 'discountPercentage', 'originalPriceFontSize', 'originalPriceColor', 'discountPercentageFontSize', 'discountPercentageColor', 'discountPercentageBackgroundColor']
  const imageKeys = ['objectFit', 'shadow', 'captionPosition', 'backgroundImage']
  const layoutKeys = ['display', 'flexDirection', 'gap', 'justifyContent', 'alignItems', 'textAlignment', 'inputsDirection', 'inputGap']
  const colorKeys = ['backgroundColor', 'textColor', 'color', 'borderColor', 'highlightColor', 'titleColor', 'descriptionColor', 'brandNameColor', 'descriptionColor', 'linksColor', 'linksHoverColor', 'copyrightColor', 'headingColor', 'questionColor', 'answerColor', 'iconColor', 'subtitleColor', 'buttonColor', 'formContainerBorderColor']
  const contentKeys = [
    'text',
    'content',
    'title',
    'subtitle',
    'link',
    'linkType',
    'linkUrl',
    'linkPageSlug',
    'linkSectionId',
    'openInNewTab',
    'rotatingWords',
    'brandName',
    'brandDescription',
    'link1',
    'link2',
    'link3',
    'copyrightText',
    'question',
    'answer',
    'sectionId',
    'buttonText',
  ]
  const visibilityKeys = ['showLinks', 'showDays', 'showHours', 'showMinutes', 'showSeconds']
  const styleKeys = ['fontSize', 'borderWidth', 'alignment', 'fontFamily', 'fontWeight', 'titleFontSize', 'titleColor', 'descriptionFontSize', 'descriptionColor', 'iconFontSize', 'brandNameFontSize', 'brandNameColor', 'descriptionFontSize', 'descriptionColor', 'linksFontSize', 'linksColor', 'linksHoverColor', 'copyrightFontSize', 'copyrightColor', 'headingFontSize', 'headingColor', 'questionFontSize', 'questionFontWeight', 'answerFontSize', 'answerLineHeight', 'iconSize', 'subtitleFontSize', 'buttonFontSize', 'formContainerBorderWidth', 'buttonPadding']
  const formKeys = ['inputFields']

  Object.entries(props).forEach(([key, value]) => {
    if (formKeys.includes(key)) sections['Campos de Formulário'][key] = value
    else if (contentKeys.includes(key)) sections['Conteúdo'][key] = value
    else if (paddingKeys.includes(key)) sections['Padding'][key] = value
    else if (marginKeys.includes(key)) sections['Margens'][key] = value
    else if (borderRadiusKeys.includes(key)) sections['Border Radius'][key] = value
    else if (discountKeys.includes(key)) sections['Desconto'][key] = value
    else if (imageKeys.includes(key)) sections['Imagem'][key] = value
    else if (dimensionKeys.includes(key)) sections['Dimensões'][key] = value
    else if (layoutKeys.includes(key)) sections['Layout'][key] = value
    else if (visibilityKeys.includes(key)) sections['Visibilidade'][key] = value
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
  
  // Mover useViewport para o nível do componente (hooks não podem ser chamados condicionalmente)
  const { currentViewport } = useViewport()

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

  // Renderizar seção de Padding com UI visual - COM SUPORTE A VALORES RESPONSIVOS
  const renderPaddingSection = (paddingProps: Record<string, unknown>) => {
    // Resolver valores para o viewport atual (suporta valores simples ou responsivos)
    const paddingTopRaw = paddingProps.paddingTop
    const paddingBottomRaw = paddingProps.paddingBottom
    const paddingLeftRaw = paddingProps.paddingLeft
    const paddingRightRaw = paddingProps.paddingRight
    
    const paddingTop = getViewportValue(paddingTopRaw as ResponsiveProp<number>, currentViewport, 0)
    const paddingBottom = getViewportValue(paddingBottomRaw as ResponsiveProp<number>, currentViewport, 0)
    const paddingLeft = getViewportValue(paddingLeftRaw as ResponsiveProp<number>, currentViewport, 0)
    const paddingRight = getViewportValue(paddingRightRaw as ResponsiveProp<number>, currentViewport, 0)
    const paddingLinked = (paddingProps.paddingLinked as boolean) ?? true

    // Handler que atualiza o valor para o viewport atual
    const handlePaddingChange = (side: 'Top' | 'Bottom' | 'Left' | 'Right', value: number) => {
      const currentLinked = (paddingProps.paddingLinked as boolean) ?? true
      const key = `padding${side}`
      
      setProp(nodeId, (pr: Record<string, unknown>) => {
        if (currentLinked) {
          // Se vinculado, muda todos os 4 para o viewport atual
          pr.paddingTop = setResponsiveValue(pr.paddingTop as ResponsiveProp<number>, value, currentViewport)
          pr.paddingBottom = setResponsiveValue(pr.paddingBottom as ResponsiveProp<number>, value, currentViewport)
          pr.paddingLeft = setResponsiveValue(pr.paddingLeft as ResponsiveProp<number>, value, currentViewport)
          pr.paddingRight = setResponsiveValue(pr.paddingRight as ResponsiveProp<number>, value, currentViewport)
        } else {
          // Se desvinculado, muda apenas o lado específico para o viewport atual
          pr[key] = setResponsiveValue(pr[key] as ResponsiveProp<number>, value, currentViewport)
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
    // Resolver valores para o viewport atual (suporta valores simples ou responsivos)
    const marginTopRaw = marginProps.marginTop
    const marginBottomRaw = marginProps.marginBottom
    const marginLeftRaw = marginProps.marginLeft
    const marginRightRaw = marginProps.marginRight
    
    const marginTop = getViewportValue(marginTopRaw as ResponsiveProp<number>, currentViewport, 0)
    const marginBottom = getViewportValue(marginBottomRaw as ResponsiveProp<number>, currentViewport, 0)
    const marginLeft = getViewportValue(marginLeftRaw as ResponsiveProp<number>, currentViewport, 0)
    const marginRight = getViewportValue(marginRightRaw as ResponsiveProp<number>, currentViewport, 0)
    const marginLinked = (marginProps.marginLinked as boolean) ?? true

    const handleMarginChange = (side: 'Top' | 'Bottom' | 'Left' | 'Right', value: number) => {
      const currentLinked = (marginProps.marginLinked as boolean) ?? true
      const key = `margin${side}`

      setProp(nodeId, (pr: Record<string, unknown>) => {
        if (currentLinked) {
          pr.marginTop = setResponsiveValue(pr.marginTop as ResponsiveProp<number>, value, currentViewport)
          pr.marginBottom = setResponsiveValue(pr.marginBottom as ResponsiveProp<number>, value, currentViewport)
          pr.marginLeft = setResponsiveValue(pr.marginLeft as ResponsiveProp<number>, value, currentViewport)
          pr.marginRight = setResponsiveValue(pr.marginRight as ResponsiveProp<number>, value, currentViewport)
        } else {
          pr[key] = setResponsiveValue(pr[key] as ResponsiveProp<number>, value, currentViewport)
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

  const renderBorderRadiusSection = (borderRadiusProps: Record<string, unknown>) => {
    const borderRadius = (borderRadiusProps.borderRadius as number) || 0
    const borderRadiusTopLeft = (borderRadiusProps.borderRadiusTopLeft as number) || 0
    const borderRadiusTopRight = (borderRadiusProps.borderRadiusTopRight as number) || 0
    const borderRadiusBottomRight = (borderRadiusProps.borderRadiusBottomRight as number) || 0
    const borderRadiusBottomLeft = (borderRadiusProps.borderRadiusBottomLeft as number) || 0
    const borderRadiusLinked = (borderRadiusProps.borderRadiusLinked as boolean) ?? true

    const handleBorderRadiusChange = (corner: 'TopLeft' | 'TopRight' | 'BottomRight' | 'BottomLeft' | null, value: number) => {
      const currentLinked = (borderRadiusProps.borderRadiusLinked as boolean) ?? true

      setProp(nodeId, (pr: Record<string, unknown>) => {
        if (currentLinked) {
          // Se vinculado, muda o valor principal e todos os 4 cantos
          pr.borderRadius = value
          pr.borderRadiusTopLeft = value
          pr.borderRadiusTopRight = value
          pr.borderRadiusBottomRight = value
          pr.borderRadiusBottomLeft = value
        } else if (corner) {
          // Se desvinculado, muda apenas o canto específico
          pr[`borderRadius${corner}`] = value
        }
      })
    }

    return (
      <div className="space-y-3 p-2 bg-muted/20 rounded border">
        {/* Switch de Vincular/Desvincular */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Vincular Border Radius</Label>
          <Switch
            checked={borderRadiusLinked}
            onCheckedChange={(checked) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.borderRadiusLinked = checked
                // Ao mudar para vinculado, sincroniza o valor principal com um dos cantos
                if (checked && borderRadius === 0) {
                  pr.borderRadius = borderRadiusTopLeft
                }
              })
            }
          />
        </div>

        {/* Representação visual tipo Figma */}
        <div className="flex justify-center p-4">
          <div 
            className="w-20 h-20 border-2 border-purple-500/50 bg-purple-500/10"
            style={{
              borderTopLeftRadius: borderRadiusLinked ? borderRadius : borderRadiusTopLeft,
              borderTopRightRadius: borderRadiusLinked ? borderRadius : borderRadiusTopRight,
              borderBottomRightRadius: borderRadiusLinked ? borderRadius : borderRadiusBottomRight,
              borderBottomLeftRadius: borderRadiusLinked ? borderRadius : borderRadiusBottomLeft,
            }}
          >
            <div className="flex items-center justify-center h-full text-xs font-mono text-muted-foreground">
              {borderRadiusLinked ? borderRadius : '•••'}
            </div>
          </div>
        </div>

        {/* Controle vinculado */}
        {borderRadiusLinked && (
          <div className="space-y-1 pt-2 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Border Radius</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={borderRadius}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0)
                    handleBorderRadiusChange(null, val)
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={200}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={200}
              step={1}
              value={[borderRadius]}
              onValueChange={(v) => handleBorderRadiusChange(null, v[0])}
            />
          </div>
        )}

        {/* Sliders individuais (mostrar apenas quando desvinculado) */}
        {!borderRadiusLinked && (
          <div className="space-y-2 pt-2 border-t">
            {[
              { label: 'Canto Superior Esquerdo', value: borderRadiusTopLeft, corner: 'TopLeft' },
              { label: 'Canto Superior Direito', value: borderRadiusTopRight, corner: 'TopRight' },
              { label: 'Canto Inferior Direito', value: borderRadiusBottomRight, corner: 'BottomRight' },
              { label: 'Canto Inferior Esquerdo', value: borderRadiusBottomLeft, corner: 'BottomLeft' },
            ].map(({ label, value, corner }) => (
              <div className="space-y-1" key={label}>
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium">{label}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0)
                        handleBorderRadiusChange(corner as 'TopLeft' | 'TopRight' | 'BottomRight' | 'BottomLeft', val)
                      }}
                      className="text-xs w-16 px-2 py-1"
                      min={0}
                      max={200}
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <Slider
                  min={0}
                  max={200}
                  step={1}
                  value={[value]}
                  onValueChange={(v) => handleBorderRadiusChange(corner as 'TopLeft' | 'TopRight' | 'BottomRight' | 'BottomLeft', v[0])}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderDiscountSection = (discountProps: Record<string, unknown>, allProps: Record<string, unknown>) => {
    const showDiscount = (discountProps.showDiscount as boolean) ?? false
    const mode = (allProps.mode as string) ?? 'plan'

    if (mode !== 'single') return null

    return (
      <div className="space-y-3">
        {/* Toggle para mostrar desconto */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Ativar Desconto</Label>
          <input
            type="checkbox"
            checked={showDiscount ? true : false}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.showDiscount = e.target.checked
              })
            }
            className="w-4 h-4 rounded cursor-pointer"
          />
        </div>

        {showDiscount && (
          <>
            {/* Preço Original */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Preço Original</Label>
              <Input
                type="number"
                value={(discountProps.originalPrice as string | number) ?? ''}
                onChange={(e) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.originalPrice = e.target.value
                  })
                }
                className="text-xs"
                step="0.01"
              />
            </div>

            {/* Percentual de Desconto */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Percentual de Desconto</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={(discountProps.discountPercentage as number) ?? 0}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.discountPercentage = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    })
                  }
                  className="text-xs flex-1"
                  min="1"
                  max="100"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Cor do Badge de Desconto */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor de Fundo do Badge</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(discountProps.discountPercentageBackgroundColor as string) ?? '#ef4444'}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.discountPercentageBackgroundColor = e.target.value
                    })
                  }
                  className="w-10 h-8 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={(discountProps.discountPercentageBackgroundColor as string) ?? '#ef4444'}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.discountPercentageBackgroundColor = e.target.value
                    })
                  }
                  className="text-xs flex-1"
                  placeholder="#ef4444"
                />
              </div>
            </div>

            {/* Cor do Texto do Badge */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor do Texto do Badge</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(discountProps.discountPercentageColor as string) ?? '#ffffff'}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.discountPercentageColor = e.target.value
                    })
                  }
                  className="w-10 h-8 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={(discountProps.discountPercentageColor as string) ?? '#ffffff'}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.discountPercentageColor = e.target.value
                    })
                  }
                  className="text-xs flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Tamanho da Fonte do Badge */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tamanho da Fonte do Badge</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={(discountProps.discountPercentageFontSize as number) ?? 14}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.discountPercentageFontSize = Math.max(8, parseInt(e.target.value) || 14)
                    })
                  }
                  className="text-xs flex-1"
                  min="8"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            {/* Cor do Preço Original */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor do Preço Original</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(discountProps.originalPriceColor as string) ?? '#999999'}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.originalPriceColor = e.target.value
                    })
                  }
                  className="w-10 h-8 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={(discountProps.originalPriceColor as string) ?? '#999999'}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.originalPriceColor = e.target.value
                    })
                  }
                  className="text-xs flex-1"
                  placeholder="#999999"
                />
              </div>
            </div>

            {/* Tamanho da Fonte do Preço Original */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tamanho da Fonte do Preço Original</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={(discountProps.originalPriceFontSize as number) ?? 14}
                  onChange={(e) =>
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.originalPriceFontSize = Math.max(8, parseInt(e.target.value) || 14)
                    })
                  }
                  className="text-xs flex-1"
                  min="8"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Renderizar seção de Dimensões (Width, Height, etc) - COM SUPORTE A VALORES RESPONSIVOS
  const renderDimensionsSection = (dimensionProps: Record<string, unknown>) => {
    // Resolver valores para o viewport atual (suporta valores simples ou responsivos)
    const widthRaw = dimensionProps.width
    const heightRaw = dimensionProps.height
    const minHeightRaw = dimensionProps.minHeight
    
    const widthValue = getViewportValue(widthRaw as ResponsiveProp<number>, currentViewport, 400)
    
    // Suporte especial para height que pode ser string 'auto' ou número
    const isHeightAuto = heightRaw === 'auto' || heightRaw === undefined
    const heightValue = isHeightAuto ? 0 : (typeof heightRaw === 'number' ? heightRaw : getViewportValue(heightRaw as ResponsiveProp<number>, currentViewport, 0))
    
    const minHeightValue = getViewportValue(minHeightRaw as ResponsiveProp<number>, currentViewport, 200)
    
    // Suportar tanto fullWidth/fullBleed (Container) quanto cardFullWidth/cardAutoHeight (FeatureCard)
    const fullWidth = (dimensionProps.fullWidth as boolean) ?? (dimensionProps.cardFullWidth as boolean) ?? false
    const fullBleed = (dimensionProps.fullBleed as boolean) ?? false
    const cardAutoHeight = (dimensionProps.cardAutoHeight as boolean) ?? false
    const autoHeight = cardAutoHeight || isHeightAuto || heightValue === 0
    
    // Determinar quais props de fullWidth usar
    const hasContainerFullWidth = dimensionProps.fullWidth !== undefined
    const hasCardFullWidth = dimensionProps.cardFullWidth !== undefined
    
    // Verificar quais viewports têm valores customizados
    const hasWidthDesktop = hasViewportOverride(widthRaw, 'desktop')
    const hasWidthTablet = hasViewportOverride(widthRaw, 'tablet')
    const hasWidthMobile = hasViewportOverride(widthRaw, 'mobile')
    const hasHeightDesktop = hasViewportOverride(heightRaw, 'desktop')
    const hasHeightTablet = hasViewportOverride(heightRaw, 'tablet')
    const hasHeightMobile = hasViewportOverride(heightRaw, 'mobile')
    const hasMinHeightDesktop = hasViewportOverride(minHeightRaw, 'desktop')
    const hasMinHeightTablet = hasViewportOverride(minHeightRaw, 'tablet')
    const hasMinHeightMobile = hasViewportOverride(minHeightRaw, 'mobile')
    
    const viewportIcons = {
      desktop: Monitor,
      tablet: Tablet,
      mobile: Smartphone,
    }
    
    // Handler que atualiza o valor para o viewport atual
    const handleWidthChange = (value: number) => {
      setProp(nodeId, (pr: Record<string, unknown>) => {
        // Para componentes que usam width como string (ex: '100%'), setar diretamente como número
        if (typeof pr.width === 'string' || pr.width === undefined) {
          pr.width = value
        } else {
          pr.width = setResponsiveValue(pr.width as ResponsiveProp<number>, value, currentViewport)
        }
      })
    }
    
    const handleHeightChange = (value: number) => {
      setProp(nodeId, (pr: Record<string, unknown>) => {
        // Para componentes que usam height como string (CaptureForm), setar diretamente como número
        if (typeof pr.height === 'string' || pr.height === undefined) {
          pr.height = value
        } else {
          pr.height = setResponsiveValue(pr.height as ResponsiveProp<number>, value, currentViewport)
        }
      })
    }
    
    const handleMinHeightChange = (value: number) => {
      setProp(nodeId, (pr: Record<string, unknown>) => {
        pr.minHeight = setResponsiveValue(pr.minHeight as ResponsiveProp<number>, value, currentViewport)
      })
    }
    
    const isWidthLocked = fullWidth || fullBleed
    
    // Componente para renderizar indicadores de viewport
    const ViewportIndicators = ({ hasDesktop, hasTablet, hasMobile, getValue }: {
      hasDesktop: boolean
      hasTablet: boolean
      hasMobile: boolean
      getValue: (vp: ViewportMode) => number
    }) => (
      <TooltipProvider delayDuration={300}>
        <div className="flex gap-0.5 mr-2">
          {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((vp) => {
            const Icon = viewportIcons[vp]
            const hasOverride = vp === 'desktop' ? hasDesktop : vp === 'tablet' ? hasTablet : hasMobile
            const vpValue = getValue(vp)
            
            return (
              <Tooltip key={vp}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "p-0.5 rounded cursor-pointer transition-colors",
                      hasOverride 
                        ? "bg-primary/20 text-primary" 
                        : "text-muted-foreground/40 hover:text-muted-foreground/60",
                      currentViewport === vp && "ring-1 ring-primary"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="capitalize">{vp}: {hasOverride ? `${vpValue}px` : 'herda'}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
    
    return (
      <div className="space-y-4">
        {/* Width */}
        {dimensionProps.width !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Largura</Label>
              <div className="flex items-center gap-1">
                <ViewportIndicators
                  hasDesktop={hasWidthDesktop}
                  hasTablet={hasWidthTablet}
                  hasMobile={hasWidthMobile}
                  getValue={(vp) => getViewportValue(widthRaw as ResponsiveProp<number>, vp, 400)}
                />
                <Input
                  type="number"
                  value={widthValue}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 400
                    handleWidthChange(Math.min(Math.max(newValue, 100), 1400))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={100}
                  max={1400}
                  disabled={isWidthLocked}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            {!isWidthLocked && (
              <Slider
                min={100}
                max={1400}
                step={10}
                value={[widthValue]}
                onValueChange={(v) => handleWidthChange(v[0])}
              />
            )}
            {isWidthLocked && (
              <p className="text-xs text-muted-foreground italic">
                {fullBleed ? 'Full Bleed ativado' : 'Full Width ativado'}
              </p>
            )}
            
            {/* Checkboxes Full Width e Full Bleed - adaptativo para Container ou FeatureCard */}
            {(hasContainerFullWidth || hasCardFullWidth) && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Full Width</Label>
                  <input
                    type="checkbox"
                    checked={fullWidth}
                    onChange={(e) =>
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        // Usar a prop correta dependendo do componente
                        if (hasContainerFullWidth) {
                          pr.fullWidth = e.target.checked
                          if (e.target.checked) {
                            pr.fullBleed = false
                          }
                        } else {
                          pr.cardFullWidth = e.target.checked
                          if (e.target.checked) {
                            pr.width = '100%'
                          }
                        }
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </div>
                {dimensionProps.fullBleed !== undefined && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Full Bleed</Label>
                      <input
                        type="checkbox"
                        checked={fullBleed}
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
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Height */}
        {dimensionProps.height !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Altura</Label>
              <div className="flex items-center gap-1">
                <ViewportIndicators
                  hasDesktop={hasHeightDesktop}
                  hasTablet={hasHeightTablet}
                  hasMobile={hasHeightMobile}
                  getValue={(vp) => getViewportValue(heightRaw as ResponsiveProp<number>, vp, 0)}
                />
                <Input
                  type="number"
                  value={autoHeight ? '' : heightValue}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0
                    handleHeightChange(Math.min(Math.max(newValue, 0), 1200))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={1200}
                  disabled={autoHeight}
                  placeholder={autoHeight ? 'auto' : ''}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            {!autoHeight && (
              <Slider
                min={0}
                max={1200}
                step={10}
                value={[heightValue]}
                onValueChange={(v) => handleHeightChange(v[0])}
              />
            )}
            
            {/* Checkbox Auto Height - adaptativo para Container, FeatureCard ou CaptureForm */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label className="text-xs font-medium">Auto Height</Label>
              <input
                type="checkbox"
                checked={autoHeight}
                onChange={(e) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    // Usar a prop correta dependendo do componente
                    if (dimensionProps.cardAutoHeight !== undefined) {
                      pr.cardAutoHeight = e.target.checked
                      if (e.target.checked) {
                        pr.height = 'auto'
                      } else {
                        pr.height = 300
                      }
                    } else if (typeof heightRaw === 'string' || heightRaw === undefined) {
                      // Para CaptureForm e outros que usam height como string
                      pr.height = e.target.checked ? 'auto' : 300
                    } else {
                      pr.height = e.target.checked ? 0 : 200
                    }
                  })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
        
        {/* Min Height */}
        {dimensionProps.minHeight !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Altura Mínima</Label>
              <div className="flex items-center gap-1">
                <ViewportIndicators
                  hasDesktop={hasMinHeightDesktop}
                  hasTablet={hasMinHeightTablet}
                  hasMobile={hasMinHeightMobile}
                  getValue={(vp) => getViewportValue(minHeightRaw as ResponsiveProp<number>, vp, 200)}
                />
                <Input
                  type="number"
                  value={minHeightValue}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 200
                    handleMinHeightChange(Math.min(Math.max(newValue, 0), 1600))
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={1600}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={1600}
              step={10}
              value={[minHeightValue]}
              onValueChange={(v) => handleMinHeightChange(v[0])}
            />
            <p className="text-[11px] text-muted-foreground">
              Define o espaço mínimo, mas cresce automaticamente se o conteúdo for maior.
            </p>
          </div>
        )}
        
        {/* Flex */}
        {dimensionProps.flex !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Flex</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={(dimensionProps.flex as number) ?? 1}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 1
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.flex = Math.min(Math.max(newValue, 0), 10)
                    })
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={10}
                  step={0.1}
                />
              </div>
            </div>
            <Slider
              min={0}
              max={10}
              step={0.1}
              value={[(dimensionProps.flex as number) ?? 1]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.flex = v[0]
                })
              }
            />
          </div>
        )}
        
        {/* Player Width (para VideoPlayer) */}
        {dimensionProps.playerWidth !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Largura do Player</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={(dimensionProps.playerWidth as number) ?? 640}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 640
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.playerWidth = Math.min(Math.max(newValue, 200), 2000)
                    })
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={200}
                  max={2000}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={200}
              max={2000}
              step={10}
              value={[(dimensionProps.playerWidth as number) ?? 640]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.playerWidth = v[0]
                })
              }
            />
          </div>
        )}
        
        {/* Margin (para Divider e outros componentes simples) */}
        {dimensionProps.margin !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Margem</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={(dimensionProps.margin as number) ?? 20}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 20
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.margin = Math.min(Math.max(newValue, 0), 500)
                    })
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
              value={[(dimensionProps.margin as number) ?? 20]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.margin = v[0]
                })
              }
            />
          </div>
        )}
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

    if (['borderRadius', 'borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft', 'borderRadiusLinked'].includes(key)) {
      return null
    }

    if (['linkUrl', 'linkPageSlug', 'openInNewTab'].includes(key)) {
      return null
    }

    if (['showDiscount', 'originalPrice', 'discountPercentage', 'originalPriceFontSize', 'originalPriceColor', 'discountPercentageFontSize', 'discountPercentageColor', 'discountPercentageBackgroundColor', 'cardFullWidth', 'cardAutoHeight', 'fullWidth', 'fullBleed', 'autoHeight'].includes(key)) {
      return null
    }
    
    // Pular renderização de dimensões individuais (já renderizados na seção especial)
    if (['width', 'height', 'minHeight', 'flex', 'playerWidth', 'margin'].includes(key)) {
      return null
    }

    // Propriedades com tratamento especial
    if (key === 'mode') {
      const modeValue = (value as 'plan' | 'single') ?? 'plan'
      
      return (
        <div key="pricing-card-mode" className="space-y-2">
          <Label className="text-xs font-medium">Modo de Card</Label>
          <Select
            value={modeValue}
            onValueChange={(next) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.mode = next
              })
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plan">Plano (com Features)</SelectItem>
              <SelectItem value="single">Preço Único</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key === 'priceAlignment') {
      const alignmentValue = (value as string) ?? 'center'
      
      return (
        <div key="price-alignment" className="space-y-2">
          <Label className="text-xs font-medium">Alinhamento do Preço</Label>
          <Select
            value={alignmentValue}
            onValueChange={(next) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.priceAlignment = next
              })
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
              <SelectItem value="column">Coluna (vertical)</SelectItem>
              <SelectItem value="column-reverse">Coluna Invertida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key === 'objectFit') {
      const objectFitValue = (value as string) ?? 'cover'
      
      return (
        <div key="object-fit" className="space-y-2">
          <Label className="text-xs font-medium">Ajuste da Imagem</Label>
          <Select
            value={objectFitValue}
            onValueChange={(next) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.objectFit = next
              })
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cobrir (cover)</SelectItem>
              <SelectItem value="contain">Conter (contain)</SelectItem>
              <SelectItem value="fill">Preencher (fill)</SelectItem>
              <SelectItem value="scale-down">Reduzir (scale-down)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key === 'shadow') {
      const shadowValue = (value as string) ?? 'md'
      
      return (
        <div key="shadow" className="space-y-2">
          <Label className="text-xs font-medium">Sombra</Label>
          <Select
            value={shadowValue}
            onValueChange={(next) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.shadow = next
              })
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              <SelectItem value="sm">Pequena</SelectItem>
              <SelectItem value="md">Média</SelectItem>
              <SelectItem value="lg">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key === 'captionPosition') {
      const captionPositionValue = (value as string) ?? 'bottom'
      
      return (
        <div key="caption-position" className="space-y-2">
          <Label className="text-xs font-medium">Posição da Legenda</Label>
          <Select
            value={captionPositionValue}
            onValueChange={(next) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.captionPosition = next
              })
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Acima</SelectItem>
              <SelectItem value="bottom">Abaixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (key === 'backgroundImage') {
      const backgroundImageValue = (value as string) ?? ''
      
      return (
        <div key="background-image" className="space-y-2">
          <Label className="text-xs font-medium">Imagem de Fundo</Label>
          <Input
            type="text"
            placeholder="https://exemplo.com/imagem.jpg"
            value={backgroundImageValue}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.backgroundImage = e.target.value
              })
            }
            className="text-xs"
          />
          {backgroundImageValue && (
            <div className="mt-2 rounded border overflow-hidden bg-muted h-24 flex items-center justify-center">
              <Image 
                src={backgroundImageValue} 
                alt="Preview de fundo" 
                width={200}
                height={96}
                className="w-full h-full object-cover"
                onError={() => {
                  // Falha silenciosa - mostra apenas a border
                }}
              />
            </div>
          )}
        </div>
      )
    }

    // Handler especial para width do TextBlock
    if (key === 'width' && (props.content !== undefined && props.icon === undefined && props.alt === undefined && props.src === undefined)) {
      const widthValue = typeof value === 'string' ? (value.endsWith('%') ? 100 : parseInt(value)) : (value as number)
      
      return (
        <div key="textblock-width" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Largura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={widthValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 300
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.width = newValue
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={100}
                max={1200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={100}
            max={1200}
            step={10}
            value={[widthValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.width = v[0]
              })
            }
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Full Width</Label>
            <input
              type="checkbox"
              checked={(allProps.fullWidth as boolean) ?? true}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.fullWidth = e.target.checked
                  if (e.target.checked) {
                    pr.width = '100%'
                  }
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para width do FeatureCard
    if (key === 'width' && (props.icon !== undefined && props.title !== undefined && props.alt === undefined && props.src === undefined)) {
      const widthValue = typeof value === 'string' ? (value.endsWith('%') ? 100 : parseInt(value)) : (value as number)
      
      return (
        <div key="feature-card-width" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Largura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={widthValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 300
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.width = newValue
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={100}
                max={800}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={100}
            max={800}
            step={10}
            value={[widthValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.width = v[0]
              })
            }
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Full Width</Label>
            <input
              type="checkbox"
              checked={(allProps.cardFullWidth as boolean) ?? false}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.cardFullWidth = e.target.checked
                  if (e.target.checked) {
                    pr.width = '100%'
                  }
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para width do ImageComponent
    if (key === 'width' && (props.alt !== undefined || props.src !== undefined)) {
      const widthValue = typeof value === 'string' ? (value.endsWith('%') ? 100 : parseInt(value)) : (value as number)
      
      return (
        <div key="image-width" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Largura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={widthValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 100
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.width = newValue
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={50}
                max={1200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={50}
            max={1200}
            step={10}
            value={[widthValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.width = v[0]
              })
            }
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">100% (Full Width)</Label>
            <input
              type="checkbox"
              checked={typeof value === 'string' && value === '100%'}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.width = e.target.checked ? '100%' : 600
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para height do TextBlock
    if (key === 'height' && (props.content !== undefined && props.icon === undefined && props.alt === undefined && props.src === undefined)) {
      const autoHeight = (allProps.autoHeight as boolean) ?? true
      const heightValue = typeof value === 'string' ? (value === 'auto' ? 'auto' : parseInt(value)) : (value as number)
      const isAutoHeight = autoHeight || heightValue === 'auto' || heightValue === 0
      const numericHeight = typeof heightValue === 'number' ? heightValue : 300
      
      return (
        <div key="textblock-height" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Altura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={isAutoHeight ? '' : numericHeight}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 300
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.height = newValue
                    pr.autoHeight = false
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={50}
                max={1200}
                disabled={isAutoHeight}
                placeholder={isAutoHeight ? 'auto' : ''}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          {!isAutoHeight && (
            <Slider
              min={50}
              max={1200}
              step={10}
              value={[numericHeight]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.height = v[0]
                })
              }
            />
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Auto Height</Label>
            <input
              type="checkbox"
              checked={autoHeight}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.autoHeight = e.target.checked
                  if (e.target.checked) {
                    pr.height = 'auto'
                  } else {
                    pr.height = 300
                  }
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para height do FeatureCard
    if (key === 'height' && (props.icon !== undefined && props.title !== undefined && props.alt === undefined && props.src === undefined)) {
      const cardAutoHeight = (allProps.cardAutoHeight as boolean) ?? true
      const heightValue = typeof value === 'string' ? (value === 'auto' ? 'auto' : parseInt(value)) : (value as number)
      const isAutoHeight = cardAutoHeight || heightValue === 'auto' || heightValue === 0
      const numericHeight = typeof heightValue === 'number' ? heightValue : 300
      
      return (
        <div key="feature-card-height" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Altura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={isAutoHeight ? '' : numericHeight}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 300
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.height = newValue
                    pr.cardAutoHeight = false
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={100}
                max={800}
                disabled={isAutoHeight}
                placeholder={isAutoHeight ? 'auto' : ''}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          {!isAutoHeight && (
            <Slider
              min={100}
              max={800}
              step={10}
              value={[numericHeight]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.height = v[0]
                })
              }
            />
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Auto Height</Label>
            <input
              type="checkbox"
              checked={cardAutoHeight}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.cardAutoHeight = e.target.checked
                  if (e.target.checked) {
                    pr.height = 'auto'
                  } else {
                    pr.height = 300
                  }
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para height do ImageComponent
    if (key === 'height' && (props.alt !== undefined || props.src !== undefined)) {
      const heightValue = typeof value === 'string' ? parseInt(value) : (value as number)
      
      return (
        <div key="image-height" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Altura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={heightValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 400
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.height = `${newValue}px`
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={50}
                max={1200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={50}
            max={1200}
            step={10}
            value={[heightValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.height = `${v[0]}px`
              })
            }
          />
        </div>
      )
    }

    // Handler especial para width do Container
    if (key === 'width' && (props.paddingTop !== undefined && props.display !== undefined && props.targetDate === undefined)) {
      const widthValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseInt(value) : 400)
      
      return (
        <div key="container-width" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Largura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={widthValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 400
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.width = newValue
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={100}
                max={1400}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={100}
            max={1400}
            step={10}
            value={[widthValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.width = v[0]
              })
            }
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Full Width</Label>
            <input
              type="checkbox"
              checked={(allProps.fullWidth as boolean) ?? false}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.fullWidth = e.target.checked
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para height do Container
    if (key === 'height' && (props.paddingTop !== undefined && props.display !== undefined && props.targetDate === undefined)) {
      const heightValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseInt(value) : 200)
      
      return (
        <div key="container-height" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Altura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={heightValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 200
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.height = newValue
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={100}
                max={1200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={100}
            max={1200}
            step={10}
            value={[heightValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.height = v[0]
              })
            }
          />
        </div>
      )
    }

    // Handler especial para width do CountdownTimer
    if (key === 'width' && (props.targetDate !== undefined && props.digitFontSize !== undefined)) {
      const widthValue = typeof value === 'string' ? (value.endsWith('%') ? 100 : parseInt(value)) : (value as number)
      
      return (
        <div key="countdown-width" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Largura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={widthValue}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 300
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.width = newValue
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={200}
                max={1200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            min={200}
            max={1200}
            step={10}
            value={[widthValue]}
            onValueChange={(v) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.width = v[0]
              })
            }
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Full Width</Label>
            <input
              type="checkbox"
              checked={(allProps.cardFullWidth as boolean) ?? false}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.cardFullWidth = e.target.checked
                  if (e.target.checked) {
                    pr.width = '100%'
                  }
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    // Handler especial para height do CountdownTimer
    if (key === 'height' && (props.targetDate !== undefined && props.digitFontSize !== undefined)) {
      const cardAutoHeight = (allProps.cardAutoHeight as boolean) ?? true
      const heightValue = typeof value === 'string' ? (value === 'auto' ? 'auto' : parseInt(value)) : (value as number)
      const isAutoHeight = cardAutoHeight || heightValue === 'auto' || heightValue === 0
      const numericHeight = typeof heightValue === 'number' ? heightValue : 300
      
      return (
        <div key="countdown-height" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Altura</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={isAutoHeight ? '' : numericHeight}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 300
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    pr.height = newValue
                    pr.cardAutoHeight = false
                  })
                }}
                className="text-xs w-16 px-2 py-1"
                min={150}
                max={800}
                disabled={isAutoHeight}
                placeholder={isAutoHeight ? 'auto' : ''}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          {!isAutoHeight && (
            <Slider
              min={150}
              max={800}
              step={10}
              value={[numericHeight]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.height = v[0]
                })
              }
            />
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Auto Height</Label>
            <input
              type="checkbox"
              checked={cardAutoHeight}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.cardAutoHeight = e.target.checked
                  if (e.target.checked) {
                    pr.height = 'auto'
                  } else {
                    pr.height = 300
                  }
                })
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      )
    }

    if (key === 'width') {
      const widthValue = value as string | number
      const isNumeric = typeof widthValue === 'number'
      
      if (isNumeric) {
        // Renderizar slider para width numérico
        return (
          <div key="width" className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Largura</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={widthValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.width = Math.min(Math.max(val, 0), 1200)
                    })
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={1200}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={1200}
              step={1}
              value={[widthValue as number]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.width = v[0]
                })
              }
            />
          </div>
        )
      }
      
      return (
        <div key="width" className="space-y-2">
          <Label className="text-xs font-medium">Largura</Label>
          <Input
            type="text"
            value={widthValue}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.width = e.target.value
              })
            }
            className="text-xs"
            placeholder="100% ou 400px"
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Full Width</Label>
            <Switch
              checked={(allProps.cardFullWidth as boolean) ?? false}
              onCheckedChange={(checked) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.cardFullWidth = checked
                  if (checked) {
                    pr.width = '100%'
                  }
                })
              }
            />
          </div>
        </div>
      )
    }

    if (key === 'height') {
      const heightValue = value as string | number
      const isNumeric = typeof heightValue === 'number'
      
      if (isNumeric) {
        // Renderizar slider para height numérico
        return (
          <div key="height" className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Altura</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={heightValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setProp(nodeId, (pr: Record<string, unknown>) => {
                      pr.height = Math.min(Math.max(val, 0), 1600)
                    })
                  }}
                  className="text-xs w-16 px-2 py-1"
                  min={0}
                  max={1600}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <Slider
              min={0}
              max={1600}
              step={1}
              value={[heightValue as number]}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.height = v[0]
                })
              }
            />
          </div>
        )
      }
      
      return (
        <div key="height" className="space-y-2">
          <Label className="text-xs font-medium">Altura</Label>
          <Input
            type="text"
            value={heightValue}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr.height = e.target.value
              })
            }
            className="text-xs"
            placeholder="auto ou 500px"
          />
          <div className="flex items-center justify-between pt-2 border-t">
            <Label className="text-xs font-medium">Auto Height</Label>
            <Switch
              checked={(allProps.cardAutoHeight as boolean) ?? true}
              onCheckedChange={(checked) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr.cardAutoHeight = checked
                  if (checked) {
                    pr.height = 'auto'
                  }
                })
              }
            />
          </div>
        </div>
      )
    }

    if (key === 'linkType') {
      const linkTypeValue = (value as 'url' | 'page' | 'section') ?? 'url'
      const legacyLink = (allProps.link as string) || ''
      const linkUrlFromProps = (allProps.linkUrl as string) || ''
      const linkPageFromProps = (allProps.linkPageSlug as string) || ''
      const linkSectionFromProps = (allProps.linkSectionId as string) || ''
      const linkUrl = linkUrlFromProps || (!legacyLink.startsWith('/page/') ? legacyLink : '')
      const linkPageSlug = linkPageFromProps || (legacyLink.startsWith('/page/') ? legacyLink.replace('/page/', '') : '')
      const openInNewTab = Boolean(allProps.openInNewTab)
      const NO_PAGE_SELECTED_VALUE = '__no_page_selected__'
      const NO_SECTION_SELECTED_VALUE = '__no_section_selected__'

      // Extrair IDs das seções dos containers da página
      const sectionIds = Object.entries(nodes)
        .filter(([, node]) => (node?.data?.displayName || '').includes('Container') && (node?.data?.props?.sectionId as string))
        .map(([, node]) => (node?.data?.props?.sectionId as string))
        .filter((id) => id && id.length > 0)

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
                <SelectItem value="section">Seção da página</SelectItem>
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
          ) : linkTypeValue === 'page' ? (
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
          ) : (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Seção</Label>
              <Select
                value={linkSectionFromProps || NO_SECTION_SELECTED_VALUE}
                onValueChange={(sectionId) =>
                  setProp(nodeId, (pr: Record<string, unknown>) => {
                    const normalizedId = sectionId === NO_SECTION_SELECTED_VALUE ? '' : sectionId
                    pr.linkSectionId = normalizedId
                    pr.link = normalizedId ? `#${normalizedId}` : ''
                  })
                }
                disabled={sectionIds.length === 0}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={sectionIds.length === 0 ? 'Nenhuma seção disponível' : 'Selecione uma seção'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SECTION_SELECTED_VALUE}>Nenhum destino</SelectItem>
                  {sectionIds.length === 0 && (
                    <SelectItem value="__empty" disabled>Nenhuma seção encontrada (configure sectionId nos containers)</SelectItem>
                  )}
                  {sectionIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      #{id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linkSectionFromProps && (
                <p className="text-[11px] text-muted-foreground">#{linkSectionFromProps}</p>
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

    // Handler especial para inputFields do CaptureForm
    if (key === 'inputFields') {
      const inputFields = (value as Array<{
        id: string
        type: 'email' | 'text' | 'number' | 'phone'
        label: string
        placeholder: string
        placeholderColor: string
        borderRadius: number
        borderColor: string
        borderWidth: number
      }>) || []

      return (
        <div key={key} className="space-y-3 border p-3 rounded bg-muted/50">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Campos do Formulário</Label>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => {
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  const fields = (pr.inputFields as typeof inputFields) || []
                  const newId = String(Date.now())
                  fields.push({
                    id: newId,
                    type: 'text',
                    label: `Campo ${fields.length + 1}`,
                    placeholder: 'Digite aqui...',
                    placeholderColor: '#9ca3af',
                    borderRadius: 6,
                    borderColor: '#d1d5db',
                    borderWidth: 1,
                  })
                })
              }}
            >
              + Adicionar
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {inputFields.map((field, idx) => (
              <div key={field.id} className="border rounded p-2 bg-background space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Campo {idx + 1}</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-5 text-xs px-2"
                    onClick={() => {
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        const fields = (pr.inputFields as typeof inputFields) || []
                        pr.inputFields = fields.filter(f => f.id !== field.id)
                      })
                    }}
                  >
                    Remover
                  </Button>
                </div>

                {/* Type */}
                <div>
                  <Label className="text-xs font-medium">Tipo</Label>
                  <Select
                    value={field.type}
                    onValueChange={(newType) => {
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        const fields = (pr.inputFields as typeof inputFields) || []
                        const fieldIdx = fields.findIndex(f => f.id === field.id)
                        if (fieldIdx !== -1) {
                          fields[fieldIdx].type = newType as typeof field.type
                        }
                      })
                    }}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Label */}
                <div>
                  <Label className="text-xs font-medium">Label</Label>
                  <Input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        const fields = (pr.inputFields as typeof inputFields) || []
                        const fieldIdx = fields.findIndex(f => f.id === field.id)
                        if (fieldIdx !== -1) {
                          fields[fieldIdx].label = e.target.value
                        }
                      })
                    }}
                    className="text-xs h-7"
                    placeholder="Ex: Email"
                  />
                </div>

                {/* Placeholder */}
                <div>
                  <Label className="text-xs font-medium">Placeholder</Label>
                  <Input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) => {
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        const fields = (pr.inputFields as typeof inputFields) || []
                        const fieldIdx = fields.findIndex(f => f.id === field.id)
                        if (fieldIdx !== -1) {
                          fields[fieldIdx].placeholder = e.target.value
                        }
                      })
                    }}
                    className="text-xs h-7"
                    placeholder="Digite um placeholder..."
                  />
                </div>

                {/* Border Radius */}
                <div className="flex gap-2 items-center">
                  <Label className="text-xs font-medium min-w-fit">Arred.</Label>
                  <Input
                    type="number"
                    value={field.borderRadius}
                    onChange={(e) => {
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        const fields = (pr.inputFields as typeof inputFields) || []
                        const fieldIdx = fields.findIndex(f => f.id === field.id)
                        if (fieldIdx !== -1) {
                          fields[fieldIdx].borderRadius = Math.max(0, parseInt(e.target.value) || 0)
                        }
                      })
                    }}
                    min="0"
                    max="50"
                    className="text-xs h-7 w-16"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>

                {/* Border Width */}
                <div className="flex gap-2 items-center">
                  <Label className="text-xs font-medium min-w-fit">Borda</Label>
                  <Input
                    type="number"
                    value={field.borderWidth}
                    onChange={(e) => {
                      setProp(nodeId, (pr: Record<string, unknown>) => {
                        const fields = (pr.inputFields as typeof inputFields) || []
                        const fieldIdx = fields.findIndex(f => f.id === field.id)
                        if (fieldIdx !== -1) {
                          fields[fieldIdx].borderWidth = Math.max(0, parseInt(e.target.value) || 0)
                        }
                      })
                    }}
                    min="0"
                    max="10"
                    className="text-xs h-7 w-16"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>

                {/* Border Color */}
                <div className="flex gap-2 items-center">
                  <Label className="text-xs font-medium">Cor Borda</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.borderColor}
                      onChange={(e) => {
                        setProp(nodeId, (pr: Record<string, unknown>) => {
                          const fields = (pr.inputFields as typeof inputFields) || []
                          const fieldIdx = fields.findIndex(f => f.id === field.id)
                          if (fieldIdx !== -1) {
                            fields[fieldIdx].borderColor = e.target.value
                          }
                        })
                      }}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={field.borderColor}
                      onChange={(e) => {
                        setProp(nodeId, (pr: Record<string, unknown>) => {
                          const fields = (pr.inputFields as typeof inputFields) || []
                          const fieldIdx = fields.findIndex(f => f.id === field.id)
                          if (fieldIdx !== -1) {
                            fields[fieldIdx].borderColor = e.target.value
                          }
                        })
                      }}
                      className="text-xs h-7 flex-1"
                      placeholder="#d1d5db"
                    />
                  </div>
                </div>

                {/* Placeholder Color */}
                <div className="flex gap-2 items-center">
                  <Label className="text-xs font-medium">Cor Placeholder</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.placeholderColor || '#9ca3af'}
                      onChange={(e) => {
                        setProp(nodeId, (pr: Record<string, unknown>) => {
                          const fields = (pr.inputFields as typeof inputFields) || []
                          const fieldIdx = fields.findIndex(f => f.id === field.id)
                          if (fieldIdx !== -1) {
                            fields[fieldIdx].placeholderColor = e.target.value
                          }
                        })
                      }}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={field.placeholderColor || '#9ca3af'}
                      onChange={(e) => {
                        setProp(nodeId, (pr: Record<string, unknown>) => {
                          const fields = (pr.inputFields as typeof inputFields) || []
                          const fieldIdx = fields.findIndex(f => f.id === field.id)
                          if (fieldIdx !== -1) {
                            fields[fieldIdx].placeholderColor = e.target.value
                          }
                        })
                      }}
                      className="text-xs h-7 flex-1"
                      placeholder="#9ca3af"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
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
    const textProperties = [
      'content',
      'text',
      'title',
      'description',
      'subtitle',
      'link',
      'placeholder',
      'label',
      'youtubeUrl',
      'thumbnailUrl',
      'src',
      'alt',
      'caption',
      'rotatingWords',
    ]
    
    if (textProperties.includes(key)) {
      // Para src e alt, usar input de uma linha
      if (['src', 'alt'].includes(key)) {
        const labelText = key === 'src' ? 'URL da Imagem' : 'Texto Alternativo'
        
        return (
          <div key={key} className="space-y-2">
            <Label className="text-xs font-medium">{labelText}</Label>
            <Input
              type={key === 'src' ? 'url' : 'text'}
              value={String(value) || ''}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = e.target.value
                })
              }
              className="text-xs"
              placeholder={key === 'src' ? 'https://exemplo.com/imagem.jpg' : 'Descrição da imagem...'}
            />
          </div>
        )
      }
      
      const labelText = key === 'rotatingWords' ? 'Textos (um por linha)' : key.replace(/([A-Z])/g, ' $1')
      const placeholder = key === 'rotatingWords' ? 'Texto 1\nTexto 2\nTexto 3' : `${key}...`

      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{labelText}</Label>
          <textarea
            value={String(value) || ''}
            onChange={(e) =>
              setProp(nodeId, (pr: Record<string, unknown>) => {
                pr[key] = e.target.value
              })
            }
            className="text-xs w-full p-2 rounded border bg-background min-h-20 resize-none"
            placeholder={placeholder}
          />
        </div>
      )
    }
    
    // Converter strings que deveriam ser números
    let processedValue = value
    if (typeof value === 'string') {
      // Se é um número como string, converte
      if (key !== 'fontWeight' && !isNaN(Number(value))) {
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
    
    // Cores (incluindo transparent para backgroundColor)
    if (typeof processedValue === 'string' && (processedValue.startsWith('#') || (key === 'backgroundColor' && processedValue === 'transparent'))) {
      const colorValue = processedValue === 'transparent' ? '#ffffff' : processedValue
      
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={colorValue || '#000000'}
              onChange={(e) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = e.target.value
                })
              }
              className="w-12 h-8 rounded border cursor-pointer"
            />
            <Input
              value={processedValue === 'transparent' ? 'transparent' : (colorValue || '#000000')}
              onChange={(e) => {
                const val = e.target.value
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = val === 'transparent' ? 'transparent' : val
                })
              }}
              className="flex-1 text-xs"
              placeholder="#000000"
            />
          </div>
        </div>
      )
    }

    // Números (sliders para propriedades específicas)
    if (typeof processedValue === 'number' && key !== 'fontWeight') {
      const isSlider = [
        'fontSize',
        'titleFontSize',
        'descriptionFontSize',
        'iconFontSize',
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
          titleFontSize: 72,
          descriptionFontSize: 72,
          iconFontSize: 100,
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
                    checked={mutableProps.fullWidth ? true : false}
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
                    checked={mutableProps.fullBleed ? true : false}
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
      key === 'textAlignment' ||
      key === 'display' ||
      key === 'flexDirection' ||
      key === 'justifyContent' ||
      key === 'alignItems' ||
      key === 'fontFamily' ||
      key === 'fontWeight' ||
      key === 'questionFontWeight' ||
      key === 'videoSource' ||
      key === 'aspectRatio'
    ) {
      const options: Record<string, string[]> = {
        alignment: ['left', 'center', 'right'],
        textAlignment: ['left', 'center', 'right'],
        display: ['block', 'flex', 'grid'],
        flexDirection: ['row', 'column'],
        justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
        alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
        fontFamily: AVAILABLE_FONTS.map(f => `${f.variable}|${f.label}`),
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

      if (key === 'questionFontWeight' || key === 'fontWeight') {
        const fontWeightOptions = [
          { value: '100', label: 'Thin · 100' },
          { value: '200', label: 'Extra Light · 200' },
          { value: '300', label: 'Light · 300' },
          { value: '400', label: 'Regular · 400' },
          { value: '500', label: 'Medium · 500' },
          { value: '600', label: 'Semi Bold · 600' },
          { value: '700', label: 'Bold · 700' },
          { value: '800', label: 'Extra Bold · 800' },
          { value: '900', label: 'Black · 900' },
        ]

        const normalizeFontWeightValue = (raw: unknown) => {
          if (raw === 'normal') return '400'
          if (raw === 'bold') return '700'
          if (typeof raw === 'number') return String(raw)
          if (typeof raw === 'string' && raw.length > 0) return raw
          return '400'
        }

        const normalizedValue = normalizeFontWeightValue(processedValue)
        const selectedLabel = fontWeightOptions.find((opt) => opt.value === normalizedValue)?.label || 'Selecionar peso'
        const displayLabel = key === 'questionFontWeight' ? 'Peso do Título' : 'Peso da Fonte'

        return (
          <div key={key} className="space-y-2">
            <Label className="text-xs font-medium">{displayLabel}</Label>
            <Select
              value={normalizedValue}
              onValueChange={(v) =>
                setProp(nodeId, (pr: Record<string, unknown>) => {
                  pr[key] = v
                })
              }
            >
              <SelectTrigger className="text-xs">
                <SelectValue>{selectedLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fontWeightOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
            checked={value ? true : false}
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

    // Handler especial para targetDate - usar o componente DateTimePicker
    if (key === 'targetDate') {
      return (
        <DateTimePicker
          key={key}
          value={String(value) || ''}
          onChange={(isoValue) =>
            setProp(nodeId, (pr: Record<string, unknown>) => {
              pr[key] = isoValue
            })
          }
        />
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
      <div className="px-4 py-3 border-b bg-background sticky top-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Propriedades</h2>
        </div>
        <p className="text-xs text-muted-foreground">{String(finalDisplayName)}</p>
        <ViewportIndicator />
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
                  ) : sectionName === 'Border Radius' ? (
                    renderBorderRadiusSection(sectionProps as Record<string, unknown>)
                  ) : sectionName === 'Desconto' ? (
                    renderDiscountSection(sectionProps as Record<string, unknown>, props as Record<string, unknown>)
                  ) : sectionName === 'Dimensões' ? (
                    renderDimensionsSection(sectionProps as Record<string, unknown>)
                  ) : sectionName === 'Imagem' ? (
                    Object.entries(sectionProps).map(([key, value]) => renderPropertyInput(key, value, props as Record<string, unknown>))
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
