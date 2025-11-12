"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Feature {
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  color: string;
}

const features: Feature[] = [
  {
    title: "Dados que Guiam",
    subtitle: "ANALYTICS",
    description: "Análise profunda de métricas e comportamento do usuário",
    benefits: ["Rastreamento de conversão completo", "Dashboards personalizados", "Relatórios de performance"],
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Criativos que Vendem",
    subtitle: "CRIATIVOS",
    description: "Campanhas visuais e copywriting otimizado para conversão",
    benefits: ["Testes A/B sistemáticos", "Storytelling persuasivo", "Vídeos e banners profissionais"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Estratégias que Escalam",
    subtitle: "ESCALABILIDADE",
    description: "Crescimento progressivo e sustentável do investimento em tráfego",
    benefits: ["Aumento gradual de orçamento", "Novos públicos descobertos", "Retorno exponencial"],
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Atendimento Direto",
    subtitle: "SUPORTE",
    description: "Você não é só mais um cliente - tem especialista dedicado",
    benefits: ["Acesso direto ao seu gestor", "Reuniões estratégicas mensais", "Suporte priorizado"],
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Propósito em Cada Clique",
    subtitle: "ESTRATÉGIA",
    description: "Cada ação tem um objetivo claro alinhado ao seu negócio",
    benefits: ["Funil de vendas otimizado", "Jornada do cliente mapeada", "Conversão maximizada"],
    color: "from-indigo-500 to-purple-500",
  },
  {
    title: "Performance, Não Promessa",
    subtitle: "RESULTADOS",
    description: "Resultados consistentes e mensuráveis em cada campanha",
    benefits: ["ROI acima de 300%", "Transparência total", "Garantia de performance"],
    color: "from-violet-500 to-fuchsia-500",
  },
];

export function Features() {
  return (
    <section id="sobre" className="py-12 md:py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-0"
        >
          <Badge variant="outline" className="mb-4 border-purple-500/50 text-purple-400">
            Como trabalhamos
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-4">
            Metodologia Digital Flow
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
            Uma abordagem completa e comprovada para crescer seu negócio através de tráfego pago
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 md:p-8 hover:border-white/20 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-linear-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              <Badge variant="outline" className="mb-3 border-white/10 text-white/70">
                {feature.subtitle}
              </Badge>
              <h3 className="text-xl md:text-2xl font-black text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm md:text-base mb-6">{feature.description}</p>

              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">→</span>
                    <span className="text-white/70 text-sm md:text-base">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-r ${feature.color} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
