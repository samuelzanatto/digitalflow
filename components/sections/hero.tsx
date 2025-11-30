"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect, lazy, Suspense } from "react";
import TypingText from "@/components/ui/shadcn-io/typing-text";
import { hyperspeedPresets } from "@/components/HyperSpeedPresets";

// Lazy load Hyperspeed para evitar bloquear o carregamento inicial
const Hyperspeed = lazy(() => import("@/components/Hyperspeed"));

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const typingTexts = ["leads qualificados", "vendas em escala", "ROI maximizado"];
  const [isHyperspeedReady, setIsHyperspeedReady] = useState(false);

  // Delay Hyperspeed loading to after initial render
  useEffect(() => {
    const timer = requestIdleCallback?.(() => setIsHyperspeedReady(true)) 
      ?? setTimeout(() => setIsHyperspeedReady(true), 100);
    return () => {
      if (typeof timer === 'number') {
        cancelIdleCallback?.(timer) ?? clearTimeout(timer);
      }
    };
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax: conteúdo sobe mais rápido que o background
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      {/* Hyperspeed Background */}
      <div className="absolute inset-0 h-screen overflow-hidden opacity-60">
        {isHyperspeedReady && (
          <Suspense fallback={
            <div className="w-full h-full bg-linear-to-b from-purple-900/20 to-black" />
          }>
            <Hyperspeed 
              effectOptions={hyperspeedPresets.one as Record<string, unknown>}
            />
          </Suspense>
        )}
      </div>

      {/* Overlay escuro sutil */}
      <div className="absolute inset-0 h-screen bg-black/40 z-5 pointer-events-none" />

      {/* Gradiente de transição suave na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-b from-transparent to-black z-20 pointer-events-none" />

      {/* Conteúdo com Parallax */}
      <motion.div 
        id="home" 
        className="relative z-10 flex items-center justify-center min-h-screen w-full"
        style={{ y: contentY, opacity: contentOpacity, willChange: "transform, opacity" }}
      >
        <div className="w-full px-4 sm:px-6 py-20 md:py-40 pt-36 md:pt-48">
          <div className="flex flex-col items-center justify-center w-full">
            {/* Conteúdo Centralizado */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center items-center text-center w-full max-w-4xl mx-auto"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-white mb-8 md:mb-10 leading-[1.2] text-center w-full"
              >
                <span className="whitespace-nowrap">Tráfego pago com</span>
                <span className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light bg-linear-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                  <TypingText 
                    text={typingTexts}
                    typingSpeed={100}
                    deletingSpeed={50}
                    pauseDuration={1500}
                    loop={true}
                    showCursor={true}
                    cursorClassName="bg-purple-500"
                    className="inline-block"
                  />
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center"
              >
                <Link
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("pricing");
                    if (element) {
                      const offsetTop = element.offsetTop - 120;
                      window.scrollTo({
                        top: offsetTop,
                        behavior: "smooth",
                      });
                    }
                  }}
                  className="group relative inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 overflow-hidden backdrop-blur-sm border-2 border-purple-500/50 bg-white/5 hover:border-transparent"
                >
                  <span className="absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Começar agora</span>
                </Link>
              </motion.div>

              {/* Seta de Scroll Animada */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-16 md:mt-20 flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white drop-shadow-lg"
                  >
                    <path d="M12 5v14m0 0l-7-7m7 7l7-7" />
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
