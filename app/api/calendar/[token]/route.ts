import { NextRequest, NextResponse } from 'next/server'
import { getCoachByToken, getRdvDuCoach } from '@/lib/agenda'
import { getLeads } from '@/lib/db'

// Flux iCal privé d'un coach : ses RDV bloqués.
// À ajouter par abonnement dans Apple Calendar ou Google Agenda.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cleanToken = token.replace(/\.ics$/, '')
  const coach = await getCoachByToken(cleanToken)
  if (!coach) return new NextResponse('Not found', { status: 404 })

  const [rdvs, leads] = await Promise.all([getRdvDuCoach(coach.id), getLeads()])
  const telDe = (leadId: string | null) =>
    leadId ? leads.find(l => l.id === leadId)?.telephone ?? '' : ''

  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m)

  const events = rdvs.map(r => [
    'BEGIN:VEVENT',
    `UID:${r.id}@crm-thegym`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(r.debut)}`,
    `DTEND:${fmt(r.fin)}`,
    `SUMMARY:${esc(`RDV THE GYM — ${r.lead_nom ?? 'Prospect'}`)}`,
    `DESCRIPTION:${esc(`Téléphone : ${telDe(r.lead_id) || '—'}`)}`,
    'END:VEVENT',
  ].join('\r\n'))

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//THE GYM CRM//Agenda coach//FR',
    `X-WR-CALNAME:THE GYM — ${esc(coach.nom)}`,
    'X-PUBLISHED-TTL:PT15M',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
