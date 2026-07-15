import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { Lead } from './supabase'

const DB_PATH = join(process.cwd(), 'data', 'leads.json')

function readDB(): Lead[] {
  if (!existsSync(DB_PATH)) {
    mkdirSync(join(process.cwd(), 'data'), { recursive: true })
    writeFileSync(DB_PATH, '[]')
    return []
  }
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return []
  }
}

function writeDB(leads: Lead[]): void {
  writeFileSync(DB_PATH, JSON.stringify(leads, null, 2))
}

export function getLeads(): Lead[] {
  return readDB().sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function getLead(id: string): Lead | null {
  return readDB().find(l => l.id === id) ?? null
}

export function createLead(data: Partial<Lead>): Lead {
  const leads = readDB()
  const now = new Date().toISOString()
  const lead: Lead = {
    id: randomUUID(),
    nom: data.nom ?? '',
    telephone: data.telephone ?? null,
    email: data.email ?? null,
    source: data.source ?? 'Autre',
    date_rdv: data.date_rdv ?? null,
    activite: data.activite ?? null,
    rdv_honore: data.rdv_honore ?? null,
    resultat_rdv: data.resultat_rdv ?? null,
    statut: data.statut ?? 'Nouveau prospect',
    offre_souscrite: data.offre_souscrite ?? null,
    coach_assigne: data.coach_assigne ?? null,
    date_relance: data.date_relance ?? null,
    motif_relance: data.motif_relance ?? null,
    suivi_relance: data.suivi_relance ?? null,
    notes: data.notes ?? null,
    appels: data.appels ?? [],
    created_at: now,
    updated_at: now,
  }
  leads.push(lead)
  writeDB(leads)
  return lead
}

export function updateLead(id: string, data: Partial<Lead>): Lead | null {
  const leads = readDB()
  const idx = leads.findIndex(l => l.id === id)
  if (idx === -1) return null
  leads[idx] = { ...leads[idx], ...data, id, updated_at: new Date().toISOString() }
  writeDB(leads)
  return leads[idx]
}

export function deleteLead(id: string): boolean {
  const leads = readDB()
  const filtered = leads.filter(l => l.id !== id)
  if (filtered.length === leads.length) return false
  writeDB(filtered)
  return true
}
