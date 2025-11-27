import type { User } from '@supabase/supabase-js'

import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { UserManagementPanel } from './user-management'

export const dynamic = 'force-dynamic'

const rootAdminEmail = (process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL || 'admin@digitalflow.com').toLowerCase()

// Extensão do tipo User para incluir campos retornados pela Admin API
type AdminUser = User & {
  banned_until?: string | null
}

async function fetchUsers(): Promise<AdminUser[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) {
    console.error('[dashboard/usuarios] Falha ao listar usuários:', error)
    return []
  }
  return (data?.users ?? []) as AdminUser[]
}

async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
    const email = user.email?.toLowerCase()
    const metadataRole = user.user_metadata?.role
    
    return email === rootAdminEmail || metadataRole === 'admin'
  } catch {
    return false
  }
}

function MissingAdminConfigNotice() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-amber-400/40 bg-amber-500/5 p-8 text-center text-sm text-amber-100">
      <div className="text-base font-semibold text-amber-200">Configuração necessária</div>
      <p className="max-w-2xl text-amber-100/80">
        A tela de gerenciamento de usuários usa a chave <code className="text-amber-50">SUPABASE_SERVICE_ROLE_KEY</code> e o
        endpoint <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_URL</code>. Defina ambos no <code className="text-amber-50">.env.local</code>{' '}
        e reinicie o servidor para carregar a lista de usuários.
      </p>
    </div>
  )
}

function AccessDeniedNotice() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-red-400/40 bg-red-500/5 p-8 text-center text-sm text-red-100">
      <div className="text-base font-semibold text-red-200">Acesso negado</div>
      <p className="max-w-2xl text-red-100/80">
        Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
      </p>
    </div>
  )
}

export default async function UsuariosPage() {
  if (!hasSupabaseAdminConfig) {
    return <MissingAdminConfigNotice />
  }

  // Verifica se o usuário é admin
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    return <AccessDeniedNotice />
  }

  const users = await fetchUsers()
  return <UserManagementPanel initialUsers={users} />
}
