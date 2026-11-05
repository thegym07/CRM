// SMS pré-écrits, envoyés depuis le téléphone de la commerciale (gratuit) :
// le bouton ouvre l'application Messages avec le texte prêt, il ne reste qu'à envoyer.
// Vouvoiement, court, signé « L'équipe THE GYM ». Modifier les textes ici.

import type { Lead } from './supabase'

const SIGNATURE = "L'équipe THE GYM"

export const prenom = (nom: string) => nom.trim().split(/\s+/)[0] || ''

/** Lien qui ouvre Messages avec le texte (format compris par iPhone et Android). */
export function lienSms(telephone: string, texte: string): string {
  return `sms:${telephone.replace(/\s/g, '')}?&body=${encodeURIComponent(texte)}`
}

const quand = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
    .replace(':', 'h')

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h')

const jourParis = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

export const SMS = {
  injoignable: (p: string, aDemandeEssai: boolean) =>
    `Bonjour ${p}, c'est THE GYM à Rosières. ${aDemandeEssai ? "Vous avez demandé votre séance d'essai offerte : j'ai essayé de vous appeler." : "J'ai essayé de vous appeler au sujet de votre séance d'essai offerte."} Quand puis-je vous rappeler ? Vous pouvez aussi me répondre ici avec le jour qui vous arrange. ${SIGNATURE}`,
  relance: (p: string) =>
    `Bonjour ${p}, votre séance d'essai offerte à THE GYM vous attend toujours. Dites-moi simplement le jour et l'heure qui vous arrangent, je vous réserve le créneau. ${SIGNATURE}`,
  confirmation: (p: string, dateRdv: string) =>
    `Bonjour ${p}, c'est noté pour votre séance d'essai offerte à THE GYM le ${quand(dateRdv)}. Adresse : 565 route des Vernades, Rosières. Prévoyez une tenue de sport et une bouteille d'eau. À très vite ! ${SIGNATURE}`,
  rappel: (p: string, dateRdv: string, jour: "aujourd'hui" | 'demain') =>
    `Bonjour ${p}, petit rappel : votre séance d'essai à THE GYM, c'est ${jour} à ${heure(dateRdv)}. Un empêchement ? Répondez simplement à ce message. ${SIGNATURE}`,
  apresSeance: (p: string) =>
    `Bonjour ${p}, merci pour votre venue à THE GYM ! Comment s'est passée votre séance ? Si vous souhaitez continuer, je vous prépare la formule la plus adaptée à votre rythme. ${SIGNATURE}`,
  absent: (p: string) =>
    `Bonjour ${p}, votre séance d'essai à THE GYM n'a pas pu avoir lieu. Pas de souci : dites-moi le jour qui vous arrange et on la refixe. ${SIGNATURE}`,
}

/** SMS à proposer pour un RDV à venir : rappel s'il a lieu aujourd'hui ou demain, sinon confirmation. */
export function smsRdv(lead: Pick<Lead, 'nom' | 'date_rdv'>): { label: string; texte: string } | null {
  if (!lead.date_rdv || new Date(lead.date_rdv).getTime() < Date.now()) return null
  const p = prenom(lead.nom)
  const jour = jourParis(new Date(lead.date_rdv).getTime())
  if (jour === jourParis(Date.now())) return { label: 'Rappel', texte: SMS.rappel(p, lead.date_rdv, "aujourd'hui") }
  if (jour === jourParis(Date.now() + 86400000)) return { label: 'Rappel', texte: SMS.rappel(p, lead.date_rdv, 'demain') }
  return { label: 'Confirmer', texte: SMS.confirmation(p, lead.date_rdv) }
}

/**
 * SMS pour un prospect pas encore joint (onglet Prospects) : seulement après au moins un appel.
 * « Vous avez demandé votre séance » n'est dit qu'aux personnes qui l'ont vraiment demandée.
 */
export function smsProspect(lead: Pick<Lead, 'nom' | 'source' | 'diagnostic'>, nbAppels: number): string | null {
  if (nbAppels === 0) return null
  const p = prenom(lead.nom)
  if (nbAppels > 1) return SMS.relance(p)
  const aDemande = lead.source === 'Meta Ads' || lead.source === 'Formulaire web' || !!lead.diagnostic?.candidature
  return SMS.injoignable(p, aDemande)
}

/** SMS à proposer dans les relances, selon ce qui s'est passé. */
export function smsRelance(lead: Pick<Lead, 'nom' | 'rdv_honore'>): string {
  const p = prenom(lead.nom)
  if (lead.rdv_honore === true) return SMS.apresSeance(p)
  if (lead.rdv_honore === false) return SMS.absent(p)
  return SMS.relance(p)
}
