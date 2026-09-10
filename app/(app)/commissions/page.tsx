import { getLeads } from '@/lib/db'
import Link from 'next/link'
import type { Lead } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Montant versé par RDV programmé où le prospect était PRÉSENT (présence = Oui),
// peu importe l'issue (vente ou non). En attente / absents : non comptés.
const COMMISSION_PAR_RDV = 10

// Date de rattachement d'un RDV : la date du RDV, sinon la date de mise à jour
// (cas rare d'une présence validée sans date saisie).
function dateRdv(l: Lead): Date {
  return new Date(l.date_rdv ?? l.updated_at)
}

const moisKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

function moisLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const ISSUE_BADGE: Record<string, string> = {
  'Vendu':      'bg-green-100 text-green-700',
  'Refus':      'bg-red-100 text-red-600',
  'À relancer': 'bg-[#F5C800]/30 text-yellow-800',
  'RDV pris':   'bg-gray-100 text-gray-600',
}

export default async function CommissionsPage() {
  const leads = await getLeads()

  // Seuls comptent les RDV où le prospect était présent
  const presents = leads.filter(l => l.rdv_honore === true)

  // Regroupement par mois (du plus récent au plus ancien)
  const parMois = new Map<string, Lead[]>()
  for (const l of presents) {
    const key = moisKey(dateRdv(l))
    parMois.set(key, [...(parMois.get(key) ?? []), l])
  }
  const moisTries = Array.from(parMois.keys()).sort().reverse()

  const moisCourant = moisKey(new Date())
  const duMois = (parMois.get(moisCourant) ?? []).sort(
    (a, b) => dateRdv(b).getTime() - dateRdv(a).getTime()
  )
  const historique = moisTries.filter(k => k !== moisCourant)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          💶 Commission Bonus
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {COMMISSION_PAR_RDV} € par RDV programmé où le prospect était présent — vente ou non.
        </p>
      </div>

      {/* Mois en cours */}
      <div className="rounded-2xl border-2 border-[#F5C800] bg-white p-6 shadow-sm mb-8">
        <p className="label-condensed mb-1">{moisLabel(moisCourant)} — mois en cours</p>
        <div className="flex items-end gap-3 flex-wrap">
          <p className="text-5xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
            {euros(duMois.length * COMMISSION_PAR_RDV)}
          </p>
          <p className="text-sm text-gray-500 pb-1.5">
            {duMois.length} RDV présent{duMois.length !== 1 ? 's' : ''} × {COMMISSION_PAR_RDV} €
          </p>
        </div>

        {duMois.length > 0 && (
          <div className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {duMois.map(l => (
              <div key={l.id} className="flex items-center gap-3 py-2.5">
                <Link href={`/leads/${l.id}`} className="flex-1 min-w-0 text-sm font-medium text-gray-900 hover:text-[#F5C800] truncate">
                  {l.nom}
                </Link>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {dateRdv(l).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ISSUE_BADGE[l.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                  {l.statut === 'RDV pris' ? 'En cours' : l.statut}
                </span>
                <span className="text-sm font-semibold text-gray-900 w-14 text-right">
                  +{COMMISSION_PAR_RDV} €
                </span>
              </div>
            ))}
          </div>
        )}
        {duMois.length === 0 && (
          <p className="mt-4 text-sm text-gray-400">Aucun RDV présent ce mois-ci pour l'instant.</p>
        )}
      </div>

      {/* Historique */}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Historique</h2>
      {historique.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-400 text-sm">Pas encore d'historique — il se remplira mois après mois.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 label-condensed">Mois</th>
                <th className="text-right px-4 py-2.5 label-condensed">RDV présents</th>
                <th className="text-right px-4 py-2.5 label-condensed">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historique.map(key => {
                const n = parMois.get(key)!.length
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{moisLabel(key)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{n}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {euros(n * COMMISSION_PAR_RDV)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
