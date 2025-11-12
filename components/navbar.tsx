"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/transition-link";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Serviços", href: "#servicos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Cases", href: "#cases" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");
  const { scrollY } = useScroll();

  // Função para scroll suave com offset
  const handleSmoothScroll = (href: string) => {
    const sectionId = href.substring(1); // Remove o #
    const element = document.getElementById(sectionId);
    
    if (element) {
      const offsetTop = element.offsetTop - 120; // 120px de offset (altura da navbar)
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
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "transparent",
          backdropFilter: isScrolled ? "blur(8px)" : "none",
          borderBottomWidth: "1px",
          borderBottomColor: isScrolled ? "rgba(255, 255, 255, 0.1)" : "transparent",
          transition: "background-color 300ms ease-in-out, border-color 300ms ease-in-out",
        }}
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2"
                >
                  <Image
                    src="/logo.png"
                    alt="Flow Logo"
                    width={40}
                    height={40}
                    className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  />
                  <div className="flex gap-1">
                    <span className="text-white font-extralight text-lg md:text-3xl font-poppins whitespace-nowrap">
                      flow
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Centro */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex md:flex-1 items-center justify-center"
            >
              <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full px-1 py-1 border border-white/30 whitespace-nowrap">
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
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
                <Button
                  asChild
                  className="relative overflow-hidden bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium shadow-lg shadow-purple-500/50 transition-all duration-300"
                >
                  <Link href="#contato">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative z-10 font-bold"
                    >
                      Agendar
                    </motion.span>
                    
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-linear-to-r from-pink-600 to-purple-600"
                      initial={{ x: "100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </Button>
              </motion.div>

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="hidden sm:block"
              >
                <Button
                  asChild
                  className="border border-white/40 hover:border-white/80 bg-transparent hover:bg-white/5 text-white rounded-full px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all duration-300"
                >
                  <TransitionLink href="/login">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative z-10 font-bold"
                    >
                      Login
                    </motion.span>
                  </TransitionLink>
                </Button>
              </motion.div>

              {/* Mobile Menu Button - Desktop only (hidden) */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{
          opacity: isMobileMenuOpen ? 1 : 0,
          x: isMobileMenuOpen ? 0 : "100%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed inset-0 md:hidden",
          isMobileMenuOpen ? "z-50 pointer-events-auto" : "z-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Menu Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: isMobileMenuOpen ? 0 : "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl"
        >
          <div className="flex flex-col h-full p-6 pt-16">
            {/* Mobile Nav Items */}
            <nav className="flex-1 space-y-2">
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
              className="space-y-3"
            >
              <Button
                asChild
                className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl py-6 text-lg font-semibold shadow-lg shadow-purple-500/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="#contato">Agendar</Link>
              </Button>

              <Button
                asChild
                className="w-full border border-white/40 hover:border-white/80 bg-transparent hover:bg-white/5 text-white rounded-xl py-6 text-lg font-semibold transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TransitionLink href="/login">Login</TransitionLink>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile Close Button - Fixed on top of sidebar */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isMobileMenuOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "fixed top-3 right-4 md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors z-50",
          !isMobileMenuOpen && "pointer-events-none"
        )}
        aria-label="Close menu"
      >
        <motion.div
          animate={{ rotate: isMobileMenuOpen ? 0 : 90 }}
          transition={{ duration: 0.3 }}
        >
          <X size={24} />
        </motion.div>
      </motion.button>
    </>
  );
}
