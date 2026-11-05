import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createLead, findLeadByPhoneOrEmail, updateLead } from '@/lib/db'
import { notifierEchecProspect, notifierNouveauProspect } from '@/lib/notifications'
import type { Lead } from '@/lib/supabase'

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
// Signature Meta (en-tête X-Hub-Signature-256) : vérifiée dès que META_APP_SECRET est
// renseigné dans Vercel (clé secrète de l'app « CRM THE GYM »). Sans lui, on accepte
// comme avant, mais seuls des identifiants de lead numériques sont traités.
function signatureValide(corps: string, entete: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) return true
  if (!entete?.startsWith('sha256=')) return false
  const attendu = Buffer.from(`sha256=${createHmac('sha256', secret).update(corps).digest('hex')}`)
  const recu = Buffer.from(entete)
  return attendu.length === recu.length && timingSafeEqual(attendu, recu)
}

const LEADGEN_ID = /^\d{5,25}$/

// Erreur passagère (Meta 5xx, base indisponible) : Meta renverra la notification.
// Erreur définitive (lead introuvable, jeton refusé) : inutile d'insister.
class ErreurDefinitive extends Error {}

export async function POST(request: NextRequest) {
  const corps = await request.text()
  if (!signatureValide(corps, request.headers.get('x-hub-signature-256'))) {
    console.warn('[META WEBHOOK] ❌ Signature invalide')
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }
  let body: MetaWebhookPayload
  try {
    body = JSON.parse(corps)
  } catch {
    console.error('[META WEBHOOK] JSON invalide')
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  // Chaque lead est traité ; si l'un échoue (Meta ou base indisponible), on prévient
  // la salle par e-mail et on répond 500 pour que Meta renvoie la notification plus tard
  // (l'anti-doublon par téléphone évite de créer deux fois le même prospect).
  const echecs: string[] = []
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue
      const leadgenId = String(change.value?.leadgen_id ?? '')
      if (!LEADGEN_ID.test(leadgenId)) continue // pas un vrai identifiant Meta : ignoré
      try {
        await traiterLead(leadgenId, change.value ?? {})
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[META WEBHOOK] ❌ Lead ${leadgenId} non enregistré :`, msg)
        // Seules les pannes passagères déclenchent l'alerte et un renvoi de Meta
        if (!(err instanceof ErreurDefinitive)) echecs.push(`Lead Meta n° ${leadgenId}`)
      }
    }
  }

  if (echecs.length > 0) {
    await notifierEchecProspect(echecs)
    return NextResponse.json({ error: 'Traitement incomplet' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}

async function graph<T>(chemin: string, token: string): Promise<T> {
  const sep = chemin.includes('?') ? '&' : '?'
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${chemin}${sep}access_token=${token}`)
  if (!res.ok) {
    const texte = await res.text()
    const msg = `API Graph ${res.status} : ${texte.slice(0, 200)}`
    // Jeton expiré ou refusé (code 190) : à réparer, donc alerte ; identifiant inconnu : ignoré
    const jetonRefuse = /"code":\s*(190|102)\b/.test(texte)
    throw res.status >= 500 || jetonRefuse ? new Error(msg) : new ErreurDefinitive(msg)
  }
  return res.json() as Promise<T>
}

/** « Origine : pub « X » · formulaire « Y » » (au mieux : si Meta refuse un champ, on s'en passe). */
async function origine(lead: MetaLead, value: MetaWebhookValue, token: string): Promise<string | null> {
  const parts: string[] = []
  if (lead.is_organic) parts.push('formulaire Facebook sans pub')
  else if (lead.ad_name) parts.push(`pub « ${lead.ad_name} »`)
  else if (lead.ad_id ?? value.ad_id) parts.push(`pub n° ${lead.ad_id ?? value.ad_id}`)
  const formId = lead.form_id ?? value.form_id
  if (formId) {
    const form = await graph<{ name?: string }>(`${formId}?fields=name`, token).catch(() => null)
    parts.push(form?.name ? `formulaire « ${form.name} »` : `formulaire n° ${formId}`)
  }
  return parts.length ? `Origine : ${parts.join(' · ')}` : null
}

const dateCourte = () => new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })
const ajouterNote = (notes: string | null, ligne: string) => (notes ? `${notes}\n${ligne}` : ligne)

async function traiterLead(leadgenId: string, value: MetaWebhookValue) {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN manquant')

  console.log(`[META WEBHOOK] 📥 Nouveau lead reçu (leadgen_id=${leadgenId}), récupération des données…`)

  // 1. Récupérer les données complètes du lead via l'API Graph (avec la pub d'origine si Meta l'autorise)
  const lead = await graph<MetaLead>(`${leadgenId}?fields=field_data,created_time,ad_id,ad_name,form_id,is_organic`, token)
    .catch(err => (err instanceof ErreurDefinitive ? graph<MetaLead>(leadgenId, token) : Promise.reject(err)))

  // Pas un lead de formulaire (objet sans réponses) : rien à créer
  if (!lead.field_data?.length) throw new ErreurDefinitive('Objet Meta sans réponses de formulaire')

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

  const ligneOrigine = await origine(lead, value, token)
  // Marqueur du lead Meta dans les notes : une même notification renvoyée n'est jamais traitée deux fois
  const marqueur = `[meta:${leadgenId}]`

  // 3. Déjà connu : il redemande une séance. Un prospect « Perdu » ou « Refus » repart
  // en « Nouveau prospect » ; dans tous les cas on le note et on prévient la commerciale.
  const existant = await findLeadByPhoneOrEmail(telephone, email)
  if (existant?.notes?.includes(marqueur)) {
    console.log(`[META WEBHOOK] ⏭️  Lead déjà traité (id=${existant.id})`)
    return
  }
  if (existant) {
    const relance = existant.statut === 'Perdu' || existant.statut === 'Refus'
    const patch: Partial<Lead> = {
      notes: ajouterNote(existant.notes, `↩ Redemande une séance par la pub le ${dateCourte()}${ligneOrigine ? ` (${ligneOrigine.replace('Origine : ', '')})` : ''} ${marqueur}`),
    }
    // Toujours dans l'entonnoir : il remonte en tête de « à appeler aujourd'hui », séquence remise à zéro
    if (existant.statut !== 'Vendu') {
      patch.date_relance = null
      patch.appels = [...(existant.appels ?? []), `${new Date().toISOString()}|go`]
    }
    if (relance) Object.assign(patch, { statut: 'Nouveau prospect', motif_relance: null })
    await updateLead(existant.id, patch)
    console.log(`[META WEBHOOK] ↩ Déjà connu (${existant.statut}, id=${existant.id}) : redemande notée`)
    await notifierNouveauProspect(existant, [
      existant.statut === 'Vendu'
        ? `Attention : déjà adhérent (vendu), il redemande une séance.`
        : `Déjà dans le CRM (${existant.statut}) : il redemande une séance${relance ? ', remis en « Nouveau prospect »' : ''}.`,
    ])
    return
  }

  // 4. Créer le prospect
  const cree = await createLead({
    nom,
    telephone,
    email,
    source: 'Meta Ads',
    statut: 'Nouveau prospect',
    notes: `${ligneOrigine ?? 'Origine : pub Meta'} ${marqueur}`,
  })
  console.log(`[META WEBHOOK] ✅ Prospect créé dans Supabase (id=${cree.id})`)
  await notifierNouveauProspect(cree, ligneOrigine ? [ligneOrigine] : [])
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
type MetaLead = {
  id: string; created_time?: string; field_data?: MetaFieldDatum[]
  ad_id?: string; ad_name?: string; form_id?: string; is_organic?: boolean
}
type MetaWebhookValue = { leadgen_id?: string; ad_id?: string; form_id?: string; adgroup_id?: string; page_id?: string }
type MetaWebhookChange = { field: string; value?: MetaWebhookValue }
type MetaWebhookEntry = { id?: string; changes?: MetaWebhookChange[] }
type MetaWebhookPayload = { object?: string; entry?: MetaWebhookEntry[] }
