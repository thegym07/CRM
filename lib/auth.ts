import { cookies } from 'next/headers'
import { SESSION_COOKIE, sessionValide } from './session'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return sessionValide(cookieStore.get(SESSION_COOKIE)?.value)
}
