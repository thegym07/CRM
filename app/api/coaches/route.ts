import { NextRequest, NextResponse } from 'next/server'
import { getCoaches, createCoach } from '@/lib/agenda'

export async function GET() {
  return NextResponse.json(await getCoaches())
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.nom?.trim()) return NextResponse.json({ error: 'Nom obligatoire' }, { status: 400 })
  const coach = await createCoach(data.nom.trim(), data.couleur || '#F5C800', data.email?.trim() || null)
  if (!coach) return NextResponse.json({ error: 'Création impossible' }, { status: 500 })
  return NextResponse.json(coach, { status: 201 })
}
