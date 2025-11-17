"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import { IconMailForward, IconRefresh, IconTrash } from '@tabler/icons-react'
import { formatRelative } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { usePageHeader } from '@/hooks/usePageHeader'

import {
  deleteUserAction,
  inviteUserAction,
  resetUserPasswordAction,
  type AdminActionResult,
} from './actions'

const rootAdminEmail = (process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL || 'admin@digitalflow.com').toLowerCase()

type InviteFormState = {
  name: string
  email: string
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—'
  try {
    return formatRelative(new Date(dateString), new Date(), { locale: ptBR })
  } catch {
    return '—'
  }
}

const buildDisplayName = (user: User) =>
  (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
  user.email?.split('@')[0] ||
  'Usuário Flow'

export function UserManagementPanel({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter()
  const { setPageHeader } = usePageHeader()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [formState, setFormState] = useState<InviteFormState>({ name: '', email: '' })
  const [formPending, setFormPending] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()
  const [rowPendingId, setRowPendingId] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  useEffect(() => {
    const refreshButton = (
      <Button
        type="button"
        variant="outline"
        onClick={() => startRefresh(() => router.refresh())}
        disabled={isRefreshing}
        className="gap-2"
      >
        <IconRefresh className="size-4" />
        {isRefreshing ? 'Atualizando...' : 'Atualizar lista'}
      </Button>
    )

    setPageHeader(
      'Usuários da plataforma',
      'Convide novos membros e controle quem pode acessar o Flow.',
      refreshButton,
    )
  }, [isRefreshing, router, setPageHeader, startRefresh])

  const stats = useMemo(() => {
    const total = users.length
    const confirmed = users.filter((user) => Boolean(user.email_confirmed_at)).length
    const activeLast7Days = users.filter((user) => {
      if (!user.last_sign_in_at) return false
      const diff = now - new Date(user.last_sign_in_at).getTime()
      return diff <= 7 * 24 * 60 * 60 * 1000
    }).length
    return { total, confirmed, activeLast7Days }
  }, [now, users])

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.email.trim()) {
      toast.error('Informe um email para enviar o convite.')
      return
    }

    setFormPending(true)
    const result = await inviteUserAction({ email: formState.email, name: formState.name })
    handleActionResult(result)
    setFormPending(false)
    if (result.success) {
      setFormState({ name: '', email: '' })
    }
  }

  const handleDelete = async (userId: string) => {
    setRowPendingId(userId)
    const result = await deleteUserAction({ userId })
    handleActionResult(result)
    setRowPendingId(null)
  }

  const handleResetPassword = async (email: string) => {
    setRowPendingId(email)
    const result = await resetUserPasswordAction({ email })
    handleActionResult(result)
    setRowPendingId(null)
  }

  const handleActionResult = (result: AdminActionResult) => {
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 rounded-b-2xl bg-black p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 p-4 text-white">
          <p className="text-xs uppercase tracking-widest text-white/50">Usuários totais</p>
          <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
          <p className="text-xs text-white/50">inclui convidados ainda não confirmados</p>
        </Card>
        <Card className="border border-white/10 bg-white/5 p-4 text-white">
          <p className="text-xs uppercase tracking-widest text-white/50">Emails confirmados</p>
          <p className="mt-2 text-3xl font-semibold">{stats.confirmed}</p>
          <p className="text-xs text-white/50">já confirmaram o acesso</p>
        </Card>
        <Card className="border border-white/10 bg-white/5 p-4 text-white">
          <p className="text-xs uppercase tracking-widest text-white/50">Ativos (7 dias)</p>
          <p className="mt-2 text-3xl font-semibold">{stats.activeLast7Days}</p>
          <p className="text-xs text-white/50">entraram na última semana</p>
        </Card>
      </div>

      <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={handleInvite}>
        <div className="space-y-2">
          <Label htmlFor="invite-name">Nome completo</Label>
          <Input
            id="invite-name"
            placeholder="Ex: Ana Costa"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            disabled={formPending}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="invite-email">Email corporativo</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="ana@empresa.com"
            value={formState.email}
            onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
            disabled={formPending}
          />
        </div>
        <div className="md:col-span-3">
          <Button type="submit" className="w-full md:w-auto" disabled={formPending}>
            {formPending ? 'Enviando convite...' : 'Enviar convite'}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full divide-y divide-white/5 text-sm text-white">
          <thead>
            <tr className="bg-white/5 text-xs uppercase tracking-widest text-white/50">
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Último acesso</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => {
              const isRootAdmin = user.email?.toLowerCase() === rootAdminEmail
              return (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{buildDisplayName(user)}</div>
                    {isRootAdmin && (
                      <Badge variant="secondary" className="mt-1 bg-amber-500/10 text-amber-200">
                        Administrador principal
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/80">{user.email}</td>
                  <td className="px-4 py-3 text-white/60">{formatDate(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3">
                    {user.email_confirmed_at ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-200">
                        confirmado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-white/10 text-white/70">
                        pendente
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!user.email || rowPendingId === user.email}
                        onClick={() => user.email && void handleResetPassword(user.email)}
                      >
                        <IconMailForward className="size-4" />
                        {rowPendingId === user.email ? 'Enviando...' : 'Resetar senha'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={isRootAdmin || rowPendingId === user.id}
                        onClick={() => void handleDelete(user.id)}
                      >
                        <IconTrash className="size-4" />
                        {rowPendingId === user.id ? 'Removendo...' : 'Remover'}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="p-6 text-center text-sm text-white/60">Nenhum usuário cadastrado.</div>
      )}
    </div>
  )
}
