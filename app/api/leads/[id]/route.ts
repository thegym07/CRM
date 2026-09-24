import { NextRequest, NextResponse } from 'next/server'
import { getLead, updateLead, deleteLead } from '@/lib/db'
import { ensureCommission } from '@/lib/commissions'

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

  return NextResponse.json(lead)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await deleteLead(id)
  if (!ok) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ success: true })
}
