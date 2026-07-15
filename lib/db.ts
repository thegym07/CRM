import { supabase } from './supabaseServer'
import type { Lead } from './supabase'

const TABLE = 'leads'

// Colonnes autorisées en écriture (évite d'envoyer id/created_at par erreur)
const WRITABLE: (keyof Lead)[] = [
  'nom', 'telephone', 'email', 'source', 'date_rdv', 'activite',
  'rdv_honore', 'resultat_rdv', 'statut', 'offre_souscrite', 'coach_assigne',
  'date_relance', 'motif_relance', 'suivi_relance', 'notes', 'appels',
]

function pickWritable(data: Partial<Lead>): Partial<Lead> {
  const out: Record<string, unknown> = {}
  for (const key of WRITABLE) {
    if (key in data) out[key] = data[key]
  }
  return out as Partial<Lead>
}

function normalize(row: Record<string, unknown>): Lead {
  return { ...row, appels: (row.appels as string[]) ?? [] } as Lead
}

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getLeads: ${error.message}`)
  return (data ?? []).map(normalize)
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`getLead: ${error.message}`)
  return data ? normalize(data) : null
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const insert = {
    ...pickWritable(data),
    statut: data.statut ?? 'Nouveau prospect',
    source: data.source ?? 'Autre',
    appels: data.appels ?? [],
  }
  const { data: row, error } = await supabase.from(TABLE).insert(insert).select('*').single()
  if (error) throw new Error(`createLead: ${error.message}`)
  return normalize(row)
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
  const { data: row, error } = await supabase
    .from(TABLE)
    .update(pickWritable(data))
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) throw new Error(`updateLead: ${error.message}`)
  return row ? normalize(row) : null
}

export async function deleteLead(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from(TABLE)
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw new Error(`deleteLead: ${error.message}`)
  return (count ?? 0) > 0
}
