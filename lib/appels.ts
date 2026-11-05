// Historique de contact d'un prospect (colonne leads.appels, tableau JSON).
// Chaque entrée : horodatage ISO, suivi éventuellement de « |code » :
//   nr = appel sans réponse · rep = a répondu · sms = SMS envoyé
//   go = remis en prospect (il redemande une séance) : la séquence de relance repart de zéro
// Les anciennes entrées (ISO seul) sont des appels sans résultat noté.

export type ResultatAppel = 'nr' | 'rep' | 'sms' | 'go'
export type Contact = { t: string; r: ResultatAppel | null }

export const ENTREE_VALIDE = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z(\|(nr|rep|sms|go))?$/

export function lireContact(entree: string): Contact {
  const [t, r] = entree.split('|')
  return { t, r: r === 'nr' || r === 'rep' || r === 'sms' || r === 'go' ? r : null }
}

export const nouvelleEntree = (r: ResultatAppel) => `${new Date().toISOString()}|${r}`

const temps = (entree: string) => new Date(entree.split('|')[0]).getTime()

/** Appels téléphoniques uniquement (ni les SMS ni les remises en prospect ne comptent). */
export const appelsSeuls = (appels: string[] | null | undefined) =>
  (appels ?? []).filter(a => { const r = lireContact(a).r; return r !== 'sms' && r !== 'go' })

export const nbAppels = (appels: string[] | null | undefined) => appelsSeuls(appels).length

/** Appels sans réponse depuis le dernier « a répondu » ou la dernière remise en prospect. */
export function nbSansReponse(appels: string[] | null | undefined): number {
  let n = 0
  for (const a of appels ?? []) {
    const r = lireContact(a).r
    if (r === 'nr') n++
    else if (r === 'rep' || r === 'go') n = 0
  }
  return n
}

/** Date (ms) du dernier contact, appel ou SMS ; null si jamais contacté. */
export function dernierContact(appels: string[] | null | undefined): number | null {
  const liste = (appels ?? []).filter(a => lireContact(a).r !== 'go')
  return liste.length > 0 ? Math.max(...liste.map(temps)) : null
}

// Séquence de relance après un appel sans réponse : nombre de jours avant le
// prochain essai, selon le nombre d'appels sans réponse déjà passés.
// Au-delà, on propose de classer le prospect en « Perdu — injoignable ».
const DELAIS_JOURS = [1, 1, 2, 3, 7]
export const MAX_SANS_REPONSE = DELAIS_JOURS.length + 1

/** Date YYYY-MM-DD (heure de Paris) du prochain essai, ou null si la séquence est finie. */
export function prochainEssai(sansReponse: number): string | null {
  const delai = DELAIS_JOURS[sansReponse - 1]
  if (delai === undefined) return null
  const d = new Date(Date.now() + delai * 86400000)
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
}

export const aujourdhuiParis = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
