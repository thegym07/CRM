import { NextRequest, NextResponse } from 'next/server'
import { deleteCommission } from '@/lib/commissions'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await deleteCommission(id)
  if (!ok) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ success: true })
}
