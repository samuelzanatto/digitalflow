'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

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

export async function inviteUserAction(payload: { email: string; name?: string }): Promise<AdminActionResult> {
  const email = payload.email?.trim().toLowerCase()
  const name = payload.name?.trim()

  if (!email) {
    return { success: false, message: 'Informe um email válido.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: name ? { full_name: name } : undefined,
    redirectTo: `${resolveAppUrl()}/auth/callback`,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/dashboard/usuarios')
  return { success: true, message: 'Convite enviado com sucesso.' }
}

export async function deleteUserAction(payload: { userId: string }): Promise<AdminActionResult> {
  const { userId } = payload
  if (!userId) {
    return { success: false, message: 'Usuário inválido.' }
  }

  if (!hasSupabaseAdminConfig) {
    return missingAdminConfigResult
  }

  const supabase = createSupabaseAdminClient()
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

export async function resetUserPasswordAction(payload: { email: string }): Promise<AdminActionResult> {
  const email = payload.email?.trim().toLowerCase()

  if (!email) {
    return { success: false, message: 'Email inválido.' }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, message: 'Supabase não está configurado corretamente.' }
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
