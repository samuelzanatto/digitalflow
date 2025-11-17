"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (mounted) {
        setHasSession(Boolean(user))
      }
    }

    void checkSession()
    return () => {
      mounted = false
    }
  }, [supabase])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus(null)

    if (!password || password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (password !== confirmation) {
      setError("As senhas digitadas não conferem.")
      return
    }

    setIsSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setIsSubmitting(false)
      return
    }

    setStatus("Senha atualizada com sucesso. Faça login novamente.")
    setIsSubmitting(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-svh bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl">
        <h1 className="text-2xl font-semibold">Redefinir senha</h1>
        <p className="mt-1 text-sm text-white/60">
          Escolha uma nova senha para continuar usando a plataforma.
        </p>

        {hasSession === false && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Não encontramos uma sessão ativa. Clique novamente no link recebido no email
            para reabrir esta página.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <FieldGroup>
            {(error || status) && (
              <div
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm",
                  error
                    ? "border-red-500/40 bg-red-500/10 text-red-200"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
                )}
              >
                {error || status}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="password">Nova senha</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmation">Confirmar nova senha</FieldLabel>
              <Input
                id="confirmation"
                type="password"
                placeholder="••••••••"
                className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Field>

            <Field>
              <Button
                type="submit"
                disabled={isSubmitting || hasSession === false}
                className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50"
              >
                {isSubmitting ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </Field>

            <Field>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-white/80"
                onClick={() => router.push("/login")}
              >
                Voltar para o login
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
