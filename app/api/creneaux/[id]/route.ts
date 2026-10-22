import { NextRequest, NextResponse } from 'next/server'
import { supprimerDispo, reserverCreneau } from '@/lib/agenda'
import { getLead, updateLead } from '@/lib/db'
import { getCoaches } from '@/lib/agenda'
import { notifierCoachNouveauRdv } from '@/lib/notifications'

// DELETE : supprime une dispo libre
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await supprimerDispo(id)
  if (!ok) return NextResponse.json({ error: 'Créneau introuvable ou déjà réservé' }, { status: 409 })
  return NextResponse.json({ success: true })
}

// POST : réserve le créneau pour un prospect { lead_id }
// Verrou côté base : renvoie 409 si quelqu'un l'a pris entre-temps.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { lead_id } = await request.json()
  const lead = await getLead(lead_id)
  if (!lead) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })

  const creneau = await reserverCreneau(id, lead.id, lead.nom)
  if (!creneau) return NextResponse.json({ error: 'Créneau déjà réservé — choisis-en un autre' }, { status: 409 })

  // Renseigne la fiche prospect : date du RDV, coach assigné, statut RDV pris
  const coach = (await getCoaches()).find(c => c.id === creneau.coach_id)
  await updateLead(lead.id, {
    date_rdv: creneau.debut,
    coach_assigne: coach?.nom ?? null,
    statut: 'RDV pris',
  })

  await notifierCoachNouveauRdv(coach, creneau, lead)

  return NextResponse.json({ success: true, creneau })
}
