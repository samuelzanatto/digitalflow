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
 * VideoSection - Para embedar VSL ou product demo
 * Essencial para páginas de vendas com video
 */
interface VideoSectionProps {
  title?: string
  subtitle?: string
  videoUrl?: string
  aspectRatio?: 'video' | 'square'
  backgroundColor?: string
}

const VideoSectionComponent = React.forwardRef<HTMLDivElement, VideoSectionProps>(
  (
    {
      title = 'Watch Our Demo',
      subtitle = 'See how we can help you',
      aspectRatio = 'video',
      backgroundColor = '#ffffff',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    const paddingBottom = aspectRatio === 'video' ? '56.25%' : '100%'

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
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h2>
          <p style={{ fontSize: '16px', color: '#666' }}>{subtitle}</p>
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom,
            height: '0',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '14px',
              }}
            >
              [Video Player Placeholder]
            </div>
          </div>
        </div>
      </div>
    )
  }
)

VideoSectionComponent.displayName = 'VideoSection'
export const VideoSection = VideoSectionComponent

;(VideoSection as unknown as Record<string, unknown>).craft = {
  props: {
    title: 'Watch Our Demo',
    subtitle: 'See how we can help you',
    aspectRatio: 'video',
    backgroundColor: '#ffffff',
  },
  displayName: 'Video Section',
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
