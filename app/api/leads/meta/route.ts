import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/db'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const nom = [body.first_name, body.last_name].filter(Boolean).join(' ').trim() || 'Inconnu'
  await createLead({ nom, telephone: body.phone_number ?? body.phone ?? null, email: body.email ?? null, source: 'Meta Ads', statut: 'Nouveau prospect' })

  return NextResponse.json({ success: true, message: 'Lead créé' })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === process.env.WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 })
}
