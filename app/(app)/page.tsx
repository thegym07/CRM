import { getLeads } from '@/lib/db'
import StatCard from '@/components/StatCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const all = getLeads()
  const total = all.length
  const nouveaux = all.filter(l => l.statut === 'Nouveau prospect').length
  const vendus = all.filter(l => l.statut === 'Vendu').length
  const aRelancer = all.filter(l => l.statut === 'À relancer').length

  const today = new Date().toISOString().split('T')[0]
  const relancesAujourdhui = all.filter(l => l.date_relance && l.date_relance <= today)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8 lg:grid-cols-4">
        <StatCard label="Total prospects" value={total} color="default" />
        <StatCard label="Nouveaux prospects" value={nouveaux} color="yellow" />
        <StatCard label="Vendus" value={vendus} color="green" />
        <StatCard label="À relancer" value={aRelancer} color="red" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Relances du jour
            {relancesAujourdhui.length > 0 && (
              <span className="ml-2 text-sm bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                {relancesAujourdhui.length}
              </span>
            )}
          </h2>
          <Link href="/leads" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Voir tout →
          </Link>
        </div>

        {relancesAujourdhui.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">Aucune relance prévue aujourd'hui 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {relancesAujourdhui.slice(0, 5).map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`}
                className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 p-4 transition-colors">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-semibold text-sm flex-shrink-0">
                  {lead.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{lead.nom}</p>
                  {lead.motif_relance && <p className="text-xs text-gray-500 truncate">{lead.motif_relance}</p>}
                </div>
                {lead.telephone && (
                  <a href={`tel:${lead.telephone}`} onClick={e => e.stopPropagation()}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors flex-shrink-0 bg-white">
                    📞 Appeler
                  </a>
                )}
              </Link>
            ))}
            {relancesAujourdhui.length > 5 && (
              <Link href="/relances" className="block text-center text-sm text-gray-500 hover:text-gray-900 py-3 transition-colors">
                + {relancesAujourdhui.length - 5} autres relances
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
