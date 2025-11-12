'use client'

import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { TransitionLink } from '@/components/transition-link'

export function BackButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <TransitionLink
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white transition-all duration-300 backdrop-blur-sm"
      >
        <motion.div
          whileHover={{ x: -4 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowLeft size={18} />
        </motion.div>
        <span className="text-sm font-medium">Voltar</span>
      </TransitionLink>
    </motion.div>
  )
}
