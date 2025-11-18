'use client'

import React from 'react'

// Hero Section - Render Only (sem Craft.js)
interface HeroSectionProps {
  title?: string
  subtitle?: string
  backgroundColor?: string
  textColor?: string
  backgroundImage?: string
}

export const HeroSectionRender = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      title = 'Hero Title',
      subtitle = 'Hero Subtitle',
      backgroundColor = '#000000',
      textColor = '#ffffff',
      backgroundImage,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={{
          background: backgroundImage ? `url(${backgroundImage})` : backgroundColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '80px 20px',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
        className="w-full"
      >
        <h1 style={{ color: textColor, fontSize: '48px', margin: '0 0 20px 0', fontWeight: 'bold' }}>
          {title}
        </h1>
        <p style={{ color: textColor, fontSize: '24px', margin: '0' }}>
          {subtitle}
        </p>
      </div>
    )
  }
)
HeroSectionRender.displayName = 'HeroSectionRender'

// Text Block - Render Only
interface TextBlockProps {
  content?: string
  fontSize?: number
  color?: string
  alignment?: 'left' | 'center' | 'right'
  width?: string | number
  height?: string | number
  padding?: number
  fontFamily?: string
  fontWeight?: React.CSSProperties['fontWeight']
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
}

export const TextBlockRender = React.forwardRef<HTMLDivElement, TextBlockProps>(
  (
    {
      content = 'Text content',
      fontSize = 16,
      color = '#000000',
      alignment = 'left',
      width = '100%',
      height = 'auto',
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
    return (
      <div
        ref={ref}
        style={{
          padding: `${padding}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          boxSizing: 'border-box',
          marginTop: `${marginTop}px`,
          marginBottom: `${marginBottom}px`,
          marginLeft: `${marginLeft}px`,
          marginRight: `${marginRight}px`,
        }}
      >
        <p
          style={{
            fontSize: `${fontSize}px`,
            color,
            textAlign: alignment,
            margin: 0,
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
TextBlockRender.displayName = 'TextBlockRender'

// CTA Button - Render Only
interface CTAButtonProps {
  text?: string
  link?: string // legado
  linkType?: 'url' | 'page'
  linkUrl?: string
  linkPageSlug?: string
  openInNewTab?: boolean
  backgroundColor?: string
  textColor?: string
}

export const CTAButtonRender = React.forwardRef<HTMLAnchorElement, CTAButtonProps>(
  (
    {
      text = 'Button',
      link = '#',
      linkType = 'url',
      linkUrl = '',
      linkPageSlug = '',
      openInNewTab = false,
      backgroundColor = '#0070f3',
      textColor = '#ffffff',
    },
    ref
  ) => {
    const resolvedHref = React.useMemo(() => {
      if (linkType === 'page' && linkPageSlug) {
        return `/page/${linkPageSlug}`
      }
      if (linkType === 'url' && linkUrl) {
        return linkUrl
      }
      return link
    }, [linkType, linkUrl, linkPageSlug, link])

    return (
      <a
        ref={ref}
        href={resolvedHref}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor,
          color: textColor,
          textDecoration: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          margin: '20px',
        }}
      >
        {text}
      </a>
    )
  }
)
CTAButtonRender.displayName = 'CTAButtonRender'

// Container - Render Only
interface ContainerProps {
  backgroundColor?: string
  padding?: number
  children?: React.ReactNode
}

export const ContainerRender = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      backgroundColor = '#ffffff',
      padding = 20,
      children,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={{
          backgroundColor,
          padding: `${padding}px`,
          width: '100%',
        }}
      >
        {children}
      </div>
    )
  }
)
ContainerRender.displayName = 'ContainerRender'

// Divider - Render Only
interface DividerProps {
  height?: number
  color?: string
  margin?: number
}

export const DividerRender = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      height = 2,
      color = '#e0e0e0',
      margin = 20,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={{
          height: `${height}px`,
          backgroundColor: color,
          margin: `${margin}px 0`,
          width: '100%',
        }}
      />
    )
  }
)
DividerRender.displayName = 'DividerRender'
