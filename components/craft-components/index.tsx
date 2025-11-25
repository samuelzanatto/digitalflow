'use client'

import React from 'react'
import { useNode, useEditor } from '@craftjs/core'
import { useEditorViewport } from '@/lib/responsive-props'
import { ResponsiveProp } from '@/contexts/viewport-context'

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
            const element = el as HTMLDivElement
            connect(drag(element))
            if (typeof ref === 'function') {
              ref(element)
            } else if (ref) {
              ref.current = element
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
  fullWidth?: boolean
  autoHeight?: boolean
  padding?: number
  fontFamily?: string
  fontWeight?: React.CSSProperties['fontWeight']
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  marginLinked?: boolean
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
      fullWidth = true,
      autoHeight = true,
      padding = 20,
      fontFamily = 'var(--font-poppins), sans-serif',
      fontWeight = 'normal',
      marginTop = 0,
      marginBottom = 0,
      marginLeft = 0,
      marginRight = 0,
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
          width: fullWidth ? '100%' : (typeof width === 'number' ? `${width}px` : width),
          height: autoHeight ? 'auto' : (typeof height === 'number' ? `${height}px` : height),
          border: isSelected ? '2px solid #3b82f6' : 'none',
          cursor: 'move',
          boxSizing: 'border-box' as const,
          marginTop: `${marginTop}px`,
          marginBottom: `${marginBottom}px`,
          marginLeft: `${marginLeft}px`,
          marginRight: `${marginRight}px`,
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
            fontWeight,
            whiteSpace: 'pre-line',
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
    width: 300,
    height: 'auto',
    fullWidth: true,
    autoHeight: true,
    padding: 20,
    fontFamily: 'var(--font-poppins), sans-serif',
    fontWeight: 'normal',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginLinked: true,
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
  linkType?: 'url' | 'page' | 'section'
  linkUrl?: string
  linkPageSlug?: string
  linkSectionId?: string
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
      linkSectionId = '',
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
      if (linkType === 'section' && linkSectionId) {
        return `#${linkSectionId}`
      }
      if (linkType === 'page' && linkPageSlug) {
        return `/page/${linkPageSlug}`
      }
      if (linkType === 'url' && linkUrl) {
        return linkUrl
      }
      return link
    }, [linkType, linkUrl, linkPageSlug, linkSectionId, link])

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
    linkSectionId: '',
    openInNewTab: false,
    width: 'auto',
    height: 'auto',
  },
  displayName: 'Botão CTA',
}

interface ContainerProps {
  backgroundColor?: string
  backgroundImage?: string
  // Propriedades de padding - suportam valores responsivos
  paddingTop?: ResponsiveProp<number>
  paddingBottom?: ResponsiveProp<number>
  paddingLeft?: ResponsiveProp<number>
  paddingRight?: ResponsiveProp<number>
  paddingLinked?: boolean
  // Propriedades de margin - suportam valores responsivos
  marginTop?: ResponsiveProp<number>
  marginBottom?: ResponsiveProp<number>
  marginLeft?: ResponsiveProp<number>
  marginRight?: ResponsiveProp<number>
  marginLinked?: boolean
  fullBleed?: boolean
  children?: React.ReactNode
  // Layout - alguns suportam valores responsivos
  display?: ResponsiveProp<'block' | 'flex' | 'grid'>
  flexDirection?: ResponsiveProp<'row' | 'column'>
  gap?: ResponsiveProp<number>
  width?: ResponsiveProp<number>
  height?: ResponsiveProp<number>
  fullWidth?: boolean
  flex?: string | number
  justifyContent?: ResponsiveProp<'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'>
  alignItems?: ResponsiveProp<'flex-start' | 'center' | 'flex-end' | 'stretch'>
  borderRadius?: number
  borderRadiusTopLeft?: number
  borderRadiusTopRight?: number
  borderRadiusBottomRight?: number
  borderRadiusBottomLeft?: number
  borderRadiusLinked?: boolean
  borderColor?: string
  borderWidth?: number
  minHeight?: ResponsiveProp<number>
  sectionId: string
}

const ContainerComponent = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      backgroundColor = '#ffffff',
      backgroundImage = '',
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
      borderRadiusTopLeft = 0,
      borderRadiusTopRight = 0,
      borderRadiusBottomRight = 0,
      borderRadiusBottomLeft = 0,
      borderRadiusLinked = true,
      borderColor = '#e5e7eb',
      borderWidth = 2,
      minHeight = 200,
      sectionId = '',
      children,
    },
    ref
  ) => {
    // Hook para resolver props responsivas baseado no viewport atual
    const { resolveResponsiveProp } = useEditorViewport()
    
    // Resolver todas as props responsivas para o viewport atual
    const resolvedPaddingTop = resolveResponsiveProp(paddingTop, 20)
    const resolvedPaddingBottom = resolveResponsiveProp(paddingBottom, 20)
    const resolvedPaddingLeft = resolveResponsiveProp(paddingLeft, 20)
    const resolvedPaddingRight = resolveResponsiveProp(paddingRight, 20)
    const resolvedMarginTop = resolveResponsiveProp(marginTop, 0)
    const resolvedMarginBottom = resolveResponsiveProp(marginBottom, 0)
    const resolvedMarginLeft = resolveResponsiveProp(marginLeft, 0)
    const resolvedMarginRight = resolveResponsiveProp(marginRight, 0)
    const resolvedDisplay = resolveResponsiveProp(display, 'block')
    const resolvedFlexDirection = resolveResponsiveProp(flexDirection, 'column')
    const resolvedGap = resolveResponsiveProp(gap, 0)
    const resolvedWidthProp = resolveResponsiveProp(width, 400)
    const resolvedHeightProp = resolveResponsiveProp(height, 200)
    const resolvedJustifyContent = resolveResponsiveProp(justifyContent, 'flex-start')
    const resolvedAlignItems = resolveResponsiveProp(alignItems, 'stretch')
    const resolvedMinHeightProp = resolveResponsiveProp(minHeight, 200)
    
    // Subscrever a TODAS as mudanças de props + eventos para garantir re-renderização em tempo real
    const { connectors: { connect, drag }, isSelected, parentId } = useNode((node) => ({
      isSelected: node.events.selected,
      parentId: node.data.parent,
      // Subscrever a todas as props para forçar re-render quando mudam
      backgroundColor: node.data.props.backgroundColor,
      backgroundImage: node.data.props.backgroundImage,
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
      borderRadiusTopLeft: node.data.props.borderRadiusTopLeft,
      borderRadiusTopRight: node.data.props.borderRadiusTopRight,
      borderRadiusBottomRight: node.data.props.borderRadiusBottomRight,
      borderRadiusBottomLeft: node.data.props.borderRadiusBottomLeft,
      borderRadiusLinked: node.data.props.borderRadiusLinked,
      borderColor: node.data.props.borderColor,
      borderWidth: node.data.props.borderWidth,
      minHeight: node.data.props.minHeight,
    }))
    
    const { parentSpacing } = useEditor((state) => {
      const parentNode = parentId ? state.nodes[parentId] : undefined
      const parentProps = parentNode?.data?.props as Record<string, number | undefined> | undefined
      return {
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

    // Calcular padding usando valores resolvidos
    const paddingStyle = `${resolvedPaddingTop}px ${resolvedPaddingRight}px ${resolvedPaddingBottom}px ${resolvedPaddingLeft}px`
    const resolvedHeight = typeof resolvedHeightProp === 'number' && resolvedHeightProp > 0 ? `${resolvedHeightProp}px` : 'auto'
    const resolvedWidth: React.CSSProperties['width'] = fullBleed
      ? `calc(100% + ${parentSpacing.paddingLeft + parentSpacing.paddingRight}px)`
      : shouldFullWidth
        ? '100%'
        : resolvedWidthProp

    const bleedHorizontalMargin = (side: 'left' | 'right', value: number) => {
      const parentPad = side === 'left' ? parentSpacing.paddingLeft : parentSpacing.paddingRight
      return `${value - parentPad}px`
    }
    const standardPx = (value: number) => `${value}px`

    const marginTopValue = standardPx(resolvedMarginTop)
    const marginBottomValue = standardPx(resolvedMarginBottom)
    const marginLeftValue = fullBleed ? bleedHorizontalMargin('left', resolvedMarginLeft) : standardPx(resolvedMarginLeft)
    const marginRightValue = fullBleed ? bleedHorizontalMargin('right', resolvedMarginRight) : standardPx(resolvedMarginRight)

    const resolvedMinHeight =
      typeof resolvedMinHeightProp === 'number' && resolvedMinHeightProp > 0
        ? `${resolvedMinHeightProp}px`
        : undefined

    const effectiveMinHeight =
      resolvedHeight !== 'auto'
        ? resolvedHeight
        : resolvedMinHeight ?? (isRootLevel ? 'auto' : undefined)

    // Calcular borderRadius: usar individual se desvinculado, senão usar o vinculado
    const effectiveBorderRadius = borderRadiusLinked
      ? borderRadius
      : `${borderRadiusTopLeft}px ${borderRadiusTopRight}px ${borderRadiusBottomRight}px ${borderRadiusBottomLeft}px`

    const baseStyle: React.CSSProperties = {
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'scroll',
      padding: paddingStyle,
      marginTop: marginTopValue,
      marginBottom: marginBottomValue,
      marginLeft: marginLeftValue,
      marginRight: marginRightValue,
      width: resolvedWidth,
      maxWidth: fullBleed ? 'none' : '100%',
      height: resolvedHeight,
      minHeight: effectiveMinHeight,
      border: borderWidth > 0
        ? `${borderWidth}px solid ${borderColor}`
        : 'none',
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: isSelected ? '2px' : '0px',
      borderRadius: typeof effectiveBorderRadius === 'number' ? `${effectiveBorderRadius}px` : effectiveBorderRadius,
      cursor: 'move',
      boxSizing: 'border-box' as const,
      display: resolvedDisplay,
      overflowX: 'hidden',
      ...(flex && { flex: typeof flex === 'number' ? flex : flex }),
    }

    const flexStyle: React.CSSProperties =
      resolvedDisplay === 'flex'
        ? {
            flexDirection: resolvedFlexDirection,
            gap: `${resolvedGap}px`,
            justifyContent: resolvedJustifyContent,
            alignItems: resolvedAlignItems,
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
        id={sectionId || undefined}
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
    backgroundImage: '',
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
    borderRadiusTopLeft: 0,
    borderRadiusTopRight: 0,
    borderRadiusBottomRight: 0,
    borderRadiusBottomLeft: 0,
    borderRadiusLinked: true,
    borderColor: '#e5e7eb',
    borderWidth: 2,
    minHeight: 200,
    sectionId: '',
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
  showLinks?: boolean
  textAlignment?: 'left' | 'center' | 'right'
  brandNameFontSize?: number
  brandNameColor?: string
  descriptionFontSize?: number
  descriptionColor?: string
  linksFontSize?: number
  linksColor?: string
  linksHoverColor?: string
  copyrightFontSize?: number
  copyrightColor?: string
  headingFontSize?: number
  headingColor?: string
}

const FooterComponent = React.forwardRef<HTMLDivElement, FooterProps>(
  (
    {
      brandName = 'DigitalFlow',
      brandDescription = 'Transformando ideias em experiências digitais',
      link1 = 'Início',
      link2 = 'Sobre',
      link3 = 'Contato',
      copyrightText = '© 2025 DigitalFlow. Todos os direitos reservados.',
      padding = 48,
      backgroundColor = '#1a1a1a',
      showLinks = true,
      textAlignment = 'left',
      brandNameFontSize = 16,
      brandNameColor = '#ffffff',
      descriptionFontSize = 14,
      descriptionColor = '#9ca3af',
      linksFontSize = 14,
      linksColor = '#9ca3af',
      linksHoverColor = '#ffffff',
      copyrightFontSize = 12,
      copyrightColor = '#9ca3af',
      headingFontSize = 14,
      headingColor = '#ffffff',
    },
    ref
  ) => {
    const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
      isSelected: node.events.selected,
    }))

    const [hoveredLink, setHoveredLink] = React.useState<number | null>(null)

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
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: showLinks ? '1fr 1fr 1fr' : '1fr',
            gap: '32px',
            marginBottom: '32px',
            textAlign: textAlignment as React.CSSProperties['textAlign'],
          }}>
            {/* Brand */}
            <div>
              <h3 style={{ 
                fontSize: `${brandNameFontSize}px`, 
                fontWeight: 'bold', 
                color: brandNameColor, 
                margin: '0 0 8px 0' 
              }}>
                {brandName}
              </h3>
              <p style={{ 
                fontSize: `${descriptionFontSize}px`, 
                color: descriptionColor, 
                margin: '0', 
                lineHeight: '1.6' 
              }}>
                {brandDescription}
              </p>
            </div>

            {/* Links - conditionally rendered */}
            {showLinks && (
              <div>
                <h4 style={{ 
                  fontSize: `${headingFontSize}px`, 
                  fontWeight: '600', 
                  color: headingColor, 
                  margin: '0 0 8px 0' 
                }}>
                  Links
                </h4>
                <ul style={{ margin: '0', padding: '0', listStyle: 'none' }}>
                  {[link1, link2, link3].map((link, idx) => (
                    <li key={idx} style={{ fontSize: `${linksFontSize}px`, marginBottom: '4px' }}>
                      <a 
                        href="#" 
                        onMouseEnter={() => setHoveredLink(idx)}
                        onMouseLeave={() => setHoveredLink(null)}
                        style={{ 
                          color: hoveredLink === idx ? linksHoverColor : linksColor, 
                          textDecoration: 'none', 
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty space for alignment when links are shown */}
            {showLinks && <div />}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #374151', paddingTop: '24px', paddingBottom: '24px' }}>
            {/* Bottom Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ 
                fontSize: `${copyrightFontSize}px`, 
                color: copyrightColor, 
                margin: '0',
                textAlign: textAlignment as React.CSSProperties['textAlign'],
              }}>
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
    link1: 'Início',
    link2: 'Sobre',
    link3: 'Contato',
    copyrightText: '© 2025 DigitalFlow. Todos os direitos reservados.',
    padding: 48,
    backgroundColor: '#1a1a1a',
    showLinks: true,
    textAlignment: 'left',
    brandNameFontSize: 16,
    brandNameColor: '#ffffff',
    descriptionFontSize: 14,
    descriptionColor: '#9ca3af',
    linksFontSize: 14,
    linksColor: '#9ca3af',
    linksHoverColor: '#ffffff',
    copyrightFontSize: 12,
    copyrightColor: '#9ca3af',
    headingFontSize: 14,
    headingColor: '#ffffff',
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
  CountdownTimer,
} from './sales-components'
