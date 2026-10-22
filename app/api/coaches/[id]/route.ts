import { NextRequest, NextResponse } from 'next/server'
import { retirerCoach, setCoachImportUrl, setCoachEmail } from '@/lib/agenda'
import { emailValide } from '@/lib/email'
import { testerLienAgenda } from '@/lib/icalImport'

// PATCH : enregistre le lien d'agenda perso du coach (Google / iPhone)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()

  // E-mail du coach (onglet Réglages)
  if ('email' in data) {
    const email = typeof data.email === 'string' ? data.email.trim() : ''
    if (email && !emailValide(email)) return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
    const ok = await setCoachEmail(id, email || null)
    return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Impossible' }, { status: 500 })
  }

  const brut = typeof data.ical_import_url === 'string' ? data.ical_import_url.trim() : ''
  const url = brut === '' ? null : brut
  if (url && !/^(https?|webcal):\/\//i.test(url)) {
    return NextResponse.json({ error: 'Lien invalide — il doit commencer par https:// ou webcal://' }, { status: 400 })
  }
  if (url) {
    const test = await testerLienAgenda(url)
    if (!test.ok) return NextResponse.json({ error: 'Impossible de lire cet agenda — vérifie le lien' }, { status: 400 })
  }
  const ok = await setCoachImportUrl(id, url)
  if (!ok) return NextResponse.json({ error: 'Impossible' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await retirerCoach(id)
  if (!ok) return NextResponse.json({ error: 'Impossible' }, { status: 500 })
  return NextResponse.json({ success: true })
}
