"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"

export function PageLoader() {
  const pathname = usePathname()

  useEffect(() => {
    // Loading desativado
    return
  }, [pathname])

  return (
    <AnimatePresence>
      {false && (
        <div>Loading desativado</div>
      )}
    </AnimatePresence>
  )
}
