import type { User } from '@supabase/supabase-js'

import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { UserManagementPanel } from './user-management'

export const dynamic = 'force-dynamic'

async function fetchUsers(): Promise<User[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) {
    console.error('[dashboard/usuarios] Falha ao listar usuários:', error)
    return []
  }
  return data?.users ?? []
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

export default async function UsuariosPage() {
  if (!hasSupabaseAdminConfig) {
    return <MissingAdminConfigNotice />
  }

  const users = await fetchUsers()
  return <UserManagementPanel initialUsers={users} />
}
