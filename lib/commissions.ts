import { supabase } from './supabaseServer'
import type { Lead } from './supabase'

// Commission figée : créée quand la présence passe à « Oui », elle survit à la
// suppression du prospect. Seule la croix ✕ de l'onglet Commission la retire.
export type Commission = {
  id: string
  lead_id: string | null
  nom: string
  date_rdv: string   // date de rattachement (mois)
  montant: number
  created_at: string
}

const TABLE = 'commissions'

export async function getCommissions(): Promise<Commission[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('date_rdv', { ascending: false })
  if (error) {
    // Table pas encore créée : on affiche vide plutôt que de planter la page
    console.error('getCommissions:', error.message)
    return []
  }
  return (data ?? []) as Commission[]
}

const jourFr = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

/**
 * Crée la commission du lead si elle n'existe pas déjà pour CE RDV
 * (déduplication par prospect + jour du RDV : un 2e RDV honoré un autre
 * jour crée bien une nouvelle commission).
 */
export async function ensureCommission(lead: Lead): Promise<void> {
  const dateRdv = lead.date_rdv ?? new Date().toISOString()
  const { data, error } = await supabase.from(TABLE).select('id,date_rdv').eq('lead_id', lead.id)
  if (error) { console.error('ensureCommission (lecture):', error.message); return }
  if ((data ?? []).some(c => jourFr(c.date_rdv) === jourFr(dateRdv))) return
  const { error: insErr } = await supabase.from(TABLE).insert({
    lead_id: lead.id,
    nom: lead.nom,
    date_rdv: dateRdv,
    montant: 10,
  })
  if (insErr) console.error('ensureCommission (insert):', insErr.message)
}

/** Suppression manuelle (croix ✕ de l'onglet Commission). */
export async function deleteCommission(id: string): Promise<boolean> {
  const { error, count } = await supabase.from(TABLE).delete({ count: 'exact' }).eq('id', id)
  if (error) { console.error('deleteCommission:', error.message); return false }
  return (count ?? 0) > 0
}
