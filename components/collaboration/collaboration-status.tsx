"use client"

import { motion } from "framer-motion"
import { MessageCircle, Users } from "lucide-react"
import { useCollaboration } from "@/contexts/collaboration-context"

export function CollaborationStatus() {
  const { collaborators, isConnected, isInAnyChatPage, cursorsVisible } = useCollaboration()

  // Não mostra nada em telas de chat ou se cursores estão desativados
  if (!isConnected || collaborators.length === 0 || isInAnyChatPage || !cursorsVisible) return null

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-white/10 bg-black/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex items-center gap-2 text-white/60">
        <Users className="h-4 w-4" />
        <span className="text-sm">{collaborators.length} online</span>
      </div>
      <div className="h-4 w-px bg-white/20" />
      <div className="flex items-center gap-2 text-white/60">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/80">⌘M</kbd>
          {" "}mensagem
        </span>
      </div>
    </motion.div>
  )
}
