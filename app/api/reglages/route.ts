import { NextRequest, NextResponse } from 'next/server'
import { getReglages, setReglage } from '@/lib/reglages'
import { envoyerEmail, emailValide } from '@/lib/email'

export async function GET() {
  return NextResponse.json(await getReglages())
}

// PUT { emailProspects: {actif, email} } ou { emailCoachRdv: {actif} }
export async function PUT(request: NextRequest) {
  const data = await request.json().catch(() => ({}))

  if (data.emailProspects) {
    const email = String(data.emailProspects.email ?? '').trim()
    const actif = !!data.emailProspects.actif
    if ((actif || email) && !emailValide(email)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
    }
    if (!(await setReglage('emailProspects', { actif, email }))) {
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }
  }

  if (data.emailCoachRdv) {
    if (!(await setReglage('emailCoachRdv', { actif: !!data.emailCoachRdv.actif }))) {
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }
  }

  return NextResponse.json(await getReglages())
}

// POST { email } : e-mail de test
export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}))
  const res = await envoyerEmail(
    email,
    'Test THE GYM : les notifications fonctionnent',
    'Bonjour,\n\nSi tu lis ce message, les notifications du CRM THE GYM arrivent bien.\n\nAstuce : ajoute cette adresse à tes contacts pour être sûr de ne jamais rater un message.\n\nTHE GYM',
  )
  return res.ok
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: res.erreur }, { status: 400 })
}
