/**
 * Definição centralizada de fontes do Google Fonts para o Next.js
 * Essas fontes podem ser usadas em todo o aplicativo
 */

import { 
  Inter, 
  Roboto, 
  Poppins, 
  Playfair_Display,
  Lora,
  Montserrat,
  Open_Sans,
  Raleway,
  Merriweather,
  Source_Sans_3
} from 'next/font/google'

// Fonte padrão - Inter
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Fonte Roboto
export const roboto = Roboto({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

// Fonte Poppins - Moderna e geométrica
export const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
})

// Fonte Playfair Display - Elegante, serif
export const playfair = Playfair_Display({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

// Fonte Lora - Elegante, com serifs
export const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
})

// Fonte Montserrat - Geométrica e limpa
export const montserrat = Montserrat({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

// Fonte Open Sans - Legível e versátil
export const openSans = Open_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
})

// Fonte Raleway - Elegante e refinada
export const raleway = Raleway({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
})

// Fonte Merriweather - Clássica, serif
export const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
})

// Fonte Source Sans 3 - Limpa e moderna
export const sourceSans = Source_Sans_3({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-sans',
})

/**
 * Lista de fontes disponíveis para seleção no editor
 * Cada entrada contém:
 * - id: identificador único
 * - label: nome exibível
 * - fontFamily: nome da família de fonte CSS
 * - variable: variável CSS (com --)
 */
export const AVAILABLE_FONTS = [
  {
    id: 'inter',
    label: 'Inter',
    fontFamily: 'Inter, sans-serif',
    variable: 'var(--font-inter)',
  },
  {
    id: 'roboto',
    label: 'Roboto',
    fontFamily: 'Roboto, sans-serif',
    variable: 'var(--font-roboto)',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    fontFamily: 'Poppins, sans-serif',
    variable: 'var(--font-poppins)',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    fontFamily: 'Playfair Display, serif',
    variable: 'var(--font-playfair)',
  },
  {
    id: 'lora',
    label: 'Lora',
    fontFamily: 'Lora, serif',
    variable: 'var(--font-lora)',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    fontFamily: 'Montserrat, sans-serif',
    variable: 'var(--font-montserrat)',
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    fontFamily: 'Open Sans, sans-serif',
    variable: 'var(--font-open-sans)',
  },
  {
    id: 'raleway',
    label: 'Raleway',
    fontFamily: 'Raleway, sans-serif',
    variable: 'var(--font-raleway)',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    fontFamily: 'Merriweather, serif',
    variable: 'var(--font-merriweather)',
  },
  {
    id: 'source-sans',
    label: 'Source Sans 3',
    fontFamily: 'Source Sans 3, sans-serif',
    variable: 'var(--font-source-sans)',
  },
]

/**
 * Obtém a fonte pelo ID
 */
export function getFontById(fontId: string) {
  return AVAILABLE_FONTS.find(font => font.id === fontId)
}
