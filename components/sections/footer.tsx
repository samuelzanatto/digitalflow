"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube, Music4 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-extralight text-base md:text-lg mb-3 md:mb-4">flow</h3>
            <p className="text-white/60 text-xs md:text-sm">
              A plataforma que transforma sua visão em negócio escalável.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h4 className="text-white font-extralight mb-3 md:mb-4 text-sm md:text-base">Navegue</h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Depoimentos
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-white font-extralight mb-3 md:mb-4 text-sm md:text-base">Recursos</h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Suporte
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm">
                  Termos e Políticas
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <h4 className="text-white font-extralight mb-3 md:mb-4 text-sm md:text-base">Siga-nos</h4>
            <div className="flex gap-2 md:gap-4">
              <Link href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Instagram size={16} className="md:w-5 md:h-5" />
              </Link>
              <Link href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Facebook size={16} className="md:w-5 md:h-5" />
              </Link>
              <Link href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Youtube size={16} className="md:w-5 md:h-5" />
              </Link>
              <Link href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Linkedin size={16} className="md:w-5 md:h-5" />
              </Link>
              <Link href="#" className="text-white/60 hover:text-purple-400 transition-colors">
                <Music4 size={16} className="md:w-5 md:h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 py-6 md:py-8 mt-6 md:mt-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-white/60 text-xs md:text-sm text-center md:text-left">
            © 2025 - flow. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 md:gap-6">
            <Link href="/" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">
              Privacidade
            </Link>
            <Link href="/" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">
              Termos
            </Link>
            <Link href="/" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
