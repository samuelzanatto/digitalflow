'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

import { sendInviteEmail, hasGmailTransport } from '@/lib/email/gmail'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

export type AdminActionResult = {
  success: boolean
  message: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const rootAdminEmail = (process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL || 'admin@digitalflow.com').toLowerCase()
const missingAdminConfigResult: AdminActionResult = {
  success: false,
  message: 'Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para gerenciar usuários.',
}
const missingEmailConfigResult: AdminActionResult = {
  success: false,
  message: 'Configure o SMTP do Gmail (GMAIL_SMTP_USER e GMAIL_SMTP_PASS) para enviar convites.',
}

const resolveAppUrl = () => {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL

  if (explicit) {
    return explicit.startsWith('http') ? explicit.replace(/\/$/, '') : `https://${explicit}`
  }

  return 'http://localhost:3000'
}

// Verifica se o email do requisitante é admin
async function isRequesterAdmin(supabaseClient: ReturnType<typeof createSupabaseAdminClient>, requesterId?: string): Promise<boolean> {
  if (!requesterId) return false
  
  try {
    const { data } = await supabaseClient.auth.admin.getUserById(requesterId)
    if (!data?.user) return false
    
    const email = data.user.email?.toLowerCase()
    const metadataRole = data.user.user_metadata?.role
    
    return email === rootAdminEmail || metadataRole === 'admin'
  } catch {
    return false
  }
}

export async function inviteUserAction(payload: { email: string; name?: string; requesterId?: string }): Promise<AdminActionResult> {
  const email = payload.email?.trim().toLowerCase()
  const name = payload.name?.trim()

  if (!email) {
    return { success: false, message: 'Informe um email válido.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()

  // Verifica permissão de admin
  if (!await isRequesterAdmin(supabase, payload.requesterId)) {
    return { success: false, message: 'Apenas administradores podem convidar novos usuários.' }
  }

  if (!hasGmailTransport) {
    return missingEmailConfigResult
  }
  
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: name ? { full_name: name } : undefined,
      redirectTo: `${resolveAppUrl()}/auth/callback`,
    },
  })

  const inviteUrl = data?.properties?.action_link

  if (error || !inviteUrl) {
    return { success: false, message: error?.message || 'Não foi possível gerar o link de convite.' }
  }

  try {
    await sendInviteEmail({
      to: email,
      inviteUrl,
      invitedName: name,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao enviar o email.'
    return { success: false, message: `Falha ao enviar email via Gmail: ${message}` }
  }

  revalidatePath('/dashboard/usuarios')
  return { success: true, message: 'Convite enviado com sucesso.' }
}

// Desativa um usuário (ban permanente) - somente admin pode executar
export async function disableUserAction(payload: { userId: string; requesterId?: string }): Promise<AdminActionResult> {
  const { userId } = payload
  if (!userId) {
    return { success: false, message: 'Usuário inválido.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()

  // Verifica permissão de admin
  if (!await isRequesterAdmin(supabase, payload.requesterId)) {
    return { success: false, message: 'Apenas administradores podem desativar usuários.' }
  }

  // Verifica se é o admin principal
  const { data } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }))
  const email = data?.user?.email?.toLowerCase()
  if (email && email === rootAdminEmail) {
    return { success: false, message: 'Não é permitido desativar o administrador principal.' }
  }

  // Usa updateUserById para "banir" o usuário permanentemente
  // A duração de ~100 anos efetivamente desativa o usuário
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h' // ~100 anos = ban permanente
  })

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/dashboard/usuarios')
  return { success: true, message: 'Usuário desativado com sucesso.' }
}

// Reativa um usuário (remove o ban) - somente admin pode executar
export async function enableUserAction(payload: { userId: string; requesterId?: string }): Promise<AdminActionResult> {
  const { userId } = payload
  if (!userId) {
    return { success: false, message: 'Usuário inválido.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()

  // Verifica permissão de admin
  if (!await isRequesterAdmin(supabase, payload.requesterId)) {
    return { success: false, message: 'Apenas administradores podem reativar usuários.' }
  }

  // Remove o ban do usuário
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none' // Remove o ban
  })

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/dashboard/usuarios')
  return { success: true, message: 'Usuário reativado com sucesso.' }
}

// Mantido para compatibilidade, mas não será mais usado na UI
export async function deleteUserAction(payload: { userId: string; requesterId?: string }): Promise<AdminActionResult> {
  const { userId } = payload
  if (!userId) {
    return { success: false, message: 'Usuário inválido.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()

  // Verifica permissão de admin
  if (!await isRequesterAdmin(supabase, payload.requesterId)) {
    return { success: false, message: 'Apenas administradores podem remover usuários.' }
  }

  const { data } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }))
  const email = data?.user?.email?.toLowerCase()
  if (email && email === rootAdminEmail) {
    return { success: false, message: 'Não é permitido remover o administrador principal.' }
  }

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/dashboard/usuarios')
  return { success: true, message: 'Usuário removido.' }
}

export async function resetUserPasswordAction(payload: { email: string; requesterId?: string }): Promise<AdminActionResult> {
  const email = payload.email?.trim().toLowerCase()

  if (!email) {
    return { success: false, message: 'Email inválido.' }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, message: 'Supabase não está configurado corretamente.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()

  // Verifica permissão de admin
  if (!await isRequesterAdmin(supabase, payload.requesterId)) {
    return { success: false, message: 'Apenas administradores podem resetar senhas de usuários.' }
  }

  const client = createClient(supabaseUrl, supabaseAnonKey)
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${resolveAppUrl()}/auth/reset-password`,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return {
    success: true,
    message: 'Email de redefinição enviado.',
  }
}
