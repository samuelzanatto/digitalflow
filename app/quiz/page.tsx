"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { TransitionLink } from "@/components/transition-link";
import { useTransitionContext } from "@/hooks/useTransitionContext";

type Step = "quiz" | "submitting";

interface Answer {
  [key: number]: string;
}

const quizQuestions = [
  {
    id: 1,
    question: "Qual é o principal objetivo das suas campanhas de tráfego pago?",
    options: [
      "Aumentar visibilidade da marca",
      "Gerar leads qualificados",
      "Aumentar vendas diretas",
      "Retargetear visitantes",
    ],
  },
  {
    id: 2,
    question: "Qual é o seu orçamento mensal de marketing digital?",
    options: [
      "Menos de R$ 1.000",
      "R$ 1.000 - R$ 5.000",
      "R$ 5.000 - R$ 20.000",
      "Acima de R$ 20.000",
    ],
  },
  {
    id: 3,
    question: "Quais plataformas você já utiliza para tráfego pago?",
    options: [
      "Google Ads",
      "Facebook/Instagram Ads",
      "TikTok Ads",
      "Não utilizo nenhuma",
    ],
  },
  {
    id: 4,
    question: "Qual é seu maior desafio atual com campanhas de tráfego?",
    options: [
      "Baixo retorno sobre investimento (ROI)",
      "Não sei por onde começar",
      "Dificuldade em escalar campanhas",
      "Gestão de múltiplas plataformas",
    ],
  },
  {
    id: 5,
    question: "Qual é seu segmento de negócio?",
    options: ["E-commerce", "Serviços", "SaaS", "Outro"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Answer>({});
  const [step, setStep] = useState<Step>("quiz");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const { isExiting } = useTransitionContext();
  const [navigated, setNavigated] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userEmail || !userName) {
      alert("Por favor, preencha seu nome e email");
      return;
    }

    setStep("submitting");

    // Salvar dados do usuário e respostas no localStorage
    const quizData = {
      name: userName,
      email: userEmail,
      answers: answers,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("quizUser", JSON.stringify(quizData));

    // Simular delay antes de redirecionar para o chat
    setTimeout(() => {
      window.location.href = "/chat";
    }, 1500);
  };

  const question = quizQuestions.find((q) => q.id === currentQuestion);
  const progress = (currentQuestion / quizQuestions.length) * 100;
  const isAnswered = answers[currentQuestion];
  const isLastQuestion = currentQuestion === quizQuestions.length;

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-black to-purple-950/20 flex items-center justify-center px-4 py-20">
      <motion.div
        animate={{ opacity: navigated || isExiting ? 0 : 1, y: navigated || isExiting ? 50 : 0 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={() => {
          if (isExiting) {
            setNavigated(true);
          }
        }}
        className="w-full max-w-2xl mx-auto"
      >
        <AnimatePresence mode="wait">
          {step === "quiz" && (
            <motion.div
              key="quiz"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
            <motion.div
              variants={contentVariants}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-extralight text-white">
                  Vamos conhecer seu negócio
                </h1>
                <p className="text-white/60 text-sm md:text-base">
                  Responda 5 perguntas rápidas para que possamos oferecer a melhor solução
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Pergunta {currentQuestion} de {quizQuestions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-linear-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* Question */}
              {question && (
                <motion.div
                  key={`question-${currentQuestion}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl md:text-2xl text-white font-light">
                    {question.question}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <motion.button
                        key={option}
                        onClick={() => handleAnswerSelect(option)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 text-left rounded-xl transition-all duration-300 ${
                          answers[currentQuestion] === option
                            ? "bg-linear-to-r from-purple-600 to-pink-600 text-white border border-purple-400"
                            : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          {answers[currentQuestion] === option && (
                            <CheckCircle size={20} />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Email and Name (Last Question) */}
              {isLastQuestion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10"
                >
                  <h3 className="text-white font-medium">
                    Para finalizarmos, preciso de alguns dados:
                  </h3>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                {currentQuestion > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevious}
                    className="px-6 py-3 border border-white/20 text-white rounded-full font-medium hover:bg-white/10 transition-all"
                  >
                    Anterior
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={!isAnswered && !isLastQuestion}
                  className={`flex-1 px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all ${
                    isAnswered || isLastQuestion
                      ? "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                      : "bg-white/5 text-white/50 cursor-not-allowed"
                  }`}
                >
                  {isLastQuestion ? "Enviar Respostas" : "Próxima"}
                  <ArrowRight size={20} />
                </motion.button>
              </div>

              {/* Back to Home Button */}
              <div className="text-center">
                <TransitionLink
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium">Voltar ao Início</span>
                </TransitionLink>
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === "submitting" && (
          <motion.div
            key="submitting"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto"
            >
              <div className="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500" />
            </motion.div>
            <h2 className="text-2xl text-white font-light">
              Enviando suas respostas...
            </h2>
            <p className="text-white/60">
              Você será redirecionado para a sala de atendimento em breve
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
