import { NextRequest, NextResponse } from 'next/server'
import { getLead, updateLead, deleteLead } from '@/lib/db'
import { ensureCommission } from '@/lib/commissions'
import { libererCreneauxDuLead } from '@/lib/agenda'
import { ENTREE_VALIDE } from '@/lib/appels'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await getLead(id)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()

  // « ajouter_appel » : un appel ou un SMS ajouté à l'historique côté serveur,
  // pour que deux boutons de la même fiche ne s'écrasent pas l'un l'autre.
  if (typeof data.ajouter_appel === 'string') {
    if (!ENTREE_VALIDE.test(data.ajouter_appel)) {
      return NextResponse.json({ error: 'Contact invalide' }, { status: 400 })
    }
    const actuel = await getLead(id)
    if (!actuel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    data.appels = [...(actuel.appels ?? []), data.ajouter_appel]
    delete data.ajouter_appel
  }

  const lead = await updateLead(id, data)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  // Commission figée : présence passée à « Oui » => création (une par RDV).
  // Jamais de suppression automatique — seule la croix ✕ de l'onglet
  // Commission Bonus retire une commission (règle métier).
  if (data.rdv_honore === true) await ensureCommission(lead)

  // Perdu ou refus : son créneau coach redevient libre (comme avant avec la suppression)
  if (data.statut === 'Perdu' || data.statut === 'Refus') await libererCreneauxDuLead(id)

  // Date de vente figée au moment où le statut passe à « Vendu »
  // (quel que soit l'écran d'où vient la vente). Jamais écrasée ensuite.
  if (data.statut === 'Vendu' && !lead.vendu_le) {
    await updateLead(id, { vendu_le: new Date().toISOString() })
  }

  return NextResponse.json(lead)
}

// Règle métier : un prospect ne se supprime plus. Pas intéressé, injoignable…
// → statut « Perdu » avec motif (on garde l'historique et les chiffres).
// Seule exception : la personne demande l'effacement de ses données (RGPD, ?rgpd=1).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (req.nextUrl.searchParams.get('rgpd') !== '1') {
    return NextResponse.json(
      { error: 'On ne supprime plus un prospect : classez-le en « Perdu » avec son motif. La suppression est réservée aux personnes qui demandent l’effacement de leurs données.' },
      { status: 403 },
    )
  }
  const lead = await getLead(id)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  await libererCreneauxDuLead(id) // ses créneaux coach redeviennent disponibles
  const ok = await deleteLead(id)
  if (!ok) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ success: true })
}
