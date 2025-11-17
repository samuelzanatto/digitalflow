"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient, type SupabaseBrowserClient } from "@/lib/supabase/client"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabaseRef = useRef<SupabaseBrowserClient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [mode, setMode] = useState<"login" | "recovery">("login")

  const ensureSupabaseClient = () => {
    if (supabaseRef.current) {
      return supabaseRef.current
    }

    if (typeof window === "undefined") {
      return null
    }

    try {
      supabaseRef.current = createSupabaseBrowserClient()
      return supabaseRef.current
    } catch (err) {
      console.error('Falha ao criar cliente Supabase no login:', err)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setInfo("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const supabase = ensureSupabaseClient()

    if (!supabase) {
      setError("Não conseguimos carregar o cliente de autenticação. Recarregue a página e tente novamente.")
      setIsLoading(false)
      return
    }

    if (!email) {
      setError("Informe um email válido")
      setIsLoading(false)
      return
    }

    if (!supabase) {
      setError("Ainda estamos inicializando o cliente de autenticação. Tente novamente em instantes.")
      setIsLoading(false)
      return
    }

    if (mode === "login") {
      if (!password) {
        setError("Digite sua senha")
        setIsLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      const redirectTo = searchParams?.get("redirectTo")
      const nextPath = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"
      router.push(nextPath)
      router.refresh()
      setIsLoading(false)
      return
    } else {
          const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (recoveryError) {
        setError(recoveryError.message)
        setIsLoading(false)
        return
      }

      setInfo("Enviamos um email com o link para redefinição de senha.")
    }

    setIsLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Flow Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-extralight font-poppins text-foreground">
                flow
              </h1>
            </div>
            <p className="text-sm pt-4 text-muted-foreground">
              Faça login na sua conta para continuar
            </p>
          </div>

          {(error || info) && (
            <div
              className={cn(
                "px-4 py-2 rounded-lg text-sm border",
                error
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
              )}
            >
              {error || info}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground"
            />
          </Field>

          {mode === "login" && (
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required={mode === "login"}
                className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground"
              />
            </Field>
          )}

          <Field>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50"
            >
              {isLoading
                ? mode === "login"
                  ? "Entrando..."
                  : "Enviando..."
                : mode === "login"
                  ? "Entrar"
                  : "Enviar link de recuperação"}
            </Button>
          </Field>

          <Field>
            <Button
              type="button"
              variant="link"
              className="w-full text-center text-sm"
              onClick={() => {
                setMode((value) => (value === "login" ? "recovery" : "login"))
                setError("")
                setInfo("")
              }}
            >
              {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
