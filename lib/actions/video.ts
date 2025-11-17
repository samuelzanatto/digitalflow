'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Upload de vídeo local
 * Salva o arquivo em public/uploads/videos
 */
export async function uploadVideo(formData: FormData) {
  try {
    const file = formData.get('file') as File
    
    if (!file) {
      return { error: 'Nenhum arquivo foi enviado' }
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('video/')) {
      return { error: 'O arquivo deve ser um vídeo válido' }
    }

    // Validar tamanho (máximo 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return { error: 'O vídeo é muito grande (máximo 500MB)' }
    }

    // Criar diretório se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'videos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `video-${timestamp}.${ext}`
    const filepath = join(uploadsDir, filename)

    // Converter arquivo para buffer e salvar
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    // Retornar URL pública
    const publicUrl = `/uploads/videos/${filename}`
    return { 
      success: true, 
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    }
  } catch (error) {
    console.error('Erro ao fazer upload de vídeo:', error)
    return { error: 'Erro ao fazer upload do vídeo' }
  }
}

/**
 * Extrai o ID do vídeo do YouTube de diferentes formatos de URL
 */
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Valida se é uma URL válida de YouTube
 */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null
}
