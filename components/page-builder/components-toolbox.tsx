'use client'

import React from 'react'
import { Element, useEditor } from '@craftjs/core'
import { Card } from '@/components/ui/card'
import { 
  Layers,
  Type,
  Square,
  Zap,
  Minus,
  Image as ImageIcon,
  DollarSign,
  MessageSquare,
  Lightbulb,
  Video,
  TrendingUp,
  HelpCircle,
  Shield,
} from 'lucide-react'
import { 
  Container, 
  TextBlock, 
  HeroSection, 
  CTAButton, 
  Divider,
  Footer, 
  PricingCard,
  TestimonialCard,
  FeatureCard,
  CaptureForm,
  StatsCounter,
  FAQItem,
  TrustBadges,
  ImageComponent,
  VSL,
} from '@/components/craft-components'

interface ComponentItem {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
}

const COMPONENTS: ComponentItem[] = [
  {
    id: 'hero-section',
    name: 'Hero Section',
    icon: <ImageIcon className="w-5 h-5" />,
    description: 'Seção principal da página',
    component: HeroSection,
  },
  {
    id: 'text-block',
    name: 'Bloco de Texto',
    icon: <Type className="w-5 h-5" />,
    description: 'Texto editável',
    component: TextBlock,
  },
  {
    id: 'cta-button',
    name: 'Botão CTA',
    icon: <Zap className="w-5 h-5" />,
    description: 'Botão de chamada para ação',
    component: CTAButton,
  },
  {
    id: 'container',
    name: 'Container',
    icon: <Square className="w-5 h-5" />,
    description: 'Agrupar elementos',
    component: Container,
  },
  {
    id: 'divider',
    name: 'Divisor',
    icon: <Minus className="w-5 h-5" />,
    description: 'Linha divisória',
    component: Divider,
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: <Layers className="w-5 h-5" />,
    description: 'Rodapé da página',
    component: Footer,
  },
  {
    id: 'pricing-card',
    name: 'Pricing Card',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Cartão de preço',
    component: PricingCard,
  },
  {
    id: 'testimonial-card',
    name: 'Depoimento',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Cartão de depoimento/review',
    component: TestimonialCard,
  },
  {
    id: 'feature-card',
    name: 'Feature Card',
    icon: <Lightbulb className="w-5 h-5" />,
    description: 'Cartão de recurso/benefício',
    component: FeatureCard,
  },
  {
    id: 'capture-form',
    name: 'Formulário de Captura',
    icon: <Zap className="w-5 h-5" />,
    description: 'Email capture com CTA',
    component: CaptureForm,
  },
  {
    id: 'stats-counter',
    name: 'Estatísticas',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Exibe números de credibilidade',
    component: StatsCounter,
  },
  {
    id: 'faq-item',
    name: 'FAQ',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Perguntas frequentes',
    component: FAQItem,
  },
  {
    id: 'trust-badges',
    name: 'Trust Badges',
    icon: <Shield className="w-5 h-5" />,
    description: 'Ícones de segurança/certificações',
    component: TrustBadges,
  },
  {
    id: 'image-component',
    name: 'Imagem',
    icon: <ImageIcon className="w-5 h-5" />,
    description: 'Imagem responsiva com caption',
    component: ImageComponent,
  },
  {
    id: 'vsl',
    name: 'VSL (Vídeo)',
    icon: <Video className="w-5 h-5" />,
    description: 'Video Sales Letter com player personalizável',
    component: VSL,
  },
]

export function ComponentsToolbox() {
  const { actions, query } = useEditor()

  const buildComponentElement = (componentId: string): React.ReactElement | null => {
    switch (componentId) {
      case 'hero-section':
        return (
          <HeroSection
            title="Novo Hero"
            subtitle="Subtítulo"
            backgroundColor="#f0f9ff"
          />
        )
      case 'text-block':
        return <TextBlock content="Novo texto" fontSize={16} color="#000000" />
      case 'cta-button':
        return <CTAButton text="Clique aqui" link="#" backgroundColor="#0070f3" />
      case 'container':
        return (
          <Element is={Container} canvas backgroundColor="#ffffff" paddingTop={20} paddingBottom={20} paddingLeft={20} paddingRight={20} />
        )
      case 'divider':
        return <Divider height={2} color="#e0e0e0" margin={20} />
      case 'footer':
        return (
          <Footer
            brandName="DigitalFlow"
            brandDescription="Transformando ideias em experiências digitais"
            link1="Home"
            link2="Sobre"
            link3="Contato"
            copyrightText="© 2025 DigitalFlow. Todos os direitos reservados."
          />
        )
      case 'pricing-card':
        return (
          <PricingCard
            title="Plano Premium"
            price="99"
            period="/mês"
            description="Melhor para empresas"
            features={['Recurso 1', 'Recurso 2', 'Recurso 3']}
            buttonText="Começar"
          />
        )
      case 'testimonial-card':
        return (
          <TestimonialCard
            quote="Produto excelente, recomendo!"
            author="João Silva"
            role="CEO"
            company="Tech Company"
            rating={5}
          />
        )
      case 'feature-card':
        return (
          <FeatureCard
            icon="⚡"
            title="Rápido e Eficiente"
            description="Descrição do recurso"
          />
        )
      case 'capture-form':
        return (
          <CaptureForm
            title="Comece Hoje"
            subtitle="Inscreva-se agora"
            inputPlaceholder="seu@email.com"
            buttonText="Inscrever"
          />
        )
      case 'stats-counter':
        return (
          <StatsCounter
            label="Clientes Satisfeitos"
            value="5K"
            suffix="+"
          />
        )
      case 'faq-item':
        return (
          <FAQItem
            question="Como começar?"
            answer="Siga os passos na documentação..."
          />
        )
      case 'trust-badges':
        return (
          <TrustBadges
            badges={['🔒 Seguro', '✓ Garantia', '⭐ Avaliado']}
          />
        )
      case 'image-component':
        return (
          <ImageComponent
            src="https://via.placeholder.com/600x400?text=Imagem"
            alt="Imagem de exemplo"
            width="100%"
            height="300px"
            borderRadius={12}
            shadow="md"
          />
        )
      case 'vsl':
        return (
          <VSL
            videoSource="youtube"
            youtubeUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
            width="100%"
            height={500}
            autoplay={false}
            controls={true}
            borderRadius={12}
            backgroundColor="#000000"
            playButtonColor="#ff0000"
            playButtonSize={80}
            showThumbnail={false}
            videoUrl=""
          />
        )
      default:
        return null
    }
  }

  const addComponentToFrame = (componentId: string) => {
    try {
      // Obter todos os nós do editor
      const allNodes = query.getNodes()
      const nodesList = Object.entries(allNodes)
      
      // Encontrar o nó raiz (nó sem parent, que é o Frame)
      let parentId: string | null = null
      for (const [nodeId, node] of nodesList) {
        const n = node as Record<string, unknown>
        const parent = n.parent
        // Se não tem parent ou parent é vazio, é o nó raiz
        if (!parent) {
          parentId = nodeId
          break
        }
      }

      if (!parentId) {
        console.error('Nó raiz não encontrado no editor')
        return
      }

      const element = buildComponentElement(componentId)
      if (!element) return

      // Usar o ID do nó raiz como parent
      const nodeTree = query.parseReactElement(element).toNodeTree()
      if (nodeTree) {
        actions.addNodeTree(nodeTree, parentId)
      }
    } catch (error) {
      console.error('Erro ao adicionar componente:', error)
    }
  }

  return (
    <div className="h-full flex flex-col border-r bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background sticky top-0">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Componentes
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Arraste para adicionar</p>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {COMPONENTS.map((component) => {
            const element = buildComponentElement(component.id)
            if (!element) return null
            return (
              <ComponentCard
                key={component.id}
                component={component}
                componentElement={element}
                onClick={() => addComponentToFrame(component.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface ComponentCardProps {
  component: ComponentItem
  componentElement: React.ReactElement
  onClick: () => void
}

function ComponentCard({ component, componentElement, onClick }: ComponentCardProps) {
  const { connectors } = useEditor()

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connectors.create(ref, componentElement)
        }
      }}
      onClick={onClick}
      className="block"
    >
      <Card className="p-3 cursor-move hover:bg-accent transition-colors group active:opacity-50">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {component.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{component.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {component.description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
