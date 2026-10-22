// Conversions heure de Paris <-> instant UTC, indépendantes du fuseau du serveur
// (Vercel tourne en UTC) et correctes aux changements d'heure.

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris',
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
})

/** Date + heure lues sur une horloge parisienne pour un instant donné. */
export function parisParts(d: Date | string): { date: string; hour: number; minute: number } {
  const parts = fmt.formatToParts(typeof d === 'string' ? new Date(d) : d)
  const get = (t: string) => parts.find(p => p.type === t)!.value
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  }
}

/** Instant UTC correspondant à « date à hour:minute » heure de Paris. */
export function parisToUtc(date: string, hour: number, minute = 0): Date {
  const [y, m, d] = date.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, hour, minute)
  const p = parisParts(new Date(guess))
  const [py, pm, pd] = p.date.split('-').map(Number)
  const offset = Date.UTC(py, pm - 1, pd, p.hour, p.minute) - guess
  return new Date(guess - offset)
}

/** Ajoute n jours à une date 'YYYY-MM-DD' (calendrier, sans fuseau). */
export function addJoursDate(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Lundi (YYYY-MM-DD) de la semaine contenant la date donnée. */
export function lundiDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const jour = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7 // 0 = lundi
  return addJoursDate(date, -jour)
}
