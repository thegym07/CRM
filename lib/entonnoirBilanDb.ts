import { supabase } from './supabaseServer'
import { ETAPES, PREFIXE_ETAPES, type Etape } from './entonnoirBilan'

// Compteurs du Bilan Forme (voir lib/entonnoirBilan.ts), table reglages :
// cle « bilan_etapes:2026-11-26 », valeur = { "<canal>": { "<etape>": n } }.
// Lecture-modification-écriture : suffisant pour le trafic du bilan (quelques visites par jour).

type Jour = Record<string, Record<string, number>>

const jourParis = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

export async function compterEtape(canal: string, etape: Etape): Promise<void> {
  const cle = PREFIXE_ETAPES + jourParis()
  const { data, error } = await supabase.from('reglages').select('valeur').eq('cle', cle).maybeSingle()
  if (error) { console.error('compterEtape (lecture):', error.message); return }
  const jour: Jour = (data?.valeur && typeof data.valeur === 'object') ? (data.valeur as Jour) : {}
  const c = jour[canal] ?? {}
  c[etape] = (c[etape] ?? 0) + 1
  jour[canal] = c
  const { error: e2 } = await supabase.from('reglages').upsert({ cle, valeur: jour }, { onConflict: 'cle' })
  if (e2) console.error('compterEtape (écriture):', e2.message)
}

export type Entonnoir = {
  depuis: string
  total: Record<Etape, number>
  parCanal: { canal: string; ouverture: number; envoi: number; essai: number }[]
}

/** Totaux des `jours` derniers jours (canal « test » exclu), ou null si la base n'a pas pu être lue. */
export async function lireEntonnoir(jours = 30): Promise<Entonnoir | null> {
  const depuis = new Date(Date.now() - (jours - 1) * 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const { data, error } = await supabase.from('reglages').select('cle, valeur')
    .like('cle', `${PREFIXE_ETAPES}%`).gte('cle', PREFIXE_ETAPES + depuis)
  if (error) { console.error('lireEntonnoir:', error.message); return null }
  const total = Object.fromEntries(ETAPES.map((e) => [e, 0])) as Record<Etape, number>
  const canaux = new Map<string, { canal: string; ouverture: number; envoi: number; essai: number }>()
  for (const row of data ?? []) {
    const jour = row.valeur as Jour
    if (!jour || typeof jour !== 'object') continue
    for (const [canal, etapes] of Object.entries(jour)) {
      if (canal === 'test' || !etapes || typeof etapes !== 'object') continue
      for (const e of ETAPES) total[e] += Number(etapes[e]) || 0
      const c = canaux.get(canal) ?? { canal, ouverture: 0, envoi: 0, essai: 0 }
      c.ouverture += Number(etapes.ouverture) || 0
      c.envoi += Number(etapes.envoi) || 0
      c.essai += Number(etapes.essai) || 0
      canaux.set(canal, c)
    }
  }
  const parCanal = Array.from(canaux.values()).sort((a, b) => b.ouverture - a.ouverture || b.envoi - a.envoi)
  return { depuis, total, parCanal }
}
