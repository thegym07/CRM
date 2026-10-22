import { supabase } from './supabaseServer'

// Réglages du CRM (onglet Réglages), stockés en base : table reglages (cle, valeur jsonb).
export type Reglages = {
  emailProspects: { actif: boolean; email: string }  // e-mail à la commerciale à chaque nouveau prospect
  emailCoachRdv: { actif: boolean }                  // e-mail au coach à chaque nouveau RDV
}

const DEFAUT: Reglages = {
  emailProspects: { actif: false, email: '' },
  emailCoachRdv: { actif: false },
}

export async function getReglages(): Promise<Reglages> {
  const { data, error } = await supabase.from('reglages').select('cle, valeur')
  if (error) { console.error('getReglages:', error.message); return DEFAUT }
  const map = new Map((data ?? []).map(r => [r.cle as string, r.valeur]))
  return {
    emailProspects: { ...DEFAUT.emailProspects, ...(map.get('emailProspects') ?? {}) },
    emailCoachRdv: { ...DEFAUT.emailCoachRdv, ...(map.get('emailCoachRdv') ?? {}) },
  }
}

export async function setReglage<K extends keyof Reglages>(cle: K, valeur: Reglages[K]): Promise<boolean> {
  const { error } = await supabase.from('reglages').upsert({ cle, valeur }, { onConflict: 'cle' })
  if (error) { console.error('setReglage:', error.message); return false }
  return true
}
