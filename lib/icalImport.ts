import ical from 'node-ical'
import { supabase } from './supabaseServer'
import type { Coach } from './agenda'

// ── Import des disponibilités depuis l'agenda perso du coach (Google / iPhone) ──
// Convention : tout événement dont le titre contient « dispo » (peu importe la
// casse) est importé comme créneaux réservables, découpés en tranches d'1 h.
// TOUT AUTRE événement de son agenda (coaching ailleurs, perso…) annule
// automatiquement les créneaux libres qu'il chevauche : le coach gère tout
// depuis son agenda, sans jamais passer par le CRM.
// Les créneaux importés non réservés qui disparaissent de l'agenda sont retirés ;
// les créneaux déjà réservés par une cliente ne sont jamais touchés.

const HORIZON_JOURS = 56       // on importe 8 semaines glissantes
const TRANCHE_MIN = 60         // durée d'un créneau réservable (minutes)
const TIMEOUT_MS = 8000

// Le mot « Dispo » (ou « Dispos ») isolé : « Indispo » et « Disponible » ne comptent pas
const estDispo = (summary: unknown) =>
  typeof summary === 'string' ? /(^|[^\p{L}])dispos?([^\p{L}]|$)/iu.test(summary) : false

type Fenetre = { debut: Date; fin: Date }

function decoupe(occ: Fenetre, slots: Fenetre[]) {
  const dureeMs = occ.fin.getTime() - occ.debut.getTime()
  if (dureeMs < 30 * 60000) return // moins de 30 min : inutilisable
  if (dureeMs < TRANCHE_MIN * 60000) { slots.push(occ); return }
  let t = occ.debut.getTime()
  while (t + TRANCHE_MIN * 60000 <= occ.fin.getTime()) {
    slots.push({ debut: new Date(t), fin: new Date(t + TRANCHE_MIN * 60000) })
    t += TRANCHE_MIN * 60000
  }
}

export type ResultatSync =
  | { ok: true; dispos: number; evenements: number }
  | { ok: false; erreur: string }

/** Lit un agenda iCal (Google / iCloud). webcal:// est converti en https://. */
async function lireAgenda(urlBrute: string) {
  const url = urlBrute.trim().replace(/^webcal:\/\//i, 'https://')
  return Promise.race([
    ical.async.fromURL(url),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)),
  ])
}

/**
 * Lit l'agenda et calcule les créneaux réellement disponibles :
 * événements « Dispo » découpés en tranches, moins tout ce qui chevauche un
 * autre événement. Les événements marqués « Disponible » (TRANSP:TRANSPARENT)
 * et les annulés ne bloquent rien.
 */
async function analyserAgenda(urlBrute: string): Promise<{ disponibles: Fenetre[]; evenements: number }> {
  const data = await lireAgenda(urlBrute)
  const maintenant = new Date()
  const horizon = new Date(Date.now() + HORIZON_JOURS * 86400000)
  const slots: Fenetre[] = []
  const occupes: Fenetre[] = []   // tous ses AUTRES événements = indisponible
  let evenements = 0

  for (const ev of Object.values(data)) {
    if (!ev || (ev as { type?: string }).type !== 'VEVENT') continue
    const e = ev as {
      summary?: unknown; start?: Date; end?: Date; status?: string; transparency?: string
      rrule?: { between: (a: Date, b: Date, inc?: boolean) => Date[] }
      exdate?: Record<string, Date>
    }
    if (!e.start || !e.end) continue
    if (typeof e.status === 'string' && e.status.toUpperCase() === 'CANCELLED') continue
    const dispo = estDispo(e.summary)
    if (!dispo && typeof e.transparency === 'string' && e.transparency.toUpperCase() === 'TRANSPARENT') continue
    const dureeMs = e.end.getTime() - e.start.getTime()

    // Occurrences de l'événement dans la fenêtre (récurrences déroulées)
    const occurrences: Fenetre[] = []
    if (e.rrule) {
      const exclues = new Set(Object.values(e.exdate ?? {}).map(d => d.getTime()))
      for (const occ of e.rrule.between(maintenant, horizon, true)) {
        if (exclues.has(occ.getTime())) continue
        occurrences.push({ debut: occ, fin: new Date(occ.getTime() + dureeMs) })
      }
    } else if (e.end > maintenant && e.start <= horizon) {
      occurrences.push({ debut: e.start, fin: e.end })
    }

    for (const occ of occurrences) {
      evenements++
      if (dispo) decoupe(occ, slots)
      else occupes.push(occ)
    }
  }

  // Un créneau « Dispo » chevauché par n'importe quel autre événement saute
  const chevauche = (s: Fenetre) =>
    occupes.some(o => s.debut.getTime() < o.fin.getTime() && o.debut.getTime() < s.fin.getTime())
  return { disponibles: slots.filter(s => s.debut > maintenant && !chevauche(s)), evenements }
}

/** Vérifie qu'un lien d'agenda est lisible, sans rien écrire en base. */
export async function testerLienAgenda(url: string): Promise<ResultatSync> {
  try {
    const { disponibles, evenements } = await analyserAgenda(url)
    return { ok: true, dispos: disponibles.length, evenements }
  } catch (err) {
    console.error('testerLienAgenda:', err instanceof Error ? err.message : err)
    return { ok: false, erreur: 'Lien illisible' }
  }
}

/** Synchronise les dispos d'un coach depuis son lien d'agenda. Ne lève jamais d'erreur. */
export async function syncCoachDispos(coach: Coach): Promise<ResultatSync> {
  if (!coach.ical_import_url) return { ok: false, erreur: 'Aucun agenda connecté' }
  try {
    const { disponibles, evenements } = await analyserAgenda(coach.ical_import_url)
    const maintenant = new Date()
    const voulus = new Map(disponibles.map(s => [s.debut.toISOString(), s]))

    // Créneaux importés existants (libres, à venir) de ce coach
    const { data: existants } = await supabase
      .from('creneaux').select('id, debut')
      .eq('coach_id', coach.id).eq('source', 'import')
      .is('lead_id', null).gte('debut', maintenant.toISOString())

    const dejaLa = new Set((existants ?? []).map(c => new Date(c.debut).toISOString()))

    // 1. Retire ceux qui ne sont plus dans l'agenda du coach
    const aSupprimer = (existants ?? []).filter(c => !voulus.has(new Date(c.debut).toISOString()))
    if (aSupprimer.length > 0) {
      await supabase.from('creneaux').delete()
        .in('id', aSupprimer.map(c => c.id)).is('lead_id', null)
    }

    // 2. Ajoute les nouveaux (les doublons avec un créneau manuel sont ignorés)
    const aInserer = [...voulus.values()]
      .filter(s => !dejaLa.has(s.debut.toISOString()))
      .map(s => ({
        coach_id: coach.id,
        debut: s.debut.toISOString(),
        fin: s.fin.toISOString(),
        source: 'import',
      }))
    if (aInserer.length > 0) {
      await supabase.from('creneaux')
        .upsert(aInserer, { onConflict: 'coach_id,debut', ignoreDuplicates: true })
    }
    return { ok: true, dispos: disponibles.length, evenements }
  } catch (err) {
    console.error(`syncCoachDispos(${coach.nom}):`, err instanceof Error ? err.message : err)
    return { ok: false, erreur: 'Lien illisible' }
  }
}

/** Synchronise tous les coachs qui ont un lien d'agenda (en parallèle). */
export async function syncTousLesCoachs(coaches: Coach[]): Promise<void> {
  await Promise.all(coaches.filter(c => c.ical_import_url).map(syncCoachDispos))
}
