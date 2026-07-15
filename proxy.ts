import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'gym_session'
const SESSION_VALUE = 'authenticated'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)
  const isAuthenticated = session?.value === SESSION_VALUE

  // Routes publiques : login, auth API, webhook Meta, formulaire d'inscription public
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/inscription' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/leads/meta') ||
    pathname.startsWith('/api/inscription')

  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
