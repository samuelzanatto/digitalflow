import { createContext, useContext } from 'react'

export interface TransitionContextType {
  isTransitioning: boolean
  isExiting: boolean
  setIsTransitioning: (value: boolean) => void
  setIsExiting: (value: boolean) => void
  triggerExit: () => Promise<void>
}

export const TransitionContext = createContext<TransitionContextType | undefined>(undefined)

export function useTransitionContext() {
  const context = useContext(TransitionContext)
  if (!context) {
    throw new Error('useTransitionContext must be used within TransitionProvider')
  }
  return context
}
