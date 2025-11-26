import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

interface StorageFile {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: Request) {
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
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.' }, { status: 400 })
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
    }

    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Gerar nome do arquivo: {userId}/avatar.{ext}
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/avatar.${ext}`

    // Primeiro, deletar avatar antigo se existir (para substituir)
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = (existingFiles as StorageFile[]).map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(filesToDelete)
    }

    // Upload do novo avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload do avatar' }, { status: 500 })
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Atualizar user_metadata com a URL do avatar usando admin client
    const adminClient = createSupabaseAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        avatar_url: avatarUrl,
      },
    })

    if (updateError) {
      console.error('Erro ao atualizar metadata:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar atualizado com sucesso' 
    })

  } catch (error) {
    console.error('Erro no upload de avatar:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Listar e deletar arquivos do usuário
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = (existingFiles as StorageFile[]).map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(filesToDelete)
    }

    // Remover URL do user_metadata
    const adminClient = createSupabaseAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        avatar_url: null,
      },
    })

    if (updateError) {
      console.error('Erro ao atualizar metadata:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar removido com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao remover avatar:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
