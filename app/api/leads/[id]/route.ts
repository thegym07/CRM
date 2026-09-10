import { NextRequest, NextResponse } from 'next/server'
import { getLead, updateLead, deleteLead } from '@/lib/db'
import { ensureCommission, removeCommissionForLead } from '@/lib/commissions'

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

  // Commission figée : présence passée à « Oui » => création (une seule fois).
  // Présence corrigée (Oui -> autre) => retrait de la commission auto.
  if ('rdv_honore' in data) {
    if (data.rdv_honore === true) await ensureCommission(lead)
    else await removeCommissionForLead(id)
  }

  return NextResponse.json(lead)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await deleteLead(id)
  if (!ok) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ success: true })
}
