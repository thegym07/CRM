import nodemailer from 'nodemailer'

// Envoi d'e-mails depuis la vraie boîte Gmail de la salle (gratuit, 500/jour).
// Un mail parti d'un vrai compte Gmail, en texte simple, arrive bien mieux en
// boîte principale qu'un mail de plateforme d'envoi.
// Variables d'environnement (Vercel) : GMAIL_USER + GMAIL_APP_PASSWORD
// (mot de passe d'application Google, pas le mot de passe du compte).

export const emailConfigure = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)

export const emailValide = (e: string | null | undefined) =>
  !!e && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

export type ResultatEmail = { ok: true } | { ok: false; erreur: string }

export async function envoyerEmail(to: string | null | undefined, sujet: string, texte: string): Promise<ResultatEmail> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return { ok: false, erreur: 'Envoi d’e-mails pas encore branché (GMAIL_USER / GMAIL_APP_PASSWORD manquants)' }
  if (!emailValide(to)) return { ok: false, erreur: 'Adresse e-mail invalide' }

  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass: pass.replace(/\s/g, '') } })
    await transport.sendMail({
      from: { name: 'THE GYM', address: user },
      to: to!.trim(),
      subject: sujet,
      text: texte,
    })
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[EMAIL] échec :', msg)
    return { ok: false, erreur: /Invalid login|535|Username and Password/i.test(msg) ? 'Gmail refuse la connexion : vérifie le mot de passe d’application' : 'Envoi impossible' }
  }
}
