import { NextRequest, NextResponse } from 'next/server'
import { getLead, updateLead, deleteLead } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = getLead(id)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  const lead = updateLead(id, data)
  if (!lead) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = deleteLead(id)
  if (!ok) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ success: true })
}
