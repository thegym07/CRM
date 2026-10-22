// Envoi de SMS via Brevo (POST /v3/transactionalSMS/send).
// Clé API dans la variable d'environnement BREVO_API_KEY (Vercel), jamais en base.

const SENDER = 'THEGYM' // nom d'expéditeur affiché : 11 caractères alphanumériques max

export const smsConfigure = () => !!process.env.BREVO_API_KEY

/** 06 12 34 56 78 / +33 6… / 0033 6… → 33612345678. null si numéro inexploitable. */
export function telInternational(tel: string | null | undefined): string | null {
  if (!tel) return null
  let t = tel.replace(/[^\d+]/g, '')
  if (t.startsWith('+')) t = t.slice(1)
  else if (t.startsWith('00')) t = t.slice(2)
  else if (t.startsWith('0')) t = '33' + t.slice(1)
  return /^\d{9,15}$/.test(t) ? t : null
}

// Les SMS standards (160 caractères) n'acceptent qu'une partie des accents :
// on remplace ceux qui forceraient un encodage plus coûteux.
function versGsm(texte: string): string {
  return texte
    .replace(/[âä]/g, 'a').replace(/[êë]/g, 'e').replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o').replace(/[ûü]/g, 'u').replace(/ç/g, 'c')
    .replace(/[’‘]/g, "'").replace(/[«»“”]/g, '"').replace(/[—–]/g, '-')
    .replace(/…/g, '...')
}

export type ResultatSms = { ok: true } | { ok: false; erreur: string }

export async function envoyerSms(tel: string | null | undefined, texte: string): Promise<ResultatSms> {
  const cle = process.env.BREVO_API_KEY
  if (!cle) return { ok: false, erreur: 'Service SMS non configuré (BREVO_API_KEY manquante)' }
  const recipient = telInternational(tel)
  if (!recipient) return { ok: false, erreur: 'Numéro de téléphone invalide' }

  try {
    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: SENDER, recipient, content: versGsm(texte), type: 'transactional' }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[SMS] échec', res.status, detail.slice(0, 300))
      return { ok: false, erreur: `Refus du service SMS (${res.status})${detail.includes('credit') ? ' : crédits SMS épuisés ?' : ''}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[SMS] erreur', err instanceof Error ? err.message : err)
    return { ok: false, erreur: 'Service SMS injoignable' }
  }
}
