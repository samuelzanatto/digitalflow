"use client"

import { AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" onExitComplete={() => null}>
      <div key={pathname}>
        {children}
      </div>
    </AnimatePresence>
  )
}
