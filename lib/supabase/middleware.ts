import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/supabase'

const PROTECTED_PATHS = [/^\/dashboard(\/.*)?$/, /^\/admin$/]

const requireEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Supabase environment variable ${key} is not configured.`)
  }
  return value
}

const supabaseUrl = requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

type SupabaseCookie = {
  name: string
  value: string
  options: CookieOptions
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const requiresAuth = PROTECTED_PATHS.some((regex) => regex.test(request.nextUrl.pathname))

  if (!user && requiresAuth) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    if (request.nextUrl.pathname !== '/login') {
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search)
    }
    return NextResponse.redirect(redirectUrl)
  }

  if (user && request.nextUrl.pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirecionar /admin para /dashboard quando autenticado
  if (user && request.nextUrl.pathname === '/admin') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
