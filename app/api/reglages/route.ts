import { NextRequest, NextResponse } from 'next/server'
import { getReglages, setReglage } from '@/lib/reglages'
import { envoyerSms, telInternational } from '@/lib/sms'

export async function GET() {
  return NextResponse.json(await getReglages())
}

// PUT { smsProspects: {actif, telephone} } ou { smsCoachRdv: {actif} }
export async function PUT(request: NextRequest) {
  const data = await request.json().catch(() => ({}))

  if (data.smsProspects) {
    const telephone = String(data.smsProspects.telephone ?? '').trim()
    const actif = !!data.smsProspects.actif
    if (actif && !telInternational(telephone)) {
      return NextResponse.json({ error: 'Numéro de portable invalide' }, { status: 400 })
    }
    if (!(await setReglage('smsProspects', { actif, telephone }))) {
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }
  }

  if (data.smsCoachRdv) {
    if (!(await setReglage('smsCoachRdv', { actif: !!data.smsCoachRdv.actif }))) {
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }
  }

  return NextResponse.json(await getReglages())
}

// POST { telephone } : SMS de test
export async function POST(request: NextRequest) {
  const { telephone } = await request.json().catch(() => ({}))
  const res = await envoyerSms(telephone, 'THE GYM : test reussi, les notifications SMS fonctionnent.')
  return res.ok
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: res.erreur }, { status: 400 })
}
