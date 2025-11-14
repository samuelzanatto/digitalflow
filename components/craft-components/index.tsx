'use client'

import React from 'react'
import { useNode, useEditor } from '@craftjs/core'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  backgroundColor?: string
  textColor?: string
  backgroundImage?: string
  width?: string | number
  height?: string | number
  padding?: number
}

const HeroSectionComponent = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      title = 'Hero Title',
      subtitle = 'Hero Subtitle',
      backgroundColor = '#000000',
      textColor = '#ffffff',
      backgroundImage,
      width = '100%',
      height = '400px',
      padding = 80,
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
          background: backgroundImage ? `url(${backgroundImage})` : backgroundColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: `${padding}px 20px`,
          textAlign: 'center',
          minHeight: typeof height === 'number' ? `${height}px` : height,
          width: typeof width === 'number' ? `${width}px` : width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          boxSizing: 'border-box' as const,
        }}
        className="w-full"
      >
        <h1 style={{ color: textColor, fontSize: '48px', margin: '0 0 20px 0', fontWeight: 'bold' }}>
          {title}
        </h1>
        <p style={{ color: textColor, fontSize: '20px', margin: '0', opacity: 0.9 }}>
          {subtitle}
        </p>
      </div>
    )
  }
)

HeroSectionComponent.displayName = 'HeroSection'

export const HeroSection = HeroSectionComponent

;(HeroSection as unknown as Record<string, unknown>).craft = {
  props: {
    title: 'Hero Title',
    subtitle: 'Hero Subtitle',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    backgroundImage: '',
    width: '100%',
    height: '400px',
    padding: 80,
  },
  displayName: 'Hero Section',
}

interface TextBlockProps {
  content?: string
  fontSize?: number
  color?: string
  alignment?: 'left' | 'center' | 'right'
  width?: string | number
  height?: string | number
  padding?: number
}

const TextBlockComponent = React.forwardRef<HTMLDivElement, TextBlockProps>(
  (
    {
      content = 'Edite este texto',
      fontSize = 16,
      color = '#000000',
      alignment = 'left',
      width = '100%',
      height = 'auto',
      padding = 20,
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
          padding: `${padding}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          boxSizing: 'border-box' as const,
        }}
        className="w-full"
      >
        <p
          style={{
            color,
            fontSize: `${fontSize}px`,
            textAlign: alignment,
            margin: '0',
            lineHeight: '1.6',
          }}
        >
          {content}
        </p>
      </div>
    )
  }
)

TextBlockComponent.displayName = 'TextBlock'

export const TextBlock = TextBlockComponent

;(TextBlock as unknown as Record<string, unknown>).craft = {
  props: {
    content: 'Edite este texto',
    fontSize: 16,
    color: '#000000',
    alignment: 'left',
    width: '100%',
    height: 'auto',
    padding: 20,
  },
  displayName: 'Bloco de Texto',
}

interface CTAButtonProps {
  text?: string
  backgroundColor?: string
  textColor?: string
  padding?: number
  borderRadius?: number
  link?: string
  width?: string | number
  height?: string | number
}

const CTAButtonComponent = React.forwardRef<HTMLDivElement, CTAButtonProps>(
  (
    {
      text = 'Clique aqui',
      backgroundColor = '#7c3aed',
      textColor = '#ffffff',
      padding = 16,
      borderRadius = 8,
      link = '#',
      width = 'auto',
      height = 'auto',
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
          padding: '20px',
          textAlign: 'center',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          boxSizing: 'border-box' as const,
        }}
        className="w-full"
      >
        <a
          href={link}
          style={{
            backgroundColor,
            color: textColor,
            padding: `${padding}px ${padding * 2}px`,
            borderRadius: `${borderRadius}px`,
            display: 'inline-block',
            textDecoration: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'opacity 0.3s',
            width: typeof width === 'number' ? `${width - 40}px` : 'auto',
            textAlign: 'center',
          }}
          className="hover:opacity-90"
        >
          {text}
        </a>
      </div>
    )
  }
)

CTAButtonComponent.displayName = 'CTAButton'

export const CTAButton = CTAButtonComponent

;(CTAButton as unknown as Record<string, unknown>).craft = {
  props: {
    text: 'Clique aqui',
    backgroundColor: '#7c3aed',
    textColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    link: '#',
    width: 'auto',
    height: 'auto',
  },
  displayName: 'Botão CTA',
}

interface ContainerProps {
  backgroundColor?: string
  padding?: number
  children?: React.ReactNode
  display?: 'block' | 'flex' | 'grid'
  flexDirection?: 'row' | 'column'
  gap?: number
  width?: number
  height?: number
  fullWidth?: boolean
  flex?: string | number
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  borderRadius?: number
  borderColor?: string
  borderWidth?: number
}

const ContainerComponent = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      backgroundColor = '#ffffff',
      padding = 20,
      display = 'block',
      flexDirection = 'column',
      gap = 0,
      width = 400,
      height = 200,
      fullWidth = false,
      flex,
      justifyContent = 'flex-start',
      alignItems = 'stretch',
      borderRadius = 0,
      borderColor = '#e5e7eb',
      borderWidth = 2,
      children,
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected, parentId } = useNode((node) => ({
      isSelected: node.events.selected,
      parentId: node.data.parent,
    }))
    const { enabled } = useEditor((state) => ({
      enabled: state.options.enabled,
    }))

    const isRootLevel = parentId === 'ROOT'
    const shouldFullWidth = isRootLevel ? true : fullWidth

    const baseStyle: React.CSSProperties = {
      backgroundColor,
      padding: `${padding}px`,
      width: shouldFullWidth ? '100%' : `${width}px`,
      height: isRootLevel ? 'auto' : `${height}px`,
      border: isSelected
        ? `${borderWidth}px solid #3b82f6`
        : enabled
          ? `${borderWidth}px dashed ${borderColor}`
          : 'none',
      borderRadius: `${borderRadius}px`,
      cursor: 'move',
      boxSizing: 'border-box' as const,
      display,
      ...(flex && { flex: typeof flex === 'number' ? flex : flex }),
    }

    const flexStyle: React.CSSProperties =
      display === 'flex'
        ? {
            flexDirection,
            gap: `${gap}px`,
            justifyContent,
            alignItems,
          }
        : {}

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
        style={{ ...baseStyle, ...flexStyle }}
      >
        {children}
      </div>
    )
  }
)

ContainerComponent.displayName = 'Container'

export const Container = ContainerComponent

;(Container as unknown as Record<string, unknown>).craft = {
  props: {
    backgroundColor: '#ffffff',
    padding: 20,
    display: 'block',
    flexDirection: 'column',
    gap: 0,
    width: 400,
    height: 200,
    fullWidth: false,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    borderRadius: 0,
    borderColor: '#e5e7eb',
    borderWidth: 2,
  },
  displayName: 'Container',
  rules: {
    canDrop: () => true,
  },
}

interface DividerProps {
  color?: string
  height?: number
  margin?: number
}

const DividerComponent = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ color = '#e5e7eb', height = 1, margin = 20 }, ref) => {
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
          backgroundColor: color,
          height: `${height}px`,
          margin: `${margin}px 0`,
          width: '100%',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
        }}
      />
    )
  }
)

DividerComponent.displayName = 'Divider'

export const Divider = DividerComponent

;(Divider as unknown as Record<string, unknown>).craft = {
  props: {
    color: '#e5e7eb',
    height: 1,
    margin: 20,
  },
  displayName: 'Divisor',
}

// Export sales-specific components
export {
  PricingCard,
  TestimonialCard,
  FeatureCard,
  CaptureForm,
  VideoSection,
  StatsCounter,
  FAQItem,
  TrustBadges,
  ImageComponent,
} from './sales-components'
