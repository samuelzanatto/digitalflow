"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const benefits = [
  "Especialistas em tráfego pago estratégico",
  "Foco exclusivo em performance e ROI",
  "Dados que guiam cada decisão",
  "Criativos otimizados para conversão",
  "Atendimento direto do seu gestor",
  "Campanhas escaláveis e sustentáveis",
  "Relatórios transparentes de performance",
  "Reuniões estratégicas mensais",
  "Resultados acima de 300% de ROI",
  "Propósito em cada clique",
  "Performance, não promessa",
  "Estratégia personalizada para seu negócio",
  "Testes A/B contínuos",
  "Acompanhamento 24/7 das campanhas",
  "Garantia de crescimento comprovado",
];

export function WhyChoose() {
  return (
    <section className="py-12 md:py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-0"
        >
          <Badge variant="outline" className="mb-4 border-purple-500/50 text-purple-400">
            Por que somos diferentes
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-4">
            Digital Flow é mais que uma agência
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
            Somos parceiros no seu crescimento, focados em performance real e resultados mensuráveis
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-white/5 backdrop-blur border-white/10 p-6 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-center gap-3 md:gap-4"
                >
                  <div className="shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Check size={14} className="text-white md:w-4 md:h-4" />
                  </div>
                  <span className="text-white/80 text-sm md:text-base">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
