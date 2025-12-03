"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { IconArrowUp, IconLoader2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

// Palavras-chave que indicam busca de lugares
const LOCATION_KEYWORDS = [
  'encontre', 'encontrar', 'busque', 'buscar', 'procure', 'procurar',
  'ache', 'achar', 'mostre', 'mostrar', 'onde fica', 'onde tem',
  'restaurante', 'restaurantes', 'farmácia', 'farmácias', 'farmacia', 'farmacias',
  'hospital', 'hospitais', 'banco', 'bancos', 'supermercado', 'supermercados',
  'mercado', 'mercados', 'posto', 'postos', 'gasolina', 'combustível',
  'hotel', 'hotéis', 'hoteis', 'escola', 'escolas', 'academia', 'academias',
  'padaria', 'padarias', 'café', 'cafeteria', 'cafeterias', 'bar', 'bares',
  'loja', 'lojas', 'shopping', 'clínica', 'clinica', 'clínicas', 'clinicas',
  'dentista', 'médico', 'medico', 'veterinário', 'veterinario', 'pet shop',
  'perto de mim', 'próximo', 'proximo', 'próximos', 'proximos', 'na região',
  'por perto', 'aqui perto', 'mais perto'
]

function isLocationSearch(text: string): boolean {
  const lowerText = text.toLowerCase()
  return LOCATION_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

interface AIInputProps {
  className?: string
}

export function AIInput({ className }: AIInputProps) {
  const [input, setInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Não precisa mais fazer auto-resize já que o textarea expande naturalmente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    // Verificar se é uma busca de lugares
    if (isLocationSearch(input.trim())) {
      // Redirecionar diretamente para o mapa
      sessionStorage.setItem("pendingMapSearch", input.trim())
      router.push("/dashboard/mapa")
      return
    }
    
    // Salvar a mensagem no sessionStorage para recuperar na página de chat
    sessionStorage.setItem("pendingAIMessage", input.trim())
    
    // Redirecionar para a página do Assistente IA
    router.push("/dashboard/ia")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const placeholders = [
    "Crie um anúncio persuasivo para...",
    "Me ajude a escrever um email de vendas...",
    "Sugira ideias para uma campanha de...",
    "Encontre restaurantes perto de mim...",
    "Escreva um copy para Instagram sobre...",
    "Busque farmácias próximas...",
  ]

  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [placeholders.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn("w-full max-w-2xl mx-auto px-4", className)}
    >
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "relative flex flex-col gap-0 rounded-2xl border bg-black/40 backdrop-blur-xl p-4 transition-all duration-300 min-h-72",
            isFocused
              ? "border-white/30 shadow-lg shadow-white/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          {/* Input */}
          <div className="flex-1 flex flex-col">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className={cn(
                "w-full bg-transparent text-white placeholder:text-white/40 text-base resize-none outline-none p-2 flex-1",
                "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
                isSubmitting && "opacity-50"
              )}
            />
            {/* Placeholder com transição */}
            {!input && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={placeholderIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute p-2 text-white/40 pointer-events-none text-base"
                >
                  {placeholders[placeholderIndex]}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Botão de enviar */}
          <div className="flex justify-end pt-4">
            <AnimatePresence mode="wait">
            <motion.button
              key={isSubmitting ? "loading" : "submit"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              type="submit"
              disabled={!input.trim() || isSubmitting}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 shrink-0",
                input.trim() && !isSubmitting
                  ? "bg-white text-black hover:bg-white/80 cursor-pointer"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <IconLoader2 className="h-5 w-5 animate-spin" />
              ) : (
                <IconArrowUp className="h-5 w-5" />
              )}
            </motion.button>
            </AnimatePresence>
          </div>
        </div>        {/* Dica */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-white/30 mt-3"
        >
          Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Enter</kbd> para enviar ou <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Shift + Enter</kbd> para nova linha
        </motion.p>
      </form>
    </motion.div>
  )
}
