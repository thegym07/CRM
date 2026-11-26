import { NextRequest, NextResponse } from 'next/server'
import { setCoachings } from '@/lib/coachings'
import { periodeValide } from '@/lib/periodes'

// PUT { periode: "YYYY-MM", nombre: 0..999 } : nombre de coachings de la période (saisie manuelle)
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const periode = body?.periode
  const nombre = Number(body?.nombre)
  if (!periodeValide(periode)) return NextResponse.json({ error: 'Période invalide' }, { status: 400 })
  if (!Number.isInteger(nombre) || nombre < 0 || nombre > 999) {
    return NextResponse.json({ error: 'Nombre invalide (0 à 999)' }, { status: 400 })
  }
  const ok = await setCoachings(periode, nombre)
  if (!ok) return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
