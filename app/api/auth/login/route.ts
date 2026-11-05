import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { creerSession, SESSION_COOKIE, SESSION_DUREE_S } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  const validUsername = process.env.ADMIN_USERNAME
  const validPasswordHash = process.env.ADMIN_PASSWORD_HASH
  const validPasswordPlain = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    return NextResponse.json({ error: 'Identifiants manquants' }, { status: 400 })
  }

  if (username !== validUsername) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  let passwordValid = false
  if (validPasswordHash) {
    passwordValid = await bcrypt.compare(password, validPasswordHash)
  } else if (validPasswordPlain) {
    // Fallback: comparaison directe (pour dev, utiliser ADMIN_PASSWORD_HASH en prod)
    passwordValid = password === validPasswordPlain
  }

  if (!passwordValid) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, creerSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DUREE_S,
    path: '/',
  })

  return response
}
