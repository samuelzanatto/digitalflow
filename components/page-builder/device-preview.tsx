'use client'

import React, { useRef, useState, useCallback } from 'react'
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer2,
  RefreshCw,
  Maximize2,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Dispositivos pré-configurados (como no Chrome DevTools)
export const DEVICE_PRESETS = {
  // Desktop
  'desktop-1920': { name: 'Desktop 1920×1080', width: 1920, height: 1080, type: 'desktop' as const, userAgent: '' },
  'desktop-1440': { name: 'Desktop 1440×900', width: 1440, height: 900, type: 'desktop' as const, userAgent: '' },
  'desktop-1366': { name: 'Desktop 1366×768', width: 1366, height: 768, type: 'desktop' as const, userAgent: '' },
  
  // Tablets
  'ipad-pro-12': { name: 'iPad Pro 12.9"', width: 1024, height: 1366, type: 'tablet' as const, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' },
  'ipad-pro-11': { name: 'iPad Pro 11"', width: 834, height: 1194, type: 'tablet' as const, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' },
  'ipad-air': { name: 'iPad Air', width: 820, height: 1180, type: 'tablet' as const, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' },
  'ipad-mini': { name: 'iPad Mini', width: 768, height: 1024, type: 'tablet' as const, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' },
  'surface-pro': { name: 'Surface Pro 7', width: 912, height: 1368, type: 'tablet' as const, userAgent: '' },
  
  // Phones
  'iphone-15-pro-max': { name: 'iPhone 15 Pro Max', width: 430, height: 932, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  'iphone-15-pro': { name: 'iPhone 15 Pro', width: 393, height: 852, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  'iphone-15': { name: 'iPhone 15', width: 390, height: 844, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  'iphone-se': { name: 'iPhone SE', width: 375, height: 667, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  'pixel-8': { name: 'Google Pixel 8', width: 412, height: 915, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)' },
  'pixel-8-pro': { name: 'Google Pixel 8 Pro', width: 448, height: 998, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro)' },
  'samsung-s24': { name: 'Samsung Galaxy S24', width: 360, height: 780, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B)' },
  'samsung-s24-ultra': { name: 'Samsung Galaxy S24 Ultra', width: 412, height: 915, type: 'mobile' as const, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B)' },
} as const

export type DevicePresetKey = keyof typeof DEVICE_PRESETS
export type DeviceType = 'desktop' | 'tablet' | 'mobile'

export interface DeviceConfig {
  name: string
  width: number
  height: number
  type: DeviceType
  userAgent: string
}

interface DevicePreviewState {
  device: DevicePresetKey | 'responsive'
  width: number
  height: number
  type: DeviceType
  zoom: number
  isRotated: boolean
  touchSimulation: boolean
}

interface DevicePreviewToolbarProps {
  state: DevicePreviewState
  onChange: (state: Partial<DevicePreviewState>) => void
  onRefresh?: () => void
}

export function DevicePreviewToolbar({ state, onChange, onRefresh }: DevicePreviewToolbarProps) {
  const [editingWidth, setEditingWidth] = useState(false)
  const [editingHeight, setEditingHeight] = useState(false)
  const [tempWidth, setTempWidth] = useState(state.width.toString())
  const [tempHeight, setTempHeight] = useState(state.height.toString())

  const handleDeviceChange = (deviceKey: DevicePresetKey | 'responsive') => {
    if (deviceKey === 'responsive') {
      onChange({ device: 'responsive' })
    } else {
      const preset = DEVICE_PRESETS[deviceKey]
      onChange({
        device: deviceKey,
        width: state.isRotated ? preset.height : preset.width,
        height: state.isRotated ? preset.width : preset.height,
        type: preset.type,
      })
    }
  }

  const handleRotate = () => {
    onChange({
      width: state.height,
      height: state.width,
      isRotated: !state.isRotated,
    })
  }

  const handleWidthChange = () => {
    const newWidth = Math.max(320, Math.min(2560, parseInt(tempWidth) || 320))
    onChange({ width: newWidth, device: 'responsive' })
    setEditingWidth(false)
    setTempWidth(newWidth.toString())
  }

  const handleHeightChange = () => {
    const newHeight = Math.max(320, Math.min(2560, parseInt(tempHeight) || 568))
    onChange({ height: newHeight, device: 'responsive' })
    setEditingHeight(false)
    setTempHeight(newHeight.toString())
  }

  const handleZoomChange = (zoom: number) => {
    onChange({ zoom: Math.max(25, Math.min(200, zoom)) })
  }

  const zoomPresets = [50, 75, 100, 125, 150]

  const currentDeviceName = state.device === 'responsive' 
    ? 'Responsivo' 
    : DEVICE_PRESETS[state.device].name

  // Sincroniza inputs quando state muda externamente (sem usar useEffect)
  const widthStr = state.width.toString()
  const heightStr = state.height.toString()
  
  if (tempWidth !== widthStr && !editingWidth) {
    setTempWidth(widthStr)
  }
  if (tempHeight !== heightStr && !editingHeight) {
    setTempHeight(heightStr)
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-card border-b text-xs">
        {/* Seletor de Dispositivo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-normal">
              {state.type === 'desktop' && <Monitor className="w-3.5 h-3.5" />}
              {state.type === 'tablet' && <Tablet className="w-3.5 h-3.5" />}
              {state.type === 'mobile' && <Smartphone className="w-3.5 h-3.5" />}
              <span className="max-w-[120px] truncate">{currentDeviceName}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-auto">
            <DropdownMenuItem onClick={() => handleDeviceChange('responsive')}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Responsivo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Desktops */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Desktop</div>
            {Object.entries(DEVICE_PRESETS)
              .filter(([, v]) => v.type === 'desktop')
              .map(([key, device]) => (
                <DropdownMenuItem key={key} onClick={() => handleDeviceChange(key as DevicePresetKey)}>
                  <Monitor className="w-4 h-4 mr-2" />
                  <span className="flex-1">{device.name}</span>
                  <span className="text-muted-foreground">{device.width}×{device.height}</span>
                </DropdownMenuItem>
              ))}
            
            <DropdownMenuSeparator />
            
            {/* Tablets */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tablets</div>
            {Object.entries(DEVICE_PRESETS)
              .filter(([, v]) => v.type === 'tablet')
              .map(([key, device]) => (
                <DropdownMenuItem key={key} onClick={() => handleDeviceChange(key as DevicePresetKey)}>
                  <Tablet className="w-4 h-4 mr-2" />
                  <span className="flex-1">{device.name}</span>
                  <span className="text-muted-foreground">{device.width}×{device.height}</span>
                </DropdownMenuItem>
              ))}
            
            <DropdownMenuSeparator />
            
            {/* Phones */}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Celulares</div>
            {Object.entries(DEVICE_PRESETS)
              .filter(([, v]) => v.type === 'mobile')
              .map(([key, device]) => (
                <DropdownMenuItem key={key} onClick={() => handleDeviceChange(key as DevicePresetKey)}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  <span className="flex-1">{device.name}</span>
                  <span className="text-muted-foreground">{device.width}×{device.height}</span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dimensões */}
        <div className="flex items-center gap-1 text-muted-foreground">
          {editingWidth ? (
            <Input
              type="number"
              value={tempWidth}
              onChange={(e) => setTempWidth(e.target.value)}
              onBlur={handleWidthChange}
              onKeyDown={(e) => e.key === 'Enter' && handleWidthChange()}
              className="w-16 h-6 text-xs px-1.5"
              autoFocus
              min={320}
              max={2560}
            />
          ) : (
            <button
              onClick={() => setEditingWidth(true)}
              className="px-1.5 py-0.5 rounded hover:bg-muted transition-colors tabular-nums"
            >
              {state.width}
            </button>
          )}
          <span>×</span>
          {editingHeight ? (
            <Input
              type="number"
              value={tempHeight}
              onChange={(e) => setTempHeight(e.target.value)}
              onBlur={handleHeightChange}
              onKeyDown={(e) => e.key === 'Enter' && handleHeightChange()}
              className="w-16 h-6 text-xs px-1.5"
              autoFocus
              min={320}
              max={2560}
            />
          ) : (
            <button
              onClick={() => setEditingHeight(true)}
              className="px-1.5 py-0.5 rounded hover:bg-muted transition-colors tabular-nums"
            >
              {state.height}
            </button>
          )}
        </div>

        {/* Rotação */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRotate}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rotacionar</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleZoomChange(state.zoom - 25)}
                disabled={state.zoom <= 25}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Diminuir zoom</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal min-w-[50px]">
                {state.zoom}%
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {zoomPresets.map((zoom) => (
                <DropdownMenuItem key={zoom} onClick={() => handleZoomChange(zoom)}>
                  {zoom}%
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleZoomChange(100)}>
                Ajustar na tela
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleZoomChange(state.zoom + 25)}
                disabled={state.zoom >= 200}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aumentar zoom</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Touch Simulation Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={state.touchSimulation ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => onChange({ touchSimulation: !state.touchSimulation })}
            >
              {state.touchSimulation ? (
                <Hand className="w-3.5 h-3.5" />
              ) : (
                <MousePointer2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {state.touchSimulation ? 'Modo Touch Ativado' : 'Modo Mouse'}
          </TooltipContent>
        </Tooltip>

        {/* Refresh */}
        {onRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Recarregar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

interface DeviceFrameProps {
  width: number
  height: number
  zoom: number
  type: DeviceType
  touchSimulation: boolean
  children: React.ReactNode
  className?: string
}

export function DeviceFrame({ 
  width, 
  height, 
  zoom, 
  type, 
  touchSimulation,
  children,
  className 
}: DeviceFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [touchIndicator, setTouchIndicator] = useState<{ x: number; y: number } | null>(null)

  const scale = zoom / 100

  // Simular touch events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!touchSimulation) return
    
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setTouchIndicator({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    })
  }, [touchSimulation, scale])

  const handleMouseUp = useCallback(() => {
    setTouchIndicator(null)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchSimulation || !touchIndicator) return
    
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setTouchIndicator({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    })
  }, [touchSimulation, touchIndicator, scale])

  // Frame styling based on device type
  const frameStyles = {
    desktop: {
      borderRadius: '8px',
      border: '1px solid #333',
      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    },
    tablet: {
      borderRadius: '24px',
      border: '12px solid #1a1a1a',
      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)',
    },
    mobile: {
      borderRadius: '40px',
      border: '12px solid #1a1a1a',
      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)',
    },
  }

  const currentFrameStyle = frameStyles[type]

  return (
    <div 
      className={cn("relative transition-all duration-300", className)}
      style={{
        width: width * scale,
        height: height * scale,
      }}
    >
      {/* Device Frame */}
      <div
        ref={frameRef}
        className={cn(
          "relative bg-white overflow-hidden transition-all duration-300",
          touchSimulation && "cursor-pointer"
        )}
        style={{
          width: width,
          height: height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ...currentFrameStyle,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        {/* Mobile Notch */}
        {type === 'mobile' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-7 bg-[#1a1a1a] rounded-b-2xl z-10 flex items-center justify-center">
            <div className="w-16 h-4 bg-black rounded-full" />
          </div>
        )}

        {/* Content Area */}
        <div 
          className="w-full h-full overflow-auto"
          style={{
            paddingTop: type === 'mobile' ? '28px' : 0,
            paddingBottom: type === 'mobile' ? '20px' : 0,
          }}
        >
          {children}
        </div>

        {/* Mobile Home Indicator */}
        {type === 'mobile' && (
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-white flex items-center justify-center">
            <div className="w-[134px] h-[5px] bg-gray-900 rounded-full" />
          </div>
        )}

        {/* Touch Indicator */}
        {touchSimulation && touchIndicator && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: touchIndicator.x - 25,
              top: touchIndicator.y - 25,
            }}
          >
            <div className="w-[50px] h-[50px] rounded-full bg-primary/30 border-2 border-primary animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}

// Hook para gerenciar o estado do preview
export function useDevicePreviewState(initialDevice: DevicePresetKey = 'iphone-15') {
  const [state, setState] = useState<DevicePreviewState>(() => {
    const preset = DEVICE_PRESETS[initialDevice]
    return {
      device: initialDevice,
      width: preset.width,
      height: preset.height,
      type: preset.type,
      zoom: 100,
      isRotated: false,
      touchSimulation: true,
    }
  })

  const updateState = useCallback((updates: Partial<DevicePreviewState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Calcula zoom ideal para caber no container
  const calculateFitZoom = useCallback((containerWidth: number, containerHeight: number) => {
    const padding = 64 // padding ao redor
    const availableWidth = containerWidth - padding
    const availableHeight = containerHeight - padding
    
    const scaleX = (availableWidth / state.width) * 100
    const scaleY = (availableHeight / state.height) * 100
    const fitZoom = Math.min(scaleX, scaleY, 100)
    
    return Math.max(25, Math.round(fitZoom / 5) * 5) // Arredonda para múltiplos de 5
  }, [state.width, state.height])

  return {
    state,
    updateState,
    calculateFitZoom,
  }
}
