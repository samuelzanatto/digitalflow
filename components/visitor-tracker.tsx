"use client"

import { useEffect, useRef, useCallback } from "react"

interface VisitorTrackerProps {
  pageSlug?: string
  pageUrl?: string
  pageId?: string
}

// Gerar ou recuperar ID único do visitante
function getVisitorId(): string {
  if (typeof window === "undefined") return ""
  
  let visitorId = localStorage.getItem("df_visitor_id")
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("df_visitor_id", visitorId)
  }
  return visitorId
}

// Detectar tipo de dispositivo
function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown"
  
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet"
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile"
  }
  return "desktop"
}

// Recuperar email capturado (se houver)
function getCapturedEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("df_visitor_email")
}

// Salvar email capturado
export function setCapturedEmail(email: string, name?: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("df_visitor_email", email)
  if (name) {
    localStorage.setItem("df_visitor_name", name)
  }
}

export function VisitorTracker({ pageSlug, pageUrl, pageId }: VisitorTrackerProps) {
  const enteredAt = useRef<number>(0)
  const scrollDepth = useRef<number>(0)
  const hasExited = useRef<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const sendTracking = useCallback(async (action: "enter" | "update" | "exit", exitIntent = false) => {
    try {
      const visitorId = getVisitorId()
      const email = getCapturedEmail()
      const name = typeof window !== "undefined" ? localStorage.getItem("df_visitor_name") : null
      const timeOnPage = Math.floor((Date.now() - enteredAt.current) / 1000)
      
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          email,
          name,
          pageId,
          pageSlug,
          pageUrl: pageUrl || window.location.href,
          timeOnPage,
          scrollDepth: scrollDepth.current,
          exitIntent,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          deviceType: getDeviceType(),
          action,
        }),
      })
    } catch (error) {
      console.error("[Tracking] Erro:", error)
    }
  }, [pageId, pageSlug, pageUrl])

  // Registrar entrada na página
  useEffect(() => {
    enteredAt.current = Date.now()
    sendTracking("enter")

    // Atualizar a cada 30 segundos
    intervalRef.current = setInterval(() => {
      sendTracking("update")
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sendTracking])

  // Tracking de scroll
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      
      const currentDepth = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      )
      
      if (currentDepth > scrollDepth.current) {
        scrollDepth.current = currentDepth
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Detectar intenção de saída (mouse saindo da janela)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Detectar quando o mouse sai pela parte superior (indicando fechamento)
      if (e.clientY <= 0 && !hasExited.current) {
        sendTracking("update", true)
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave)
    return () => document.removeEventListener("mouseleave", handleMouseLeave)
  }, [sendTracking])

  // Registrar saída da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasExited.current) return
      hasExited.current = true
      
      // Usar sendBeacon para garantir envio mesmo ao fechar
      const visitorId = getVisitorId()
      const email = getCapturedEmail()
      const name = typeof window !== "undefined" ? localStorage.getItem("df_visitor_name") : null
      const timeOnPage = Math.floor((Date.now() - enteredAt.current) / 1000)

      const data = JSON.stringify({
        visitorId,
        email,
        name,
        pageId,
        pageSlug,
        pageUrl: pageUrl || window.location.href,
        timeOnPage,
        scrollDepth: scrollDepth.current,
        exitIntent: true,
        action: "exit",
      })

      // sendBeacon é mais confiável para eventos de saída
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/tracking", data)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleBeforeUnload()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [pageId, pageSlug, pageUrl])

  // Registrar navegação para outra página (conversão)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      
      if (link?.href) {
        try {
          const url = new URL(link.href)
          // Se for link interno, registrar como possível conversão
          if (url.origin === window.location.origin) {
            const targetSlug = url.pathname.replace(/^\/page\//, "").replace(/\/$/, "")
            
            // Atualizar tracking com destino
            fetch("/api/tracking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                visitorId: getVisitorId(),
                email: getCapturedEmail(),
                pageUrl: pageUrl || window.location.href,
                timeOnPage: Math.floor((Date.now() - enteredAt.current) / 1000),
                scrollDepth: scrollDepth.current,
                convertedTo: targetSlug,
                action: "update",
              }),
            }).catch(console.error)
          }
        } catch {
          // URL inválida, ignorar
        }
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [pageUrl])

  // Componente não renderiza nada
  return null
}

export default VisitorTracker
