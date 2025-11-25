'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

export interface ViewportConfig {
  width: number
  height: number
  label: string
  icon: 'monitor' | 'tablet' | 'smartphone'
}

export const VIEWPORT_CONFIGS: Record<ViewportMode, ViewportConfig> = {
  desktop: {
    width: 1440,  // 16:9 proporção
    height: 810,
    label: 'Desktop',
    icon: 'monitor',
  },
  tablet: {
    width: 768,
    height: 1024,
    label: 'Tablet',
    icon: 'tablet',
  },
  mobile: {
    width: 390,
    height: 844,
    label: 'Mobile',
    icon: 'smartphone',
  },
}

/**
 * Tipo para valores responsivos - pode ser um valor simples ou objeto com valores por viewport
 */
export interface ResponsiveValue<T> {
  desktop?: T
  tablet?: T
  mobile?: T
}

/**
 * Tipo que aceita valor simples OU responsivo
 */
export type ResponsiveProp<T> = T | ResponsiveValue<T>

interface ViewportContextType {
  currentViewport: ViewportMode
  setViewport: (mode: ViewportMode) => void
  config: ViewportConfig
  getResponsiveValue: <T>(values: ResponsiveProp<T>, fallback: T) => T
  resolveResponsiveProp: <T>(prop: ResponsiveProp<T> | undefined, fallback: T) => T
}

const ViewportContext = createContext<ViewportContextType | null>(null)

interface ViewportProviderProps {
  children: ReactNode
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const [currentViewport, setCurrentViewport] = useState<ViewportMode>('desktop')

  const setViewport = useCallback((mode: ViewportMode) => {
    setCurrentViewport(mode)
  }, [])

  const config = VIEWPORT_CONFIGS[currentViewport]

  /**
   * Retorna o valor responsivo para o viewport atual.
   * Cascateia de mobile -> tablet -> desktop se valores menores não existirem.
   */
  const getResponsiveValue = useCallback(<T,>(values: ResponsiveProp<T>, fallback: T): T => {
    // Se não é objeto ou é null/undefined, retorna como valor simples
    if (values === null || values === undefined) {
      return fallback
    }
    
    // Se é valor simples (não é objeto responsivo), retorna direto
    if (!isResponsiveValue(values)) {
      return values as T
    }

    const responsiveValues = values as ResponsiveValue<T>

    // Para desktop, usa apenas o valor desktop ou fallback
    if (currentViewport === 'desktop') {
      return responsiveValues.desktop ?? fallback
    }

    // Para tablet, usa tablet -> desktop -> fallback
    if (currentViewport === 'tablet') {
      return responsiveValues.tablet ?? responsiveValues.desktop ?? fallback
    }

    // Para mobile, usa mobile -> tablet -> desktop -> fallback
    return responsiveValues.mobile ?? responsiveValues.tablet ?? responsiveValues.desktop ?? fallback
  }, [currentViewport])

  /**
   * Resolve uma prop que pode ser simples ou responsiva
   */
  const resolveResponsiveProp = useCallback(<T,>(prop: ResponsiveProp<T> | undefined, fallback: T): T => {
    if (prop === undefined || prop === null) {
      return fallback
    }
    return getResponsiveValue(prop, fallback)
  }, [getResponsiveValue])

  return (
    <ViewportContext.Provider
      value={{
        currentViewport,
        setViewport,
        config,
        getResponsiveValue,
        resolveResponsiveProp,
      }}
    >
      {children}
    </ViewportContext.Provider>
  )
}

export function useViewport() {
  const context = useContext(ViewportContext)
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider')
  }
  return context
}

/**
 * Hook para usar fora do provider (retorna valores padrão desktop)
 */
export function useViewportSafe() {
  const context = useContext(ViewportContext)
  
  const defaultResolve = <T,>(prop: ResponsiveProp<T> | undefined, fallback: T): T => {
    if (prop === undefined || prop === null) return fallback
    if (!isResponsiveValue(prop)) return prop as T
    return (prop as ResponsiveValue<T>).desktop ?? fallback
  }
  
  if (!context) {
    return {
      currentViewport: 'desktop' as ViewportMode,
      config: VIEWPORT_CONFIGS.desktop,
      resolveResponsiveProp: defaultResolve,
      getResponsiveValue: defaultResolve,
      setViewport: () => {},
    }
  }
  return context
}

/**
 * Helper para criar valores responsivos
 */
export function createResponsiveValue<T>(
  desktop: T,
  tablet?: T,
  mobile?: T
): ResponsiveValue<T> {
  return {
    desktop,
    tablet: tablet ?? desktop,
    mobile: mobile ?? tablet ?? desktop,
  }
}

/**
 * Verifica se um valor é do tipo ResponsiveValue
 */
export function isResponsiveValue<T>(value: unknown): value is ResponsiveValue<T> {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return 'desktop' in obj || 'tablet' in obj || 'mobile' in obj
}
