import { NextRequest, NextResponse } from 'next/server'
import { addDispo, getCreneauxLibres, getCoaches } from '@/lib/agenda'

// GET /api/creneaux : dispos libres à venir, avec le nom du coach (sélecteur de réservation)
export async function GET() {
  const [libres, coaches] = await Promise.all([getCreneauxLibres(), getCoaches()])
  const nomDe = (id: string) => coaches.find(c => c.id === id)?.nom ?? '?'
  return NextResponse.json(libres.map(c => ({ ...c, coach_nom: nomDe(c.coach_id) })))
}

// POST : ajout d'une disponibilité { coach_id, debut, fin }
export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.coach_id || !data.debut || !data.fin) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }
  const res = await addDispo(data.coach_id, data.debut, data.fin)
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 409 })
  return NextResponse.json({ success: true }, { status: 201 })
}
