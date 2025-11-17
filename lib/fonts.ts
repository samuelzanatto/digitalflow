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

