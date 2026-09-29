import { NextRequest, NextResponse } from 'next/server'
import { getLeads } from '@/lib/db'

const COMMISSION_COACH = 30
const cleMois = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }).slice(0, 7)

// Export CSV des commissions coachs du mois (?mois=YYYY-MM)
export async function GET(request: NextRequest) {
  const mois = new URL(request.url).searchParams.get('mois') ?? cleMois(new Date().toISOString())
  const leads = await getLeads()

  const seances = leads
    .filter(l => l.activite === 'plateau muscu' && l.coach_assigne && l.rdv_honore === true)
    .filter(l => cleMois(l.date_rdv ?? l.updated_at) === mois)
    .sort((a, b) => (a.coach_assigne! + a.date_rdv).localeCompare(b.coach_assigne! + b.date_rdv))

  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  const lignes = [
    ['Coach', 'Date', 'Prospect', 'Montant'].join(';'),
    ...seances.map(s => [
      q(s.coach_assigne!),
      new Date(s.date_rdv ?? s.updated_at).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }),
      q(s.nom),
      `${COMMISSION_COACH} €`,
    ].join(';')),
    ['TOTAL', '', String(seances.length) + ' séances', `${seances.length * COMMISSION_COACH} €`].join(';'),
  ]

  return new NextResponse('﻿' + lignes.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="commissions-coachs-${mois}.csv"`,
    },
  })
}
