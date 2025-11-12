'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransitionContext } from '@/hooks/useTransitionContext'
import React from 'react'

interface TransitionLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function TransitionLink({
  href,
  children,
  className,
  onClick,
}: TransitionLinkProps) {
  const router = useRouter()
  const { triggerExit, setIsExiting } = useTransitionContext()

  const handleNavigate = async (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e)
    }

    // Previne o comportamento padrão do link
    e.preventDefault()

    // Sinaliza que está saindo para ativar animações
    setIsExiting(true)

    // Aguarda a animação de saída completar
    await triggerExit()

    // Depois navega
    router.push(href)
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleNavigate}
    >
      {children}
    </Link>
  )
}
