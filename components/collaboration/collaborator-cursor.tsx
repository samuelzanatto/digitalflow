"use client"

import { useMemo, useEffect } from "react"
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring,
  type SpringOptions 
} from "framer-motion"
import { 
  Cursor, 
  CursorPointer, 
  CursorBody, 
  CursorName, 
  CursorMessage 
} from "@/components/ui/animated-cursor"
import type { CollaboratorPresence } from "@/hooks/useRealtimeCollaboration"

// Configuração de spring para movimento suave
const SPRING_CONFIG: SpringOptions = {
  stiffness: 500,
  damping: 50,
  bounce: 0,
}

interface CollaboratorCursorProps {
  collaborator: CollaboratorPresence
}

// Componente de animação de digitação
function TypingIndicator() {
  return (
    <span className="flex items-center gap-0.5 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  )
}

export function CollaboratorCursor({ collaborator }: CollaboratorCursorProps) {
  // Motion values para posição do cursor
  const x = useMotionValue(collaborator.cursorPosition?.x ?? 0)
  const y = useMotionValue(collaborator.cursorPosition?.y ?? 0)
  
  // Springs para movimento suave
  const springX = useSpring(x, SPRING_CONFIG)
  const springY = useSpring(y, SPRING_CONFIG)

  // Atualiza posição quando recebe novos dados
  useEffect(() => {
    if (collaborator.cursorPosition) {
      x.set(collaborator.cursorPosition.x)
      y.set(collaborator.cursorPosition.y)
    }
  }, [collaborator.cursorPosition, x, y])

  // Calcula se deve mostrar mensagem
  const hasMessage = useMemo(() => {
    return Boolean(collaborator.message && collaborator.messageTimestamp)
  }, [collaborator.message, collaborator.messageTimestamp])

  // Verifica se está digitando
  const isTyping = collaborator.isTyping && !hasMessage

  if (!collaborator.cursorPosition) return null

  return (
    <motion.div
      className="pointer-events-none fixed z-9999"
      style={{ 
        left: springX, 
        top: springY,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <Cursor>
        <CursorPointer style={{ color: collaborator.color }} />
        <CursorBody 
          className="text-white shadow-lg"
          style={{ backgroundColor: collaborator.color }}
        >
          <CursorName className="font-medium opacity-100">
            {collaborator.name.split(" ")[0]}
          </CursorName>
          <AnimatePresence mode="wait">
            {isTyping && (
              <motion.span
                key="typing"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CursorMessage>
                  <TypingIndicator />
                </CursorMessage>
              </motion.span>
            )}
            {hasMessage && collaborator.message && (
              <motion.span
                key="message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CursorMessage>{collaborator.message}</CursorMessage>
              </motion.span>
            )}
          </AnimatePresence>
        </CursorBody>
      </Cursor>
    </motion.div>
  )
}

interface CollaboratorCursorsOverlayProps {
  collaborators: CollaboratorPresence[]
}

export function CollaboratorCursorsOverlay({ collaborators }: CollaboratorCursorsOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-9998 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {collaborators.map((collaborator) => (
          <CollaboratorCursor key={collaborator.id} collaborator={collaborator} />
        ))}
      </AnimatePresence>
    </div>
  )
}
