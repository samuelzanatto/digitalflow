"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Send, ArrowLeft, User, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "specialist";
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simular carregamento das informações do usuário
  useEffect(() => {
    setTimeout(() => {
      const savedUser = localStorage.getItem("quizUser");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // Adicionar mensagem de boas-vindas do especialista
        const welcomeMessage: Message = {
          id: "welcome",
          text: `Olá ${userData.name}! 👋 Bem-vindo à sala de atendimento. Um especialista analisará suas respostas e estará com você em breve para conversar sobre a melhor estratégia para seu negócio.`,
          sender: "specialist",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
      setIsLoading(false);
    }, 800);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simular resposta do especialista após 2 segundos
    setTimeout(() => {
      const responses = [
        "Entendi perfeitamente! Deixe-me analisar suas respostas com mais detalhes.",
        "Ótimo! Isso nos ajuda a entender melhor suas necessidades.",
        "Perfeito! Com essas informações, podemos criar uma estratégia personalizada.",
        "Muito bom! Vejo que há grande potencial aqui.",
        "Excelente! Vou preparar uma proposta específica para você.",
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      const specialistMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "specialist",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, specialistMessage]);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black via-black to-purple-950/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
            Abrindo sala de atendimento...
          </h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-black to-purple-950/20 flex flex-col relative">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/10 sticky top-0 z-10"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Especialista Digital Flow</p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Online agora
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </Link>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-6 space-y-4 pb-40">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-3 max-w-xs md:max-w-md ${
                  message.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {message.sender === "specialist" && (
                  <div className="w-8 h-8 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === "user"
                        ? "text-white/70"
                        : "text-white/60"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 border-t border-white/10 z-20"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-4xl mx-auto w-full px-4 py-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
            >
              <Send size={20} />
            </motion.button>
          </div>
          <p className="text-white/50 text-xs mt-2">
            Pressione Enter para enviar
          </p>
        </div>
      </motion.div>
    </div>
  );
}
