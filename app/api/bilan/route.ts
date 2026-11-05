import { NextResponse, type NextRequest } from 'next/server'
import { createLead, findLeadByPhoneOrEmail, getLead, updateLead } from '@/lib/db'
import { notifierCandidature, notifierNouveauProspect } from '@/lib/notifications'
import { bilanResume, blockersOf, sanitizeAnswers, type BilanFiche } from '@/lib/bilan'
import type { Lead } from '@/lib/supabase'
import { lireIdBilan, sessionValide, signerIdBilan, SESSION_COOKIE } from '@/lib/session'

// =============================================================================
// Bilan Forme — API PUBLIQUE (page /bilan, sans connexion).
//  POST { etape: 'bilan' }        : réponses + prénom + téléphone → prospect
//        « Nouveau prospect » source « Bilan Forme » (anti-doublon par
//        téléphone : la fiche existante est mise à jour) ; renvoie son id ;
//  POST { etape: 'candidature' }  : prénom, nom, téléphone → fiche
//        complétée + e-mail « veut sa séance d'essai » à la commerciale ;
//  GET ?id= : réponses d'un bilan pour réafficher le résultat. Lien public
//        signé (id.signature, renvoyé par le POST) ; id seul accepté uniquement
//        depuis le CRM connecté. Ni téléphone ni email renvoyés.
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

  if (!prenom) return NextResponse.json({ error: 'Indiquez votre prénom.' }, { status: 400 })
  if (!telephone) return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 })
  if (!answers.objectif || !answers.salle) return NextResponse.json({ error: 'Réponses incomplètes.' }, { status: 400 })
  const id = await enregistrerBilan(prenom, telephone, answers, clean(body.source, 20))
  return NextResponse.json({ id, r: signerIdBilan(id) })
}

/** Crée le prospect (ou met à jour la fiche du même numéro) et renvoie son id. */
async function enregistrerBilan(prenom: string, telephone: string, answers: ReturnType<typeof sanitizeAnswers>, source: string) {
  const canal = source.toLowerCase()

  const ranked = blockersOf(answers)
  const fiche: BilanFiche = {
    answers,
    profile: ranked[0],
    secondaries: ranked.slice(1),
    src: SOURCES_CANAL.has(canal) ? canal : null,
    at: new Date().toISOString(),
    prenom,
    candidature: null,
  }

  const existant = await findLeadByPhoneOrEmail(telephone, null)
  if (existant) {
    // Déjà connu : on garde sa fiche et son statut (un adhérent « Vendu » reste adhérent),
    // sauf un ancien refus qui redevient un prospect à rappeler.
    const patch: Partial<Lead> = { diagnostic: { ...fiche, candidature: existant.diagnostic?.candidature ?? null } }
    redemande(existant, patch)
    await updateLead(existant.id, patch)
    return existant.id
  }

  const cree = await createLead({
    nom: prenom,
    telephone,
    source: 'Bilan Forme',
    statut: 'Nouveau prospect',
    diagnostic: fiche,
  })
  await notifierNouveauProspect(cree, [`Bilan Forme : ${bilanResume(fiche)}`, `Son bilan : https://crm-thegym.vercel.app/bilan?r=${signerIdBilan(cree.id)}`])
  return cree.id
}

/** Il (re)demande une séance : en tête de « à appeler aujourd'hui », séquence de relance remise à zéro. */
function redemande(lead: Lead, patch: Partial<Lead>) {
  if (lead.statut === 'Vendu' || lead.statut === 'RDV pris') return
  if (lead.statut === 'Refus' || lead.statut === 'Perdu') Object.assign(patch, { statut: 'Nouveau prospect', motif_relance: null })
  patch.date_relance = null
  patch.appels = [...(lead.appels ?? []), `${new Date().toISOString()}|go`]
}

async function candidature(body: Record<string, unknown>) {
  // L'id doit venir du lien signé renvoyé par l'étape « bilan » (sinon on repasse par le bilan)
  let id = lireIdBilan(clean(body.id, 80)) ?? ''
  const prenom = capitalize(clean(body.first_name, 60))
  const nom = capitalize(clean(body.last_name, 60))
  const telephone = normaliserTel(clean(body.phone, 30))

  if (!prenom || !nom) return NextResponse.json({ error: 'Indiquez votre prénom et votre nom.' }, { status: 400 })
  if (!telephone) return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 })
  // Le bilan n'a pas pu être enregistré avant le résultat (réseau, vérification Vercel) : on le crée maintenant.
  if (!UUID.test(id)) {
    const answers = sanitizeAnswers(body.answers)
    if (!answers.objectif || !answers.salle) return NextResponse.json({ error: 'Bilan introuvable.' }, { status: 404 })
    id = await enregistrerBilan(prenom, telephone, answers, clean(body.source, 20))
  }

  const lead = await getLead(id)
  if (!lead?.diagnostic) return NextResponse.json({ error: 'Bilan introuvable.' }, { status: 404 })

  const dejaPostule = !!lead.diagnostic.candidature
  const patch: Partial<Lead> = {
    diagnostic: { ...lead.diagnostic, candidature: { at: new Date().toISOString() } },
  }
  // Une fiche d'adhérent (Vendu) ne change jamais de nom ni de numéro depuis la page publique
  if (lead.statut !== 'Vendu') {
    patch.nom = `${prenom} ${nom}`
    if (telephone !== lead.telephone && !(await findLeadByPhoneOrEmail(telephone, null))) patch.telephone = telephone
  }
  redemande(lead, patch)
  const maj = await updateLead(id, patch)

  if (maj && !dejaPostule) {
    await notifierCandidature(maj, [
      `Bilan Forme : ${bilanResume(maj.diagnostic!)}`,
      `Son bilan : https://crm-thegym.vercel.app/bilan?r=${signerIdBilan(maj.id)}`,
    ].filter((l): l is string => !!l))
  }
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const brut = request.nextUrl.searchParams.get('id') ?? ''
  // Lien signé (public) ou id seul si la personne est connectée au CRM
  const connecte = sessionValide(request.cookies.get(SESSION_COOKIE)?.value)
  const id = brut.includes('.') ? lireIdBilan(brut) : connecte ? brut : null
  if (!id || !UUID.test(id)) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  const lead = await getLead(id).catch(() => null)
  if (!lead?.diagnostic) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({
    first_name: lead.diagnostic.prenom ?? (connecte ? lead.nom.split(' ')[0] : ''),
    answers: lead.diagnostic.answers ?? {},
    applied: !!lead.diagnostic.candidature,
  })
}
