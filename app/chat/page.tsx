"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Send, ArrowLeft, MessageCircle, Star, X, Clock, Users } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type ChatSessionRow = Database['public']['Tables']['ChatSession']['Row']
type ChatMessageRow = Database['public']['Tables']['ChatMessage']['Row']

// Avatares fake de atendentes
const supportTeam = [
  { name: "Ana", avatar: "https://i.pravatar.cc/150?img=1" },
  { name: "Lucas", avatar: "https://i.pravatar.cc/150?img=3" },
  { name: "Julia", avatar: "https://i.pravatar.cc/150?img=5" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [userName, setUserName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'in_progress' | 'completed' | 'abandoned'>('waiting');
  const [queuePosition, setQueuePosition] = useState(0);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  // Inicializar cliente Supabase no browser (apenas para Realtime)
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  }, []);

  // Inicializar ou recuperar sessão
  useEffect(() => {
    const initSession = async () => {
      // Verificar se já existe uma sessão ativa no localStorage
      const savedSessionId = localStorage.getItem('chatSessionId');
      
      if (savedSessionId) {
        try {
          // Recuperar sessão existente via API
          const response = await fetch('/api/chat?sessionId=' + savedSessionId + '&type=session');
          const data = await response.json();
          
          if (data.session && data.session.status !== 'completed' && data.session.status !== 'abandoned') {
            setSessionId(data.session.id);
            setSessionStatus(data.session.status);
            setQueuePosition(data.session.queuePosition || 0);
            setUserName(data.session.visitorName);
            setAgentName(null); // Será carregado via realtime
            
            // Carregar mensagens existentes
            const messagesResponse = await fetch('/api/chat?sessionId=' + savedSessionId + '&type=messages');
            const messagesData = await messagesResponse.json();
            
            if (messagesData.messages) {
              setMessages(messagesData.messages);
            }
            
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem('chatSessionId');
          }
        } catch (error) {
          console.error('Erro ao recuperar sessão:', error);
          localStorage.removeItem('chatSessionId');
        }
      }
      
      // Mostrar formulário para nova sessão
      setShowForm(true);
      setIsLoading(false);
    };
    
    initSession();
  }, []);

  // Criar nova sessão
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Recuperar respostas do quiz se existirem
      const quizAnswersRaw = localStorage.getItem('quizAnswers');
      let quizAnswers = {};
      
      if (quizAnswersRaw) {
        try {
          quizAnswers = JSON.parse(quizAnswersRaw);
        } catch {
          console.error('Erro ao parsear respostas do quiz');
        }
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session',
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          quizAnswers
        })
      });
      
      const data = await response.json();
      
      if (data.session) {
        setSessionId(data.session.id);
        setUserName(data.session.visitorName);
        setQueuePosition(data.queuePosition);
        setSessionStatus('waiting');
        setShowForm(false);
        localStorage.setItem('chatSessionId', data.session.id);
        
        // Limpar respostas do quiz após enviar
        localStorage.removeItem('quizAnswers');
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    }
    
    setIsLoading(false);
  };

  // Subscrever a mudanças na sessão (realtime)
  useEffect(() => {
    if (!sessionId) return;
    
    const supabase = getSupabase();
    
    console.log('[Chat Public] Configurando Realtime para sessão:', sessionId);
    
    // Canal único para todas as mudanças relacionadas a esta sessão
    const channel = supabase
      .channel(`chat-public-${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ChatSession'
        },
        (payload) => {
          console.log('[Chat Public] Mudança na sessão detectada:', payload);
          const session = payload.new as ChatSessionRow;
          // Verificar se é a sessão correta
          if (session && session.id === sessionId) {
            console.log('[Chat Public] Sessão atualizada - novo status:', session.status);
            setSessionStatus(session.status);
            setQueuePosition(session.queuePosition || 0);
            
            if (session.status === 'completed') {
              setShowFeedback(true);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ChatMessage'
        },
        (payload) => {
          console.log('[Chat Public] Nova mensagem detectada:', payload);
          const newMessage = payload.new as ChatMessageRow;
          // Verificar se é uma mensagem para esta sessão
          if (newMessage && newMessage.sessionId === sessionId) {
            console.log('[Chat Public] Nova mensagem adicionada:', newMessage.content);
            setMessages(prev => {
              if (prev.find(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Chat Public] Status da subscrição:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('[Chat Public] Realtime conectado com sucesso!');
        }
        if (err) {
          console.error('[Chat Public] Erro na subscrição:', err);
        }
      });
    
    return () => {
      console.log('[Chat Public] Removendo canal Realtime');
      supabase.removeChannel(channel);
    };
  }, [sessionId, getSupabase]);

  // Atualizar posição na fila periodicamente
  useEffect(() => {
    if (sessionStatus !== 'waiting' || !sessionId) return;
    
    const updatePosition = async () => {
      try {
        const response = await fetch('/api/chat?sessionId=' + sessionId + '&type=session');
        const data = await response.json();
        
        if (data.session) {
          setQueuePosition(data.session.queuePosition || 1);
        }
      } catch (error) {
        console.error('Erro ao atualizar posição:', error);
      }
    };
    
    const interval = setInterval(updatePosition, 5000);
    return () => clearInterval(interval);
  }, [sessionStatus, sessionId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sessionStatus !== 'in_progress' || !sessionId) return;

    const content = inputValue.trim();
    setInputValue("");
    
    // Gerar ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessageRow = {
      id: tempId,
      sessionId: sessionId,
      sender: 'visitor',
      senderId: null,
      content,
      createdAt: new Date().toISOString()
    };
    
    // Atualização otimista - adicionar mensagem imediatamente
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          sessionId,
          sender: 'visitor',
          content
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar');
      }
      
      const data = await response.json();
      
      // Substituir mensagem temporária pela real
      if (data.message) {
        setMessages(prev => prev.map(m => 
          m.id === tempId ? data.message : m
        ));
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputValue(content); // Restaurar input em caso de erro
    }
  };

  const handleEndChat = async () => {
    if (!sessionId) return;
    
    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: 'completed'
        })
      });
      
      setSessionStatus('completed');
      setShowFeedback(true);
    } catch (error) {
      console.error('Erro ao encerrar chat:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!sessionId || rating === 0) return;
    
    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating,
          feedback: feedbackText || null
        })
      });
      
      setFeedbackSubmitted(true);
      localStorage.removeItem('chatSessionId');
      
      setTimeout(() => {
        setShowFeedback(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-linear-to-br from-black via-black to-purple-950/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-white/70">Carregando chat...</p>
        </motion.div>
      </div>
    );
  }

  // Formulário de início
  if (showForm) {
    return (
      <div className="h-screen bg-linear-to-br from-black via-black to-purple-950/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-linear-to-r from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Iniciar Atendimento</h1>
              <p className="text-white/60">Preencha seus dados para iniciar o chat</p>
            </div>

            <div className="flex -space-x-3 justify-center mb-6">
              {supportTeam.map((member, i) => (
                <div key={i} className="relative">
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-zinc-900"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                </div>
              ))}
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-zinc-900">
                <span className="text-xs text-purple-400 font-medium">+5</span>
              </div>
            </div>

            <form onSubmit={handleStartChat} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Iniciar Chat
              </button>
            </form>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-white/50 hover:text-white/80 mt-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-linear-to-br from-black via-black to-purple-950/20 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className={"absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 " + (sessionStatus === 'in_progress' ? 'bg-green-500' : 'bg-yellow-500')} />
              </div>
              <div>
                <h1 className="text-white font-medium">
                  {sessionStatus === 'in_progress' && agentName ? agentName : 'Suporte'}
                </h1>
                <p className="text-xs text-white/50">
                  {sessionStatus === 'waiting' && 'Aguardando atendimento...'}
                  {sessionStatus === 'in_progress' && 'Online'}
                  {sessionStatus === 'completed' && 'Atendimento finalizado'}
                </p>
              </div>
            </div>
          </div>
          
          {sessionStatus === 'in_progress' && (
            <button
              onClick={handleEndChat}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Encerrar
            </button>
          )}
        </div>
      </header>

      {/* Status da fila */}
      {sessionStatus === 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3"
        >
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-300 text-sm">
              Você está na posição <strong>{queuePosition}</strong> da fila
            </p>
            <Users className="w-5 h-5 text-yellow-400" />
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={"flex " + (message.sender === 'visitor' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={"max-w-[80%] rounded-2xl px-4 py-3 " + (
                  message.sender === 'visitor'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-white'
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={"text-xs mt-1 " + (message.sender === 'visitor' ? 'text-white/60' : 'text-white/40')}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {sessionStatus === 'in_progress' && (
        <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Waiting message */}
      {sessionStatus === 'waiting' && (
        <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 p-4">
          <p className="text-center text-white/50 text-sm">
            Aguarde, em breve um atendente irá te atender...
          </p>
        </div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              {feedbackSubmitted ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Star className="w-8 h-8 text-green-400" fill="currentColor" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Obrigado!</h3>
                  <p className="text-white/60">Sua avaliação foi enviada com sucesso.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Avalie o atendimento</h3>
                    <button
                      onClick={() => {
                        setShowFeedback(false);
                        localStorage.removeItem('chatSessionId');
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white/50" />
                    </button>
                  </div>

                  <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={"w-10 h-10 transition-colors " + (
                            star <= (hoverRating || rating)
                              ? 'text-yellow-400'
                              : 'text-white/20'
                          )}
                          fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Deixe um comentário (opcional)"
                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none h-24 mb-4"
                  />

                  <button
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    Enviar Avaliação
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
