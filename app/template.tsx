"use client"

import { ReactNode } from "react"

export default function Template({ children }: { children: ReactNode }) {
  // Removido AnimatePresence com key={pathname} pois causava
  // remontagem de todos os componentes a cada navegação,
  // incluindo providers e sidebar
  return <>{children}</>
}
