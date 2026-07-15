import { cookies } from 'next/headers'

const SESSION_COOKIE = 'gym_session'
const SESSION_VALUE = 'authenticated'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === SESSION_VALUE
}

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export function getSessionCookieValue() {
  return SESSION_VALUE
}
