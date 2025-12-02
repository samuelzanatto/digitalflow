"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface PageBuilderCollaborationContextValue {
  broadcastPageSaved: () => void
  setBroadcastPageSaved: (fn: () => void) => void
  onSaveComplete: () => void
  setOnSaveComplete: (fn: () => void) => void
}

const PageBuilderCollaborationContext = createContext<PageBuilderCollaborationContextValue | null>(null)

export function PageBuilderCollaborationProvider({ children }: { children: React.ReactNode }) {
  const [broadcastFn, setBroadcastFn] = useState<(() => void) | null>(null)
  const [onSaveFn, setOnSaveFn] = useState<(() => void) | null>(null)

  const broadcastPageSaved = useCallback(() => {
    broadcastFn?.()
  }, [broadcastFn])

  const setBroadcastPageSaved = useCallback((fn: () => void) => {
    setBroadcastFn(() => fn)
  }, [])

  const onSaveComplete = useCallback(() => {
    onSaveFn?.()
  }, [onSaveFn])

  const setOnSaveComplete = useCallback((fn: () => void) => {
    setOnSaveFn(() => fn)
  }, [])

  return (
    <PageBuilderCollaborationContext.Provider
      value={{
        broadcastPageSaved,
        setBroadcastPageSaved,
        onSaveComplete,
        setOnSaveComplete,
      }}
    >
      {children}
    </PageBuilderCollaborationContext.Provider>
  )
}

export function usePageBuilderCollaborationContext() {
  const context = useContext(PageBuilderCollaborationContext)
  if (!context) {
    // Return no-op functions if not inside provider
    return {
      broadcastPageSaved: () => {},
      setBroadcastPageSaved: () => {},
      onSaveComplete: () => {},
      setOnSaveComplete: () => {},
    }
  }
  return context
}
