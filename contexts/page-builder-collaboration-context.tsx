"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { PageBuilderCollaborator } from "@/hooks/usePageBuilderCollaboration"

interface PageBuilderCollaborationContextValue {
  broadcastPageSaved: () => void
  setBroadcastPageSaved: (fn: () => void) => void
  onSaveComplete: () => void
  setOnSaveComplete: (fn: () => void) => void
  collaborators: PageBuilderCollaborator[]
  setCollaborators: (collaborators: PageBuilderCollaborator[]) => void
  isConnected: boolean
  setIsConnected: (isConnected: boolean) => void
}

const PageBuilderCollaborationContext = createContext<PageBuilderCollaborationContextValue | null>(null)

export function PageBuilderCollaborationProvider({ children }: { children: React.ReactNode }) {
  const [broadcastFn, setBroadcastFn] = useState<(() => void) | null>(null)
  const [onSaveFn, setOnSaveFn] = useState<(() => void) | null>(null)
  const [collaborators, setCollaboratorsState] = useState<PageBuilderCollaborator[]>([])
  const [isConnected, setIsConnectedState] = useState(false)

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

  const setCollaborators = useCallback((collaborators: PageBuilderCollaborator[]) => {
    setCollaboratorsState(collaborators)
  }, [])

  const setIsConnected = useCallback((isConnected: boolean) => {
    setIsConnectedState(isConnected)
  }, [])

  return (
    <PageBuilderCollaborationContext.Provider
      value={{
        broadcastPageSaved,
        setBroadcastPageSaved,
        onSaveComplete,
        setOnSaveComplete,
        collaborators,
        setCollaborators,
        isConnected,
        setIsConnected,
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
      collaborators: [] as PageBuilderCollaborator[],
      setCollaborators: () => {},
      isConnected: false,
      setIsConnected: () => {},
    }
  }
  return context
}
