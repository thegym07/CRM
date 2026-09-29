import { NextRequest, NextResponse } from 'next/server'
import { retirerCoach } from '@/lib/agenda'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await retirerCoach(id)
  if (!ok) return NextResponse.json({ error: 'Impossible' }, { status: 500 })
  return NextResponse.json({ success: true })
}
