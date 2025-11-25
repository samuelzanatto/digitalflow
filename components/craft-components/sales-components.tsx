'use client'

import React from 'react'
import Image from 'next/image'
import { useNode, useEditor } from '@craftjs/core'
import { Card, CardContent } from '@/components/ui/card'
import { useEditorViewport } from '@/lib/responsive-props'
import { ResponsiveProp } from '@/contexts/viewport-context'

/**
 * PricingCard - Para tabelas de preço
 * Componente essencial em landing pages de vendas
 * Suporta dois modos: plano (com features) e preço único
 */
interface PricingCardProps {
  mode?: 'plan' | 'single'
  title?: string
  price?: string | number
  period?: string
  description?: string
  features?: string[]
  buttonText?: string
  isPopular?: boolean
  
  // Dimensões
  width?: string | number
  height?: string | number
  cardFullWidth?: boolean
  cardAutoHeight?: boolean
  
  // Desconto (modo single)
  originalPrice?: string | number
  discountPercentage?: number
  showDiscount?: boolean
  
  // Personalizações de texto
  titleFontSize?: number
  titleFontWeight?: 'normal' | 'bold' | '600' | '700'
  titleColor?: string
  titleAlignment?: 'left' | 'center' | 'right'
  
  descriptionFontSize?: number
  descriptionColor?: string
  descriptionAlignment?: 'left' | 'center' | 'right'
  
  priceFontSize?: number
  priceColor?: string
  priceAlignment?: 'left' | 'center' | 'right' | 'column' | 'column-reverse'
  
  periodFontSize?: number
  periodColor?: string
  
  originalPriceFontSize?: number
  originalPriceColor?: string
  
  discountPercentageFontSize?: number
  discountPercentageColor?: string
  discountPercentageBackgroundColor?: string
  
  featuresFontSize?: number
  featuresColor?: string
  featuresCheckColor?: string
  
  // Personalização de cores e espaçamento
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  
  // CTA Button
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonBorderRadius?: number
  buttonPadding?: number
  buttonFontSize?: number
}

const PricingCardComponent = React.forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      mode = 'plan',
      title = 'Plan Name',
      price = '99',
      period = '/month',
      description = 'Plan description',
      features = ['Feature 1', 'Feature 2', 'Feature 3'],
      buttonText = 'Get Started',
      isPopular = false,
      
      width = '100%',
      height = 'auto',
      
      originalPrice = '149',
      discountPercentage = 33,
      showDiscount = false,
      
      titleFontSize = 24,
      titleFontWeight = 'bold',
      titleColor = '#000000',
      titleAlignment = 'center',
      
      descriptionFontSize = 14,
      descriptionColor = '#666666',
      descriptionAlignment = 'center',
      
      priceFontSize = 48,
      priceColor = '#000000',
      priceAlignment = 'center',
      
      periodFontSize = 14,
      periodColor = '#666666',
      
      originalPriceFontSize = 16,
      originalPriceColor = '#999999',
      
      discountPercentageFontSize = 14,
      discountPercentageColor = '#ffffff',
      discountPercentageBackgroundColor = '#ef4444',
      
      featuresFontSize = 14,
      featuresColor = '#333333',
      featuresCheckColor = '#7c3aed',
      
      backgroundColor = '#ffffff',
      borderColor = '#e5e7eb',
      borderWidth = 1,
      borderRadius = 8,
      padding = 24,
      
      buttonBackgroundColor = '#7c3aed',
      buttonTextColor = '#ffffff',
      buttonBorderRadius = 6,
      buttonPadding = 12,
      buttonFontSize = 14,
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    const cardStyle: React.CSSProperties = {
      backgroundColor,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: `${borderRadius}px`,
      padding: `${padding}px`,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      boxShadow: isPopular ? '0 20px 25px -5px rgba(124, 58, 237, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }

    const titleStyle: React.CSSProperties = {
      fontSize: `${titleFontSize}px`,
      fontWeight: titleFontWeight as React.CSSProperties['fontWeight'],
      color: titleColor,
      textAlign: titleAlignment as React.CSSProperties['textAlign'],
      margin: '0 0 12px 0',
    }

    const descriptionStyle: React.CSSProperties = {
      fontSize: `${descriptionFontSize}px`,
      color: descriptionColor,
      textAlign: descriptionAlignment as React.CSSProperties['textAlign'],
      margin: '0 0 20px 0',
      lineHeight: '1.5',
    }

    const getPriceFlexDirection = () => {
      if (priceAlignment === 'column') return 'column' as const
      if (priceAlignment === 'column-reverse') return 'column-reverse' as const
      return 'row' as const
    }

    const getPriceJustify = () => {
      if (priceAlignment === 'column' || priceAlignment === 'column-reverse') return 'center'
      if (priceAlignment === 'center') return 'center'
      if (priceAlignment === 'right') return 'flex-end'
      return 'flex-start'
    }

    const priceContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: getPriceFlexDirection(),
      alignItems: 'center',
      justifyContent: getPriceJustify(),
      gap: '8px',
      margin: '20px 0',
      flexWrap: 'wrap',
    }

    const priceStyle: React.CSSProperties = {
      fontSize: `${priceFontSize}px`,
      fontWeight: 'bold',
      color: priceColor,
    }

    const periodStyle: React.CSSProperties = {
      fontSize: `${periodFontSize}px`,
      color: periodColor,
    }

    const originalPriceStyle: React.CSSProperties = {
      fontSize: `${originalPriceFontSize}px`,
      color: originalPriceColor,
      textDecoration: 'line-through',
      marginRight: '8px',
    }

    const discountBadgeStyle: React.CSSProperties = {
      backgroundColor: discountPercentageBackgroundColor,
      color: discountPercentageColor,
      fontSize: `${discountPercentageFontSize}px`,
      padding: '4px 8px',
      borderRadius: '4px',
      fontWeight: '600',
      marginLeft: '8px',
    }

    const buttonStyle: React.CSSProperties = {
      backgroundColor: buttonBackgroundColor,
      color: buttonTextColor,
      border: 'none',
      borderRadius: `${buttonBorderRadius}px`,
      padding: `${buttonPadding}px ${buttonPadding * 2}px`,
      fontSize: `${buttonFontSize}px`,
      fontWeight: '500',
      cursor: 'pointer',
      width: '100%',
      transition: 'all 0.3s ease',
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
          position: 'relative',
          minHeight: mode === 'plan' ? '500px' : '350px',
        }}
      >
        {isPopular && (
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#7c3aed',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              zIndex: 10,
            }}
          >
            Mais Popular
          </div>
        )}

        <div style={cardStyle}>
          {/* Header */}
          <div>
            <h3 style={titleStyle}>{title}</h3>
            {description && <p style={descriptionStyle}>{description}</p>}

            {/* Preço */}
            <div style={priceContainerStyle}>
              {/* Preço original com desconto (modo single) */}
              {mode === 'single' && showDiscount && originalPrice && (
                <span style={originalPriceStyle}>${originalPrice}</span>
              )}
              
              <span style={priceStyle}>${price}</span>
              
              {/* Badge de desconto (modo single) */}
              {mode === 'single' && showDiscount && discountPercentage && (
                <span style={discountBadgeStyle}>{discountPercentage}% OFF</span>
              )}
              
              {mode === 'plan' && period && <span style={periodStyle}>{period}</span>}
            </div>
          </div>

          {/* Features (modo plano) */}
          {mode === 'plan' && features.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                padding: '0',
                margin: '20px 0',
                flex: 1,
              }}
            >
              {features.map((feature, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: `${featuresFontSize}px`,
                    color: featuresColor,
                  }}
                >
                  <span
                    style={{
                      color: featuresCheckColor,
                      marginRight: '12px',
                      fontWeight: 'bold',
                      fontSize: '18px',
                    }}
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Botão CTA */}
          <button style={buttonStyle} onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
          }} onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}>
            {buttonText}
          </button>
        </div>
      </div>
    )
  }
)

PricingCardComponent.displayName = 'PricingCard'
export const PricingCard = PricingCardComponent

;(PricingCard as unknown as Record<string, unknown>).craft = {
  props: {
    mode: 'plan',
    title: 'Plan Name',
    price: '99',
    period: '/month',
    description: 'Plan description',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    buttonText: 'Get Started',
    isPopular: false,
    
    width: '100%',
    height: 'auto',
    cardFullWidth: false,
    cardAutoHeight: true,
    
    originalPrice: '149',
    discountPercentage: 33,
    showDiscount: false,
    
    titleFontSize: 24,
    titleFontWeight: 'bold',
    titleColor: '#000000',
    titleAlignment: 'center',
    
    descriptionFontSize: 14,
    descriptionColor: '#666666',
    descriptionAlignment: 'center',
    
    priceFontSize: 48,
    priceColor: '#000000',
    priceAlignment: 'center',
    
    periodFontSize: 14,
    periodColor: '#666666',
    
    originalPriceFontSize: 16,
    originalPriceColor: '#999999',
    
    discountPercentageFontSize: 14,
    discountPercentageColor: '#ffffff',
    discountPercentageBackgroundColor: '#ef4444',
    
    featuresFontSize: 14,
    featuresColor: '#333333',
    featuresCheckColor: '#7c3aed',
    
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    
    buttonBackgroundColor: '#7c3aed',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: 6,
    buttonPadding: 12,
    buttonFontSize: 14,
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
  
  // Dimensões
  width?: string | number
  height?: string | number
  cardFullWidth?: boolean
  cardAutoHeight?: boolean
  
  // Personalizações de texto
  titleFontSize?: number
  titleColor?: string
  descriptionFontSize?: number
  descriptionColor?: string
  iconFontSize?: number
}

const FeatureCardComponent = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      icon = '⚡',
      title = 'Feature Title',
      description = 'Feature description goes here',
      backgroundColor = '#ffffff',
      iconBackgroundColor = '#e0e7ff',
      width = '100%',
      height = 'auto',
      cardFullWidth = false,
      cardAutoHeight = true,
      titleFontSize = 18,
      titleColor = '#000000',
      descriptionFontSize = 14,
      descriptionColor = '#666666',
      iconFontSize = 28,
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    // Helper para renderizar quebras de linha
    const renderTextWithLineBreaks = (text: string) => {
      return text.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))
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
          width: cardFullWidth ? '100%' : (typeof width === 'number' ? `${width}px` : width),
          height: cardAutoHeight ? 'auto' : (typeof height === 'number' ? `${height}px` : height),
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
                fontSize: `${iconFontSize}px`,
                margin: '0 auto 16px',
              }}
            >
              {icon}
            </div>
            <h3 style={{ fontSize: `${titleFontSize}px`, fontWeight: 'bold', marginBottom: '8px', color: titleColor, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderTextWithLineBreaks(title)}
            </h3>
            <p style={{ fontSize: `${descriptionFontSize}px`, color: descriptionColor, lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderTextWithLineBreaks(description)}
            </p>
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
    width: 300,
    height: 'auto',
    cardFullWidth: false,
    cardAutoHeight: true,
    titleFontSize: 18,
    titleColor: '#000000',
    descriptionFontSize: 14,
    descriptionColor: '#666666',
    iconFontSize: 28,
  },
  displayName: 'Feature Card',
}

/**
 * CaptureForm - Para lead capture/email signup
 * Um dos componentes MAIS críticos para conversão
 * Versão 2: Com suporte a múltiplos inputs, tipos customizáveis, sliders de width/height
 */
interface InputFieldConfig {
  id: string
  type: 'email' | 'text' | 'number' | 'phone'
  label: string
  placeholder: string
  placeholderColor: string
  borderRadius: number
  borderColor: string
  borderWidth: number
}

interface CaptureFormProps {
  title?: string
  subtitle?: string
  buttonText?: string
  buttonColor?: string
  backgroundColor?: string
  width?: ResponsiveProp<string | number>
  height?: ResponsiveProp<string | number>
  fullWidth?: boolean
  formContainerBorderRadius?: number
  formContainerBorderWidth?: number
  formContainerBorderColor?: string
  formPaddingTop?: ResponsiveProp<number>
  formPaddingBottom?: ResponsiveProp<number>
  formPaddingLeft?: ResponsiveProp<number>
  formPaddingRight?: ResponsiveProp<number>
  inputsDirection?: ResponsiveProp<'column' | 'row'>
  inputGap?: ResponsiveProp<number>
  inputFields?: InputFieldConfig[]
  titleFontSize?: ResponsiveProp<number>
  titleColor?: string
  subtitleFontSize?: ResponsiveProp<number>
  subtitleColor?: string
  buttonBorderRadius?: number
  buttonPadding?: number
  buttonFontSize?: number
  textColor?: string
  inputPlaceholderColor?: string
}

const CaptureFormComponent = React.forwardRef<HTMLDivElement, CaptureFormProps>(
  (
    {
      title = 'Get Started Today',
      subtitle = 'Join thousands of happy customers',
      buttonText = 'Sign Up',
      buttonColor = '#7c3aed',
      backgroundColor = '#f3f4f6',
      width = '100%',
      height = 'auto',
      fullWidth = true,
      formContainerBorderRadius = 12,
      formContainerBorderWidth = 1,
      formContainerBorderColor = '#d1d5db',
      formPaddingTop = 40,
      formPaddingBottom = 40,
      formPaddingLeft = 20,
      formPaddingRight = 20,
      inputsDirection = 'column',
      inputGap = 12,
      inputFields = [
        {
          id: '1',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          placeholderColor: '#9ca3af',
          borderRadius: 6,
          borderColor: '#d1d5db',
          borderWidth: 1,
        },
      ],
      inputPlaceholderColor = '#9ca3af',
      titleFontSize = 28,
      titleColor = '#000000',
      subtitleFontSize = 16,
      subtitleColor = '#666666',
      buttonBorderRadius = 6,
      buttonPadding = 12,
      buttonFontSize = 14,
      textColor = '#ffffff',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))
    const { enabled: isEditorEnabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }))
    const { resolveResponsiveProp } = useEditorViewport()

    // Resolver todas as props responsivas
    const paddingTopValue = resolveResponsiveProp(formPaddingTop, 40)
    const paddingBottomValue = resolveResponsiveProp(formPaddingBottom, 40)
    const paddingLeftValue = resolveResponsiveProp(formPaddingLeft, 20)
    const paddingRightValue = resolveResponsiveProp(formPaddingRight, 20)
    const resolvedInputsDirection = resolveResponsiveProp(inputsDirection, 'column')
    const resolvedInputGap = resolveResponsiveProp(inputGap, 12)
    const resolvedTitleFontSize = resolveResponsiveProp(titleFontSize, 28)
    const resolvedSubtitleFontSize = resolveResponsiveProp(subtitleFontSize, 16)
    
    // Para width, tratar número e string separadamente
    const rawWidth = width ?? '100%'
    const resolvedWidth = typeof rawWidth === 'number' 
      ? rawWidth 
      : resolveResponsiveProp(rawWidth, '100%')
    
    // Para height, precisamos tratar string 'auto' e números separadamente
    const rawHeight = height ?? 'auto'
    const resolvedHeight = typeof rawHeight === 'number' 
      ? rawHeight 
      : (rawHeight === 'auto' ? 'auto' : resolveResponsiveProp(rawHeight, 'auto'))

    // Calcular width e height finais
    // Width: fullWidth força 100%, senão usa o valor resolvido
    const computedWidth: React.CSSProperties['width'] = fullWidth 
      ? '100%' 
      : (typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth)
    
    // Height: se for número > 0, usa px; se for 0 ou 'auto', usa auto
    const computedHeight: React.CSSProperties['height'] = typeof resolvedHeight === 'number' 
      ? (resolvedHeight > 0 ? `${resolvedHeight}px` : 'auto')
      : resolvedHeight
    
    // MinHeight: só aplica se for número > 0
    const computedMinHeight: React.CSSProperties['minHeight'] = typeof resolvedHeight === 'number' && resolvedHeight > 0
      ? `${resolvedHeight}px`
      : undefined

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
          width: computedWidth,
          maxWidth: '100%',
          height: computedHeight,
          minHeight: computedMinHeight,
          backgroundColor,
          padding: `${paddingTopValue}px ${paddingRightValue}px ${paddingBottomValue}px ${paddingLeftValue}px`,
          borderRadius: `${formContainerBorderRadius}px`,
          border: `${formContainerBorderWidth}px solid ${formContainerBorderColor}`,
          textAlign: 'center',
          outline: isSelected ? '2px solid #3b82f6' : 'none',
          outlineOffset: isSelected ? '2px' : '0px',
          cursor: 'move',
          boxSizing: 'border-box' as const,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        {/* Título */}
        <div>
          <h2 style={{
            fontSize: `${resolvedTitleFontSize}px`,
            fontWeight: 'bold',
            marginBottom: '8px',
            color: titleColor,
            margin: 0,
            wordWrap: 'break-word',
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{
              fontSize: `${resolvedSubtitleFontSize}px`,
              color: subtitleColor,
              margin: '8px 0 0 0',
              wordWrap: 'break-word',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Formulário com inputs */}
        <div style={{
          display: 'flex',
          flexDirection: resolvedInputsDirection,
          gap: `${resolvedInputGap}px`,
          width: '100%',
        }}>
          {inputFields && inputFields.map((field) => (
            <div key={field.id} style={{ flex: resolvedInputsDirection === 'row' ? 1 : undefined, width: resolvedInputsDirection === 'column' ? '100%' : 'auto', minWidth: 0 }}>
              {field.label && (
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '4px',
                  color: titleColor,
                  textAlign: 'left',
                }}>
                  {field.label}
                </label>
              )}
              <input
                type={field.type === 'phone' ? 'tel' : field.type}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: `${field.borderRadius}px`,
                  border: `${field.borderWidth}px solid ${field.borderColor}`,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box' as const,
                  '--placeholder-color': field.placeholderColor || inputPlaceholderColor || '#9ca3af',
                  pointerEvents: isEditorEnabled ? 'none' : 'auto',
                } as React.CSSProperties}
                className="capture-form-input"
                disabled={isEditorEnabled}
              />
            </div>
          ))}

          {/* Botão */}
          <button
            type={isEditorEnabled ? 'button' : 'submit'}
            style={{
              backgroundColor: buttonColor,
              color: textColor,
              padding: `${buttonPadding}px 24px`,
              borderRadius: `${buttonBorderRadius}px`,
              border: 'none',
              fontWeight: 'bold',
              fontSize: `${buttonFontSize}px`,
              cursor: isEditorEnabled ? 'default' : 'pointer',
              width: resolvedInputsDirection === 'row' ? 'auto' : '100%',
              minHeight: '44px',
              flexShrink: 0,
              pointerEvents: isEditorEnabled ? 'none' : 'auto',
            }}
            disabled={isEditorEnabled}
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
    buttonText: 'Sign Up',
    buttonColor: '#7c3aed',
    backgroundColor: '#f3f4f6',
    width: '100%',
    height: 'auto',
    fullWidth: true,
    formContainerBorderRadius: 12,
    formContainerBorderWidth: 1,
    formContainerBorderColor: '#d1d5db',
    formPaddingTop: 40,
    formPaddingBottom: 40,
    formPaddingLeft: 20,
    formPaddingRight: 20,
    inputsDirection: 'column',
    inputGap: 12,
    inputFields: [
      {
        id: '1',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter your email',
        placeholderColor: '#9ca3af',
        borderRadius: 6,
        borderColor: '#d1d5db',
        borderWidth: 1,
      },
    ],
    inputPlaceholderColor: '#9ca3af',
    titleFontSize: 28,
    titleColor: '#000000',
    subtitleFontSize: 16,
    subtitleColor: '#666666',
    buttonBorderRadius: 6,
    buttonPadding: 12,
    buttonFontSize: 14,
    textColor: '#ffffff',
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
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  questionFontSize?: number
  questionColor?: string
  questionFontWeight?: 'normal' | 'bold' | '500' | '600' | '700'
  answerFontSize?: number
  answerColor?: string
  answerLineHeight?: number
  iconColor?: string
  iconSize?: number
}

const FAQItemComponent = React.forwardRef<HTMLDivElement, FAQItemProps>(
  (
    {
      question = 'What is this product?',
      answer = 'This is a great product that solves your problems.',
      backgroundColor = '#ffffff',
      borderColor = '#e5e7eb',
      borderWidth = 1,
      borderRadius = 8,
      padding = 16,
      questionFontSize = 16,
      questionColor = '#1a1a1a',
      questionFontWeight = 'bold',
      answerFontSize = 14,
      answerColor = '#666666',
      answerLineHeight = 1.6,
      iconColor = '#1a1a1a',
      iconSize = 16,
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
          border: isSelected ? `2px solid #3b82f6` : `${borderWidth}px solid ${borderColor}`,
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          marginBottom: '12px',
          cursor: 'move',
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: `${padding}px`,
            backgroundColor: 'transparent',
            border: 'none',
            textAlign: 'left',
            fontWeight: questionFontWeight as React.CSSProperties['fontWeight'],
            fontSize: `${questionFontSize}px`,
            color: questionColor,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {question}
          <span style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s',
            fontSize: `${iconSize}px`,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
          }}>
            ▼
          </span>
        </button>
        {isOpen && (
          <div style={{ 
            padding: `0 ${padding}px ${padding}px ${padding}px`, 
            color: answerColor, 
            lineHeight: answerLineHeight,
            fontSize: `${answerFontSize}px`,
          }}>
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
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    questionFontSize: 16,
    questionColor: '#1a1a1a',
    questionFontWeight: 'bold',
    answerFontSize: 14,
    answerColor: '#666666',
    answerLineHeight: 1.6,
    iconColor: '#1a1a1a',
    iconSize: 16,
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
 * Utiliza Next.js Image para otimização automática
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
    
    const [imageError, setImageError] = React.useState(false)

    const shadowStyles: Record<string, string> = {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    }

    // Converter dimensões para números se necessário
    const numericWidth = typeof width === 'string' && width.endsWith('%') ? 600 : (typeof width === 'string' ? parseInt(width) : width)

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
          {!imageError ? (
            <Image
              src={src}
              alt={alt}
              fill
              sizes={typeof width === 'string' && width.endsWith('%') ? '100vw' : `${numericWidth}px`}
              style={{
                objectFit: objectFit as React.CSSProperties['objectFit'],
                objectPosition: 'center',
              }}
              onError={() => setImageError(true)}
              priority={false}
              quality={85}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0f0f0',
                color: '#999',
                fontSize: '14px',
                zIndex: 1,
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '24px' }}>⚠️</div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Erro ao carregar imagem</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#aaa', maxHeight: '60px', overflow: 'auto' }}>
                URL: {src ? (src.length > 50 ? src.substring(0, 50) + '...' : src) : 'sem URL'}
              </div>
              <div style={{ fontSize: '11px', marginTop: '8px', color: '#bbb' }}>
                Verifique se a URL está correta
              </div>
            </div>
          )}
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

/**
 * CountdownTimer - Para criar urgência com contagem regressiva
 * Essencial para sales pages com oferta por tempo limitado
 */
interface CountdownTimerProps {
  targetDate?: string // ISO date string
  title?: string
  titleFontSize?: number
  titleColor?: string
  
  // Exibição
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  
  // Estilos dos dígitos
  digitFontSize?: number
  digitColor?: string
  digitBackgroundColor?: string
  digitBorderRadius?: number
  digitPadding?: number
  
  // Estilos dos labels
  labelFontSize?: number
  labelColor?: string
  
  // Dimensões
  width?: string | number
  height?: string | number
  cardFullWidth?: boolean
  cardAutoHeight?: boolean
  
  // Layout
  alignment?: 'left' | 'center' | 'right'
  gapBetweenUnits?: number
  backgroundColor?: string
  borderRadius?: number
  padding?: number
}

const CountdownTimerComponent = React.forwardRef<HTMLDivElement, CountdownTimerProps>(
  (
    {
      targetDate = new Date(Date.now() + 86400000).toISOString(), // 24 horas a partir de agora
      title = 'Oferta termina em:',
      titleFontSize = 20,
      titleColor = '#000000',
      
      showDays = true,
      showHours = true,
      showMinutes = true,
      showSeconds = true,
      
      digitFontSize = 32,
      digitColor = '#ffffff',
      digitBackgroundColor = '#ff6b35',
      digitBorderRadius = 8,
      digitPadding = 12,
      
      labelFontSize = 12,
      labelColor = '#666666',
      
      width = '100%',
      height = 'auto',
      cardFullWidth = true,
      cardAutoHeight = true,
      
      alignment = 'center',
      gapBetweenUnits = 16,
      backgroundColor = '#ffffff',
      borderRadius = 12,
      padding = 24,
    },
    ref
  ) => {
    const [timeLeft, setTimeLeft] = React.useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })

    const [isExpired, setIsExpired] = React.useState(false)

    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    React.useEffect(() => {
      const calculateTimeLeft = () => {
        const targetTime = new Date(targetDate).getTime()
        const currentTime = new Date().getTime()
        const difference = targetTime - currentTime

        if (difference <= 0) {
          setIsExpired(true)
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
          return
        }

        setIsExpired(false)
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }

      calculateTimeLeft()
      const timer = setInterval(calculateTimeLeft, 1000)
      return () => clearInterval(timer)
    }, [targetDate])

    const TimeUnit = ({ value, label }: { value: number; label: string }) => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            backgroundColor: digitBackgroundColor,
            color: digitColor,
            padding: `${digitPadding}px`,
            borderRadius: `${digitBorderRadius}px`,
            fontSize: `${digitFontSize}px`,
            fontWeight: 'bold',
            minWidth: `${digitFontSize * 1.5}px`,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(value).padStart(2, '0')}
        </div>
        <span style={{ fontSize: `${labelFontSize}px`, color: labelColor, fontWeight: '500' }}>
          {label}
        </span>
      </div>
    )

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
          width: cardFullWidth ? '100%' : (typeof width === 'number' ? `${width}px` : width),
          height: cardAutoHeight ? 'auto' : (typeof height === 'number' ? `${height}px` : height),
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      >
        <div
          style={{
            backgroundColor,
            borderRadius: `${borderRadius}px`,
            padding: `${padding}px`,
            textAlign: alignment,
          }}
        >
          {title && (
            <h3 style={{ fontSize: `${titleFontSize}px`, color: titleColor, marginBottom: '24px', margin: '0 0 24px 0' }}>
              {title}
            </h3>
          )}

          {isExpired ? (
            <div style={{ fontSize: `${digitFontSize}px`, color: digitColor, fontWeight: 'bold' }}>
              Oferta expirada
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                gap: `${gapBetweenUnits}px`,
                flexWrap: 'wrap',
              }}
            >
              {showDays && <TimeUnit value={timeLeft.days} label="dias" />}
              {showHours && <TimeUnit value={timeLeft.hours} label="horas" />}
              {showMinutes && <TimeUnit value={timeLeft.minutes} label="min" />}
              {showSeconds && <TimeUnit value={timeLeft.seconds} label="seg" />}
            </div>
          )}
        </div>
      </div>
    )
  }
)

CountdownTimerComponent.displayName = 'CountdownTimer'
export const CountdownTimer = CountdownTimerComponent

;(CountdownTimer as unknown as Record<string, unknown>).craft = {
  props: {
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    title: 'Oferta termina em:',
    titleFontSize: 20,
    titleColor: '#000000',
    
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
    
    digitFontSize: 32,
    digitColor: '#ffffff',
    digitBackgroundColor: '#ff6b35',
    digitBorderRadius: 8,
    digitPadding: 12,
    
    labelFontSize: 12,
    labelColor: '#666666',
    
    width: '100%',
    height: 'auto',
    cardFullWidth: true,
    cardAutoHeight: true,
    
    alignment: 'center',
    gapBetweenUnits: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
  },
  displayName: 'Contagem Regressiva',
}

