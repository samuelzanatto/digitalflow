"use client"

import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { BackButton } from "@/components/back-button"
import { motion } from "framer-motion"
import { useTransitionContext } from "@/hooks/useTransitionContext"

export default function LoginPage() {
  const { isExiting } = useTransitionContext()

  return (
    <motion.div
      className="relative min-h-svh flex flex-col items-center justify-center gap-6 p-6 md:p-10 bg-black overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 50 : 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Conteúdo - precisa estar ANTES do grid no DOM para estar acima */}
      <Suspense
        fallback={
          <div className="w-full max-w-sm relative z-20">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-10 text-center text-white/70">
              Carregando formulário...
            </div>
          </div>
        }
      >
        <motion.div
          className="w-full max-w-sm relative z-20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.95 : 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Card translúcido com blur imediato */}
          <div className="absolute inset-0 -z-10 bg-black/60 rounded-2xl" style={{ backdropFilter: 'blur(50px)' }} />
          <div className="absolute inset-0 -z-10 bg-white/10 border border-white/20 rounded-2xl" />
          
          <div className="relative z-10 px-8 py-10 rounded-2xl">
            <LoginForm />
          </div>
        </motion.div>
      </Suspense>

      {/* Gradientes de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Gradiente roxo topo-esquerda */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl opacity-40" />
        
        {/* Gradiente rosa topo-direita */}
        <div className="absolute -top-20 -right-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl opacity-40" />
        
        {/* Gradiente roxo-escuro abaixo */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl opacity-30" />
        
        {/* Grid overlay suave */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[48px_48px]" />
      </div>

      {/* Botão de voltar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 20 : 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6"
      >
        <BackButton />
      </motion.div>
    </motion.div>
  )
}
