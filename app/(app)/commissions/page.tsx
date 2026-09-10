import { getLeads } from '@/lib/db'
import { getCommissions, type Commission } from '@/lib/commissions'
import Link from 'next/link'
import CommissionDelete from './CommissionDelete'

export const dynamic = 'force-dynamic'

// Montant de référence affiché dans le sous-titre (chaque ligne garde son
// propre montant figé en base).
const COMMISSION_PAR_RDV = 10

const moisKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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
  const [commissions, leads] = await Promise.all([getCommissions(), getLeads()])
  const statutParLead = new Map(leads.map(l => [l.id, l.statut]))

  // Regroupement par mois (date du RDV figée à la création de la commission)
  const parMois = new Map<string, Commission[]>()
  for (const c of commissions) {
    const key = moisKey(c.date_rdv)
    parMois.set(key, [...(parMois.get(key) ?? []), c])
  }
  const moisCourant = moisKey(new Date().toISOString())
  const duMois = (parMois.get(moisCourant) ?? [])
  const historique = Array.from(parMois.keys()).sort().reverse().filter(k => k !== moisCourant)
  const totalMois = duMois.reduce((s, c) => s + c.montant, 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          💶 Commission Bonus
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {COMMISSION_PAR_RDV} € par RDV où le prospect était présent — vente ou non.
          Les commissions sont figées : supprimer un prospect ailleurs ne les retire pas.
        </p>
      </div>

      {/* Mois en cours */}
      <div className="rounded-2xl border-2 border-[#F5C800] bg-white p-6 shadow-sm mb-8">
        <p className="label-condensed mb-1">{moisLabel(moisCourant)} — mois en cours</p>
        <div className="flex items-end gap-3 flex-wrap">
          <p className="text-5xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
            {euros(totalMois)}
          </p>
          <p className="text-sm text-gray-500 pb-1.5">
            {duMois.length} RDV présent{duMois.length !== 1 ? 's' : ''}
          </p>
        </div>

        {duMois.length > 0 && (
          <div className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {duMois.map(c => {
              const statut = c.lead_id ? statutParLead.get(c.lead_id) : undefined
              return (
                <div key={c.id} className="flex items-center gap-3 py-2.5">
                  {c.lead_id && statut ? (
                    <Link href={`/leads/${c.lead_id}`} className="flex-1 min-w-0 text-sm font-medium text-gray-900 hover:text-[#F5C800] truncate">
                      {c.nom}
                    </Link>
                  ) : (
                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 truncate">{c.nom}</span>
                  )}
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  {statut ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ISSUE_BADGE[statut] ?? 'bg-gray-100 text-gray-600'}`}>
                      {statut === 'RDV pris' ? 'En cours' : statut}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      Supprimé du CRM
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">+{c.montant} €</span>
                  <CommissionDelete id={c.id} nom={c.nom} />
                </div>
              )
            })}
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
                const rows = parMois.get(key)!
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{moisLabel(key)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{rows.length}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {euros(rows.reduce((s, c) => s + c.montant, 0))}
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
