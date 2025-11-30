"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { TransitionLink } from "@/components/transition-link";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", href: "#home" },
  { label: "Serviços", href: "#servicos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Cases", href: "#cases" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Início");
  const { scrollY } = useScroll();

  // Função para scroll suave com offset
  const handleSmoothScroll = (href: string) => {
    const sectionId = href.substring(1); // Remove o #
    const element = document.getElementById(sectionId);
    
    if (element) {
      const offsetTop = element.offsetTop - 80; // 80px de offset para ficar mais próximo
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  // Detectar scroll para efeitos visuais
  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  // Detectar seção ativa ao fazer scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => item.href.substring(1)); // Remove o #
      
      let currentSection = "Home";
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Se a seção está no topo da viewport (com offset)
          if (rect.top <= 150) {
            currentSection = navItems.find(item => item.href === `#${section}`)?.label || "Home";
          }
        }
      }
      
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fechar menu mobile ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevenir scroll quando menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-40"
      >
        <div className="w-full">
          <div className="relative flex items-center h-16 md:h-28 px-4 sm:px-8 lg:px-36 justify-between md:justify-center">
            {/* Logo - Esquerda */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="shrink-0 md:flex-1 md:justify-start"
            >
              <Link 
                href="#home" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSmoothScroll("#home");
                }}
                className="flex items-center space-x-2 whitespace-nowrap min-w-max"
              >
                <div
                  className="flex items-center gap-2"
                >
                  <Image
                    src="/logo.png"
                    alt="Flow Logo"
                    width={40}
                    height={40}
                    className="w-8 h-8 md:w-8 md:h-8 object-contain"
                  />
                  <div className="flex gap-1">
                    <span className="text-white font-extralight text-lg md:text-3xl font-poppins whitespace-nowrap">
                      flow
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Centro */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex md:flex-1 items-center justify-center"
            >
              <div 
                className="flex items-center gap-1 rounded-full px-1 py-1 border border-white/20 whitespace-nowrap"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection(item.label);
                        handleSmoothScroll(item.href);
                      }}
                      className="relative group"
                    >
                      <motion.div
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
                          activeSection === item.label
                            ? "text-black font-extralight"
                            : "text-white/70 hover:text-white font-extralight"
                        )}
                      >
                        {item.label}
                        
                        {/* Active indicator */}
                        {activeSection === item.label && (
                          <motion.div
                            layoutId="activeSection"
                            className="absolute inset-0 bg-white rounded-full -z-10"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}

                        {/* Hover effect */}
                        <motion.div
                          className="absolute inset-0 bg-white/5 rounded-full -z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contact Button & Mobile Menu Toggle - Direita */}
            <div className="flex items-center md:flex-1 md:justify-end space-x-2 md:space-x-4 shrink-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="hidden sm:block"
              >
                <TransitionLink
                  href="/quiz"
                  className="relative inline-flex items-center justify-center border border-white/30 hover:border-white/50 text-white rounded-full px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all duration-300"
                >
                  <span
                    className="relative z-10 font-bold"
                  >
                    Falar com especialista
                  </span>
                </TransitionLink>
              </motion.div>

              {/* Mobile Menu Button - Desktop only (hidden) */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <motion.div
                      animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </motion.div>
                  </motion.button>
                </SheetTrigger>
                  <SheetContent side="right" className="w-4/5 sm:w-96 bg-black/95 border-l border-white/10 px-6">
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    <div className="flex flex-col h-full pt-16">
                      {/* Mobile Nav Items */}
                      <nav className="flex-1 space-y-2 pt-8">
                        {navItems.map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{
                              opacity: isMobileMenuOpen ? 1 : 0,
                              x: isMobileMenuOpen ? 0 : 50,
                            }}
                            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                          >
                            <Link
                              href={item.href}
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveSection(item.label);
                                setIsMobileMenuOpen(false);
                                handleSmoothScroll(item.href);
                              }}
                              className="block"
                            >
                              <motion.div
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                  "px-6 py-4 rounded-xl text-lg font-medium transition-all duration-300",
                                  activeSection === item.label
                                    ? "bg-white/10 text-white"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                                )}
                              >
                                {item.label}
                              </motion.div>
                            </Link>
                          </motion.div>
                        ))}
                      </nav>

                      {/* Mobile Contact Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: isMobileMenuOpen ? 1 : 0,
                          y: isMobileMenuOpen ? 0 : 20,
                        }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="space-y-3 pb-8 mt-auto"
                      >
                        <TransitionLink
                          href="/quiz"
                          className="relative inline-flex w-full items-center justify-center border border-white/30 hover:border-white/50 text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
                        >
                          <span className="relative z-10 font-bold">
                            Falar com especialista
                          </span>
                        </TransitionLink>
                      </motion.div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </motion.nav>
    </>
  );
}
