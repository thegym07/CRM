import { getReglages } from './reglages'
import { envoyerSms } from './sms'
import type { Lead } from './supabase'
import type { Coach, Creneau } from './agenda'

// Notifications SMS, déclenchées selon l'onglet Réglages.
// Ne lèvent jamais d'erreur : un SMS raté ne doit pas bloquer l'arrivée d'un prospect ou une réservation.

/** Nouveau prospect (pub Meta ou formulaire du site) → SMS à la commerciale. */
export async function notifierNouveauProspect(lead: Pick<Lead, 'nom' | 'telephone' | 'source'>): Promise<void> {
  try {
    const { smsProspects } = await getReglages()
    if (!smsProspects.actif || !smsProspects.telephone) return
    const tel = lead.telephone ? ` - ${lead.telephone}` : ''
    await envoyerSms(smsProspects.telephone, `THE GYM : nouveau prospect ${lead.nom}${tel} (${lead.source}). A rappeler vite !`)
  } catch (err) {
    console.error('[NOTIF] nouveau prospect :', err instanceof Error ? err.message : err)
  }
}

/** Créneau réservé → SMS au coach concerné. */
export async function notifierCoachNouveauRdv(
  coach: Coach | undefined,
  creneau: Creneau,
  lead: Pick<Lead, 'nom' | 'telephone'>,
): Promise<void> {
  try {
    if (!coach?.telephone) return
    const { smsCoachRdv } = await getReglages()
    if (!smsCoachRdv.actif) return
    const quand = new Date(creneau.debut).toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
    })
    const tel = lead.telephone ? ` (${lead.telephone})` : ''
    await envoyerSms(coach.telephone, `THE GYM : nouveau RDV ${quand} avec ${lead.nom}${tel}. Bonne seance !`)
  } catch (err) {
    console.error('[NOTIF] RDV coach :', err instanceof Error ? err.message : err)
  }
}
