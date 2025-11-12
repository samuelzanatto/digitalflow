"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Search, Lightbulb, Palette, Zap, LineChart } from "lucide-react";

interface ProductType {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const products: ProductType[] = [
  {
    title: "Gestão de Tráfego Meta",
    subtitle: "META ADS",
    description: "Campanhas estratégicas no Facebook e Instagram com foco em conversão",
    features: [
      "Estruturação de campanhas otimizadas",
      "Segmentação de públicos avançada",
      "Pixel implementado com nota máxima",
      "Otimização contínua de performance",
    ],
    icon: <Smartphone size={48} className="text-purple-400" />,
  },
  {
    title: "Google Ads",
    subtitle: "GOOGLE ADS",
    description: "Tráfego qualificado via Google Search, Shopping e Display",
    features: [
      "Estratégia de keywords agressiva",
      "Otimização de landing pages",
      "Rastreamento de conversões",
      "ROI garantido acima de 300%",
    ],
    icon: <Search size={48} className="text-pink-400" />,
  },
  {
    title: "Tráfego Estratégico",
    subtitle: "ESTRATÉGIA",
    description: "Planejamento de tráfego pago alinhado aos seus objetivos",
    features: [
      "Análise de mercado competitivo",
      "Planejamento de orçamento",
      "Mix de canais otimizado",
      "Relatórios e análise de performance",
    ],
    icon: <Lightbulb size={48} className="text-purple-400" />,
  },
  {
    title: "Otimização de Criativos",
    subtitle: "CRIATIVOS",
    description: "Criatividade que vende - anúncios testados e aprovados",
    features: [
      "Testes A/B de criativos",
      "Copywriting otimizado para conversão",
      "Design e vídeos profissionais",
      "Histórias que ressoam com seu público",
    ],
    icon: <Palette size={48} className="text-pink-400" />,
  },
  {
    title: "Landing Pages Personalizadas",
    subtitle: "LANDING PAGES",
    description: "Páginas de conversão otimizadas para maximizar seus resultados",
    features: [
      "Design responsivo e profissional",
      "Otimização para conversão",
      "Integração com funis de vendas",
      "Testes de performance contínuos",
    ],
    icon: <Zap size={48} className="text-purple-400" />,
  },
  {
    title: "Otimização de Conversão",
    subtitle: "CRO",
    description: "Aumentamos suas conversões através de análise e otimização",
    features: [
      "Análise de comportamento do usuário",
      "Testes A/B de landing pages",
      "Otimização de formulários",
      "Relatórios de melhorias implementadas",
    ],
    icon: <LineChart size={48} className="text-pink-400" />,
  },
];

export function ProductTypes() {
  return (
    <section id="servicos" className="py-12 md:py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-0"
        >
          <Badge variant="outline" className="mb-4 border-purple-500/50 text-purple-400">
            Nossos serviços
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-4">
            Soluções completas em tráfego pago
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
            Gerenciamos todas as plataformas de tráfego com foco em ROI real
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="mb-4">{product.icon}</div>
              <Badge variant="outline" className="mb-3 border-white/10 text-white/70">
                {product.subtitle}
              </Badge>
              <h3 className="text-xl md:text-2xl font-black text-white mb-2">{product.title}</h3>
              <p className="text-white/60 text-sm md:text-base mb-6">{product.description}</p>

              <ul className="space-y-3">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span className="text-white/70 text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
