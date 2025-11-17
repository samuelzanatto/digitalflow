## Visão geral

Projeto Next.js 16 (App Router) que integra Supabase para autenticação real, chat em tempo real e painel administrativo.

- Login baseado em email/senha com fluxo PKCE (`/auth/callback`).
- Recuperação de senha primeiro-partido em `/auth/reset-password`.
- Chat da equipe (`/dashboard/equipe`) com mensagens vinculadas ao usuário autenticado.
- Painel de gerenciamento de usuários em `/dashboard/usuarios` com convites, reset remoto de senha e proteção do admin principal.

## Pré-requisitos

1. **Supabase project** com Auth e Database ativos.
2. **Variáveis de ambiente** (adicione em `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...           # usado apenas no servidor
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_ADMIN_EMAIL=admin@empresa.com
```

`SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposto no cliente – apenas o Next.js server utiliza nas server actions.

## Configuração Supabase

1. **Redirects de Auth**
	- Dashboard → Authentication → URL Configuration.
	- Adicione `https://seu-app.com/auth/callback` e `https://seu-app.com/auth/reset-password` (troque para `http://localhost:3000` em dev).

2. **Template de e-mail**
	- Em *Auth → Templates → Confirm signup* substitua `{{ .ConfirmationURL }}` por `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.

3. **Tabela de chat** (caso ainda não exista):

```sql
create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  content text not null,
  inserted_at timestamp with time zone default now()
);

alter table public.team_messages enable row level security;

create policy "chat leitura" on public.team_messages for select using (auth.role() = 'authenticated');
create policy "chat escrita" on public.team_messages for insert with check (auth.uid() = user_id);
```

4. **Bucket de previews** – mantenha o bucket `page-previews` público se quiser que as imagens geradas continuem acessíveis.

5. **Admin fixo** – configure `NEXT_PUBLIC_ROOT_ADMIN_EMAIL` com o email do administrador que não pode ser excluído pelo painel.

## Rodando localmente

```bash
npm install
npm run dev
```

O middleware (`middleware.ts`) mantém a sessão Supabase em sincronia e redireciona usuários não autenticados que tentarem acessar `/dashboard/*`.

## Painel de usuários

- A página `/dashboard/usuarios` lista todos os usuários (`auth.admin.listUsers`).
- Botões: **Enviar convite**, **Resetar senha** (dispara email de recuperação) e **Remover** (desabilitado para o admin raiz).
- As ações utilizam server actions em `app/dashboard/usuarios/actions.ts`, logo dependem de `SUPABASE_SERVICE_ROLE_KEY` configurada.

## Recuperação de senha

- Usuários podem solicitar o reset diretamente no formulário de login (aba "Esqueci minha senha").
- O email enviado pelo Supabase aponta para `/auth/reset-password`, onde o usuário define a nova senha.

## Executando lint

```bash
npm run lint
```

Resolva qualquer aviso antes de abrir PR/deploy para garantir que as server actions e componentes (principalmente os client components em `/dashboard`) continuem determinísticos.
