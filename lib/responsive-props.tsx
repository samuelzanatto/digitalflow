'use client'

import { useContext, createContext, useMemo, useState, useEffect, useCallback } from 'react'
import { ViewportMode, ResponsiveValue, ResponsiveProp, isResponsiveValue, VIEWPORT_CONFIGS } from '@/contexts/viewport-context'

/**
 * Breakpoints padrão para detecção automática de viewport
 * Alinhados com Tailwind CSS: sm=640, md=768, lg=1024
 */
export const BREAKPOINTS = {
  mobile: 640,   // 0 - 639px
  tablet: 1024,  // 640 - 1023px
  desktop: Infinity, // 1024px+
} as const

/**
 * Detecta o viewport baseado na largura
 */
export function getViewportFromWidth(width: number): ViewportMode {
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.tablet) return 'tablet'
  return 'desktop'
}

/**
 * Contexto interno para o viewport no editor
 * Este contexto é usado dentro dos componentes Craft para resolver props responsivas
 */

interface EditorViewportContextType {
  currentViewport: ViewportMode
  resolveResponsiveProp: <T>(prop: ResponsiveProp<T> | undefined, fallback: T) => T
  isAutoDetect: boolean
}

const EditorViewportContext = createContext<EditorViewportContextType>({
  currentViewport: 'desktop',
  resolveResponsiveProp: <T,>(prop: ResponsiveProp<T> | undefined, fallback: T): T => {
    if (prop === undefined || prop === null) return fallback
    if (!isResponsiveValue(prop)) return prop as T
    return (prop as ResponsiveValue<T>).desktop ?? fallback
  },
  isAutoDetect: false,
})

interface EditorViewportProviderProps {
  children: React.ReactNode
  viewport?: ViewportMode
  autoDetect?: boolean
}

/**
 * Provider para viewport no editor e na preview
 * 
 * @param viewport - Viewport forçado (usado no editor)
 * @param autoDetect - Se true, detecta viewport automaticamente baseado na largura da tela (usado na preview)
 */
export function EditorViewportProvider({ 
  children, 
  viewport,
  autoDetect = false,
}: EditorViewportProviderProps) {
  const [autoViewport, setAutoViewport] = useState<ViewportMode>('desktop')

  // Detectar viewport automaticamente baseado na largura da janela
  useEffect(() => {
    if (!autoDetect) return

    const updateViewport = () => {
      const width = window.innerWidth
      setAutoViewport(getViewportFromWidth(width))
    }

    // Atualiza imediatamente
    updateViewport()

    // Listener para resize
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [autoDetect])

  // Viewport efetivo: forçado ou auto-detectado
  const effectiveViewport = viewport ?? autoViewport

  const resolveResponsiveProp = useCallback(<T,>(prop: ResponsiveProp<T> | undefined, fallback: T): T => {
    if (prop === undefined || prop === null) return fallback
    if (!isResponsiveValue(prop)) return prop as T
    
    const values = prop as ResponsiveValue<T>
    
    if (effectiveViewport === 'desktop') {
      return values.desktop ?? fallback
    }
    if (effectiveViewport === 'tablet') {
      return values.tablet ?? values.desktop ?? fallback
    }
    // mobile - cascata completa
    return values.mobile ?? values.tablet ?? values.desktop ?? fallback
  }, [effectiveViewport])

  const contextValue = useMemo(() => ({
    currentViewport: effectiveViewport,
    resolveResponsiveProp,
    isAutoDetect: autoDetect,
  }), [effectiveViewport, resolveResponsiveProp, autoDetect])

  return (
    <EditorViewportContext.Provider value={contextValue}>
      {children}
    </EditorViewportContext.Provider>
  )
}

/**
 * Hook para usar dentro dos componentes Craft para resolver props responsivas
 */
export function useEditorViewport() {
  return useContext(EditorViewportContext)
}

/**
 * Hook helper para resolver múltiplas props de uma vez
 */
export function useResolvedProps<T extends Record<string, unknown>>(
  props: T,
  defaults: Partial<T>
): T {
  const { resolveResponsiveProp } = useEditorViewport()
  
  return useMemo(() => {
    const resolved: Record<string, unknown> = {}
    
    for (const key in props) {
      const value = props[key]
      const defaultValue = defaults[key]
      
      // Se o valor é responsivo, resolve
      if (isResponsiveValue(value)) {
        resolved[key] = resolveResponsiveProp(value as ResponsiveProp<unknown>, defaultValue)
      } else {
        resolved[key] = value ?? defaultValue
      }
    }
    
    return resolved as T
  }, [props, defaults, resolveResponsiveProp])
}

/**
 * Lista de propriedades que suportam valores responsivos
 */
export const RESPONSIVE_PROPS = [
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'gap',
  'fontSize',
  'width',
  'height',
  'minHeight',
  'flexDirection',
  'display',
  'justifyContent',
  'alignItems',
] as const

export type ResponsivePropName = typeof RESPONSIVE_PROPS[number]

/**
 * Verifica se uma propriedade suporta valores responsivos
 */
export function isResponsivePropName(name: string): name is ResponsivePropName {
  return RESPONSIVE_PROPS.includes(name as ResponsivePropName)
}

/**
 * Cria um valor responsivo a partir de um valor existente para o viewport atual
 */
export function setResponsiveValue<T>(
  currentValue: ResponsiveProp<T> | undefined,
  newValue: T,
  viewport: ViewportMode
): ResponsiveValue<T> {
  // Se já é um valor responsivo, atualiza o viewport específico
  if (isResponsiveValue(currentValue)) {
    return {
      ...currentValue,
      [viewport]: newValue,
    }
  }
  
  // Se é um valor simples, cria um objeto responsivo com o valor atual como desktop
  // e o novo valor no viewport atual
  if (viewport === 'desktop') {
    return { desktop: newValue }
  }
  
  return {
    desktop: currentValue as T,
    [viewport]: newValue,
  }
}

/**
 * Obtém o valor de um viewport específico de uma prop responsiva
 */
export function getViewportValue<T>(
  prop: ResponsiveProp<T> | undefined,
  viewport: ViewportMode,
  fallback: T
): T {
  if (prop === undefined || prop === null) return fallback
  if (!isResponsiveValue(prop)) return prop as T
  
  const values = prop as ResponsiveValue<T>
  return values[viewport] ?? fallback
}

/**
 * Verifica se uma prop tem valor customizado para um viewport específico
 */
export function hasViewportOverride<T>(
  prop: ResponsiveProp<T> | undefined,
  viewport: ViewportMode
): boolean {
  if (!isResponsiveValue(prop)) return false
  const values = prop as ResponsiveValue<T>
  return viewport in values && values[viewport] !== undefined
}
