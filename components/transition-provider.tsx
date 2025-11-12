'use client'

import { useState, useCallback } from 'react'
import { TransitionContext, TransitionContextType } from '@/hooks/useTransitionContext'

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const triggerExit = useCallback(async () => {
    setIsExiting(true)
    // Aguarda 500ms (duração da animação) + 100ms de margem
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsExiting(false)
        setIsTransitioning(false)
        resolve()
      }, 600)
    })
  }, [])

  const value: TransitionContextType = {
    isTransitioning,
    isExiting,
    setIsTransitioning,
    setIsExiting,
    triggerExit,
  }

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  )
}
