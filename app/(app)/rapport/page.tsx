import { getReport, getReports, type DailyReport } from '@/lib/reports'
import RapportForm from './RapportForm'
import DateNav from './DateNav'

export const dynamic = 'force-dynamic'

type SearchParams = { date?: string }

// ── Bilan mensuel : total + moyenne par jour saisi, pour chaque statistique ──
type BilanMois = {
  key: string          // "YYYY-MM"
  jours: number        // jours avec au moins une saisie
  appels: number
  tel: number
  rdv: number
  sms: number          // jours où les SMS ont été envoyés
}

function bilansMensuels(reports: DailyReport[]): BilanMois[] {
  const map = new Map<string, BilanMois>()
  for (const r of reports) {
    const key = r.date.slice(0, 7)
    const b = map.get(key) ?? { key, jours: 0, appels: 0, tel: 0, rdv: 0, sms: 0 }
    b.jours += 1
    b.appels += r.appels_passes ?? 0
    b.tel += r.personnes_au_tel ?? 0
    b.rdv += r.rdv_pris ?? 0
    b.sms += r.sms_envoyes ? 1 : 0
    map.set(key, b)
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
}

function labelMois(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const moy = (total: number, jours: number) =>
  jours === 0 ? '—' : (total / jours).toFixed(1).replace('.', ',').replace(',0', '')

export default async function RapportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date && params.date <= today ? params.date : today

  const reportDuJour = await getReport(selectedDate)

  const tousLesRapports = (await getReports())
    .filter(r => r.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const allReports = tousLesRapports.slice(0, 30)
  const bilans = bilansMensuels(tousLesRapports)

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-4xl text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
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

      {/* Bilan mensuel : total et moyenne par jour saisi */}
      {bilans.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}>
            Bilan mensuel
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2.5 label-condensed">Mois</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Appels</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Au tél</th>
                  <th className="text-right px-4 py-2.5 label-condensed">RDV pris</th>
                  <th className="text-right px-4 py-2.5 label-condensed">SMS</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Jours saisis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bilans.map(b => (
                  <tr key={b.key} className={`hover:bg-gray-50 ${b.key === today.slice(0, 7) ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{labelMois(b.key)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900">{b.appels}</span>
                      <span className="block text-xs text-gray-400">moy. {moy(b.appels, b.jours)}/j</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900">{b.tel}</span>
                      <span className="block text-xs text-gray-400">moy. {moy(b.tel, b.jours)}/j</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900">{b.rdv}</span>
                      <span className="block text-xs text-gray-400">moy. {moy(b.rdv, b.jours)}/j</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900">{b.sms}<span className="text-gray-400 font-normal">/{b.jours}j</span></span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{b.jours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Historique */}
      {allReports.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}>
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
