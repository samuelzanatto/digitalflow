"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function useDelayedRouter() {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)

  const push = (href: string) => {
    if (isAnimating) return

    setIsAnimating(true)
    // Aguarda a animação de saída (0.5s) + margem de segurança (100ms)
    setTimeout(() => {
      router.push(href)
      setIsAnimating(false)
    }, 600)
  }

  return { push, isAnimating }
}
