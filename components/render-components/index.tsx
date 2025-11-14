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
}

export const TextBlockRender = React.forwardRef<HTMLDivElement, TextBlockProps>(
  (
    {
      content = 'Text content',
      fontSize = 16,
      color = '#000000',
      alignment = 'left',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={{
          padding: '20px',
          fontSize: `${fontSize}px`,
          color,
          textAlign: alignment,
          width: '100%',
        }}
      >
        {content}
      </div>
    )
  }
)
TextBlockRender.displayName = 'TextBlockRender'

// CTA Button - Render Only
interface CTAButtonProps {
  text?: string
  link?: string
  backgroundColor?: string
  textColor?: string
}

export const CTAButtonRender = React.forwardRef<HTMLAnchorElement, CTAButtonProps>(
  (
    {
      text = 'Button',
      link = '#',
      backgroundColor = '#0070f3',
      textColor = '#ffffff',
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
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
