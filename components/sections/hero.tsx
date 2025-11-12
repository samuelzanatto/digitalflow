"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTransitionContext } from "@/hooks/useTransitionContext";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 segundos
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = target / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setCount(Math.min(Math.floor(increment * currentStep), target));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(target);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target]);

  return <>{count}{suffix}</>;
}

export function Hero() {
  const { isExiting } = useTransitionContext();

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-linear-to-b from-black via-black to-black">
      <div className="w-full px-4 sm:px-6 md:px-24 md:ml-48 py-20 md:py-40 pt-36 md:pt-48">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full items-center gap-8 md:gap-12">
          {/* Conteúdo à Esquerda */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center text-center lg:text-left w-full"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-extralight text-white mb-4 md:mb-6 leading-[1.1]"
            >
              Tráfego pago com{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-purple-400">
                performance real
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed"
            >
              Agência especializada em tráfego pago estratégico. Dados que guiam, criativos que vendem e resultados que escalam.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 pt-4 md:pt-10"
            >
              <Link
                href="#contato"
                className="inline-flex items-center justify-center bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-lg font-semibold shadow-lg shadow-purple-500/50 transition-all"
              >
                Começar agora
              </Link>

              <Link
                href="#servicos"
                className="inline-flex items-center justify-center border border-white/20 text-white hover:bg-white/10 rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-lg font-semibold transition-all"
              >
                Agendar
              </Link>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mt-8 md:mt-16 pt-6 md:pt-16 border-t border-white/10"
            >
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extralight text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">
                  <AnimatedCounter target={500} suffix="+" />
                </p>
                <p className="text-white/60 text-xs">campanhas geridas</p>
              </motion.div>
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extralight text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">
                  +<AnimatedCounter target={300} suffix="%" />
                </p>
                <p className="text-white/60 text-xs">ROI médio</p>
              </motion.div>
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extralight text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">
                  <AnimatedCounter target={100} suffix="%" />
                </p>
                <p className="text-white/60 text-xs">foco em resultados</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Mosaico Moderno à Direita - Apenas no Desktop */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block h-full w-full"
          >
            <div className="relative h-full w-full">
              {/* Grid de mosaico */}
              <div className="flex relative items-center justify-center h-full gap-4">
                {/* Card com gradiente atrás da imagem - terceira camada */}
                <motion.div
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: isExiting ? -45 : -24 }}
                  exit={{ opacity: 0, rotate: -45 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="rounded-2xl border border-white/10 backdrop-blur absolute"
                  style={{ 
                    width: "calc(200px + 10vw)", 
                    height: "calc(215px + 20vw)", 
                    zIndex: 0,
                    background: "radial-gradient(circle at center, rgba(236, 72, 153, 0.6) 0%, rgba(168, 85, 247, 0.4) 50%, transparent 70%)"
                  }}
                />
                
                {/* Card com gradiente atrás da imagem - segunda camada */}
                <motion.div
                  initial={{ opacity: 0, rotate: 45 }}
                  animate={{ opacity: 1, rotate: isExiting ? 45 : -12 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="rounded-2xl border border-white/10 backdrop-blur absolute"
                  style={{ 
                    width: "calc(100px + 15vw)", 
                    height: "calc(250px + 20vw)", 
                    zIndex: 1,
                    background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.6) 0%, rgba(236, 72, 153, 0.4) 50%, transparent 70%)"
                  }}
                />
                
                {/* Peça grande superior esquerda */}
                <motion.div
                  initial={{ opacity: 0, rotate: -15, scale: 0.95 }}
                  animate={{ opacity: 1, rotate: isExiting ? -15 : 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -15, scale: 0.95 }}
                  whileHover={{ y: -10, rotate: 2 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="w-40 md:w-96 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur relative"
                  style={{ zIndex: 2 }}
                >
                  <Image
                    src="/owner.jpg"
                    alt="Owner Digital Flow"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover scale-110"
                    style={{ objectPosition: "center 10%" }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Avatar Mobile - Abaixo do conteúdo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:hidden flex items-center pt-24 justify-center w-full"
          >
            <div className="relative w-full flex justify-center">
              {/* Card com gradiente atrás da imagem - terceira camada */}
              <motion.div
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: isExiting ? -45 : -24 }}
                exit={{ opacity: 0, rotate: -45 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="rounded-2xl border border-white/10 backdrop-blur absolute"
                style={{ 
                  width: "calc(220px + 5vw)", 
                  height: "calc(400px + 5vw)", 
                  zIndex: 0,
                  background: "radial-gradient(circle at center, rgba(236, 72, 153, 0.6) 0%, rgba(168, 85, 247, 0.4) 50%, transparent 70%)"
                }}
              />
              
              {/* Card com gradiente atrás da imagem - segunda camada */}
              <motion.div
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: isExiting ? 45 : -12 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="rounded-2xl border border-white/10 backdrop-blur absolute"
                style={{ 
                  width: "calc(220px + 5vw)", 
                  height: "calc(400px + 5vw)", 
                  zIndex: 1,
                  background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.6) 0%, rgba(236, 72, 153, 0.4) 50%, transparent 70%)"
                }}
              />
              
              {/* Imagem do avatar */}
              <motion.div
                initial={{ opacity: 0, rotate: -15, scale: 0.95 }}
                animate={{ opacity: 1, rotate: isExiting ? -15 : 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -15, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-60 sm:w-48 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur relative"
                style={{ zIndex: 2 }}
              >
                <Image
                  src="/owner.jpg"
                  alt="Owner Digital Flow"
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover scale-110"
                  style={{ objectPosition: "center 10%" }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
