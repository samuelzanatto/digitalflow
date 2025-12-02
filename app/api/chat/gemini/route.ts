import { streamText, tool, stepCountIs, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// ============================================
// SISTEMA DE PAGE BUILDER AVANÇADO v2.0
// Inspirado em v0, Lovable e Open Lovable
// ============================================

// Design System - Cores do tema escuro premium
const designSystem = {
  colors: {
    // Backgrounds (do mais escuro ao mais claro)
    background: '#09090b',      // zinc-950 - background principal
    backgroundAlt: '#0a0a0a',   // background alternativo
    surface: '#18181b',         // zinc-900 - cards, containers
    surfaceHover: '#27272a',    // zinc-800 - hover states
    elevated: '#3f3f46',        // zinc-700 - elevated elements
    
    // Texto (hierarquia visual clara)
    text: '#fafafa',            // zinc-50 - texto principal
    textSecondary: '#a1a1aa',   // zinc-400 - texto secundário
    textMuted: '#71717a',       // zinc-500 - texto sutil
    textDisabled: '#52525b',    // zinc-600 - disabled
    
    // Bordas e separadores
    border: '#27272a',          // zinc-800
    borderLight: '#3f3f46',     // zinc-700
    
    // Cores de destaque (accent)
    accent: '#22c55e',          // green-500 - CTA principal
    accentHover: '#16a34a',     // green-600
    accentMuted: '#166534',     // green-800
    
    // Cores secundárias
    secondary: '#a855f7',       // purple-500
    secondaryHover: '#9333ea',  // purple-600
    
    // Feedback
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Tipografia
  typography: {
    display: { size: '72px', weight: '800', lineHeight: '1.0' },
    h1: { size: '56px', weight: '700', lineHeight: '1.1' },
    h2: { size: '42px', weight: '700', lineHeight: '1.2' },
    h3: { size: '32px', weight: '600', lineHeight: '1.3' },
    h4: { size: '24px', weight: '600', lineHeight: '1.4' },
    body: { size: '18px', weight: '400', lineHeight: '1.7' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' },
  },
  
  // Espaçamentos
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
    '2xl': '64px',
    '3xl': '96px',
    section: '80px',
  },
  
  // Border radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  
  // Sombras
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.3)',
    lg: '0 10px 15px rgba(0,0,0,0.3)',
    xl: '0 25px 50px rgba(0,0,0,0.4)',
    glow: (color: string) => `0 0 40px ${color}33`,
  },
} as const;

// Atalhos para as cores mais usadas
const colors = designSystem.colors;

// ============================================
// CREATIVE DESIGN SYSTEM - Liberdade Total
// ============================================
const CREATIVE_SYSTEM_PROMPT = `Você é um designer visual criativo de elite, inspirado em Dribbble, Behance, Awwwards e as melhores agências de design do mundo. Você cria designs únicos, inovadores e visualmente impactantes.

## 🎨 SUA IDENTIDADE
Você é um artista digital com total liberdade criativa. Não está preso a templates ou estruturas rígidas. Cada design é uma obra de arte única.

## 🌟 FILOSOFIA CRIATIVA

### Princípios de Design:
1. **Ousadia** - Não tenha medo de experimentar
2. **Contraste** - Use tamanhos, cores e espaçamentos dramáticos
3. **Hierarquia** - Guie o olhar do usuário intencionalmente
4. **Espaço Negativo** - O vazio é tão importante quanto o cheio
5. **Tipografia Expressiva** - Letras podem ser arte
6. **Microinterações** - Detalhes fazem a diferença

## 🎭 ESTILOS VISUAIS DISPONÍVEIS

### 1. **Glassmorphism**
- Fundos com blur (backdrop-filter)
- Transparência com rgba()
- Bordas sutis com opacidade
- Cores: backgrounds semi-transparentes
\`\`\`
background: rgba(255,255,255,0.05)
backdropFilter: blur(20px)
border: 1px solid rgba(255,255,255,0.1)
\`\`\`

### 2. **Neomorphism**
- Sombras duplas (interna e externa)
- Fundo e elementos na mesma cor
- Efeito "extrudido" ou "pressionado"
\`\`\`
boxShadow: '8px 8px 16px #0d0d0d, -8px -8px 16px #1f1f1f'
background: #18181b
\`\`\`

### 3. **Brutalism**
- Cores primárias fortes
- Bordas grossas e visíveis
- Tipografia bold/heavy
- Assimetria intencional
\`\`\`
border: 4px solid #fff
background: #ff0000 ou #00ff00 ou #0000ff
fontWeight: 900
\`\`\`

### 4. **Minimal/Clean**
- Muito espaço em branco
- Tipografia elegante
- Poucos elementos
- Cores limitadas (2-3)

### 5. **Dark Luxury**
- Preto profundo com dourado/rose gold
- Gradientes sutis
- Tipografia serif elegante
\`\`\`
background: #0a0a0a
accent: #d4af37 (gold) ou #e8b4b8 (rose)
\`\`\`

### 6. **Neon/Cyberpunk**
- Cores vibrantes neon
- Efeitos de glow
- Fundos escuros
\`\`\`
color: #00ffff ou #ff00ff ou #00ff00
textShadow: '0 0 20px #00ffff'
boxShadow: '0 0 30px rgba(0,255,255,0.5)'
\`\`\`

### 7. **Gradient Mesh**
- Gradientes multicoloridos
- Formas orgânicas
- Transições suaves
\`\`\`
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
\`\`\`

### 8. **Retro/Vintage**
- Cores pastéis ou saturadas
- Tipografia decorativa
- Texturas e padrões

## 🔧 FERRAMENTAS CRIATIVAS

Você tem acesso a componentes flexíveis que aceita QUALQUER estilo:
- **Cores**: Qualquer hex/rgba/gradiente
- **Bordas**: Qualquer radius/width/style
- **Sombras**: Box-shadow, text-shadow, glows
- **Espaçamentos**: Padding/margin customizáveis
- **Tipografia**: Qualquer tamanho/peso

## 💡 CRIATIVIDADE EM AÇÃO

### Quando pedirem algo específico:
- Interprete livremente e crie algo único
- Adicione sua assinatura criativa
- Surpreenda com detalhes inesperados

### Quando pedirem experimentação:
- Misture estilos
- Use cores inesperadas
- Brinque com proporções
- Crie layouts assimétricos

### Quando pedirem algo profissional:
- Mantenha consistência
- Use hierarquia clara
- Foque em legibilidade
- Equilibre criatividade e funcionalidade

## 🎨 PALETAS SUGERIDAS

**Aurora Borealis:**
#00d4ff → #7c3aed → #f472b6

**Sunset Vibes:**
#ff6b6b → #feca57 → #ff9ff3

**Ocean Depth:**
#0c0c1e → #1a1a4e → #4c4cff

**Forest Night:**
#0d1f0d → #1a4a1a → #2ecc71

**Cosmic Purple:**
#1a0a2e → #4a1e6e → #9b59b6

**Fire & Ice:**
#ff4757 → #3742fa → #2f3542

## 📐 LAYOUTS CRIATIVOS

### Assimétrico
- Elementos desalinhados intencionalmente
- Cria tensão visual e interesse

### Bento Grid
- Caixas de tamanhos variados
- Estilo magazine/editorial

### Full Bleed
- Imagens/cores que vão até a borda
- Impacto visual máximo

### Split Screen
- Dividido em duas metades contrastantes
- Um lado claro, outro escuro

### Overlapping
- Elementos sobrepostos
- Cria profundidade e dinamismo

## ⚡ EXECUÇÃO

1. **Interprete** o pedido criativamente
2. **Escolha** um estilo ou misture estilos
3. **Execute** com as tools disponíveis
4. **Surpreenda** com detalhes únicos

IMPORTANTE: Você tem TOTAL LIBERDADE. Não siga regras rígidas. Crie arte.`;

// Valores padrão das cores para facilitar uso nas tools
const defaultColors = {
  background: colors.backgroundAlt,
  surface: colors.surface,
  text: colors.text,
  textSecondary: colors.textSecondary,
  accent: colors.accent,
  border: colors.border,
};

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google('gemini-2.0-flash'),
      temperature: 0.7, // Alta criatividade para designs únicos
      system: CREATIVE_SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(30), // Mais steps para designs complexos
      tools: {
        // ========== TOOL: INICIAR CANVAS CRIATIVO ==========
        startPageBuilder: tool({
          description: 'Inicia o canvas criativo. Chame primeiro antes de adicionar elementos.',
          inputSchema: z.object({
            projectName: z.string().describe('Nome do projeto'),
            style: z.enum(['glassmorphism', 'neomorphism', 'brutalism', 'minimal', 'dark-luxury', 'neon', 'gradient-mesh', 'retro', 'custom']).default('custom').describe('Estilo visual principal'),
            mood: z.string().optional().describe('Atmosfera do design (ex: futurista, elegante, divertido, sério)'),
            colorScheme: z.string().optional().describe('Paleta de cores principal'),
          }),
          execute: async ({ projectName, style, mood, colorScheme }) => {
            return {
              success: true,
              action: 'START_PAGE_BUILDER',
              pageTitle: projectName,
              pageType: style,
              targetAudience: mood,
              colorScheme,
              message: `🎨 Canvas criativo iniciado: ${projectName} | Estilo: ${style}${mood ? ` | Mood: ${mood}` : ''}${colorScheme ? ` | Cores: ${colorScheme}` : ''}`,
            };
          },
        }),

        // ========== TOOL: ADICIONAR NAVBAR ==========
        addNavbar: tool({
          description: 'Barra de navegação customizável. Use estilos criativos!',
          inputSchema: z.object({
            logoText: z.string().describe('Nome/logo da marca'),
            logoIcon: z.string().optional().describe('Emoji ou símbolo do logo'),
            links: z.array(z.object({
              label: z.string(),
              href: z.string().default('#'),
            })).optional().describe('Links de navegação'),
            ctaText: z.string().optional().describe('Texto do botão CTA'),
            ctaLink: z.string().default('#'),
            // Estilos totalmente customizáveis
            backgroundColor: z.string().default('transparent').describe('Cor de fundo (hex, rgba, gradiente)'),
            textColor: z.string().default('#fafafa'),
            accentColor: z.string().default('#22c55e'),
            blur: z.boolean().default(false).describe('Efeito glassmorphism'),
            borderBottom: z.string().optional().describe('Borda inferior customizada'),
            sticky: z.boolean().default(true),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'navbar',
              componentId: `navbar-${Date.now()}`,
              props,
              message: `Navbar adicionada: ${props.logoText}`,
            };
          },
        }),

        // ========== TOOL: HERO SECTION CRIATIVO ==========
        addHeroSection: tool({
          description: 'Seção hero principal totalmente customizável. Use estilos criativos!',
          inputSchema: z.object({
            // Conteúdo
            badge: z.string().optional().describe('Badge/tag acima do título'),
            headline: z.string().describe('Título principal - seja criativo!'),
            subheadline: z.string().optional().describe('Subtítulo explicativo'),
            ctaText: z.string().optional().describe('Texto do botão CTA'),
            ctaLink: z.string().default('#'),
            secondaryCtaText: z.string().optional().describe('CTA secundário'),
            secondaryCtaLink: z.string().optional(),
            socialProof: z.string().optional().describe('Texto de prova social'),
            // Estilos customizáveis
            backgroundColor: z.string().default('#09090b').describe('Cor/gradiente de fundo'),
            textColor: z.string().default('#fafafa'),
            ctaColor: z.string().default('#22c55e'),
            // Opções criativas
            layout: z.enum(['centered', 'left-aligned', 'split', 'fullscreen']).default('centered'),
            effect: z.enum(['none', 'gradient-text', 'glow', 'blur-bg']).default('none').describe('Efeito especial'),
            size: z.enum(['small', 'medium', 'large', 'fullscreen']).default('large'),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'hero',
              componentId: `hero-${Date.now()}`,
              props,
              message: '✨ Hero Section criativa adicionada',
            };
          },
        }),

        // ========== TOOL: SOCIAL PROOF / LOGOS ==========
        addSocialProof: tool({
          description: 'Barra de prova social com logos ou métricas.',
          inputSchema: z.object({
            type: z.enum(['logos', 'metrics', 'mixed']).default('metrics'),
            title: z.string().optional().describe('Título (ex: "Confiado por +500 empresas")'),
            items: z.array(z.object({
              label: z.string().describe('Nome da empresa ou label'),
              value: z.string().optional().describe('Valor/número'),
              icon: z.string().optional().describe('Emoji ou ícone'),
            })).describe('Itens de prova social'),
            backgroundColor: z.string().default('#18181b'),
            textColor: z.string().default('#a1a1aa'),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'socialProof',
              componentId: `social-proof-${Date.now()}`,
              props,
              message: 'Barra de prova social adicionada',
            };
          },
        }),

        // ========== TOOL: FEATURE CARD CRIATIVO ==========
        addFeatureCard: tool({
          description: 'Card de feature/benefício customizável. Chame múltiplas vezes para criar um grid.',
          inputSchema: z.object({
            icon: z.string().default('✨').describe('Emoji ou ícone'),
            title: z.string().describe('Título'),
            description: z.string().describe('Descrição'),
            badge: z.string().optional().describe('Badge opcional'),
            // Estilos
            backgroundColor: z.string().default('#18181b'),
            textColor: z.string().default('#fafafa'),
            iconColor: z.string().default('#22c55e'),
            borderColor: z.string().default('#27272a'),
            // Variações de estilo
            variant: z.enum(['default', 'glass', 'neon', 'gradient', 'minimal']).default('default'),
            glowColor: z.string().optional().describe('Cor do glow (para variant neon)'),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'featureCard',
              componentId: `feature-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              props,
              message: `Feature adicionada: ${props.title}`,
            };
          },
        }),

        // ========== TOOL: ADICIONAR TESTIMONIAL CARD ==========
        addTestimonialCard: tool({
          description: 'Adiciona UM depoimento. Chame 3x para 3 depoimentos (serão agrupados automaticamente).',
          inputSchema: z.object({
            quote: z.string().describe('Depoimento com resultado específico (2-3 frases). Use números!'),
            authorName: z.string().describe('Nome do autor'),
            authorRole: z.string().describe('Cargo + Empresa'),
            authorImage: z.string().optional().describe('URL da foto (opcional)'),
            rating: z.number().min(1).max(5).default(5).describe('Avaliação em estrelas'),
            verified: z.boolean().default(true).describe('Mostrar badge verificado'),
            backgroundColor: z.string().default(defaultColors.surface),
            textColor: z.string().default(defaultColors.text),
            accentColor: z.string().default(colors.warning),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'testimonialCard',
              componentId: `testimonial-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              props,
              message: `Depoimento adicionado: ${props.authorName}`,
            };
          },
        }),

        // ========== TOOL: ADICIONAR PRICING CARD ==========
        addPricingCard: tool({
          description: 'Adiciona UM card de preço. Chame 3x para 3 planos (serão agrupados automaticamente). Destaque o plano recomendado.',
          inputSchema: z.object({
            planName: z.string().describe('Nome do plano'),
            planDescription: z.string().optional().describe('Descrição curta do plano'),
            price: z.string().describe('Preço (ex: "R$497")'),
            originalPrice: z.string().optional().describe('Preço original riscado (ancoragem)'),
            period: z.string().default('/único').describe('Período (ex: /mês, /ano, /único)'),
            features: z.array(z.string()).describe('Lista de recursos incluídos (5-7 itens)'),
            ctaText: z.string().default('Começar Agora'),
            ctaLink: z.string().default('#'),
            highlighted: z.boolean().default(false).describe('TRUE para o plano recomendado'),
            badge: z.string().optional().describe('Badge (ex: "Mais Popular", "Melhor Custo-Benefício")'),
            backgroundColor: z.string().default(defaultColors.surface),
            textColor: z.string().default(defaultColors.text),
            accentColor: z.string().default(defaultColors.accent),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'pricingCard',
              componentId: `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              props,
              message: `Plano adicionado: ${props.planName}`,
            };
          },
        }),

        // ========== TOOL: ADICIONAR FAQ ITEM ==========
        addFAQItem: tool({
          description: 'Adiciona uma pergunta/resposta ao FAQ. Chame múltiplas vezes para várias perguntas.',
          inputSchema: z.object({
            question: z.string().describe('Pergunta frequente'),
            answer: z.string().describe('Resposta completa e útil'),
            icon: z.string().optional().describe('Ícone opcional'),
            backgroundColor: z.string().default(defaultColors.surface),
            textColor: z.string().default(defaultColors.text),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'faqItem',
              componentId: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              props,
              message: 'Item FAQ adicionado',
            };
          },
        }),

        // ========== TOOL: ADICIONAR CTA SECTION ==========
        addCTASection: tool({
          description: 'Seção de chamada para ação final. Use no final da página com urgência.',
          inputSchema: z.object({
            headline: z.string().describe('Título persuasivo final'),
            subheadline: z.string().optional().describe('Subtítulo com urgência/escassez'),
            ctaText: z.string().describe('Texto do botão'),
            ctaLink: z.string().default('#pricing'),
            urgencyText: z.string().optional().describe('Texto de urgência (ex: "Últimas 10 vagas")'),
            backgroundColor: z.string().default(defaultColors.surface),
            textColor: z.string().default(defaultColors.text),
            ctaColor: z.string().default(defaultColors.accent),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'ctaSection',
              componentId: `cta-section-${Date.now()}`,
              props,
              message: 'Seção CTA adicionada',
            };
          },
        }),

        // ========== TOOL: ADICIONAR CTA BUTTON ==========
        addCTAButton: tool({
          description: 'Botão de call-to-action isolado.',
          inputSchema: z.object({
            text: z.string().describe('Texto do botão'),
            link: z.string().default('#'),
            variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
            size: z.enum(['small', 'medium', 'large']).default('large'),
            fullWidth: z.boolean().default(false),
            icon: z.string().optional().describe('Emoji antes do texto'),
            backgroundColor: z.string().default(defaultColors.accent),
            textColor: z.string().default('#ffffff'),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'ctaButton',
              componentId: `cta-${Date.now()}`,
              props,
              message: 'Botão CTA adicionado',
            };
          },
        }),

        // ========== TOOL: ADICIONAR FOOTER ==========
        addFooter: tool({
          description: 'Rodapé da página com links, redes sociais e copyright.',
          inputSchema: z.object({
            companyName: z.string().describe('Nome da empresa'),
            tagline: z.string().optional().describe('Slogan curto'),
            links: z.array(z.object({
              label: z.string(),
              href: z.string().default('#'),
            })).optional().describe('Links do rodapé'),
            socialLinks: z.array(z.object({
              platform: z.string(),
              url: z.string(),
              icon: z.string().optional(),
            })).optional().describe('Links de redes sociais'),
            copyrightYear: z.number().default(2025),
            backgroundColor: z.string().default(defaultColors.surface),
            textColor: z.string().default(defaultColors.textSecondary),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'footer',
              componentId: `footer-${Date.now()}`,
              props,
              message: 'Footer adicionado',
            };
          },
        }),

        // ========== TOOL: ADICIONAR TEXTO ==========
        addTextBlock: tool({
          description: 'Adiciona um bloco de texto. Use para títulos de seção ou descrições.',
          inputSchema: z.object({
            content: z.string().describe('Conteúdo do texto'),
            variant: z.enum(['heading', 'subheading', 'body', 'caption']).default('body'),
            textAlign: z.enum(['left', 'center', 'right']).default('center'),
            textColor: z.string().default(defaultColors.text),
            backgroundColor: z.string().default('transparent'),
            maxWidth: z.string().default('800px'),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'textBlock',
              componentId: `text-${Date.now()}`,
              props,
              message: 'Bloco de texto adicionado',
            };
          },
        }),

        // ========== TOOL: ADICIONAR DIVIDER ==========
        addDivider: tool({
          description: 'Separador visual entre seções.',
          inputSchema: z.object({
            style: z.enum(['solid', 'dashed', 'dotted', 'gradient', 'spacer']).default('gradient'),
            height: z.enum(['thin', 'medium', 'thick']).default('thin'),
            color: z.string().default(defaultColors.border),
            marginY: z.enum(['small', 'medium', 'large', 'xlarge']).default('large'),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'divider',
              componentId: `divider-${Date.now()}`,
              props,
              message: 'Divisor adicionado',
            };
          },
        }),

        // ========== TOOL: ADICIONAR GARANTIA ==========
        addGuarantee: tool({
          description: 'Seção de garantia para reduzir objeções. Use perto do pricing.',
          inputSchema: z.object({
            days: z.number().default(7).describe('Dias de garantia'),
            title: z.string().default('Garantia Incondicional'),
            description: z.string().describe('Descrição da garantia'),
            icon: z.string().default('🛡️'),
            backgroundColor: z.string().default(defaultColors.surface),
            textColor: z.string().default(defaultColors.text),
            accentColor: z.string().default(defaultColors.accent),
          }),
          execute: async (props) => {
            return {
              success: true,
              action: 'ADD_COMPONENT',
              componentType: 'guarantee',
              componentId: `guarantee-${Date.now()}`,
              props,
              message: 'Garantia adicionada',
            };
          },
        }),

        // ========== TOOL: REMOVER COMPONENTE ==========
        removeComponent: tool({
          description: 'Remove um componente pelo ID.',
          inputSchema: z.object({
            componentId: z.string().describe('ID do componente'),
          }),
          execute: async ({ componentId }) => {
            return {
              success: true,
              action: 'REMOVE_COMPONENT',
              componentId,
              message: `Componente ${componentId} removido`,
            };
          },
        }),

        // ========== TOOL: ATUALIZAR COMPONENTE ==========
        updateComponent: tool({
          description: 'Atualiza propriedades de um componente existente.',
          inputSchema: z.object({
            componentId: z.string().describe('ID do componente'),
            updates: z.record(z.string(), z.unknown()).describe('Propriedades a atualizar'),
          }),
          execute: async ({ componentId, updates }) => {
            return {
              success: true,
              action: 'UPDATE_COMPONENT',
              componentId,
              updates,
              message: `Componente ${componentId} atualizado`,
            };
          },
        }),

        // ========== TOOL: LIMPAR PÁGINA ==========
        clearPage: tool({
          description: 'Remove TODOS os componentes. Use com cuidado.',
          inputSchema: z.object({
            confirm: z.boolean().describe('Deve ser true'),
          }),
          execute: async ({ confirm }) => {
            if (!confirm) {
              return { success: false, message: 'Confirmação necessária' };
            }
            return {
              success: true,
              action: 'CLEAR_PAGE',
              message: 'Página limpa',
            };
          },
        }),
      },
      toolChoice: 'auto',
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro no processamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
