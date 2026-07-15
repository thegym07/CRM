/**
 * Script d'import CSV one-shot
 * Usage : npm run import-csv
 */

import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createLead } from '../lib/db'

function mapStatut(resultat: string): string {
  const r = resultat.trim().toLowerCase()
  if (r === 'vente') return 'Vendu'
  if (r.includes('relancer')) return 'Perdu/À relancer'
  return 'Nouveau'
}

function normalizePhone(phone: string): string {
  const p = phone.trim().replace(/\s/g, '')
  if (p.startsWith('33') && p.length === 11) return '0' + p.slice(2)
  if (p.startsWith('+33')) return '0' + p.slice(3)
  return p
}

function extractActivite(rdvText: string): string | null {
  const t = rdvText.toLowerCase()
  if (t.includes('plateau muscu') || t.includes('muscu')) return 'plateau muscu'
  if (t.includes('coaching') || t.includes('coach')) return 'coaching'
  if (t.includes('cours collectif') || t.includes('pilate') || t.includes('tabata') ||
      t.includes('burn calories') || t.includes('caf') || t.includes('body barre') || t.includes('fitness'))
    return 'cours collectif'
  return null
}

const MONTH_SEPARATORS = ['mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre']

const csvPaths = [
  join(process.env.HOME || '', 'Downloads', 'Prospects THE GYM - Show-up.csv'),
  join(process.cwd(), 'Prospects THE GYM - Show-up.csv'),
]

let csvContent: string | null = null
let foundPath = ''

for (const p of csvPaths) {
  try { csvContent = readFileSync(p, 'utf-8'); foundPath = p; break } catch {}
}

if (!csvContent) {
  console.error('❌ CSV introuvable dans ~/Downloads')
  process.exit(1)
}

console.log(`📄 Lecture du CSV : ${foundPath}`)

const records: string[][] = parse(csvContent, { skip_empty_lines: true, relax_column_count: true })
let count = 0

for (const row of records.slice(1)) {
  const nom = (row[0] || '').trim()
  if (!nom) continue
  if (MONTH_SEPARATORS.some(m => nom.toLowerCase().startsWith(m))) {
    console.log(`  ↳ Séparateur ignoré : "${nom}"`)
    continue
  }

  const telephone = normalizePhone(row[1] || '')
  const email = (row[2] || '').trim()
  const rdvText = (row[3] || '').trim()
  const rdvHonore = (row[4] || '').trim().toLowerCase() === 'oui'
  const resultat = (row[5] || '').trim()
  const notes = (row[6] || '').trim()

  createLead({
    nom,
    telephone: telephone || null,
    email: email || null,
    source: 'Bouche-à-oreille',
    rdv_honore: rdvHonore,
    activite: extractActivite(rdvText) as 'cours collectif' | 'plateau muscu' | 'coaching' | null,
    statut: mapStatut(resultat) as 'Nouveau prospect' | 'Vendu' | 'À relancer',
    notes: notes || null,
  })

  console.log(`  ✓ ${nom} → ${mapStatut(resultat)}`)
  count++
}

console.log(`\n✅ ${count} prospects importés dans data/leads.json`)
