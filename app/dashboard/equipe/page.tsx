'use client'

import { useEffect } from 'react'
import { usePageHeader } from '@/hooks/usePageHeader'
import { TeamChat } from '@/components/team-chat'

export default function EquipePage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader(
      'Equipe',
      'Chat geral para todos os membros conectados na dashboard',
    )
  }, [setPageHeader])

  return (
    <div className="flex flex-1 flex-col gap-6 rounded-b-2xl bg-black/90 overflow-hidden">
      <div className="h-[calc(100vh-80px)]">
        <TeamChat />
      </div>
    </div>
  )
}
