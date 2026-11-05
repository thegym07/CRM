import { createHmac, timingSafeEqual } from 'node:crypto'

// Session signée : le cookie contient une date d'expiration + une signature HMAC.
// Impossible à fabriquer sans le secret serveur (avant : valeur fixe « authenticated »,
// lisible dans le code public). Changer le mot de passe invalide toutes les sessions.
export const SESSION_COOKIE = 'gym_session'
export const SESSION_DUREE_S = 60 * 60 * 24 * 30 // 30 jours

function secret(): string {
  const s = process.env.SESSION_SECRET
    || [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.ADMIN_PASSWORD_HASH ?? process.env.ADMIN_PASSWORD].filter(Boolean).join('|')
  if (!s) throw new Error('Secret de session manquant (SESSION_SECRET ou SUPABASE_SERVICE_ROLE_KEY)')
  return s
}

const signer = (data: string) => createHmac('sha256', secret()).update(data).digest('base64url')

function egal(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function creerSession(): string {
  const data = `v1.${Math.floor(Date.now() / 1000) + SESSION_DUREE_S}`
  return `${data}.${signer(data)}`
}

export function sessionValide(valeur: string | undefined | null): boolean {
  if (!valeur) return false
  const [version, exp, sig] = valeur.split('.')
  if (version !== 'v1' || !/^\d+$/.test(exp ?? '') || !sig) return false
  if (Number(exp) < Date.now() / 1000) return false
  try {
    return egal(sig, signer(`v1.${exp}`))
  } catch {
    return false
  }
}

// Lien public d'un Bilan Forme (?r=) : l'id du prospect + une signature courte,
// pour qu'on ne puisse pas lire les réponses d'un autre en devinant un id.
export function signerIdBilan(id: string): string {
  return `${id}.${signer(`bilan:${id}`).slice(0, 22)}`
}

/** Renvoie l'id si le lien signé est valide, sinon null. */
export function lireIdBilan(r: string): string | null {
  const [id, sig] = r.split('.')
  if (!id || !sig) return null
  try {
    return egal(sig, signer(`bilan:${id}`).slice(0, 22)) ? id : null
  } catch {
    return null
  }
}
