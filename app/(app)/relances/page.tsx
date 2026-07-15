import { getLeads } from '@/lib/db'
import Link from 'next/link'
import SuiviRelanceSelect from '@/components/SuiviRelanceSelect'
import CallTracker from '@/components/CallTracker'

export const dynamic = 'force-dynamic'

export default async function RelancesPage() {
  const today = new Date().toISOString().split('T')[0]
  const allLeads = await getLeads()

  // Relances classiques (date_relance <= aujourd'hui)
  const byDate = allLeads
    .filter(l => l.date_relance && l.date_relance <= today)
    .sort((a, b) => (a.date_relance ?? '').localeCompare(b.date_relance ?? ''))

  // Prospects "À relancer" (statut direct ou résultat de show-up) sans date de relance fixée
  const fromShowUp = allLeads.filter(l =>
    (l.statut === 'À relancer' || l.resultat_rdv === 'À relancer') &&
    (!l.date_relance || l.date_relance > today)
  )

  const total = byDate.length + fromShowUp.length

  const grouped = byDate.reduce<Record<string, typeof byDate>>((acc, lead) => {
    const date = lead.date_relance!
    if (!acc[date]) acc[date] = []
    acc[date].push(lead)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>Relances</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {total > 0 ? `${total} prospect${total !== 1 ? 's' : ''} à contacter` : 'Aucune relance en attente'}
        </p>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-900 font-medium">Tout est à jour !</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Depuis le show-up : "À relancer" sans date fixée */}
          {fromShowUp.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-orange-500">À relancer (depuis Show-up)</h2>
                <span className="text-xs text-gray-400">{fromShowUp.length} contact{fromShowUp.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {fromShowUp.map(lead => <LeadCard key={lead.id} lead={lead} />)}
              </div>
            </div>
          )}

          {/* Relances par date */}
          {sortedDates.map((date) => {
            const dateLabel = date === today
              ? "Aujourd'hui"
              : new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
            const isOverdue = date < today

            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className={`text-sm font-semibold ${isOverdue ? 'text-red-500' : 'text-gray-700'}`}>
                    {isOverdue ? '⚠ En retard — ' : ''}{dateLabel}
                  </h2>
                  <span className="text-xs text-gray-400">{grouped[date].length} contact{grouped[date].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {grouped[date].map(lead => <LeadCard key={lead.id} lead={lead} overdue={isOverdue} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead, overdue }: { lead: Awaited<ReturnType<typeof getLeads>>[0]; overdue?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${overdue ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${overdue ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
          {lead.nom.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:underline text-sm">
            {lead.nom}
          </Link>
          {lead.motif_relance && <p className="text-xs text-gray-500 mt-0.5">{lead.motif_relance}</p>}
          <p className="text-xs text-gray-400 mt-0.5">{lead.statut}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <SuiviRelanceSelect
            leadId={lead.id}
            value={lead.suivi_relance ?? 'À appeler'}
            nom={lead.nom}
          />
          <CallTracker leadId={lead.id} appels={lead.appels ?? []} />
          <div className="flex gap-2">
            {lead.telephone && (
              <a href={`tel:${lead.telephone}`} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-200">
                📞 Appeler
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-200">
                ✉ Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
