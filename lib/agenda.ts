import { supabase } from './supabaseServer'

export type Coach = {
  id: string
  nom: string
  couleur: string
  email: string | null
  telephone: string | null       // portable du coach (SMS de nouveau RDV)
  ical_token: string
  ical_import_url: string | null  // lien privé de SON agenda (Google/iPhone) → import des dispos
  actif: boolean
  created_at: string
}

export type Creneau = {
  id: string
  coach_id: string
  debut: string   // ISO
  fin: string     // ISO
  lead_id: string | null   // null = dispo libre, renseigné = RDV bloqué
  lead_nom: string | null
  source: 'crm' | 'import' // import = vient de l'agenda perso du coach
  created_at: string
}

// ── Coachs ──

export async function getCoaches(): Promise<Coach[]> {
  const { data, error } = await supabase.from('coaches').select('*').eq('actif', true).order('nom')
  if (error) { console.error('getCoaches:', error.message); return [] }
  return (data ?? []) as Coach[]
}

export async function createCoach(nom: string, couleur: string, email: string | null): Promise<Coach | null> {
  const { data, error } = await supabase.from('coaches').insert({ nom, couleur, email }).select('*').single()
  if (error) { console.error('createCoach:', error.message); return null }
  return data as Coach
}

/** Retire un coach (désactivation : l'historique de ses RDV est conservé). */
export async function retirerCoach(id: string): Promise<boolean> {
  // Supprime ses dispos libres à venir, garde les créneaux réservés (historique)
  await supabase.from('creneaux').delete().eq('coach_id', id).is('lead_id', null)
  const { error } = await supabase.from('coaches').update({ actif: false }).eq('id', id)
  if (error) { console.error('retirerCoach:', error.message); return false }
  return true
}

/** Enregistre le portable d'un coach (SMS de nouveau RDV). */
export async function setCoachTelephone(id: string, telephone: string | null): Promise<boolean> {
  const { error } = await supabase.from('coaches').update({ telephone }).eq('id', id)
  if (error) { console.error('setCoachTelephone:', error.message); return false }
  return true
}

/** Enregistre (ou efface) le lien d'agenda perso d'un coach. */
export async function setCoachImportUrl(id: string, url: string | null): Promise<boolean> {
  const { error } = await supabase.from('coaches').update({ ical_import_url: url }).eq('id', id)
  if (error) { console.error('setCoachImportUrl:', error.message); return false }
  return true
}

export async function getCoachByToken(token: string): Promise<Coach | null> {
  const { data, error } = await supabase.from('coaches').select('*').eq('ical_token', token).maybeSingle()
  if (error) { console.error('getCoachByToken:', error.message); return null }
  return (data as Coach) ?? null
}

// ── Créneaux ──

export async function getCreneaux(debutISO: string, finISO: string): Promise<Creneau[]> {
  const { data, error } = await supabase
    .from('creneaux').select('*')
    .gte('debut', debutISO).lt('debut', finISO)
    .order('debut')
  if (error) { console.error('getCreneaux:', error.message); return [] }
  return (data ?? []) as Creneau[]
}

/** Dispos libres à venir (pour le sélecteur de réservation). */
export async function getCreneauxLibres(): Promise<Creneau[]> {
  const { data, error } = await supabase
    .from('creneaux').select('*')
    .is('lead_id', null)
    .gte('debut', new Date().toISOString())
    .order('debut')
    .limit(200)
  if (error) { console.error('getCreneauxLibres:', error.message); return [] }
  return (data ?? []) as Creneau[]
}

export async function addDispo(coachId: string, debutISO: string, finISO: string): Promise<{ ok: boolean; erreur?: string }> {
  const { error } = await supabase.from('creneaux').insert({ coach_id: coachId, debut: debutISO, fin: finISO })
  if (error) {
    // 23505 = contrainte UNIQUE : créneau déjà existant pour ce coach
    if (error.code === '23505') return { ok: false, erreur: 'Ce créneau existe déjà pour ce coach' }
    console.error('addDispo:', error.message)
    return { ok: false, erreur: error.message }
  }
  return { ok: true }
}

/** Supprime une dispo LIBRE uniquement (un créneau réservé ne se supprime pas ici). */
export async function supprimerDispo(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('creneaux').delete({ count: 'exact' })
    .eq('id', id).is('lead_id', null)
  if (error) { console.error('supprimerDispo:', error.message); return false }
  return (count ?? 0) > 0
}

/**
 * Réserve un créneau pour un prospect — VERROU côté base :
 * l'update ne passe que si le créneau est encore libre (lead_id IS NULL).
 * Retourne le créneau réservé, ou null si déjà pris.
 */
export async function reserverCreneau(creneauId: string, leadId: string, leadNom: string): Promise<Creneau | null> {
  const { data, error } = await supabase
    .from('creneaux')
    .update({ lead_id: leadId, lead_nom: leadNom })
    .eq('id', creneauId)
    .is('lead_id', null)
    .select('*')
  if (error) { console.error('reserverCreneau:', error.message); return null }
  return (data?.[0] as Creneau) ?? null
}

/** Libère les créneaux d'un prospect (appelé quand on le supprime). */
export async function libererCreneauxDuLead(leadId: string): Promise<void> {
  const { error } = await supabase
    .from('creneaux')
    .update({ lead_id: null, lead_nom: null })
    .eq('lead_id', leadId)
    .gte('debut', new Date().toISOString()) // on ne libère que les créneaux à venir
  if (error) console.error('libererCreneauxDuLead:', error.message)
}

// ── Page perso du coach (/coach/[token]) ──

/** Coach actif correspondant au lien secret, sinon null. */
export async function getCoachActifByToken(token: string): Promise<Coach | null> {
  const coach = await getCoachByToken(token)
  return coach && coach.actif ? coach : null
}

/** Tous les créneaux d'un coach sur une période. */
export async function getCreneauxDuCoach(coachId: string, debutISO: string, finISO: string): Promise<Creneau[]> {
  const { data, error } = await supabase
    .from('creneaux').select('*')
    .eq('coach_id', coachId)
    .gte('debut', debutISO).lt('debut', finISO)
    .order('debut')
  if (error) { console.error('getCreneauxDuCoach:', error.message); return [] }
  return (data ?? []) as Creneau[]
}

/** Téléphones des prospects (pour afficher « appeler » sur les RDV du coach). */
export async function getTelephones(leadIds: string[]): Promise<Map<string, string>> {
  if (leadIds.length === 0) return new Map()
  const { data, error } = await supabase.from('leads').select('id, telephone').in('id', leadIds)
  if (error) { console.error('getTelephones:', error.message); return new Map() }
  return new Map((data ?? []).filter(l => l.telephone).map(l => [l.id as string, l.telephone as string]))
}

/** RDV bloqués d'un coach (pour le flux iCal). */
export async function getRdvDuCoach(coachId: string): Promise<Creneau[]> {
  const { data, error } = await supabase
    .from('creneaux').select('*')
    .eq('coach_id', coachId)
    .not('lead_id', 'is', null)
    .order('debut')
  if (error) { console.error('getRdvDuCoach:', error.message); return [] }
  return (data ?? []) as Creneau[]
}
