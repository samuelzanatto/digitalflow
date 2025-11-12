"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Rafael Csizmar",
    role: "Estrategista Digital",
    quote: "Com a flow, dobramos nosso ROI em 3 meses. A performance é irrefutável.",
    image: "🎯",
  },
  {
    name: "Rubens Miguel",
    role: "Empresário",
    quote: "Finalmente encontrei uma agência que entende realmente de performance e resultados.",
    image: "📈",
  },
  {
    name: "Matheus Borges",
    role: "Infoprodutor",
    quote: "Os dados, a estratégia e o atendimento direto fazem toda a diferença. Recomendo!",
    image: "⚡",
  },
  {
    name: "Davy Barros",
    role: "Gestor de Tráfego",
    quote: "Seus criativos convertem 50% mais que a média do mercado. Excelente!",
    image: "🚀",
  },
  {
    name: "Bruno Aguiar",
    role: "Investidor Digital",
    quote: "O ROI de 300%+ é consistente. Resultado que fala mais que promessa.",
    image: "💰",
  },
  {
    name: "Larissa Andrade",
    role: "Empreendedora",
    quote: "Melhor decisão que tomei foi investir em tráfego pago com a flow.",
    image: "⭐",
  },
];

export function Testimonials() {
  return (
    <section id="cases" className="py-12 md:py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-0"
        >
          <Badge variant="outline" className="mb-4 border-purple-500/50 text-purple-400">
            Depoimentos
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-4">
            Veja o que nossos clientes dizem
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg max-w-2xl mx-auto">
            Histórias reais de empresas que escalaram com a flow
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur border-white/10 hover:border-white/20 transition-all duration-300 p-4 md:p-6 h-full flex flex-col">
                <div className="text-4xl md:text-5xl mb-4">{testimonial.image}</div>
                <p className="text-white mb-4 font-semibold flex-1 text-sm md:text-base">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="text-white font-bold text-sm md:text-base">{testimonial.name}</p>
                  <p className="text-white/60 text-xs md:text-sm">{testimonial.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
