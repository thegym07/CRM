import { supabase } from './supabaseServer'

// Réglages du CRM (onglet Réglages), stockés en base : table reglages (cle, valeur jsonb).
export type Reglages = {
  smsProspects: { actif: boolean; telephone: string }  // SMS à la commerciale à chaque nouveau prospect
  smsCoachRdv: { actif: boolean }                      // SMS au coach à chaque nouveau RDV
}

const DEFAUT: Reglages = {
  smsProspects: { actif: false, telephone: '' },
  smsCoachRdv: { actif: false },
}

export async function getReglages(): Promise<Reglages> {
  const { data, error } = await supabase.from('reglages').select('cle, valeur')
  if (error) { console.error('getReglages:', error.message); return DEFAUT }
  const map = new Map((data ?? []).map(r => [r.cle as string, r.valeur]))
  return {
    smsProspects: { ...DEFAUT.smsProspects, ...(map.get('smsProspects') ?? {}) },
    smsCoachRdv: { ...DEFAUT.smsCoachRdv, ...(map.get('smsCoachRdv') ?? {}) },
  }
}

export async function setReglage<K extends keyof Reglages>(cle: K, valeur: Reglages[K]): Promise<boolean> {
  const { error } = await supabase.from('reglages').upsert({ cle, valeur }, { onConflict: 'cle' })
  if (error) { console.error('setReglage:', error.message); return false }
  return true
}
