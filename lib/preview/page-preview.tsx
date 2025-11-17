import React from 'react'
import { existsSync } from 'node:fs'
import { ImageResponse } from 'next/og'
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { prisma, withRetry } from '@/lib/db/prisma'
import { createServerClient } from '@/lib/db/supabase'

export const previewSize = {
  width: 1200,
  height: 630,
}

const TEXT_PRIORITIES = ['title', 'heading', 'headline', 'primaryText', 'name', 'titleText']
const SUBTEXT_PRIORITIES = ['subtitle', 'description', 'body', 'subheading', 'details']
const ACCENT_PRIORITIES = ['eyebrow', 'eyebrowText', 'label', 'tagline', 'category']
const COLOR_PRIORITIES = ['backgroundColor', 'overlayColor', 'color']
const MAX_TRAVERSAL_DEPTH = 4

export interface PreviewSectionData {
  id: string
  type: string
  props: unknown
}

export interface PreviewPageData {
  id: string
  title: string
  description: string | null
  slug: string
  sections?: PreviewSectionData[]
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const resolveNestedString = (value: unknown, depth = 0): string | null => {
  if (depth > MAX_TRAVERSAL_DEPTH || value == null) return null
  if (isNonEmptyString(value)) return value.trim()
  if (typeof value === 'number') return String(value)

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = resolveNestedString(entry, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['text', 'value', 'content', 'title']) {
      if (record[key] !== undefined) {
        const found = resolveNestedString(record[key], depth + 1)
        if (found) return found
      }
    }

    for (const nestedValue of Object.values(record)) {
      const found = resolveNestedString(nestedValue, depth + 1)
      if (found) return found
    }
  }

  return null
}

const findFirstImageSource = (value: unknown, depth = 0): string | null => {
  if (value == null || depth > MAX_TRAVERSAL_DEPTH) return null
  if (isNonEmptyString(value)) {
    const trimmed = value.trim()
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:image') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed
    }
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFirstImageSource(entry, depth + 1)
      if (found) return found
    }
    return null
  }

  if (typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const found = findFirstImageSource(entry, depth + 1)
      if (found) return found
    }
  }

  return null
}

const extractFromProps = (
  props: unknown,
  priorities: string[],
  fallback?: string | null,
): string | null => {
  if (props && typeof props === 'object' && !Array.isArray(props)) {
    const record = props as Record<string, unknown>
    for (const key of priorities) {
      if (key in record) {
        const value = record[key]
        const resolved = resolveNestedString(value, 0)
        if (resolved) return resolved
      }
    }

    const anyValue = resolveNestedString(record, 0)
    if (anyValue) return anyValue
  }

  return fallback ?? null
}

const extractColor = (props: unknown): string | null => {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return null
  const record = props as Record<string, unknown>
  for (const key of COLOR_PRIORITIES) {
    if (key in record && isNonEmptyString(record[key])) {
      return record[key] as string
    }
  }
  return null
}

export const buildPreviewTokens = (
  page: PreviewPageData,
  section?: PreviewSectionData | null,
) => {
  const props = section?.props ?? null
  const primary = extractFromProps(props, TEXT_PRIORITIES, page.title) ?? page.title
  const secondary = extractFromProps(props, SUBTEXT_PRIORITIES, page.description)
  const accent = extractFromProps(props, ACCENT_PRIORITIES, section?.type ?? null)
  const backgroundImage = findFirstImageSource(props)
  const backgroundColor = extractColor(props) ?? '#05060a'

  return {
    primary,
    secondary,
    accent,
    backgroundImage,
    backgroundColor,
    sectionType: section?.type ?? 'preview',
    slug: page.slug,
  }
}

export type PreviewTokens = ReturnType<typeof buildPreviewTokens>

export const PreviewArtwork = ({
  primary,
  secondary,
  accent,
  backgroundImage,
  backgroundColor,
  sectionType,
  slug,
}: PreviewTokens) => {
  const hasPreviewImage = Boolean(backgroundImage)
  const backgroundLayers = [
    'linear-gradient(120deg, rgba(2,6,23,0.95), rgba(15,23,42,0.35))',
    hasPreviewImage ? `url(${backgroundImage})` : null,
  ].filter(Boolean)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontFamily: 'Inter, "Space Grotesk", system-ui, sans-serif',
        color: '#f8fafc',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor,
        backgroundImage: backgroundLayers.join(', '),
        backgroundSize: hasPreviewImage ? 'cover, cover' : 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        padding: '80px 72px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 48,
          fontSize: 18,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: 'rgba(226,232,240,0.6)',
          display: 'flex',
        }}
      >
        #{sectionType}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          right: 48,
          fontSize: 16,
          letterSpacing: 2,
          color: 'rgba(226,232,240,0.6)',
          display: 'flex',
        }}
      >
        {slug.startsWith('/') ? slug : `/${slug}`}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
          flex: 1,
        }}
      >
        {accent && (
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: 'uppercase',
              color: '#fcd34d',
              display: 'flex',
            }}
          >
            {accent}
          </div>
        )}
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.1,
            fontWeight: 600,
            maxWidth: '900px',
          }}
        >
          {primary}
        </div>
        {secondary && (
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: 'rgba(226,232,240,0.85)',
              maxWidth: '840px',
            }}
          >
            {secondary}
          </div>
        )}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: 'rgba(148,163,184,0.9)',
            fontSize: 18,
          }}
        >
          <div
            style={{
              width: 96,
              height: 4,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
            }}
          />
          Prévia automática da primeira seção
        </div>
      </div>
    </div>
  )
}

export const createPreviewImageResponse = (tokens: PreviewTokens) =>
  new ImageResponse(<PreviewArtwork {...tokens} />, {
    ...previewSize,
  })

type PuppeteerLaunchOptions = Parameters<typeof puppeteer.launch>[0]

const localChromeCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH,
  process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  process.platform === 'win32'
    ? 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    : '/usr/bin/google-chrome',
]

const findLocalChromeExecutable = () => {
  for (const candidate of localChromeCandidates) {
    if (candidate && existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

const resolvePreviewBaseUrl = () => {
  const explicit =
    process.env.PREVIEW_BASE_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL

  if (explicit) {
    return explicit.replace(/\/$/, '')
  }

  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
    return normalized.replace(/\/$/, '')
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  return null
}

const resolveLaunchOptions = async (): Promise<PuppeteerLaunchOptions | null> => {
  const viewport = {
    width: previewSize.width,
    height: previewSize.height,
    deviceScaleFactor: 1,
  }

  if (process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH) {
    return {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH,
      headless: true,
      args: [],
      defaultViewport: viewport,
    }
  }

  try {
    const executablePath = await chromium.executablePath()
    if (executablePath) {
      return {
        args: chromium.args,
        defaultViewport: viewport,
        executablePath,
        headless: true,
      }
    }
  } catch (error) {
    console.warn('Chromium executable not available, falling back to local Chrome', error)
  }

  const localChrome = findLocalChromeExecutable()
  if (localChrome) {
    return {
      executablePath: localChrome,
      headless: true,
      args: [],
      defaultViewport: viewport,
    }
  }

  return null
}

const capturePageScreenshot = async (pageId: string) => {
  const baseUrl = resolvePreviewBaseUrl()
  if (!baseUrl) {
    console.warn('Nenhuma URL base configurada para capturar a prévia da página')
    return null
  }

  const launchOptions = await resolveLaunchOptions()
  if (!launchOptions) {
    console.warn('Nenhum navegador disponível para capturar screenshot')
    return null
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
  try {
    browser = await puppeteer.launch(launchOptions)
    const page = await browser.newPage()
    await page.setViewport({
      width: previewSize.width,
      height: previewSize.height,
      deviceScaleFactor: 1,
    })

    const targetUrl = `${baseUrl}/preview/${pageId}?thumbnail=1`
    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 45000,
    })

    if (!response || response.status() >= 400) {
      throw new Error(`Falha ao carregar página para screenshot: ${response?.status()}`)
    }

    const buffer = (await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: previewSize.width, height: previewSize.height },
    })) as Buffer

    return buffer
  } catch (error) {
    console.error('Erro ao capturar screenshot da página', error)
    return null
  } finally {
    if (browser) {
      await browser.close().catch(() => null)
    }
  }
}

export const fetchPagePreviewPayload = async (pageId: string) => {
  return await withRetry(async () => {
    return await prisma.salesPage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        sections: {
          orderBy: { order: 'asc' },
          take: 1,
          select: {
            id: true,
            type: true,
            props: true,
          },
        },
      },
    })
  })
}
const buildPreviewImageBuffer = async (page: PreviewPageData) => {
  const screenshot = await capturePageScreenshot(page.id)
  if (screenshot && screenshot.length > 0) {
    return screenshot
  }

  const section = page.sections?.[0] ?? null
  const tokens = buildPreviewTokens(page, section)
  const fallbackImage = createPreviewImageResponse(tokens)
  return Buffer.from(await fallbackImage.arrayBuffer())
}

export const generatePreviewImage = async (pageId: string) => {
  const page = await fetchPagePreviewPayload(pageId)
  if (!page) {
    return null
  }

  const buffer = await buildPreviewImageBuffer(page)
  if (!buffer) {
    return null
  }

  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer
  const blob = new Blob([arrayBuffer])

  return new Response(blob, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}

export const generatePreviewImagePath = async (pageId: string): Promise<string | null> => {
  try {
    const page = await fetchPagePreviewPayload(pageId)
    if (!page) return null

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL não configurada')
      return null
    }

    const buffer = await buildPreviewImageBuffer(page)
    if (!buffer) {
      return null
    }

    const supabase = createServerClient()
    const filename = `${pageId}.png`

    const { error } = await supabase.storage
      .from('page-previews')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      console.error('Erro ao enviar preview para o Supabase Storage:', error)
      return null
    }

    const bust = Date.now()
    return `${supabaseUrl}/storage/v1/object/public/page-previews/${filename}?v=${bust}`
  } catch (error) {
    console.error('Erro ao salvar preview:', error)
    return null
  }
}
