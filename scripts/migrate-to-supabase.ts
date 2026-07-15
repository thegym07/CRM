/**
 * Migration one-shot : data/leads.json -> table Supabase "leads"
 * Usage : npm run migrate
 * Prérequis : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local + schéma SQL exécuté.
 */

import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  const leadsPath = join(process.cwd(), 'data', 'leads.json')
  const reportsPath = join(process.cwd(), 'data', 'reports.json')

  // --- Leads ---
  if (existsSync(leadsPath)) {
    const leads = JSON.parse(readFileSync(leadsPath, 'utf-8'))
    const rows = leads.map((l: Record<string, unknown>) => ({
      id: l.id,
      nom: l.nom,
      telephone: l.telephone ?? null,
      email: l.email ?? null,
      source: l.source ?? 'Autre',
      date_rdv: l.date_rdv ?? null,
      activite: l.activite ?? null,
      rdv_honore: l.rdv_honore ?? null,
      resultat_rdv: l.resultat_rdv ?? null,
      statut: l.statut ?? 'Nouveau prospect',
      offre_souscrite: l.offre_souscrite ?? null,
      coach_assigne: l.coach_assigne ?? null,
      date_relance: l.date_relance ?? null,
      motif_relance: l.motif_relance ?? null,
      suivi_relance: l.suivi_relance ?? null,
      notes: l.notes ?? null,
      appels: l.appels ?? [],
      created_at: l.created_at ?? new Date().toISOString(),
      updated_at: l.updated_at ?? new Date().toISOString(),
    }))
    const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'id' })
    if (error) { console.error('❌ leads :', error.message); process.exit(1) }
    console.log(`✅ ${rows.length} prospects migrés`)
  } else {
    console.log('ℹ️  Pas de data/leads.json, étape ignorée')
  }

  // --- Reports ---
  if (existsSync(reportsPath)) {
    const reports = JSON.parse(readFileSync(reportsPath, 'utf-8'))
    if (reports.length) {
      const { error } = await supabase.from('reports').upsert(reports, { onConflict: 'date' })
      if (error) { console.error('❌ reports :', error.message); process.exit(1) }
      console.log(`✅ ${reports.length} rapports migrés`)
    }
  }

  console.log('\n🎉 Migration terminée')
}

main()
