"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CursorMessageInputProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
  onTyping?: (isTyping: boolean) => void
  className?: string
}

export function CursorMessageInput({ isOpen, onClose, onSend, onTyping, className }: CursorMessageInputProps) {
  const [message, setMessage] = useState("")
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
      onClose()
    }
  }, [message, onSend, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMessage("")
      onClose()
    }
  }, [onClose])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    // Notifica que está digitando
    if (onTyping) {
      onTyping(value.length > 0)
      
      // Limpa timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Para de digitar após 2 segundos sem atividade
      if (value.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false)
        }, 2000)
      }
    }
  }, [onTyping])

  // Limpa typing quando fecha
  useEffect(() => {
    if (!isOpen && onTyping) {
      onTyping(false)
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [isOpen, onTyping])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed bottom-6 left-1/2 z-9999 -translate-x-1/2",
            className
          )}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/90 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            <Input
              autoFocus
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Envie uma mensagem para a equipe..."
              className="h-9 min-w-[280px] border-0 bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus-visible:ring-0"
              maxLength={100}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-white/40">
            Pressione <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/60">Enter</kbd> para enviar
            ou <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/60">Esc</kbd> para cancelar
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook para controlar o atalho de teclado
export function useCursorMessageShortcut(onOpen: () => void, disabled?: boolean) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + M para abrir input de mensagem
      if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault()
        if (!disabled) {
          onOpen()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpen, disabled])
}
