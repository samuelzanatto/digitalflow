"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface AuroraBannerContextType {
  showAurora: boolean
  setShowAurora: (show: boolean) => void
}

const AuroraBannerContext = createContext<AuroraBannerContextType | null>(null)

export function useAuroraBanner() {
  const context = useContext(AuroraBannerContext)
  if (!context) {
    throw new Error("useAuroraBanner must be used within AuroraBannerProvider")
  }
  return context
}

export function AuroraBannerProvider({ children }: { children: ReactNode }) {
  const [showAurora, setShowAurora] = useState(false)

  return (
    <AuroraBannerContext.Provider value={{ showAurora, setShowAurora }}>
      {children}
    </AuroraBannerContext.Provider>
  )
}
