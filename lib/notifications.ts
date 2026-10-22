import { getReglages } from './reglages'
import { envoyerEmail } from './email'
import type { Lead } from './supabase'
import type { Coach, Creneau } from './agenda'

// Notifications par e-mail, déclenchées selon l'onglet Réglages.
// Ne lèvent jamais d'erreur : un e-mail raté ne doit pas bloquer l'arrivée d'un prospect ou une réservation.

const CRM = 'https://crm-thegym.vercel.app'

/** Nouveau prospect (pub Meta ou formulaire du site) → e-mail à la commerciale. */
export async function notifierNouveauProspect(
  lead: Pick<Lead, 'id' | 'nom' | 'telephone' | 'email' | 'source'>,
  details: string[] = [],
): Promise<void> {
  try {
    const { emailProspects } = await getReglages()
    if (!emailProspects.actif || !emailProspects.email) return
    await envoyerEmail(
      emailProspects.email,
      `Nouveau prospect : ${lead.nom}`,
      [
        `Bonjour,`,
        ``,
        `Un nouveau prospect vient d'arriver (${lead.source}) :`,
        ``,
        `${lead.nom}`,
        lead.telephone ? `Téléphone : ${lead.telephone}` : null,
        lead.email ? `E-mail : ${lead.email}` : null,
        ...details,
        ``,
        `Rappelle-le vite, c'est maintenant qu'il est le plus chaud !`,
        `Sa fiche : ${CRM}/leads/${lead.id}`,
        ``,
        `THE GYM`,
      ].filter(l => l !== null).join('\n'),
    )
  } catch (err) {
    console.error('[NOTIF] nouveau prospect :', err instanceof Error ? err.message : err)
  }
}

/** Candidature à la séance d'essai (Bilan Forme) → e-mail à la commerciale. */
export async function notifierCandidature(
  lead: Pick<Lead, 'id' | 'nom' | 'telephone'>,
  details: string[],
): Promise<void> {
  try {
    const { emailProspects } = await getReglages()
    if (!emailProspects.actif || !emailProspects.email) return
    await envoyerEmail(
      emailProspects.email,
      `🔥 ${lead.nom} veut sa séance d'essai`,
      [
        `Bonjour,`,
        ``,
        `${lead.nom} vient de postuler pour sa séance d'essai offerte (Bilan Forme).`,
        lead.telephone ? `Téléphone : ${lead.telephone}` : null,
        ...details,
        ``,
        `On lui a promis un rappel sous 24-48 h pour fixer la séance.`,
        `Sa fiche : ${CRM}/leads/${lead.id}`,
        ``,
        `THE GYM`,
      ].filter(l => l !== null).join('\n'),
    )
  } catch (err) {
    console.error('[NOTIF] candidature :', err instanceof Error ? err.message : err)
  }
}

/** Créneau réservé → e-mail au coach concerné. */
export async function notifierCoachNouveauRdv(
  coach: Coach | undefined,
  creneau: Creneau,
  lead: Pick<Lead, 'nom' | 'telephone'>,
): Promise<void> {
  try {
    if (!coach?.email) return
    const { emailCoachRdv } = await getReglages()
    if (!emailCoachRdv.actif) return
    const quand = new Date(creneau.debut).toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
    })
    await envoyerEmail(
      coach.email,
      `Nouveau RDV THE GYM : ${quand}`,
      [
        `Salut ${coach.nom},`,
        ``,
        `Tu as un nouveau RDV : ${quand}`,
        `Avec : ${lead.nom}`,
        lead.telephone ? `Téléphone : ${lead.telephone}` : null,
        ``,
        `Tous tes RDV : ${CRM}/coach/${coach.ical_token}`,
        ``,
        `Bonne séance !`,
        `THE GYM`,
      ].filter(l => l !== null).join('\n'),
    )
  } catch (err) {
    console.error('[NOTIF] RDV coach :', err instanceof Error ? err.message : err)
  }
}
