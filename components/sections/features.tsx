"use client";

import { Badge } from "@/components/ui/badge";
import { useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BarChart3, Palette, TrendingUp, Headphones, Target, Award } from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Feature {
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
}

const features: Feature[] = [
  {
    title: "Dados que Guiam",
    subtitle: "ANALYTICS",
    description: "Análise profunda de métricas e comportamento do usuário para tomar decisões baseadas em dados reais.",
    benefits: ["Dashboard em tempo real", "Rastreamento de conversões", "Relatórios semanais detalhados", "Insights de audiência"],
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    title: "Criativos que Vendem",
    subtitle: "CRIATIVOS",
    description: "Campanhas visuais e copywriting otimizado para conversão máxima com testes A/B sistemáticos.",
    benefits: ["Produção de vídeos e imagens", "Copywriting persuasivo", "Testes A/B contínuos", "Biblioteca de criativos"],
    icon: <Palette className="w-5 h-5" />,
  },
  {
    title: "Estratégias que Escalam",
    subtitle: "ESCALABILIDADE",
    description: "Crescimento progressivo e sustentável do investimento em tráfego com retorno exponencial.",
    benefits: ["Escala gradual controlada", "Otimização de budget", "Expansão de públicos", "Multi-plataforma"],
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    title: "Atendimento Direto",
    subtitle: "SUPORTE",
    description: "Você não é só mais um cliente - tem especialista dedicado com acesso direto e reuniões estratégicas.",
    benefits: ["Gestor dedicado", "Reuniões quinzenais", "Suporte via WhatsApp", "Resposta em até 2h"],
    icon: <Headphones className="w-5 h-5" />,
  },
  {
    title: "Propósito em Cada Clique",
    subtitle: "ESTRATÉGIA",
    description: "Cada ação tem um objetivo claro alinhado ao seu negócio e funil de vendas otimizado.",
    benefits: ["Funil personalizado", "Metas claras definidas", "KPIs monitorados", "Ajustes semanais"],
    icon: <Target className="w-5 h-5" />,
  },
  {
    title: "Performance, Não Promessa",
    subtitle: "RESULTADOS",
    description: "Resultados consistentes e mensuráveis com ROI acima de 300% e transparência total.",
    benefits: ["ROI médio de 300%+", "Transparência total", "Sem contratos longos", "Garantia de resultado"],
    icon: <Award className="w-5 h-5" />,
  },
];

function FeatureBadge({ feature, isExpanded }: { feature: Feature; isExpanded: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current || !arrowRef.current || !innerRef.current) return;

    // Usa GSAP para animar em vez de Framer Motion - mais performático
    gsap.to(contentRef.current, {
      height: isExpanded ? "auto" : 0,
      duration: 0.6,
      ease: "power2.inOut",
    });

    gsap.to(arrowRef.current, {
      rotation: isExpanded ? 180 : 0,
      duration: 0.4,
      ease: "power2.inOut",
    });

    gsap.to(innerRef.current, {
      opacity: isExpanded ? 1 : 0,
      y: isExpanded ? 0 : -10,
      duration: 0.4,
      delay: isExpanded ? 0.15 : 0,
      ease: "power2.out",
    });
  }, { dependencies: [isExpanded] });

  return (
    <div className="relative overflow-visible">
      <div
        className={`rounded-xl border border-white/10 bg-white/2 backdrop-blur-sm transition-all duration-500 ${
          isExpanded ? "bg-white/5 border-purple-500/30" : ""
        }`}
      >
        <div className="p-5">
          {/* Header com ícone e título */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors duration-500 ${
                isExpanded ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/50"
              }`}>
                {feature.icon}
              </div>
              <div>
                <span className="text-xs font-medium text-purple-400/80 uppercase tracking-wider">
                  {feature.subtitle}
                </span>
                <h3 className="text-base font-medium text-white">{feature.title}</h3>
              </div>
            </div>
            <div ref={arrowRef} className="text-white/40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Descrição sempre visível */}
          <p className="text-sm text-white/50 leading-relaxed min-h-10">
            {feature.description}
          </p>
          
          {/* Conteúdo expandido */}
          <div ref={contentRef} className="overflow-hidden" style={{ height: 0 }}>
            <div ref={innerRef} className="opacity-0" style={{ transform: "translateY(-10px)" }}>
              <div className="pt-4 mt-4 border-t border-white/10">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                  O que está incluso:
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState(-1);

  // Usa useCallback para evitar recriação da função
  const updateExpandedIndex = useCallback((newIndex: number) => {
    setExpandedIndex((prev) => (prev !== newIndex ? newIndex : prev));
  }, []);

  useGSAP(() => {
    // Cria um ScrollTrigger com pin que percorre todos os badges
    // 500px por feature = scroll mais longo e confortável
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: `+=${features.length * 500}`,
      pin: true,
      pinSpacing: true,
      scrub: 1.2,
      anticipatePin: 1, // Melhora performance do pin
      onUpdate: (self) => {
        // Calcula qual badge deve estar expandido baseado no progresso
        const progress = self.progress;
        // Adiciona um offset para que o primeiro card não comece expandido
        const adjustedProgress = Math.max(0, (progress - 0.05) / 0.95);
        const newIndex = Math.floor(adjustedProgress * features.length);
        
        // Garante que o índice não ultrapasse o número de features
        // E começa em -1 para que nenhum badge inicie expandido
        const clampedIndex = progress < 0.05 ? -1 : Math.min(newIndex, features.length - 1);
        
        updateExpandedIndex(clampedIndex);
      },
    });
  }, { scope: sectionRef }); // Remove expandedIndex da dependência, usa scope

  return (
    <section ref={sectionRef} id="sobre" className="py-12 md:py-20 px-4 bg-black">
      <div ref={containerRef} className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="text-center mb-8 md:mb-12 px-0 header-content shrink-0">
          <Badge variant="outline" className="mb-4 border-purple-500/30 text-purple-400 bg-purple-500/5 backdrop-blur-sm">
            Como trabalhamos
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            Metodologia{" "}
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              Digital Flow
            </span>
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
            Uma abordagem completa e comprovada para crescer seu negócio através de tráfego pago
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 flex-1 auto-rows-fr">
          {features.map((feature, index) => (
            <div key={feature.title} className="feature-card">
              <FeatureBadge 
                feature={feature} 
                isExpanded={index <= expandedIndex} 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
