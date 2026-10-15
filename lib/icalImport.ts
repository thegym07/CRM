import ical from 'node-ical'
import { supabase } from './supabaseServer'
import type { Coach } from './agenda'

// ── Import des disponibilités depuis l'agenda perso du coach (Google / iPhone) ──
// Convention : tout événement dont le titre contient « dispo » (peu importe la
// casse) est importé comme créneaux réservables, découpés en tranches d'1 h.
// Les créneaux importés non réservés qui disparaissent de l'agenda sont retirés ;
// les créneaux déjà réservés par une cliente ne sont jamais touchés.

const HORIZON_JOURS = 56       // on importe 8 semaines glissantes
const TRANCHE_MIN = 60         // durée d'un créneau réservable (minutes)
const TIMEOUT_MS = 8000

const estDispo = (summary: unknown) =>
  typeof summary === 'string' ? /dispo/i.test(summary) : false

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

/** Synchronise les dispos d'un coach depuis son lien d'agenda. Silencieux en cas d'échec. */
export async function syncCoachDispos(coach: Coach): Promise<void> {
  if (!coach.ical_import_url) return
  try {
    const url = coach.ical_import_url.trim().replace(/^webcal:\/\//i, 'https://')
    const data = await Promise.race([
      ical.async.fromURL(url),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)),
    ])

    const maintenant = new Date()
    const horizon = new Date(Date.now() + HORIZON_JOURS * 86400000)
    const slots: Fenetre[] = []

    for (const ev of Object.values(data)) {
      if (!ev || (ev as { type?: string }).type !== 'VEVENT') continue
      const e = ev as {
        summary?: unknown; start?: Date; end?: Date
        rrule?: { between: (a: Date, b: Date, inc?: boolean) => Date[] }
        exdate?: Record<string, Date>
      }
      if (!estDispo(e.summary) || !e.start || !e.end) continue
      const dureeMs = e.end.getTime() - e.start.getTime()

      if (e.rrule) {
        // Événement récurrent (ex. « Dispo » chaque mardi) : on déroule les occurrences
        const exclues = new Set(Object.values(e.exdate ?? {}).map(d => d.getTime()))
        for (const occ of e.rrule.between(maintenant, horizon, true)) {
          if (exclues.has(occ.getTime())) continue
          decoupe({ debut: occ, fin: new Date(occ.getTime() + dureeMs) }, slots)
        }
      } else if (e.start >= maintenant && e.start <= horizon) {
        decoupe({ debut: e.start, fin: e.end }, slots)
      }
    }

    const voulus = new Map(slots.map(s => [s.debut.toISOString(), s]))

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
  } catch (err) {
    console.error(`syncCoachDispos(${coach.nom}):`, err instanceof Error ? err.message : err)
  }
}

/** Synchronise tous les coachs qui ont un lien d'agenda (en parallèle). */
export async function syncTousLesCoachs(coaches: Coach[]): Promise<void> {
  await Promise.all(coaches.filter(c => c.ical_import_url).map(syncCoachDispos))
}
