"use client";
import { TestimonialsColumn } from "@/components/testimonials-columns";

const testimonials = [
  {
    text: "Não entendo nada de publicidade, mas com a Flow meu faturamento triplicou. Agora preciso contratar mais gente porque não dou conta dos pedidos.",
    image: "https://i.pravatar.cc/150?img=33",
    name: "Carlos Eduardo",
    role: "Dono de Loja de Roupas",
  },
  {
    text: "Achei que era um risco investir, mas virou meu maior gasto inteligente. A agenda está sempre cheia agora.",
    image: "https://i.pravatar.cc/150?img=47",
    name: "Fernanda Costa",
    role: "Proprietária - Salão de Beleza",
  },
  {
    text: "Meu personal foi quem me indicou. Antes eu tentava marketing no bairro, agora vem gente de toda a cidade. Que diferença!",
    image: "https://i.pravatar.cc/150?img=12",
    name: "Marcelo Silva",
    role: "Dono de Academia",
  },
  {
    text: "Sou apenas uma mulher que ama fazer pão. A Flow cuidou de trazer clientes pra mim. Meu negócio saiu do prejuízo.",
    image: "https://i.pravatar.cc/150?img=48",
    name: "Juliana Martins",
    role: "Dona de Padaria Artesanal",
  },
  {
    text: "Eu desconfiava, mas meu filho sugeriu tentar. Hoje a oficina não para. Triplicou o faturamento sem eu fazer nada além do meu trabalho.",
    image: "https://i.pravatar.cc/150?img=11",
    name: "Roberto Oliveira",
    role: "Proprietário - Oficina Mecânica",
  },
  {
    text: "Comecei do zero com pouco investimento. A Flow me ajudou a encher minha agenda de pacientes. Hoje tenho duas recepcionistas só pra marcar consulta.",
    image: "https://i.pravatar.cc/150?img=45",
    name: "Amanda Souza",
    role: "Dona de Consultório Odontológico",
  },
  {
    text: "Com a estratégia certa de marketing, consegui expandir meu negócio para outras cidades. Melhor investimento que já fiz.",
    image: "https://i.pravatar.cc/150?img=16",
    name: "Diego Ferreira",
    role: "Empreendedor - Serviços",
  },
  {
    text: "O ROI que tive foi absurdo. Cada real investido retornou em 5. Agora é meu principal canal de aquisição de clientes.",
    image: "https://i.pravatar.cc/150?img=22",
    name: "Marina Santos",
    role: "Proprietária - E-commerce",
  },
  {
    text: "A equipe da Flow é atenciosa e entende muito bem meu negócio. Os resultados falam por si só.",
    image: "https://i.pravatar.cc/150?img=38",
    name: "André Pereira",
    role: "CEO - Startup Tech",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function Testimonials() {
  return (
    <section id="cases" className="relative py-16 md:py-24 lg:py-32 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 mb-16 md:mb-20">
          <div className="flex justify-center">
            <div className="rounded-lg border border-purple-500/30 px-4 py-1 text-sm text-purple-400 bg-purple-500/5 backdrop-blur-sm">
              Depoimentos
            </div>
          </div>

          <h2 className="font-light text-4xl sm:text-5xl md:text-6xl lg:text-6xl tracking-tighter text-white text-center leading-tight">
            Veja o que nossos{" "}
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              clientes dizem
            </span>
          </h2>
          <p className="text-center text-white/60 text-base sm:text-lg md:text-lg">
            Histórias reais de empresas que escalaram com a flow
          </p>
        </div>

        <div className="mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <TestimonialsColumn duration={16} testimonials={firstColumn} />
          <TestimonialsColumn
            className="hidden md:block"
            duration={20}
            testimonials={secondColumn}
          />
          <TestimonialsColumn
            className="hidden lg:block"
            duration={18}
            testimonials={thirdColumn}
          />
        </div>
      </div>
    </section>
  );
}
