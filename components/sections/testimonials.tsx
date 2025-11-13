"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Carlos Eduardo",
    role: "Dono de Loja de Roupas",
    quote: "Não entendo nada de publicidade, mas com a Flow meu faturamento triplicou. Agora preciso contratar mais gente porque não dou conta dos pedidos.",
    image: "https://i.pravatar.cc/150?img=33",
  },
  {
    name: "Fernanda Costa",
    role: "Proprietária - Salão de Beleza",
    quote: "Achei que era um risco investir, mas virou meu maior gasto inteligente. A agenda está sempre cheia agora.",
    image: "https://i.pravatar.cc/150?img=47",
  },
  {
    name: "Marcelo Silva",
    role: "Dono de Academia",
    quote: "Meu personal foi quem me indicou. Antes eu tentava marketing no bairro, agora vem gente de toda a cidade. Que diferença!",
    image: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Juliana Martins",
    role: "Dona de Padaria Artesanal",
    quote: "Sou apenas uma mulher que ama fazer pão. A Flow cuidou de trazer clientes pra mim. Meu negócio saiu do prejuízo.",
    image: "https://i.pravatar.cc/150?img=48",
  },
  {
    name: "Roberto Oliveira",
    role: "Proprietário - Oficina Mecânica",
    quote: "Eu desconfiava, mas meu filho sugeriu tentar. Hoje a oficina não para. Triplicou o faturamento sem eu fazer nada além do meu trabalho.",
    image: "https://i.pravatar.cc/150?img=11",
  },
  {
    name: "Amanda Souza",
    role: "Dona de Consultório Odontológico",
    quote: "Comecei do zero com pouco investimento. A Flow me ajudou a encher minha agenda de pacientes. Hoje tenho duas recepcionistas só pra marcar consulta.",
    image: "https://i.pravatar.cc/150?img=45",
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
                <div className="mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
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
