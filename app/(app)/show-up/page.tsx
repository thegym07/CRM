import { getLeads } from '@/lib/db'
import Link from 'next/link'
import ShowUpRow, { ShowUpCard } from './ShowUpRow'

export const dynamic = 'force-dynamic'

export default async function ShowUpPage() {
  const leads = await getLeads()

  // Tous les prospects "RDV pris"
  const rdvLeads = leads.filter(l => l.statut === 'RDV pris')

  const withDate = rdvLeads
    .filter(l => l.date_rdv)
    .sort((a, b) => new Date(a.date_rdv!).getTime() - new Date(b.date_rdv!).getTime())
  const withoutDate = rdvLeads.filter(l => !l.date_rdv)

  const total = rdvLeads.length

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
            Show-up
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {total} RDV pris
            {withoutDate.length > 0 && (
              <span className="ml-2 text-orange-500 font-semibold">
                ⚠ {withoutDate.length} sans date
              </span>
            )}
          </p>
        </div>
        <Link href="/leads/nouveau" className="btn-primary text-sm">+ Nouveau</Link>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center bg-white">
          <p className="text-gray-500">Aucun RDV pris pour le moment</p>
        </div>
      ) : (
        <div className="space-y-6">
          {withoutDate.length > 0 && (
            <Section title="⚠ Sans date fixée" leads={withoutDate} warn />
          )}
          {withDate.length > 0 && (
            <Section title="RDV programmés" leads={withDate} />
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, leads, warn }: {
  title: string
  leads: Awaited<ReturnType<typeof getLeads>>
  warn?: boolean
}) {
  return (
    <div>
      <h2 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${warn ? 'text-orange-500' : 'text-gray-500'}`}
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
        {title} — {leads.length}
      </h2>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2.5 label-condensed">Nom</th>
              <th className="text-left px-4 py-2.5 label-condensed">Téléphone</th>
              <th className="text-left px-4 py-2.5 label-condensed">Date & heure RDV</th>
              <th className="text-center px-4 py-2.5 label-condensed">Présence</th>
              <th className="text-center px-4 py-2.5 label-condensed">Résultat</th>
              <th className="text-left px-4 py-2.5 label-condensed min-w-[220px]">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map(lead => (
              <ShowUpRow key={lead.id} lead={lead} faded={false} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {leads.map(lead => (
          <ShowUpCard key={lead.id} lead={lead} faded={false} />
        ))}
      </div>
    </div>
  )
}
