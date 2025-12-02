"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAuroraBanner } from "@/contexts/aurora-banner-context"
import { AIInput } from "@/components/ai-input"

export function AuroraBanner() {
  const { showAurora } = useAuroraBanner()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!showAurora) return null

  return (
    <div 
      className="absolute -top-2 left-0 -right-2 h-[75vh] overflow-hidden pointer-events-none z-0 bg-sidebar"
      style={{
        transform: `translateY(${scrollY * 0.5}px)`,
        opacity: Math.max(0, 1 - scrollY / 600)
      }}
    >
      {/* Aurora Background - começa mais à direita para não tocar na sidebar */}
      <div
        className="absolute top-0 left-48 right-0 bottom-0 overflow-hidden"
        style={
          {
            "--aurora":
              "repeating-linear-gradient(100deg,#9333ea_10%,#a855f7_15%,#c084fc_20%,#ec4899_25%,#f472b6_30%)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",

            "--purple-600": "#9333ea",
            "--purple-500": "#a855f7",
            "--purple-400": "#c084fc",
            "--pink-500": "#ec4899",
            "--pink-400": "#f472b6",
            "--black": "#000",
            "--transparent": "transparent",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--dark-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-20 blur-[10px] filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--purple-600)_10%,var(--purple-500)_15%,var(--purple-400)_20%,var(--pink-500)_25%,var(--pink-400)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""]`,
            `[mask-image:radial-gradient(ellipse_at_100%_0%,black_40%,var(--transparent)_90%)]`
          )}
        />
      </div>
      
      {/* Container com logo e input */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-30 pt-20">
        {/* Logo e texto */}
        <div className="flex items-center gap-3 mb-12">
          {/* Logo */}
          <Image 
            src="/logo.png" 
            alt="flowAI Logo" 
            width={40} 
            height={40}
            className="rounded-lg"
          />
          {/* Texto flowAI */}
          <span className="text-white text-2xl font-semibold">flowAI</span>
        </div>
        
        {/* Input */}
        <AIInput />
      </div>
      
      {/* Gradiente de suavização na borda esquerda para mesclar com a sidebar */}
      <div className="absolute top-0 left-48 w-64 h-full bg-linear-to-r from-sidebar to-transparent z-20" />
      {/* Gradiente de suavização no bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-sidebar to-transparent z-20" />
    </div>
  )
}

export function useAuroraSpacing() {
  const { showAurora } = useAuroraBanner()
  return showAurora ? "mt-36" : ""
}
