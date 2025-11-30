"use client";

import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
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

function TimelineCard({ feature, index, isActive }: { feature: Feature; index: number; isActive: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={cardRef}
    >
      <div 
        className={`rounded-xl border bg-white/2 backdrop-blur-sm p-6 h-full transition-all duration-700 ${
          isActive 
            ? "border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]" 
            : "border-white/10"
        }`}
      >
        {/* Header com ícone e título */}
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            {feature.icon}
          </div>
          <div>
            <span className="text-xs font-medium text-purple-400/70 uppercase tracking-wider">
              {feature.subtitle}
            </span>
            <h3 className="text-lg font-medium text-white">{feature.title}</h3>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {feature.description}
        </p>

        {/* Benefícios */}
        <ul className="space-y-2">
          {feature.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-white/50">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const glowLineRef = useRef<HTMLDivElement>(null);
  const [activeCards, setActiveCards] = useState<boolean[]>(features.map(() => false));

  useGSAP(() => {
    if (!containerRef.current || !timelineRef.current || !glowLineRef.current) return;

    const points = containerRef.current.querySelectorAll(".timeline-point");
    const cards = containerRef.current.querySelectorAll(".timeline-card");

    // Animação principal da linha que "acende" durante o scroll
    ScrollTrigger.create({
      trigger: timelineRef.current,
      start: "top 60%",
      end: "bottom 40%",
      scrub: 0.5,
      onUpdate: (self) => {
        // Atualiza a altura da linha brilhante baseado no progresso do scroll
        const progress = self.progress;
        gsap.set(glowLineRef.current, {
          height: `${progress * 100}%`,
        });

        // Para cada ponto, verifica se a linha chegou à sua posição
        points.forEach((point, index) => {
          if (!point) return;

          // Calcula a posição do ponto relativa ao container da timeline
          const pointRect = point.getBoundingClientRect();
          const containerRect = timelineRef.current!.getBoundingClientRect();
          
          // Posição do ponto como percentual da altura total da timeline
          const pointTopRelative = pointRect.top - containerRect.top;
          const containerHeight = containerRect.height;
          const pointHeightPercent = (pointTopRelative / containerHeight) * 100;

          // A linha ativa o ponto quando a altura do glow alcança a posição do ponto
          const glowHeight = progress * 100;
          const isPointActive = glowHeight >= pointHeightPercent;

          if (isPointActive) {
            gsap.to(point, {
              scale: 1.3,
              borderColor: "#a855f7",
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)",
              duration: 0.1,
              ease: "power1.out",
            });

            // Ativa o card correspondente
            setActiveCards((prev) => {
              if (!prev[index]) {
                const newActive = [...prev];
                newActive[index] = true;
                return newActive;
              }
              return prev;
            });
          } else {
            gsap.to(point, {
              scale: 1,
              borderColor: "rgba(168, 85, 247, 0.4)",
              boxShadow: "none",
              duration: 0.1,
              ease: "power1.out",
            });

            // Desativa o card se a linha passar
            setActiveCards((prev) => {
              if (prev[index]) {
                const newActive = [...prev];
                newActive[index] = false;
                return newActive;
              }
              return prev;
            });
          }
        });
      },
    });

    // Também ativar no mobile sem a timeline visível
    cards.forEach((card, index) => {
      ScrollTrigger.create({
        trigger: card,
        start: "top 75%",
        onEnter: () => {
          setActiveCards((prev) => {
            const newActive = [...prev];
            newActive[index] = true;
            return newActive;
          });
        },
        once: true,
      });
    });
  }, { scope: containerRef });

  return (
    <section ref={sectionRef} id="sobre" className="py-24 md:py-32 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
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

        {/* Timeline */}
        <div ref={containerRef} className="relative">
          {/* Container da Linha da Timeline - visível apenas em desktop */}
          <div ref={timelineRef} className="hidden lg:block absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2">
            {/* Linha base (escura) */}
            <div className="absolute inset-0 w-px bg-white/10" />
            
            {/* Linha que acende (glow) */}
            <div 
              ref={glowLineRef}
              className="absolute top-0 left-0 w-px"
              style={{
                height: "0%",
                background: "linear-gradient(180deg, rgba(168, 85, 247, 0.8) 0%, rgba(168, 85, 247, 1) 50%, rgba(236, 72, 153, 0.8) 100%)",
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.6), 0 0 20px rgba(168, 85, 247, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)",
              }}
            />
          </div>

          {/* Cards */}
          <div className="space-y-24 lg:space-y-48">
            {features.map((feature, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div key={feature.title} className="timeline-card relative">
                  {/* Layout Desktop */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr_60px_1fr] items-center">
                    {/* Lado Esquerdo - card se for par, vazio se for ímpar */}
                    <div className={isEven ? "" : "invisible"}>
                      {isEven && (
                        <TimelineCard 
                          feature={feature} 
                          index={index}
                          isActive={activeCards[index]}
                        />
                      )}
                    </div>

                    {/* Ponto Central da Timeline */}
                    <div className="flex justify-center items-center">
                      <div 
                        className="timeline-point w-4 h-4 rounded-full border-4 border-purple-500/50 bg-black z-10 transition-all"
                      />
                    </div>

                    {/* Lado Direito - card se for ímpar, vazio se for par */}
                    <div className={!isEven ? "" : "invisible"}>
                      {!isEven && (
                        <TimelineCard 
                          feature={feature} 
                          index={index}
                          isActive={activeCards[index]}
                        />
                      )}
                    </div>
                  </div>

                  {/* Layout Mobile - sempre mostrar card */}
                  <div className="lg:hidden">
                    <TimelineCard 
                      feature={feature} 
                      index={index}
                      isActive={activeCards[index]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
