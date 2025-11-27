"use client"

import * as React from "react"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"

interface OwnCursorProps {
  color: string
  visible: boolean
}

export function OwnCursor({ color, visible }: OwnCursorProps) {
  const [isActive, setIsActive] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Evita problemas de hidratação - só renderiza no cliente
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!visible || !mounted) return

    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setIsActive(true)
    }

    const handleMouseLeave = () => setIsActive(false)
    const handleMouseEnter = () => setIsActive(true)

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [visible, mounted, x, y])

  // Esconde o cursor padrão do sistema
  React.useEffect(() => {
    if (!mounted) return
    
    if (visible) {
      const style = document.createElement("style")
      style.id = "hide-cursor-style"
      style.textContent = "* { cursor: none !important; }"
      document.head.appendChild(style)
      
      return () => {
        const existingStyle = document.getElementById("hide-cursor-style")
        if (existingStyle) {
          existingStyle.remove()
        }
      }
    }
  }, [visible, mounted])

  // Não renderiza nada até estar montado no cliente
  if (!mounted) return null

  const shouldShow = visible && isActive

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="pointer-events-none fixed z-99999"
          style={{ left: x, top: y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <svg
            aria-hidden="true"
            className="size-5 drop-shadow-md"
            fill="none"
            focusable="false"
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color }}
          >
            <path
              fill="currentColor"
              d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
