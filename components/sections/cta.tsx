"use client";

import { motion } from "framer-motion";
import { TransitionLink } from "@/components/transition-link";

export function CTA() {
  return (
    <section id="contato" className="py-20 md:py-32 lg:py-64 pb-32 md:pb-48 lg:pb-96 px-4 bg-linear-to-b from-black to-purple-950/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 md:space-y-8"
        >
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-4">
              Pronto para escalar seu negócio?
            </h2>
            <p className="text-white/60 text-sm md:text-base lg:text-lg">
              Entre em contato com nossos especialistas e descubra como podemos aumentar o ROI das suas campanhas de tráfego pago.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
            <TransitionLink
              href="/quiz"
              className="inline-flex items-center justify-center border border-white/20 text-white hover:bg-white/10 rounded-full px-6 md:px-8 py-2 md:py-3 text-sm md:text-lg font-semibold transition-all"
            >
              Falar com especialista
            </TransitionLink>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-white/60">
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Performance que posiciona e vende
          </div>
        </motion.div>
      </div>
    </section>
  );
}
