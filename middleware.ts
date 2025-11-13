import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Se acessar /dashboard sem estar logado, redirecionar para /login
  if (pathname.startsWith('/dashboard')) {
    const isAuthenticated = request.cookies.get('auth-token')?.value

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
