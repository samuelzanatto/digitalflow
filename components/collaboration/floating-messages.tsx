"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCollaboration } from "@/contexts/collaboration-context"
import type { CursorMessageHistoryItem } from "@/hooks/useRealtimeCollaboration"

// Tempo que cada mensagem fica visível (em ms)
const MESSAGE_VISIBLE_TIME = 30000 // 30 segundos
const FADE_DURATION = 500 // 0.5 segundos para fade out

export function FloatingMessages() {
  const { messageHistory, isConnected, isInAnyChatPage, cursorsVisible, collaborators } = useCollaboration()
  const [fadingMessages, setFadingMessages] = useState<Set<string>>(new Set())
  const [removedMessages, setRemovedMessages] = useState<Set<string>>(new Set())
  const messageTimersRef = useRef<Map<string, { fadeTimer: NodeJS.Timeout; removeTimer: NodeJS.Timeout }>>(new Map())

  // Filtra mensagens que ainda não foram removidas
  const visibleMessages = useMemo(() => {
    return messageHistory.filter((msg) => !removedMessages.has(msg.messageId))
  }, [messageHistory, removedMessages])

  // Configura fade out para cada mensagem nova
  useEffect(() => {
    messageHistory.forEach((msg) => {
      // Só processa cada mensagem uma vez
      if (messageTimersRef.current.has(msg.messageId)) return

      const age = Date.now() - msg.timestamp
      const remainingTime = Math.max(0, MESSAGE_VISIBLE_TIME - age)

      // Timer para iniciar fade
      const fadeTimer = setTimeout(() => {
        setFadingMessages((prev) => new Set([...prev, msg.messageId]))
      }, remainingTime)

      // Timer para remover após fade
      const removeTimer = setTimeout(() => {
        setRemovedMessages((prev) => new Set([...prev, msg.messageId]))
        messageTimersRef.current.delete(msg.messageId)
      }, remainingTime + FADE_DURATION)

      messageTimersRef.current.set(msg.messageId, { fadeTimer, removeTimer })
    })

    // Cleanup: limpa timers de mensagens que não existem mais no histórico
    const currentIds = new Set(messageHistory.map((m) => m.messageId))
    messageTimersRef.current.forEach((timers, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timers.fadeTimer)
        clearTimeout(timers.removeTimer)
        messageTimersRef.current.delete(id)
      }
    })
  }, [messageHistory])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      messageTimersRef.current.forEach((timers) => {
        clearTimeout(timers.fadeTimer)
        clearTimeout(timers.removeTimer)
      })
      messageTimersRef.current.clear()
    }
  }, [])

  // Não mostra em telas de chat ou se cursores estão desativados
  if (!isConnected || isInAnyChatPage || !cursorsVisible) return null

  // Não mostra se não há colaboradores (mas mostra as próprias mensagens)
  // Removido: if (collaborators.length === 0) return null

  // Não mostra se não há mensagens visíveis
  if (visibleMessages.length === 0) return null

  return (
    <motion.div
      className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="popLayout">
        {visibleMessages.map((msg, index) => (
          <MessageBubble
            key={msg.messageId}
            message={msg}
            index={index}
            total={visibleMessages.length}
            isFading={fadingMessages.has(msg.messageId)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

interface MessageBubbleProps {
  message: CursorMessageHistoryItem
  index: number
  total: number
  isFading: boolean
}

function MessageBubble({ message, index, total, isFading }: MessageBubbleProps) {
  // Calcula opacidade baseada na posição
  // Mensagens mais recentes (índice maior) têm opacidade maior
  // Mensagens mais antigas (índice menor) ficam mais transparentes
  const opacityByPosition = Math.max(0.5, 0.5 + (index / Math.max(1, total - 1)) * 0.5)
  const baseOpacity = isFading ? 0 : opacityByPosition

  const initials = message.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{
        opacity: baseOpacity,
        x: 0,
        scale: 1,
      }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        opacity: { duration: 0.3 },
      }}
      className="flex items-end gap-2"
    >
      {/* Bolha de mensagem */}
      <div
        className="relative max-w-[280px] rounded-2xl rounded-br-sm px-3 py-2 shadow-lg"
        style={{
          backgroundColor: message.color,
        }}
      >
        {/* Nome do remetente */}
        <p className="mb-0.5 text-[10px] font-medium text-white/80">
          {message.isOwn ? "Você" : message.name}
        </p>
        {/* Texto da mensagem */}
        <p className="text-sm font-medium text-white wrap-break-word">
          {message.message}
        </p>
        {/* Timestamp */}
        <p className="mt-0.5 text-[9px] text-white/60">
          {formatTime(message.timestamp)}
        </p>
      </div>

      {/* Avatar */}
      <Avatar className="h-6 w-6 border-2 shrink-0" style={{ borderColor: message.color }}>
        <AvatarImage src={message.avatarUrl || undefined} alt={message.name} />
        <AvatarFallback
          className="text-[10px] font-medium text-white"
          style={{ backgroundColor: message.color }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  )
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
