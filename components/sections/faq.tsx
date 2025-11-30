"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como começar com a Digital Flow?",
    answer:
      "Agende uma estratégia com nossos especialistas. Analisaremos seu negócio, metas e mercado. Depois elaboramos uma proposta personalizada com ROI projetado e plano de ação detalhado.",
  },
  {
    question: "Qual é o investimento mínimo?",
    answer:
      "O investimento mínimo em tráfego pago é de R$ 2.000/mês. Nossa comissão é de 15% sobre o faturamento gerado. Quanto mais você cresce, mais você ganha. Alinhamos nossos interesses aos seus.",
  },
  {
    question: "Quanto tempo leva para ver resultados?",
    answer:
      "Resultados começam a aparecer entre 15 a 30 dias. As campanhas ganham força com otimização contínua. Em 60-90 dias você já terá dados sólidos de performance para tomar decisões estratégicas.",
  },
  {
    question: "Como funciona o acompanhamento?",
    answer:
      "Você tem um gestor dedicado que acompanha suas campanhas 24/7. Relatórios detalhados são entregues semanalmente. Reuniões estratégicas mensais para revisar performance e traçar novos objetivos.",
  },
  {
    question: "Vocês garantem resultados?",
    answer:
      "Garantimos performance baseada em dados. Se você segue nossas recomendações, atingiremos os objetivos projetados. Nossa comissão é baseada em resultados - ganhamos quando você cresce.",
  },
  {
    question: "Qual é o contrato?",
    answer:
      "Oferecemos flexibilidade. Começamos com um teste de 30 dias. Se comprovamos os resultados, você fica. Sem contratos longos ou cláusulas punitivas. Performance que fala por si.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-16 md:py-24 lg:py-32 px-4 bg-black">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 px-0"
        >
          <Badge variant="outline" className="mb-4 border-purple-500/30 text-purple-400 bg-purple-500/5 backdrop-blur-sm">
            Dúvidas frequentes
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            Ficou com alguma dúvida?
          </h2>
          <p className="text-white/60 text-sm md:text-base lg:text-lg">
            Respondemos as perguntas mais comuns sobre tráfego pago e estratégia
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-white/10"
              >
                <AccordionTrigger className="text-white hover:text-purple-400 transition-colors py-3 md:py-4">
                  <span className="text-left font-semibold text-sm md:text-base">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-4 text-sm md:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
