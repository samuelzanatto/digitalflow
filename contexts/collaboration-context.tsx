"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useRealtimeCollaboration, type CollaboratorPresence, type CursorMessageHistoryItem } from "@/hooks/useRealtimeCollaboration"
import { CollaboratorCursorsOverlay } from "@/components/collaboration/collaborator-cursor"
import { CursorMessageInput, useCursorMessageShortcut } from "@/components/collaboration/cursor-message-input"
import { CollaborationStatus } from "@/components/collaboration/collaboration-status"
import { FloatingMessages } from "@/components/collaboration/floating-messages"
import { OwnCursor } from "@/components/collaboration/own-cursor"

const CURSORS_VISIBLE_KEY = "collaboration_cursors_visible"

interface CollaborationContextType {
  collaborators: CollaboratorPresence[]
  collaboratorsOnCurrentPage: CollaboratorPresence[]
  collaboratorsByPath: Record<string, CollaboratorPresence[]>
  messageHistory: CursorMessageHistoryItem[]
  isConnected: boolean
  isInChatPage: boolean
  isInAnyChatPage: boolean
  currentUserColor: string
  setUserColor: (color: string) => void
  availableColors: string[]
  cursorsVisible: boolean
  setCursorsVisible: (visible: boolean) => void
  openMessageInput: () => void
  setTypingIndicator: (isTyping: boolean) => void
  sendCursorMessage: (message: string, skipPersist?: boolean) => void
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

function CollaborationProviderInner({ children }: { children: ReactNode }) {
  const {
    collaborators,
    collaboratorsOnCurrentPage,
    collaboratorsByPath,
    messageHistory,
    isConnected,
    isInChatPage,
    isInAnyChatPage,
    updateCursorPosition,
    sendCursorMessage,
    setTypingIndicator,
    currentUserColor,
    setUserColor,
    availableColors,
  } = useRealtimeCollaboration()

  const [isMessageInputOpen, setIsMessageInputOpen] = useState(false)
  
  // Preferência de visualização de cursores (salva no localStorage)
  // Usar lazy initializer para evitar efeito cascata
  const [cursorsVisible, setCursorsVisibleState] = useState(() => {
    if (typeof window === "undefined") return true
    const saved = localStorage.getItem(CURSORS_VISIBLE_KEY)
    return saved === null ? true : saved === "true"
  })
  
  // Função para alterar e salvar preferência
  const setCursorsVisible = useCallback((visible: boolean) => {
    setCursorsVisibleState(visible)
    if (typeof window !== "undefined") {
      localStorage.setItem(CURSORS_VISIBLE_KEY, String(visible))
    }
  }, [])

  const openMessageInput = useCallback(() => {
    // Não abre input de mensagem na tela de chat ou se cursores estão desativados
    if (isInChatPage || !cursorsVisible) return
    setIsMessageInputOpen(true)
  }, [isInChatPage, cursorsVisible])

  const closeMessageInput = useCallback(() => {
    setIsMessageInputOpen(false)
    setTypingIndicator(false)
  }, [setTypingIndicator])

  const handleSendMessage = useCallback((message: string) => {
    sendCursorMessage(message)
    setTypingIndicator(false)
  }, [sendCursorMessage, setTypingIndicator])

  const handleTyping = useCallback((isTyping: boolean) => {
    setTypingIndicator(isTyping)
  }, [setTypingIndicator])

  // Atalho de teclado Cmd/Ctrl + M (desabilitado na tela de chat ou se cursores desativados)
  useCursorMessageShortcut(openMessageInput, isInChatPage || !cursorsVisible)

  // Rastreia movimento do mouse
  useEffect(() => {
    if (!isConnected) return

    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e.clientX, e.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isConnected, updateCursorPosition])

  return (
    <CollaborationContext.Provider
      value={{
        collaborators,
        collaboratorsOnCurrentPage,
        collaboratorsByPath,
        messageHistory,
        isConnected,
        isInChatPage,
        isInAnyChatPage,
        currentUserColor,
        setUserColor,
        availableColors,
        cursorsVisible,
        setCursorsVisible,
        openMessageInput,
        setTypingIndicator,
        sendCursorMessage,
      }}
    >
      {children}
      
      {/* Overlay de cursores dos colaboradores (só aparece se cursores estão visíveis) */}
      {cursorsVisible && (
        <CollaboratorCursorsOverlay collaborators={collaboratorsOnCurrentPage} />
      )}
      
      {/* Cursor personalizado do próprio usuário */}
      <OwnCursor color={currentUserColor} visible={cursorsVisible} />
      
      {/* Input de mensagem flutuante (não aparece na tela de chat ou se cursores desativados) */}
      {!isInChatPage && cursorsVisible && (
        <CursorMessageInput
          isOpen={isMessageInputOpen}
          onClose={closeMessageInput}
          onSend={handleSendMessage}
          onTyping={handleTyping}
        />
      )}
    </CollaborationContext.Provider>
  )
}

export function CollaborationProvider({ children }: { children: ReactNode }) {
  return (
    <CollaborationProviderInner>
      {children}
      {/* Status de colaboração - precisa estar dentro do provider para usar o contexto */}
      <CollaborationStatusWrapper />
      {/* Mensagens flutuantes - precisa estar dentro do provider para usar o contexto */}
      <FloatingMessagesWrapper />
    </CollaborationProviderInner>
  )
}

// Wrapper separado para o status que precisa usar o contexto
function CollaborationStatusWrapper() {
  return <CollaborationStatus />
}

// Wrapper separado para as mensagens flutuantes que precisa usar o contexto
function FloatingMessagesWrapper() {
  return <FloatingMessages />
}

export function useCollaboration() {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error("useCollaboration must be used within a CollaborationProvider")
  }
  return context
}
