// Périodes de paie des commissions : elles s'arrêtent le 25 de chaque mois.
// La période « 2026-12 » va du 26 novembre au 25 décembre inclus (payée avec décembre).
// Tout est lu en heure de Paris, quel que soit le fuseau du serveur.

/** Dernier jour inclus d'une période (le 25). */
export const JOUR_CLOTURE = 25

const jourParis = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) // YYYY-MM-DD

const moisSuivant = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

export const moisPrecedent = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

// Bascule : jusqu'à octobre 2026 les commissions étaient payées au mois civil (octobre = 1er → 31).
// Pour ne rien payer deux fois, la période de transition « Novembre 2026 » va du 1er au 25/11,
// puis toutes les suivantes vont du 26 au 25.
const DEBUT_TRANSITION = '2026-11'

/** Période (YYYY-MM) à laquelle appartient un instant : jusqu'au 25 inclus = ce mois, après = mois suivant. */
export function periodeDe(iso: string): string {
  const j = jourParis(iso)
  const mois = j.slice(0, 7)
  if (mois < DEBUT_TRANSITION) return mois // ancien régime : mois civil
  return Number(j.slice(8, 10)) <= JOUR_CLOTURE ? mois : moisSuivant(mois)
}

/** Période en cours (heure de Paris). */
export const periodeActuelle = () => periodeDe(new Date().toISOString())

export const periodeValide = (p: unknown): p is string =>
  typeof p === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(p)

const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** « Décembre 2026 » */
export function labelPeriode(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const nom = NOMS_MOIS[m - 1]
  return `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${y}`
}

/** « du 26/11 au 25/12 » (« du 01/10 au 31/10 » avant la bascule, « du 01/11 au 25/11 » pour la transition) */
export function bornesPeriode(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const deux = (n: number) => String(n).padStart(2, '0')
  if (key < DEBUT_TRANSITION) return `du 01/${deux(m)} au ${new Date(Date.UTC(y, m, 0)).getUTCDate()}/${deux(m)}`
  if (key === DEBUT_TRANSITION) return `du 01/${deux(m)} au ${JOUR_CLOTURE}/${deux(m)}`
  const mPrec = Number(moisPrecedent(key).slice(5, 7))
  return `du ${JOUR_CLOTURE + 1}/${deux(mPrec)} au ${JOUR_CLOTURE}/${deux(m)}`
}
