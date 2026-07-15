import { getReport, getReports } from '@/lib/reports'
import RapportForm from './RapportForm'
import DateNav from './DateNav'

export const dynamic = 'force-dynamic'

type SearchParams = { date?: string }

export default async function RapportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date && params.date <= today ? params.date : today

  const reportDuJour = getReport(selectedDate)

  const allReports = getReports()
    .filter(r => r.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-4xl text-gray-900" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
          Rapport journalier
        </h1>
      </div>

      {/* Navigation date */}
      <div className="mb-6">
        <DateNav date={selectedDate} today={today} />
        <p className="text-lg font-semibold text-gray-700 mt-2 capitalize">{dateLabel}</p>
      </div>

      {/* Saisie manuelle */}
      <section className="mb-8">
        <RapportForm date={selectedDate} initial={reportDuJour} />
      </section>

      {/* Historique */}
      {allReports.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Historique
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2.5 label-condensed">Date</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Appels</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Au tél</th>
                  <th className="text-right px-4 py-2.5 label-condensed">RDV pris</th>
                  <th className="text-center px-4 py-2.5 label-condensed">SMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allReports.map(r => (
                  <tr key={r.date} className={`hover:bg-gray-50 ${r.date === selectedDate ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-2.5 text-gray-700">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{r.appels_passes ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{r.personnes_au_tel ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{r.rdv_pris ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{r.sms_envoyes ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
