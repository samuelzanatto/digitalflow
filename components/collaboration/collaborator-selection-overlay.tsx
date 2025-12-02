"use client"

import React, { useEffect, useState, useRef } from "react"
import { useEditor } from "@craftjs/core"
import { PageBuilderCollaborator } from "@/hooks/usePageBuilderCollaboration"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CollaboratorSelectionOverlayProps {
  collaborators: PageBuilderCollaborator[]
}

interface SelectionIndicator {
  collaborator: PageBuilderCollaborator
  top: number
  left: number
  width: number
  height: number
}

/**
 * Componente que mostra indicadores visuais de seleção de colaboradores
 * Usa position absolute relativo ao craftjs-frame
 */
export function CollaboratorSelectionOverlay({ collaborators }: CollaboratorSelectionOverlayProps) {
  const [indicators, setIndicators] = useState<SelectionIndicator[]>([])
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { nodes } = useEditor((state) => ({
    nodes: state.nodes,
  }))

  useEffect(() => {
    const updateIndicators = () => {
      const newIndicators: SelectionIndicator[] = []

      for (const collaborator of collaborators) {
        if (!collaborator.selectedNodeId) continue
        if (!nodes[collaborator.selectedNodeId]) continue

        // Busca o elemento pelo data-node-id
        const element = document.querySelector(`[data-node-id="${collaborator.selectedNodeId}"]`) as HTMLElement
        
        if (element) {
          // Calcula posição usando offsetTop/offsetLeft acumulados até o craftjs-frame
          let top = 0
          let left = 0
          let currentElement: HTMLElement | null = element
          
          // Sobe na hierarquia até encontrar o craftjs-frame ou o root
          while (currentElement && !currentElement.classList.contains('craftjs-frame')) {
            top += currentElement.offsetTop
            left += currentElement.offsetLeft
            currentElement = currentElement.offsetParent as HTMLElement | null
          }
          
          newIndicators.push({ 
            collaborator, 
            top,
            left,
            width: element.offsetWidth,
            height: element.offsetHeight,
          })
        }
      }

      setIndicators(newIndicators)
    }

    // Debounce
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = setTimeout(updateIndicators, 50)

    const handleUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      updateTimeoutRef.current = setTimeout(updateIndicators, 50)
    }

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    const observer = new MutationObserver(handleUpdate)
    const craftFrame = document.querySelector('.craftjs-frame')
    if (craftFrame) {
      observer.observe(craftFrame, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }

    const interval = setInterval(updateIndicators, 200)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
      observer.disconnect()
      clearInterval(interval)
    }
  }, [collaborators, nodes])

  if (indicators.length === 0) return null

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 100, overflow: 'hidden' }}
    >
      {indicators.map(({ collaborator, top, left, width, height }) => {
        const initials = collaborator.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        // Badge position - abaixo se muito perto do topo
        const badgeTop = top < 30 ? height + 4 : -28

        return (
          <div
            key={`selection-${collaborator.id}`}
            className="absolute pointer-events-none transition-all duration-100 ease-out"
            style={{
              top: top - 2,
              left: left - 2,
              width: width + 4,
              height: height + 4,
              border: `2px dashed ${collaborator.color}`,
              borderRadius: '4px',
              boxShadow: `0 0 0 1px ${collaborator.color}20`,
            }}
          >
            <div
              className="absolute flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg"
              style={{
                top: badgeTop,
                left: -2,
                backgroundColor: collaborator.color,
                whiteSpace: 'nowrap',
              }}
            >
              <Avatar className="w-4 h-4 border border-white/30">
                <AvatarImage src={collaborator.avatarUrl || ""} alt={collaborator.name} />
                <AvatarFallback 
                  className="text-[8px] font-bold"
                  style={{ backgroundColor: collaborator.color, color: 'white' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[100px] truncate">{collaborator.name}</span>
              {collaborator.selectedNodeName && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="opacity-80 max-w-20 truncate">{collaborator.selectedNodeName}</span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
