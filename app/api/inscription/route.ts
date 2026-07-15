import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/db'

export async function POST(request: NextRequest) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const nom = (body.nom ?? '').trim()
  if (!nom) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
  }

  const activite = ['cours collectif', 'plateau muscu', 'coaching'].includes(body.activite)
    ? (body.activite as 'cours collectif' | 'plateau muscu' | 'coaching')
    : null

  await createLead({
    nom,
    telephone: body.telephone?.trim() || null,
    email: body.email?.trim() || null,
    source: 'Formulaire web',
    activite,
    statut: 'Nouveau prospect',
    notes: body.message?.trim() || null,
  })

  return NextResponse.json({ success: true })
}
