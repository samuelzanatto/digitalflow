import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Digital Flow
            </h1>
            <p className="text-sm text-white/60">
              Faça login na sua conta para continuar
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
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
              type="password"
              placeholder="••••••••"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </Field>

          <Field>
            <Button 
              type="submit"
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50"
            >
              Entrar
            </Button>
          </Field>

          <div className="text-center text-sm">
            <p className="text-white/60">
              Não tem uma conta?{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300 font-semibold">
                Criar conta
              </a>
            </p>
          </div>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center text-xs">
        Ao continuar, você concorda com nossos{" "}
        <a href="#" className="text-purple-400 hover:text-purple-300">
          Termos de Serviço
        </a>{" "}
        e{" "}
        <a href="#" className="text-purple-400 hover:text-purple-300">
          Política de Privacidade
        </a>
        .
      </FieldDescription>
    </div>
  )
}
