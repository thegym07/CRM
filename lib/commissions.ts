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

/** Crée la commission du lead si elle n'existe pas déjà (1 par prospect). */
export async function ensureCommission(lead: Lead): Promise<void> {
  const { data, error } = await supabase.from(TABLE).select('id').eq('lead_id', lead.id).limit(1).maybeSingle()
  if (error) { console.error('ensureCommission (lecture):', error.message); return }
  if (data) return
  const { error: insErr } = await supabase.from(TABLE).insert({
    lead_id: lead.id,
    nom: lead.nom,
    date_rdv: lead.date_rdv ?? new Date().toISOString(),
    montant: 10,
  })
  if (insErr) console.error('ensureCommission (insert):', insErr.message)
}

/**
 * Correction de saisie : si la présence repasse de « Oui » à autre chose,
 * on retire la commission auto du lead (le lead existe encore, c'est une
 * correction — pas une suppression de prospect).
 */
export async function removeCommissionForLead(leadId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('lead_id', leadId)
  if (error) console.error('removeCommissionForLead:', error.message)
}

/** Suppression manuelle (croix ✕ de l'onglet Commission). */
export async function deleteCommission(id: string): Promise<boolean> {
  const { error, count } = await supabase.from(TABLE).delete({ count: 'exact' }).eq('id', id)
  if (error) { console.error('deleteCommission:', error.message); return false }
  return (count ?? 0) > 0
}
