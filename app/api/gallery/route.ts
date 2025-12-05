import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import sharp from 'sharp'

// Configuração de otimização de imagem
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const QUALITY = 80

// GET - Listar imagens da galeria (compartilhada)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Listar todos os arquivos da galeria compartilhada
    const { data: files, error } = await supabase.storage
      .from('gallery')
      .list('', {
        limit,
        offset: (page - 1) * limit,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Erro ao listar arquivos:', error)
      return NextResponse.json({ error: 'Erro ao listar imagens' }, { status: 500 })
    }

    // Gerar URLs públicas para cada arquivo
    const images = (files || [])
      .filter(file => file.name && !file.name.startsWith('.'))
      .map((file) => {
        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(file.name)
        
        return {
          id: file.id,
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          contentType: file.metadata?.mimetype || 'image/jpeg',
          createdAt: file.created_at,
          updatedAt: file.updated_at,
        }
      })

    return NextResponse.json({ 
      images,
      page,
      limit,
      hasMore: files?.length === limit
    })
  } catch (error) {
    console.error('Erro na API de galeria:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Upload de imagem (galeria compartilhada)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não suportado. Use: JPG, PNG, GIF, WebP ou SVG' 
      }, { status: 400 })
    }

    // Ler o arquivo como buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    let optimizedBuffer: Buffer
    let contentType: string
    let extension: string

    // SVG não precisa de otimização
    if (file.type === 'image/svg+xml') {
      optimizedBuffer = buffer
      contentType = 'image/svg+xml'
      extension = 'svg'
    } else if (file.type === 'image/gif') {
      // GIF mantém original (para preservar animação)
      optimizedBuffer = buffer
      contentType = 'image/gif'
      extension = 'gif'
    } else {
      // Otimizar outras imagens com sharp
      try {
        const image = sharp(buffer)
        const metadata = await image.metadata()
        
        // Redimensionar se necessário mantendo proporção
        let resizeOptions = {}
        if (metadata.width && metadata.width > MAX_WIDTH) {
          resizeOptions = { width: MAX_WIDTH, withoutEnlargement: true }
        } else if (metadata.height && metadata.height > MAX_HEIGHT) {
          resizeOptions = { height: MAX_HEIGHT, withoutEnlargement: true }
        }

        // Converter para WebP para melhor compressão
        optimizedBuffer = await image
          .resize(resizeOptions)
          .webp({ quality: QUALITY })
          .toBuffer()
        
        contentType = 'image/webp'
        extension = 'webp'
      } catch (sharpError) {
        console.error('Erro ao otimizar imagem:', sharpError)
        // Fallback: usar imagem original
        optimizedBuffer = buffer
        contentType = file.type
        extension = file.name.split('.').pop() || 'jpg'
      }
    }

    // Gerar nome único para o arquivo (na raiz do bucket)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extensão original
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Sanitiza caracteres especiais
      .substring(0, 50) // Limita tamanho
    const fileName = `${sanitizedName}_${timestamp}_${randomString}.${extension}`

    // Upload para o Supabase Storage (na raiz, sem pasta de usuário)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, optimizedBuffer, {
        contentType,
        cacheControl: '31536000', // 1 ano de cache
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      image: {
        id: uploadData.id,
        name: fileName,
        url: urlData.publicUrl,
        size: optimizedBuffer.length,
        originalSize: buffer.length,
        contentType,
        path: fileName
      }
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remover imagem (galeria compartilhada)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    
    if (!path) {
      return NextResponse.json({ error: 'Caminho não fornecido' }, { status: 400 })
    }

    // Deletar arquivo da galeria compartilhada
    const { error } = await supabase.storage
      .from('gallery')
      .remove([path])

    if (error) {
      console.error('Erro ao deletar:', error)
      return NextResponse.json({ error: 'Erro ao deletar imagem' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
