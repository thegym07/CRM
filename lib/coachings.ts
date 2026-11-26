import { supabase } from './supabaseServer'
import { periodeValide } from './periodes'

// Coachings réalisés par la commerciale, notés à la main par période de paie (voir lib/periodes.ts).
// Stockés dans la table reglages, une ligne par période : cle « coachings:2026-12 », valeur = nombre.
// Une ligne par période => chaque saisie n'écrit que sa propre période (aucune ne peut en écraser une autre).

export const COMMISSION_COACHING = 30 // € par coaching

const PREFIXE = 'coachings:'

/** Coachings par période ({ "2026-12": 4 }), ou null si la base n'a pas pu être lue. */
export async function getCoachings(): Promise<Record<string, number> | null> {
  const { data, error } = await supabase.from('reglages').select('cle, valeur').like('cle', `${PREFIXE}%`)
  if (error) { console.error('getCoachings:', error.message); return null }
  const parPeriode: Record<string, number> = {}
  for (const r of data ?? []) {
    const p = String(r.cle).slice(PREFIXE.length)
    const n = Number(r.valeur)
    if (periodeValide(p) && Number.isFinite(n) && n > 0) parPeriode[p] = Math.round(n)
  }
  return parPeriode
}

export async function setCoachings(periode: string, nombre: number): Promise<boolean> {
  const cle = `${PREFIXE}${periode}`
  const { error } = nombre > 0
    ? await supabase.from('reglages').upsert({ cle, valeur: nombre }, { onConflict: 'cle' })
    : await supabase.from('reglages').delete().eq('cle', cle)
  if (error) { console.error('setCoachings:', error.message); return false }
  return true
}
