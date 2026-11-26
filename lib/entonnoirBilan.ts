// Entonnoir anonyme du Bilan Forme : combien de visiteurs ouvrent le bilan, arrivent à chaque
// question, laissent leur prénom + téléphone, puis demandent la séance d'essai.
// Aucune donnée personnelle, aucun cookie : de simples compteurs par jour × canal × étape
// (table reglages, une ligne par jour : « bilan_etapes:AAAA-MM-JJ »).
// Ce fichier est partagé par la page publique (envoi) et le CRM (affichage) : rien de serveur ici.

import { QUESTIONS } from './bilan'

export const ETAPES = [
  'ouverture',
  ...QUESTIONS.map((q) => q.id),
  'contact', // arrivé au formulaire prénom + téléphone
  'envoi',   // bilan envoyé = prospect créé dans le CRM
  'essai',   // a demandé la séance d'essai depuis son bilan
  'membre',  // déjà adhérent (bilan sans prospect)
] as const
export type Etape = (typeof ETAPES)[number]

export const LIBELLE_ETAPE: Record<string, string> = {
  ouverture: 'Bilan ouvert',
  ...Object.fromEntries(QUESTIONS.map((q, i) => [q.id, `Q${i + 1} · ${q.short}`])),
  contact: 'Formulaire prénom + tél.',
  envoi: 'Bilan envoyé (prospect)',
  essai: 'Séance d’essai demandée',
  membre: 'Déjà adhérent',
}

/** Canaux connus (?src=) ; tout le reste est compté en « autre », l'absence en « aucun ». */
export const CANAUX = [
  'wa', 'ig', 'story', 'bio', 'ads', 'fb', 'site', 'qr', 'sms',
  'google', 'google-post', 'google-produit',
  'site-fiche', 'site-google', 'site-fb', 'site-ig', 'site-direct', 'site-autre',
  'test',
] as const

export const PREFIXE_ETAPES = 'bilan_etapes:'

export function canalDe(src: string | null | undefined): string {
  const s = (src ?? '').trim().toLowerCase()
  if (!s) return 'aucun'
  return (CANAUX as readonly string[]).includes(s) ? s : 'autre'
}

export const etapeValide = (e: unknown): e is Etape => typeof e === 'string' && (ETAPES as readonly string[]).includes(e)

// --- Côté navigateur : un signal par étape et par chargement de page, jamais bloquant ---
const dejaEnvoyees = new Set<string>()

export function signalerEtape(etape: Etape, src: string | null | undefined) {
  if (typeof window === 'undefined' || dejaEnvoyees.has(etape)) return
  dejaEnvoyees.add(etape)
  try {
    const corps = JSON.stringify({ e: etape, c: canalDe(src) })
    const envoye = typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/bilan/etape', new Blob([corps], { type: 'text/plain' }))
    if (!envoye) {
      fetch('/api/bilan/etape', { method: 'POST', body: corps, keepalive: true }).catch(() => {})
    }
  } catch {
    /* le compteur ne doit jamais gêner le bilan */
  }
}

export const LIBELLE_CANAL: Record<string, string> = {
  wa: 'WhatsApp', ig: 'Instagram', story: 'Story', bio: 'Bio Instagram', ads: 'Pub', fb: 'Facebook', site: 'Site',
  qr: 'QR code', sms: 'SMS', google: 'Fiche Google', 'google-post': 'Post Google', 'google-produit': 'Tarif Google',
  'site-fiche': 'Site ← fiche Google', 'site-google': 'Site ← recherche Google', 'site-fb': 'Site ← Facebook',
  'site-ig': 'Site ← Instagram', 'site-direct': 'Site ← accès direct', 'site-autre': 'Site ← autre site',
  aucun: 'Lien sans source', autre: 'Autre',
}

/** Étapes affichées dans l'entonnoir (« membre » est à part). */
export const ETAPES_ENTONNOIR = ETAPES.filter((e) => e !== 'membre')
export const QUESTION_CONDITIONNELLE = new Set<string>(QUESTIONS.filter((q) => q.showIf).map((q) => q.id))
