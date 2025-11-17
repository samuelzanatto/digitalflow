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
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | '800' | '900'
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
      fontFamily = 'var(--font-poppins), sans-serif',
      fontWeight = 'normal',
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
            fontFamily,
            fontWeight: fontWeight as unknown as number,
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
    fontFamily: 'var(--font-poppins), sans-serif',
    fontWeight: 'normal',
  },
  displayName: 'Bloco de Texto',
}

interface CTAButtonProps {
  text?: string
  backgroundColor?: string
  textColor?: string
  padding?: number
  borderRadius?: number
  link?: string // legado
  linkType?: 'url' | 'page'
  linkUrl?: string
  linkPageSlug?: string
  openInNewTab?: boolean
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
      linkType = 'url',
      linkUrl = '',
      linkPageSlug = '',
      openInNewTab = false,
      width = 'auto',
      height = 'auto',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    const resolvedHref = React.useMemo(() => {
      if (linkType === 'page' && linkPageSlug) {
        return `/page/${linkPageSlug}`
      }
      if (linkType === 'url' && linkUrl) {
        return linkUrl
      }
      return link
    }, [linkType, linkUrl, linkPageSlug, link])

    const target = openInNewTab ? '_blank' : undefined
    const rel = openInNewTab ? 'noopener noreferrer' : undefined

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
          href={resolvedHref}
          target={target}
          rel={rel}
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
    linkType: 'url',
    linkUrl: '',
    linkPageSlug: '',
    openInNewTab: false,
    width: 'auto',
    height: 'auto',
  },
  displayName: 'Botão CTA',
}

interface ContainerProps {
  backgroundColor?: string
  paddingTop?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
  paddingLinked?: boolean
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  marginLinked?: boolean
  fullBleed?: boolean
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
  minHeight?: number
}

const ContainerComponent = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      backgroundColor = '#ffffff',
      paddingTop = 20,
      paddingBottom = 20,
      paddingLeft = 20,
      paddingRight = 20,
      marginTop = 0,
      marginBottom = 0,
      marginLeft = 0,
      marginRight = 0,
      fullBleed = false,
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
      minHeight = 200,
      children,
    },
    ref
  ) => {
    // Subscrever a TODAS as mudanças de props + eventos para garantir re-renderização em tempo real
    const { connectors: { connect, drag }, isSelected, parentId } = useNode((node) => ({
      isSelected: node.events.selected,
      parentId: node.data.parent,
      // Subscrever a todas as props para forçar re-render quando mudam
      backgroundColor: node.data.props.backgroundColor,
      paddingTop: node.data.props.paddingTop,
      paddingBottom: node.data.props.paddingBottom,
      paddingLeft: node.data.props.paddingLeft,
      paddingRight: node.data.props.paddingRight,
      paddingLinked: node.data.props.paddingLinked,
      marginTop: node.data.props.marginTop,
      marginBottom: node.data.props.marginBottom,
      marginLeft: node.data.props.marginLeft,
      marginRight: node.data.props.marginRight,
      marginLinked: node.data.props.marginLinked,
      fullBleed: node.data.props.fullBleed,
      display: node.data.props.display,
      flexDirection: node.data.props.flexDirection,
      gap: node.data.props.gap,
      width: node.data.props.width,
      height: node.data.props.height,
      fullWidth: node.data.props.fullWidth,
      flex: node.data.props.flex,
      justifyContent: node.data.props.justifyContent,
      alignItems: node.data.props.alignItems,
      borderRadius: node.data.props.borderRadius,
      borderColor: node.data.props.borderColor,
      borderWidth: node.data.props.borderWidth,
      minHeight: node.data.props.minHeight,
    }))
    
    const { enabled, parentSpacing } = useEditor((state) => {
      const parentNode = parentId ? state.nodes[parentId] : undefined
      const parentProps = parentNode?.data?.props as Record<string, number | undefined> | undefined
      return {
        enabled: state.options.enabled,
        parentSpacing: {
          paddingTop: parentProps?.paddingTop ?? 0,
          paddingBottom: parentProps?.paddingBottom ?? 0,
          paddingLeft: parentProps?.paddingLeft ?? 0,
          paddingRight: parentProps?.paddingRight ?? 0,
        },
      }
    })

    const isRootLevel = parentId === 'ROOT'
    const shouldFullWidth = isRootLevel ? true : fullWidth

    // Calcular padding usando apenas valores individuais (sem fallback para geral)
    const paddingStyle = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
    const resolvedHeight = typeof height === 'number' && height > 0 ? `${height}px` : 'auto'
    const resolvedWidth: React.CSSProperties['width'] = fullBleed
      ? `calc(100% + ${parentSpacing.paddingLeft + parentSpacing.paddingRight}px)`
      : shouldFullWidth
        ? '100%'
        : width

    const bleedHorizontalMargin = (side: 'left' | 'right', value: number) => {
      const parentPad = side === 'left' ? parentSpacing.paddingLeft : parentSpacing.paddingRight
      return `${value - parentPad}px`
    }
    const standardPx = (value: number) => `${value}px`

    const marginTopValue = standardPx(marginTop)
    const marginBottomValue = standardPx(marginBottom)
    const marginLeftValue = fullBleed ? bleedHorizontalMargin('left', marginLeft) : standardPx(marginLeft)
    const marginRightValue = fullBleed ? bleedHorizontalMargin('right', marginRight) : standardPx(marginRight)

    const resolvedMinHeight =
      typeof minHeight === 'number' && minHeight > 0
        ? `${minHeight}px`
        : undefined

    const effectiveMinHeight =
      resolvedHeight !== 'auto'
        ? resolvedHeight
        : resolvedMinHeight ?? (isRootLevel ? 'auto' : undefined)

    const baseStyle: React.CSSProperties = {
      backgroundColor,
      padding: paddingStyle,
      marginTop: marginTopValue,
      marginBottom: marginBottomValue,
      marginLeft: marginLeftValue,
      marginRight: marginRightValue,
      width: resolvedWidth,
      height: resolvedHeight,
      minHeight: effectiveMinHeight,
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

    if (fullBleed) {
      baseStyle.maxWidth = 'none'
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    paddingLinked: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginLinked: true,
    fullBleed: false,
    display: 'block',
    flexDirection: 'column',
    gap: 0,
    width: 400,
    height: 0,
    fullWidth: false,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    borderRadius: 0,
    borderColor: '#e5e7eb',
    borderWidth: 2,
    minHeight: 200,
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

interface FooterProps {
  brandName?: string
  brandDescription?: string
  link1?: string
  link2?: string
  link3?: string
  copyrightText?: string
  padding?: number
  backgroundColor?: string
}

const FooterComponent = React.forwardRef<HTMLDivElement, FooterProps>(
  (
    {
      brandName = 'DigitalFlow',
      brandDescription = 'Transformando ideias em experiências digitais',
      link1 = 'Home',
      link2 = 'Sobre',
      link3 = 'Contato',
      copyrightText = '© 2025 DigitalFlow. Todos os direitos reservados.',
      padding = 48,
      backgroundColor = '#1a1a1a',
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
          width: '100%',
          padding: `${padding}px`,
          backgroundColor,
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          boxSizing: 'border-box' as const,
        }}
        className="w-full"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 8px 0' }}>
                {brandName}
              </h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0', lineHeight: '1.6' }}>
                {brandDescription}
              </p>
            </div>

            {/* Page Info */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
                Links
              </h4>
              <ul style={{ margin: '0', padding: '0', listStyle: 'none' }}>
                <li style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', cursor: 'pointer' }}>
                    {link1}
                  </a>
                </li>
                <li style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                  <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', cursor: 'pointer' }}>
                    {link2}
                  </a>
                </li>
                <li style={{ fontSize: '14px', color: '#9ca3af' }}>
                  <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', cursor: 'pointer' }}>
                    {link3}
                  </a>
                </li>
              </ul>
            </div>

            {/* Empty space for 3rd column */}
            <div />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #374151', paddingTop: '24px', paddingBottom: '24px' }}>
            {/* Bottom Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>
                {copyrightText}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

FooterComponent.displayName = 'Footer'

export const Footer = FooterComponent

;(Footer as unknown as Record<string, unknown>).craft = {
  props: {
    brandName: 'DigitalFlow',
    brandDescription: 'Transformando ideias em experiências digitais',
    link1: 'Home',
    link2: 'Sobre',
    link3: 'Contato',
    copyrightText: '© 2025 DigitalFlow. Todos os direitos reservados.',
    padding: 48,
    backgroundColor: '#1a1a1a',
  },
  displayName: 'Footer',
}

// Export sales-specific components
export {
  PricingCard,
  TestimonialCard,
  FeatureCard,
  CaptureForm,
  StatsCounter,
  FAQItem,
  TrustBadges,
  ImageComponent,
  VSL,
} from './sales-components'
