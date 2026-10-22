import { NextRequest, NextResponse } from 'next/server'
import { getCoachActifByToken, setCoachImportUrl } from '@/lib/agenda'
import { testerLienAgenda, syncCoachDispos } from '@/lib/icalImport'

// Page perso du coach (accès par lien secret) : brancher ou débrancher son agenda.
//   { action: 'connecter', url: '<lien iCal Google ou iCloud>' }
//   { action: 'deconnecter' }
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const coach = await getCoachActifByToken(token)
  if (!coach) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })

  const data = await request.json().catch(() => ({}))

  if (data.action === 'connecter') {
    const url = typeof data.url === 'string' ? data.url.trim() : ''
    if (!/^(https?|webcal):\/\//i.test(url)) {
      return NextResponse.json({ error: 'Ce n’est pas un lien d’agenda. Il doit commencer par https:// ou webcal://' }, { status: 400 })
    }
    // On vérifie que le lien est lisible AVANT de l'enregistrer
    const test = await testerLienAgenda(url)
    if (!test.ok) {
      return NextResponse.json({ error: 'Impossible de lire cet agenda. Vérifie que tu as copié le bon lien (voir les étapes).' }, { status: 400 })
    }
    await setCoachImportUrl(coach.id, url)
    const res = await syncCoachDispos({ ...coach, ical_import_url: url })
    return NextResponse.json({ success: true, ...(res.ok ? { dispos: res.dispos, evenements: res.evenements } : {}) })
  }

  if (data.action === 'deconnecter') {
    await setCoachImportUrl(coach.id, null)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
