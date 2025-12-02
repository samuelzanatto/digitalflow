"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { useAuroraBanner } from "@/contexts/aurora-banner-context"
import { cn } from "@/lib/utils"

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { showAurora } = useAuroraBanner()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div 
      className={cn(
        "flex flex-1 flex-col overflow-hidden rounded-2xl bg-black transition-[margin] duration-300",
        showAurora ? "mt-[93vh] -mb-[90px]" : ""
      )}
      style={{
        transform: `translateY(${scrollY * -0.1}px)`
      }}
    >
      <SiteHeader />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
