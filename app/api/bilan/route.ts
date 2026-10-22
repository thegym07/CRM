import { NextResponse } from 'next/server'
import { createLead, findLeadByPhoneOrEmail, getLead, updateLead } from '@/lib/db'
import { emailValide } from '@/lib/email'
import { notifierCandidature, notifierNouveauProspect } from '@/lib/notifications'
import { RAPPEL, bilanResume, blockersOf, rappelLabel, sanitizeAnswers, type BilanFiche } from '@/lib/bilan'
import type { Lead } from '@/lib/supabase'

// =============================================================================
// Bilan Forme — API PUBLIQUE (page /bilan, sans connexion).
//  POST { etape: 'bilan' }        : réponses + prénom + téléphone → prospect
//        « Nouveau prospect » source « Bilan Forme » (anti-doublon par
//        téléphone : la fiche existante est mise à jour) ; renvoie son id ;
//  POST { etape: 'candidature' }  : nom, email, créneaux de rappel → fiche
//        complétée + e-mail « veut sa séance d'essai » à la commerciale ;
//  GET ?id= : réponses d'un bilan pour réafficher le résultat (lien envoyé à
//        la personne et ouvert depuis le CRM ; ni téléphone ni email renvoyés).
// =============================================================================

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SOURCES_CANAL = new Set(['wa', 'ig', 'story', 'bio', 'ads', 'fb', 'site', 'qr', 'sms'])

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')

/** 06 12 34 56 78, +33 6…, 0033 6… → 0612345678 (même format que le webhook Meta). */
function normaliserTel(tel: string): string | null {
  let t = tel.replace(/[^\d+]/g, '')
  if (t.startsWith('+33')) t = '0' + t.slice(3)
  else if (t.startsWith('0033')) t = '0' + t.slice(4)
  else if (/^[67]\d{8}$/.test(t)) t = '0' + t
  return /^0[1-9]\d{8}$/.test(t) ? t : null
}

const capitalize = (s: string) => s.replace(/(^|[\s-])(\p{L})/gu, (_m, sep, c) => sep + c.toUpperCase())

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  try {
    return body.etape === 'candidature' ? await candidature(body) : await bilan(body)
  } catch (err) {
    console.error('[BILAN]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Enregistrement impossible, réessayez dans un instant.' }, { status: 500 })
  }
}

async function bilan(body: Record<string, unknown>) {
  const prenom = capitalize(clean(body.first_name, 60))
  const telephone = normaliserTel(clean(body.phone, 30))
  const answers = sanitizeAnswers(body.answers)
  const canal = clean(body.source, 20).toLowerCase()

  if (!prenom) return NextResponse.json({ error: 'Indiquez votre prénom.' }, { status: 400 })
  if (!telephone) return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 })
  if (!answers.objectif || !answers.salle) return NextResponse.json({ error: 'Réponses incomplètes.' }, { status: 400 })

  const ranked = blockersOf(answers)
  const fiche: BilanFiche = {
    answers,
    profile: ranked[0],
    secondaries: ranked.slice(1),
    src: SOURCES_CANAL.has(canal) ? canal : null,
    at: new Date().toISOString(),
    candidature: null,
  }

  const existant = await findLeadByPhoneOrEmail(telephone, null)
  if (existant) {
    // Déjà connu : on garde sa fiche et son statut (un adhérent « Vendu » reste adhérent),
    // sauf un ancien refus qui redevient un prospect à rappeler.
    const patch: Partial<Lead> = { diagnostic: { ...fiche, candidature: existant.diagnostic?.candidature ?? null } }
    if (existant.statut === 'Refus') patch.statut = 'Nouveau prospect'
    await updateLead(existant.id, patch)
    return NextResponse.json({ id: existant.id })
  }

  const cree = await createLead({
    nom: prenom,
    telephone,
    source: 'Bilan Forme',
    statut: 'Nouveau prospect',
    diagnostic: fiche,
  })
  await notifierNouveauProspect(cree, [`Bilan Forme : ${bilanResume(fiche)}`, `Son bilan : https://crm-thegym.vercel.app/bilan?r=${cree.id}`])
  return NextResponse.json({ id: cree.id })
}

async function candidature(body: Record<string, unknown>) {
  const id = clean(body.id, 40)
  const prenom = capitalize(clean(body.first_name, 60))
  const nom = capitalize(clean(body.last_name, 60))
  const telephone = normaliserTel(clean(body.phone, 30))
  const email = clean(body.email, 120).toLowerCase()
  const rappel = (Array.isArray(body.rappel) ? body.rappel : []).filter(
    (v): v is string => typeof v === 'string' && RAPPEL.some((r) => r.value === v),
  )

  if (!UUID.test(id)) return NextResponse.json({ error: 'Bilan introuvable.' }, { status: 404 })
  if (!prenom || !nom) return NextResponse.json({ error: 'Indiquez votre prénom et votre nom.' }, { status: 400 })
  if (!telephone) return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 })
  if (email && !emailValide(email)) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })

  const lead = await getLead(id)
  if (!lead?.diagnostic) return NextResponse.json({ error: 'Bilan introuvable.' }, { status: 404 })

  const dejaPostule = !!lead.diagnostic.candidature
  const patch: Partial<Lead> = {
    nom: `${prenom} ${nom}`,
    diagnostic: { ...lead.diagnostic, candidature: { at: new Date().toISOString(), rappel } },
  }
  if (email) patch.email = email
  if (telephone !== lead.telephone && !(await findLeadByPhoneOrEmail(telephone, null))) patch.telephone = telephone
  if (lead.statut === 'Refus') patch.statut = 'Nouveau prospect'
  const maj = await updateLead(id, patch)

  if (maj && !dejaPostule) {
    await notifierCandidature(maj, [
      `Bilan Forme : ${bilanResume(maj.diagnostic!)}`,
      rappel.length ? `À rappeler : ${rappelLabel(rappel)}` : null,
      `Son bilan : https://crm-thegym.vercel.app/bilan?r=${maj.id}`,
    ].filter((l): l is string => !!l))
  }
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  const lead = await getLead(id).catch(() => null)
  if (!lead?.diagnostic) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({
    first_name: lead.nom.split(' ')[0],
    answers: lead.diagnostic.answers ?? {},
    applied: !!lead.diagnostic.candidature,
  })
}
