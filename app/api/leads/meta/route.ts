import { NextRequest, NextResponse } from 'next/server'
import { createLead, findLeadByPhoneOrEmail } from '@/lib/db'

const GRAPH_VERSION = 'v21.0'

// ─────────────────────────────────────────────────────────────
// GET — Vérification du webhook par Meta
// Meta appelle cette route avec hub.mode / hub.verify_token / hub.challenge
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('[META WEBHOOK] ✅ Vérification réussie')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[META WEBHOOK] ❌ Vérification échouée (token invalide ou mode incorrect)')
  return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 })
}

// ─────────────────────────────────────────────────────────────
// POST — Réception d'un nouveau lead (leadgen)
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: MetaWebhookPayload
  try {
    body = await request.json()
  } catch {
    console.error('[META WEBHOOK] JSON invalide')
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  // On répond 200 rapidement à Meta ; on traite chaque lead reçu.
  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'leadgen') continue
        const leadgenId = change.value?.leadgen_id
        if (!leadgenId) continue
        await traiterLead(leadgenId)
      }
    }
  } catch (err) {
    console.error('[META WEBHOOK] Erreur de traitement :', err)
    // On renvoie quand même 200 pour éviter que Meta ne renvoie en boucle.
  }

  return NextResponse.json({ received: true })
}

async function traiterLead(leadgenId: string) {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) {
    console.error('[META WEBHOOK] META_PAGE_ACCESS_TOKEN manquant — impossible de récupérer le lead')
    return
  }

  console.log(`[META WEBHOOK] 📥 Nouveau lead reçu (leadgen_id=${leadgenId}), récupération des données…`)

  // 1. Récupérer les données complètes du lead via l'API Graph
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text()
    console.error(`[META WEBHOOK] Échec API Graph (${res.status}) : ${txt}`)
    return
  }
  const lead: MetaLead = await res.json()

  // 2. Extraire les champs
  const fields = extraireChamps(lead.field_data ?? [])
  const nom = [fields.first_name ?? fields.prenom, fields.last_name ?? fields.nom]
    .filter(Boolean)
    .join(' ')
    .trim()
    || fields.full_name?.trim()
    || 'Lead Meta'
  const telephone = normaliserTel(fields.phone_number ?? null)
  const email = (fields.email ?? '').trim() || null

  console.log(`[META WEBHOOK] 👤 Lead : nom="${nom}" tel="${telephone ?? '—'}" email="${email ?? '—'}"`)

  // 3. Anti-doublon
  const existant = await findLeadByPhoneOrEmail(telephone, email)
  if (existant) {
    console.log(`[META WEBHOOK] ⏭️  Doublon ignoré (déjà présent : ${existant.nom}, id=${existant.id})`)
    return
  }

  // 4. Créer le prospect
  const cree = await createLead({
    nom,
    telephone,
    email,
    source: 'Meta Ads',
    statut: 'Nouveau prospect',
  })
  console.log(`[META WEBHOOK] ✅ Prospect créé dans Supabase (id=${cree.id})`)
}

// Transforme field_data [{name, values:[]}] en objet { name: value }
function extraireChamps(fieldData: MetaFieldDatum[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of fieldData) {
    if (f.name && f.values?.length) out[f.name] = f.values[0]
  }
  return out
}

function normaliserTel(tel: string | null): string | null {
  if (!tel) return null
  const t = tel.replace(/\s/g, '')
  // +33612345678 -> 0612345678
  if (t.startsWith('+33')) return '0' + t.slice(3)
  if (t.startsWith('0033')) return '0' + t.slice(4)
  return t
}

// ── Types ──
type MetaFieldDatum = { name: string; values: string[] }
type MetaLead = { id: string; created_time?: string; field_data?: MetaFieldDatum[] }
type MetaWebhookChange = { field: string; value?: { leadgen_id?: string } }
type MetaWebhookEntry = { id?: string; changes?: MetaWebhookChange[] }
type MetaWebhookPayload = { object?: string; entry?: MetaWebhookEntry[] }
