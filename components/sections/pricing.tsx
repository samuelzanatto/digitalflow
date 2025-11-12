"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Pricing() {
  return (
    <section className="py-12 md:py-20 px-4 bg-black">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-0"
        >
          <Badge variant="outline" className="mb-4 border-purple-500/50 text-purple-400">
            Investimento
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-4">
            Modelos de investimento flexíveis
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg">
            Escolha o modelo que melhor se alinha ao seu negócio. Sem contratos longos ou surpresas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 md:p-8 lg:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <p className="text-white/60 text-xs md:text-sm mb-2">Modelo: Performance Based</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl md:text-4xl lg:text-5xl font-black text-white">15%</span>
                <span className="text-white/60 text-sm md:text-base">de comissão</span>
              </div>
              <p className="text-white/70 text-xs md:text-sm mb-6">sobre o faturamento que gerar</p>

              <div className="space-y-4">
                <p className="text-white font-semibold text-sm">Incluso:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-white/70 text-xs md:text-sm">Gestão completa de campanhas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-white/70 text-xs md:text-sm">Criativos profissionais</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-white/70 text-xs md:text-sm">Relatórios mensais detalhados</span>
                  </div>
                </div>
              </div>

              <p className="text-white/50 text-xs mt-6">
                *Investimento mínimo de R$ 2.000/mês em tráfego
              </p>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <p className="text-white text-xs md:text-sm font-semibold mb-4">POR QUE ESCOLHER ESSE MODELO?</p>
                <p className="text-white/70 text-xs md:text-sm">
                  Nossos interesses estão alinhados aos seus. Ganhamos quando você cresce. Sem riscos para você, apenas resultados mensuráveis e performance garantida.
                </p>
              </div>

              <Button
                asChild
                className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full py-4 md:py-6 text-sm md:text-lg font-semibold shadow-lg shadow-purple-500/50 mt-6 md:mt-0"
              >
                <Link href="#contato">Agendar uma estratégia</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
