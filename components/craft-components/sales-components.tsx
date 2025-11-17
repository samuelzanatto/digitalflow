'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * PricingCard - Para tabelas de preço
 * Componente essencial em landing pages de vendas
 */
interface PricingCardProps {
  title?: string
  price?: string | number
  period?: string
  description?: string
  features?: string[]
  buttonText?: string
  buttonColor?: 'default' | 'primary' | 'secondary'
  isPopular?: boolean
  backgroundColor?: string
}

const PricingCardComponent = React.forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      title = 'Plan Name',
      price = '99',
      period = '/month',
      description = 'Plan description',
      features = ['Feature 1', 'Feature 2', 'Feature 3'],
      buttonText = 'Get Started',
      isPopular = false,
      backgroundColor = '#ffffff',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          minHeight: '400px',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          position: 'relative',
        }}
      >
        <Card
          style={{
            backgroundColor,
            border: isPopular ? '2px solid #7c3aed' : undefined,
            boxShadow: isPopular ? '0 20px 25px -5px rgba(124, 58, 237, 0.1)' : undefined,
            height: '100%',
          }}
        >
          {isPopular && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Badge variant="default">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold' }}>${price}</span>
              <span style={{ fontSize: '14px', color: '#666' }}>{period}</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul style={{ listStyle: 'none', padding: '0', marginBottom: '20px' }}>
              {features.map((feature, idx) => (
                <li key={idx} style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#7c3aed', marginRight: '8px' }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={isPopular ? 'default' : 'outline'}
              className="w-full"
              style={{ cursor: 'pointer' }}
            >
              {buttonText}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
)

PricingCardComponent.displayName = 'PricingCard'
export const PricingCard = PricingCardComponent

;(PricingCard as unknown as Record<string, unknown>).craft = {
  props: {
    title: 'Plan Name',
    price: '99',
    period: '/month',
    description: 'Plan description',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    buttonText: 'Get Started',
    buttonColor: 'default',
    isPopular: false,
    backgroundColor: '#ffffff',
  },
  displayName: 'Pricing Card',
}

/**
 * TestimonialCard - Para depoimentos e social proof
 * Componente crítico para aumentar conversão
 */
interface TestimonialCardProps {
  quote?: string
  author?: string
  role?: string
  company?: string
  avatar?: string
  rating?: number
  backgroundColor?: string
}

const TestimonialCardComponent = React.forwardRef<HTMLDivElement, TestimonialCardProps>(
  (
    {
      quote = 'This is an amazing product! Highly recommended.',
      author = 'John Doe',
      role = 'CEO',
      company = 'Company Inc',
      avatar = '👤',
      rating = 5,
      backgroundColor = '#f9fafb',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <Card style={{ backgroundColor }}>
          <CardContent style={{ paddingTop: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              {[...Array(rating)].map((_, i) => (
                <span key={i} style={{ color: '#fbbf24', marginRight: '4px' }}>
                  ★
                </span>
              ))}
            </div>
            <p style={{ fontSize: '16px', marginBottom: '20px', fontStyle: 'italic', lineHeight: '1.6' }}>
              &ldquo;{quote}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                {avatar}
              </div>
              <div>
                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>{author}</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  {role} at {company}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)

TestimonialCardComponent.displayName = 'TestimonialCard'
export const TestimonialCard = TestimonialCardComponent

;(TestimonialCard as unknown as Record<string, unknown>).craft = {
  props: {
    quote: 'This is an amazing product! Highly recommended.',
    author: 'John Doe',
    role: 'CEO',
    company: 'Company Inc',
    avatar: '👤',
    rating: 5,
    backgroundColor: '#f9fafb',
  },
  displayName: 'Testimonial Card',
}

/**
 * FeatureCard - Para showcasing features/benefits
 * Essencial para comunicar value proposition
 */
interface FeatureCardProps {
  icon?: string
  title?: string
  description?: string
  backgroundColor?: string
  iconBackgroundColor?: string
}

const FeatureCardComponent = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      icon = '⚡',
      title = 'Feature Title',
      description = 'Feature description goes here',
      backgroundColor = '#ffffff',
      iconBackgroundColor = '#e0e7ff',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <Card style={{ backgroundColor }}>
          <CardContent style={{ padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: iconBackgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 16px',
              }}
            >
              {icon}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>{description}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
)

FeatureCardComponent.displayName = 'FeatureCard'
export const FeatureCard = FeatureCardComponent

;(FeatureCard as unknown as Record<string, unknown>).craft = {
  props: {
    icon: '⚡',
    title: 'Feature Title',
    description: 'Feature description goes here',
    backgroundColor: '#ffffff',
    iconBackgroundColor: '#e0e7ff',
  },
  displayName: 'Feature Card',
}

/**
 * CaptureForm - Para lead capture/email signup
 * Um dos componentes MAIS críticos para conversão
 */
interface CaptureFormProps {
  title?: string
  subtitle?: string
  inputPlaceholder?: string
  buttonText?: string
  buttonColor?: string
  backgroundColor?: string
}

const CaptureFormComponent = React.forwardRef<HTMLDivElement, CaptureFormProps>(
  (
    {
      title = 'Get Started Today',
      subtitle = 'Join thousands of happy customers',
      inputPlaceholder = 'Enter your email',
      buttonText = 'Sign Up',
      buttonColor = '#7c3aed',
      backgroundColor = '#f3f4f6',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          backgroundColor,
          padding: '40px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>{subtitle}</p>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
          <input
            type="email"
            placeholder={inputPlaceholder}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            disabled
          />
          <button
            style={{
              backgroundColor: buttonColor,
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            disabled
          >
            {buttonText}
          </button>
        </div>
      </div>
    )
  }
)

CaptureFormComponent.displayName = 'CaptureForm'
export const CaptureForm = CaptureFormComponent

;(CaptureForm as unknown as Record<string, unknown>).craft = {
  props: {
    title: 'Get Started Today',
    subtitle: 'Join thousands of happy customers',
    inputPlaceholder: 'Enter your email',
    buttonText: 'Sign Up',
    buttonColor: '#7c3aed',
    backgroundColor: '#f3f4f6',
  },
  displayName: 'Capture Form',
}

/**
 * StatsCounter - Para mostrar social proof via numbers
 * Aumenta credibilidade e conversão
 */
interface StatsCounterProps {
  label?: string
  value?: string
  suffix?: string
  backgroundColor?: string
}

const StatsCounterComponent = React.forwardRef<HTMLDivElement, StatsCounterProps>(
  (
    {
      label = 'Happy Customers',
      value = '10K',
      suffix = '+',
      backgroundColor = '#f9fafb',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          backgroundColor,
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>
          {value}
          {suffix}
        </div>
        <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>{label}</p>
      </div>
    )
  }
)

StatsCounterComponent.displayName = 'StatsCounter'
export const StatsCounter = StatsCounterComponent

;(StatsCounter as unknown as Record<string, unknown>).craft = {
  props: {
    label: 'Happy Customers',
    value: '10K',
    suffix: '+',
    backgroundColor: '#f9fafb',
  },
  displayName: 'Stats Counter',
}

/**
 * FAQ Accordion - Para responder dúvidas comuns
 * Aumenta conversão reduzindo fricção
 */
interface FAQItemProps {
  question?: string
  answer?: string
  backgroundColor?: string
}

const FAQItemComponent = React.forwardRef<HTMLDivElement, FAQItemProps>(
  (
    {
      question = 'What is this product?',
      answer = 'This is a great product that solves your problems.',
      backgroundColor = '#ffffff',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          backgroundColor,
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '12px',
          borderTopColor: isSelected ? '#3b82f6' : '#e5e7eb',
          borderTopWidth: isSelected ? '2px' : '1px',
          cursor: 'move',
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {question}
          <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
        {isOpen && (
          <div style={{ padding: '0 16px 16px 16px', color: '#666', lineHeight: '1.6' }}>
            {answer}
          </div>
        )}
      </div>
    )
  }
)

FAQItemComponent.displayName = 'FAQItem'
export const FAQItem = FAQItemComponent

;(FAQItem as unknown as Record<string, unknown>).craft = {
  props: {
    question: 'What is this product?',
    answer: 'This is a great product that solves your problems.',
    backgroundColor: '#ffffff',
  },
  displayName: 'FAQ Item',
}

/**
 * TrustBadges - Para credibilidade (segurança, certificações, etc)
 * Pequeno mas impactante para conversão
 */
interface TrustBadgesProps {
  badges?: string[]
  backgroundColor?: string
}

const TrustBadgesComponent = React.forwardRef<HTMLDivElement, TrustBadgesProps>(
  (
    {
      badges = ['🔒 SSL Secured', '✓ Money-Back Guarantee', '⭐ 4.9/5 Rating'],
      backgroundColor = '#f9fafb',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          backgroundColor,
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          {badges.map((badge, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                fontWeight: '500',
                color: '#333',
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    )
  }
)

TrustBadgesComponent.displayName = 'TrustBadges'
export const TrustBadges = TrustBadgesComponent

;(TrustBadges as unknown as Record<string, unknown>).craft = {
  props: {
    badges: ['🔒 SSL Secured', '✓ Money-Back Guarantee', '⭐ 4.9/5 Rating'],
    backgroundColor: '#f9fafb',
  },
  displayName: 'Trust Badges',
}

/**
 * ImageComponent - Para exibir imagens responsivas
 * Essencial para fotografias de produtos, screenshots, etc
 */
interface ImageComponentProps {
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'
  borderRadius?: number
  caption?: string
  captionPosition?: 'bottom' | 'top'
  showBorder?: boolean
  borderColor?: string
  borderWidth?: number
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: string | number
}

const ImageComponentInner = React.forwardRef<HTMLDivElement, ImageComponentProps>(
  (
    {
      src = 'https://via.placeholder.com/600x400?text=Image',
      alt = 'Image',
      width = '100%',
      height = '400px',
      objectFit = 'cover',
      borderRadius = 12,
      caption = '',
      captionPosition = 'bottom',
      showBorder = false,
      borderColor = '#e5e7eb',
      borderWidth = 1,
      shadow = 'md',
      maxWidth = '100%',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    const shadowStyles: Record<string, string> = {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    }

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          display: 'flex',
          flexDirection: 'column',
          gap: caption ? '12px' : '0',
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
        }}
      >
        {caption && captionPosition === 'top' && (
          <p
            style={{
              margin: '0',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {caption}
          </p>
        )}

        <div
          style={{
            position: 'relative',
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius: `${borderRadius}px`,
            overflow: 'hidden',
            border: showBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
            boxShadow: shadowStyles[shadow],
            backgroundColor: '#f0f0f0',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              objectPosition: 'center',
              display: 'block',
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.style.display = 'none'
            }}
          />
          {/* Placeholder quando não consegue carregar a imagem */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              color: '#999',
              fontSize: '14px',
              zIndex: -1,
            }}
          >
            [Imagem não carregou]
          </div>
        </div>

        {caption && captionPosition === 'bottom' && (
          <p
            style={{
              margin: '0',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {caption}
          </p>
        )}
      </div>
    )
  }
)

ImageComponentInner.displayName = 'ImageComponent'
export const ImageComponent = ImageComponentInner

;(ImageComponent as unknown as Record<string, unknown>).craft = {
  props: {
    src: 'https://via.placeholder.com/600x400?text=Image',
    alt: 'Image',
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    borderRadius: 12,
    caption: '',
    captionPosition: 'bottom',
    showBorder: false,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    shadow: 'md',
    maxWidth: '100%',
  },
  displayName: 'Imagem',
}

/**
 * VSL (Video Sales Letter) Component
 * Player totalmente personalizável com suporte a YouTube e vídeo local
 */
interface VSLProps {
  videoSource?: 'youtube' | 'upload'
  youtubeUrl?: string
  videoUrl?: string
  width?: string | number
  height?: number
  aspectRatio?: string
  autoplay?: boolean
  controls?: boolean
  muted?: boolean
  loop?: boolean
  borderRadius?: number
  backgroundColor?: string
  playButtonColor?: string
  playButtonSize?: number
  showThumbnail?: boolean
  thumbnailUrl?: string
  padding?: number
  paddingTop?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
  playerWidth?: number
}

const VSLComponent = React.forwardRef<HTMLDivElement, VSLProps>(
  (
    {
      videoSource = 'youtube',
      youtubeUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      videoUrl = '',
      width = '100%',
      height = 500,
      aspectRatio = '16 / 9',
      autoplay = false,
      controls = true,
      muted = false,
      loop = false,
      borderRadius = 12,
      backgroundColor = '#000000',
      playButtonColor = '#ff0000',
      playButtonSize = 80,
      showThumbnail = true,
      thumbnailUrl = '',
      padding = 20,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      playerWidth = 960,
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))
    const [showPlayer, setShowPlayer] = React.useState(!showThumbnail || !thumbnailUrl)
    const videoRef = React.useRef<HTMLVideoElement>(null)

    // Extract YouTube video ID from URL
    const getYoutubeEmbedUrl = (url: string) => {
      if (url.includes('youtube.com/embed/')) return url
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
      return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url
    }

    const handlePlayClick = () => {
      setShowPlayer(true)
      if (videoRef.current && videoSource === 'upload') {
        videoRef.current.play()
      }
    }

    const displayWidth = typeof width === 'number' ? `${width}px` : width
    const maxPlayerWidth = playerWidth ? `${playerWidth}px` : '100%'
    const resolvedHeight = typeof height === 'number' ? `${height}px` : height

    const resolvedPaddingTop = paddingTop ?? padding ?? 20
    const resolvedPaddingBottom = paddingBottom ?? padding ?? 20
    const resolvedPaddingLeft = paddingLeft ?? padding ?? 20
    const resolvedPaddingRight = paddingRight ?? padding ?? 20

    return (
      <div
        ref={(el) => {
          if (el) {
            connect(drag(el))
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }
        }}
        style={{
          padding: `${resolvedPaddingTop}px ${resolvedPaddingRight}px ${resolvedPaddingBottom}px ${resolvedPaddingLeft}px`,
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          boxSizing: 'border-box' as const,
          width: displayWidth,
          maxWidth: maxPlayerWidth,
          margin: '0 auto',
        }}
        className="w-full"
      >
        {/* Container com aspect ratio mantido */}
        <div
          style={{
            width: '100%',
            aspectRatio: aspectRatio,
            minHeight: resolvedHeight ?? undefined,
            borderRadius: `${borderRadius}px`,
            overflow: 'hidden',
            backgroundColor,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: backgroundColor,
          }}
        >
          {/* Thumbnail with play button */}
          {showThumbnail && thumbnailUrl && !showPlayer && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={handlePlayClick}
            >
              {/* Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              {/* Play button */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: `${playButtonSize}px`,
                  height: `${playButtonSize}px`,
                  borderRadius: '50%',
                  backgroundColor: playButtonColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${playButtonSize * 0.4}px solid white`,
                    borderTop: `${playButtonSize * 0.25}px solid transparent`,
                    borderBottom: `${playButtonSize * 0.25}px solid transparent`,
                    marginLeft: `${playButtonSize * 0.1}px`,
                  }}
                />
              </div>
            </div>
          )}

          {/* YouTube embed */}
          {showPlayer && videoSource === 'youtube' && (
            <iframe
              width="100%"
              height="100%"
              src={`${getYoutubeEmbedUrl(youtubeUrl)}?autoplay=${autoplay ? 1 : 0}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          )}

          {/* Upload video player */}
          {showPlayer && videoSource === 'upload' && videoUrl && (
            <video
              ref={videoRef}
              width="100%"
              height="100%"
              style={{ objectFit: 'contain' }}
              autoPlay={autoplay}
              controls={controls}
              muted={muted}
              loop={loop}
            >
              <source src={videoUrl} type="video/mp4" />
              Seu navegador não suporta reprodução de vídeo
            </video>
          )}

          {/* Fallback no video message */}
          {showPlayer && !youtubeUrl && !videoUrl && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#999',
                fontSize: '16px',
              }}
            >
              Nenhum vídeo configurado
            </div>
          )}
        </div>
      </div>
    )
  }
)

VSLComponent.displayName = 'VSL'
export const VSL = VSLComponent

;(VSL as unknown as Record<string, unknown>).craft = {
  props: {
    videoSource: 'youtube',
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoUrl: '',
    width: '100%',
    height: 500,
    aspectRatio: '16 / 9',
    autoplay: false,
    controls: true,
    muted: false,
    loop: false,
    borderRadius: 12,
    backgroundColor: '#000000',
    playButtonColor: '#ff0000',
    playButtonSize: 80,
    showThumbnail: true,
    thumbnailUrl: '',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    playerWidth: 960,
  },
  displayName: 'VSL (Vídeo)',
  related: {
    toolbar: [],
  },
}
