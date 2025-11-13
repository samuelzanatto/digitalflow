"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validação simples (em produção, fazer chamada a um servidor)
    if (email && password) {
      // Criar um token de autenticação
      document.cookie = "auth-token=authenticated; path=/; max-age=86400"
      
      // Redirecionar para dashboard
      router.push("/dashboard")
    } else {
      setError("Por favor, preencha todos os campos")
      setIsLoading(false)
    }
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
              <h1 className="text-2xl font-extralight text-white font-poppins">
                flow
              </h1>
            </div>
            <p className="text-sm pt-4 text-white/60">
              Faça login na sua conta para continuar
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
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
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </Field>

          <Field>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
