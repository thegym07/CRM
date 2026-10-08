import { NextRequest, NextResponse } from 'next/server'
import { getLead, updateLead, deleteLead } from '@/lib/db'
import { ensureCommission } from '@/lib/commissions'
import { libererCreneauxDuLead } from '@/lib/agenda'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await getLead(id)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  const lead = await updateLead(id, data)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  // Commission figée : présence passée à « Oui » => création (une par RDV).
  // Jamais de suppression automatique — seule la croix ✕ de l'onglet
  // Commission Bonus retire une commission (règle métier).
  if (data.rdv_honore === true) await ensureCommission(lead)

  // Date de vente figée au moment où le statut passe à « Vendu »
  // (quel que soit l'écran d'où vient la vente). Jamais écrasée ensuite.
  if (data.statut === 'Vendu' && !lead.vendu_le) {
    await updateLead(id, { vendu_le: new Date().toISOString() })
  }

  return NextResponse.json(lead)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await libererCreneauxDuLead(id) // ses créneaux coach redeviennent disponibles
  const ok = await deleteLead(id)
  if (!ok) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ success: true })
}
