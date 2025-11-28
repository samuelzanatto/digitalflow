"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Search,
  Lightbulb,
  Palette,
  Zap,
  LineChart,
  ArrowRight,
  Sparkles,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ServiceItem {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
}

const services: ServiceItem[] = [
  {
    title: "Gestão de Tráfego Meta",
    subtitle: "META ADS",
    description: "Campanhas estratégicas no Facebook e Instagram com foco em conversão e ROI mensurável.",
    features: ["Campanhas otimizadas", "Públicos avançados", "Pixel máximo", "Performance contínua"],
    icon: <Smartphone size={24} />,
    accentColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
  },
  {
    title: "Google Ads",
    subtitle: "GOOGLE ADS",
    description: "Tráfego qualificado via Google Search, Shopping e Display para maximizar conversões.",
    features: ["Keywords agressivas", "Landing pages", "Conversões", "ROI 300%+"],
    icon: <Search size={24} />,
    accentColor: "#f472b6",
    glowColor: "rgba(244, 114, 182, 0.4)",
  },
  {
    title: "Tráfego Estratégico",
    subtitle: "ESTRATÉGIA",
    description: "Planejamento de tráfego pago alinhado aos seus objetivos de negócio.",
    features: ["Análise competitiva", "Orçamento", "Mix de canais", "Relatórios"],
    icon: <Lightbulb size={24} />,
    accentColor: "#818cf8",
    glowColor: "rgba(129, 140, 248, 0.4)",
  },
  {
    title: "Criativos Premium",
    subtitle: "CRIATIVOS",
    description: "Anúncios testados e aprovados pelo mercado que capturam atenção.",
    features: ["Testes A/B", "Copywriting", "Design pro", "Storytelling"],
    icon: <Palette size={24} />,
    accentColor: "#e879f9",
    glowColor: "rgba(232, 121, 249, 0.4)",
  },
  {
    title: "Landing Pages",
    subtitle: "PÁGINAS",
    description: "Páginas de conversão otimizadas para maximizar seus resultados.",
    features: ["Design responsivo", "Otimização CRO", "Funis", "Testes"],
    icon: <Zap size={24} />,
    accentColor: "#fbbf24",
    glowColor: "rgba(251, 191, 36, 0.4)",
  },
  {
    title: "Otimização CRO",
    subtitle: "CONVERSÃO",
    description: "Aumentamos suas conversões através de análise e otimização contínua.",
    features: ["Comportamento", "Testes A/B", "Formulários", "Melhorias"],
    icon: <LineChart size={24} />,
    accentColor: "#34d399",
    glowColor: "rgba(52, 211, 153, 0.4)",
  },
];

function GlassCard({
  service,
  index,
}: {
  service: ServiceItem;
  index: number;
}) {
  return (
    <div
      className="glass-card group relative cursor-pointer h-full"
      style={{ "--accent": service.accentColor, "--glow": service.glowColor } as React.CSSProperties}
    >
      {/* Animated border gradient */}
      <div 
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${service.accentColor}40, transparent 50%, ${service.accentColor}20)`,
        }}
      />
      
      {/* Glow effect */}
      <div 
        className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-40 transition-all duration-700 blur-2xl pointer-events-none"
        style={{ backgroundColor: service.glowColor }}
      />

      {/* Glass card body */}
      <div className="relative h-full flex flex-col rounded-2xl bg-white/2 backdrop-blur-xl border border-white/10 p-6 overflow-hidden transition-all duration-300 group-hover:bg-white/4 group-hover:border-white/20">
        
        {/* Gradient orb in corner */}
        <div 
          className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none"
          style={{ backgroundColor: service.accentColor }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon container */}
            <div 
              className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${service.accentColor}15, ${service.accentColor}05)`,
                border: `1px solid ${service.accentColor}20`,
              }}
            >
              <div style={{ color: service.accentColor }}>{service.icon}</div>
            </div>
            
            <div className="min-w-0">
              <span 
                className="text-[10px] font-semibold tracking-widest uppercase block"
                style={{ color: service.accentColor }}
              >
                {service.subtitle}
              </span>
              <h3 className="text-base font-semibold text-white mt-0.5 leading-tight">{service.title}</h3>
            </div>
          </div>

          {/* Number badge */}
          <div 
            className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ 
              background: `${service.accentColor}10`,
              color: service.accentColor,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>

        {/* Description */}
        <p className="relative text-white/50 text-sm leading-relaxed mb-5 group-hover:text-white/60 transition-colors duration-300">
          {service.description}
        </p>

        {/* Features grid */}
        <div className="relative grid grid-cols-2 gap-2 mb-5 flex-1">
          {service.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/2 border border-white/5 group-hover:bg-white/4 group-hover:border-white/10 transition-all duration-300"
            >
              <Sparkles size={8} style={{ color: service.accentColor }} className="shrink-0 opacity-70" />
              <span className="text-white/50 text-[11px] group-hover:text-white/70 transition-colors truncate">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="relative flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <button
            className="flex items-center gap-2 text-sm font-medium transition-all duration-300 group-hover:gap-2.5"
            style={{ color: service.accentColor }}
          >
            Explorar
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 rounded-full opacity-30 group-hover:opacity-100 transition-all duration-300"
                style={{ 
                  backgroundColor: service.accentColor,
                  transitionDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductTypes() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header animation
    gsap.from(headerRef.current?.querySelectorAll(".animate-item") || [], {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: headerRef.current,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });

    // Cards scattered animation - cada card vem de posição diferente
    const cards = cardsRef.current?.querySelectorAll(".glass-card") || [];
    
    // Posições iniciais espalhadas para cada card
    const scatteredPositions = [
      { x: -120, y: 80, rotation: -8, scale: 0.8 },   // Card 1 - vem da esquerda
      { x: 0, y: 120, rotation: 0, scale: 0.85 },     // Card 2 - vem de baixo
      { x: 120, y: 80, rotation: 8, scale: 0.8 },     // Card 3 - vem da direita
      { x: -100, y: 100, rotation: -6, scale: 0.82 }, // Card 4 - esquerda baixo
      { x: 0, y: 140, rotation: 0, scale: 0.78 },     // Card 5 - centro baixo
      { x: 100, y: 100, rotation: 6, scale: 0.82 },   // Card 6 - direita baixo
    ];

    cards.forEach((card, index) => {
      const pos = scatteredPositions[index] || { x: 0, y: 100, rotation: 0, scale: 0.8 };
      
      gsap.fromTo(card, 
        {
          x: pos.x,
          y: pos.y,
          rotation: pos.rotation,
          scale: pos.scale,
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 1,
          delay: index * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

  }, { scope: sectionRef }); // Usa scope para cleanup automático

  return (
    <section
      ref={sectionRef}
      id="servicos"
      className="relative bg-black py-32 overflow-hidden"
    >
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-20">
          <div className="animate-item">
            <Badge variant="outline" className="mb-6 border-purple-500/30 text-purple-400 bg-purple-500/5 backdrop-blur-sm">
              <Sparkles size={12} className="mr-2" />
              Nossos Serviços
            </Badge>
          </div>
          
          <h2 className="animate-item text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">
            Soluções em{" "}
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              Tráfego Pago
            </span>
          </h2>
          
          <p className="animate-item text-white/50 text-lg max-w-2xl mx-auto">
            Gerenciamos suas campanhas com foco em ROI real, utilizando as melhores práticas e tecnologias do mercado.
          </p>
        </div>

        {/* Cards Grid */}
        <div 
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 md:gap-16 xl:gap-12"
        >
          {services.map((service, index) => (
            <GlassCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
