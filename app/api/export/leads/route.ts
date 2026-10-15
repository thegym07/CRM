import { getLeads } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Export CSV de tous les prospects (séparateur ; + BOM pour Excel français)
export async function GET() {
  const leads = await getLeads()

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }) : ''
  const champ = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`

  const lignes = [
    ['Nom', 'Téléphone', 'Email', 'Source', 'Statut', 'Activité', 'Ajouté le', 'RDV', 'Présence', 'Formule', 'Vendu le', 'Nb appels', 'Notes'].join(';'),
    ...leads.map(l => [
      champ(l.nom),
      champ(l.telephone),
      champ(l.email),
      champ(l.source),
      champ(l.statut),
      champ(l.activite),
      fmtDate(l.created_at),
      fmtDate(l.date_rdv),
      l.rdv_honore === true ? 'Oui' : l.rdv_honore === false ? 'Non' : '',
      champ(l.offre_souscrite),
      fmtDate(l.vendu_le),
      String((l.appels ?? []).length),
      champ(l.notes),
    ].join(';')),
  ]

  const jour = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  return new Response('﻿' + lignes.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="prospects-the-gym-${jour}.csv"`,
    },
  })
}
