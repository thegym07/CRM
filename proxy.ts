import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, sessionValide } from '@/lib/session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = sessionValide(request.cookies.get(SESSION_COOKIE)?.value)

  // Routes publiques : login, auth API, webhook Meta, formulaire d'inscription et Bilan Forme publics
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/inscription' ||
    pathname === '/confidentialite' ||
    // Bilan Forme public (page, images /bilan/*, API)
    pathname === '/bilan' ||
    pathname.startsWith('/bilan/') ||
    pathname.startsWith('/api/bilan') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/leads/meta') ||
    pathname.startsWith('/api/inscription') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/calendar') ||
    // Page perso des coachs : accès par lien secret (token), sans mot de passe
    pathname.startsWith('/coach/') ||
    pathname.startsWith('/api/coach/')

  if (!isPublicPath && !isAuthenticated) {
    // Les appels d'API reçoivent une vraie erreur (pas une page de connexion)
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
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
