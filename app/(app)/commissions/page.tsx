import { getLeads } from '@/lib/db'
import { getCommissions, type Commission } from '@/lib/commissions'
import { getCoachings, COMMISSION_COACHING } from '@/lib/coachings'
import { periodeDe, periodeActuelle, labelPeriode, bornesPeriode } from '@/lib/periodes'
import Link from 'next/link'
import CommissionDelete from './CommissionDelete'

export const dynamic = 'force-dynamic'

// Montant de référence affiché dans le sous-titre (chaque ligne garde son
// propre montant figé en base).
const COMMISSION_PAR_RDV = 10

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const ISSUE_BADGE: Record<string, string> = {
  'Vendu':      'bg-green-100 text-green-700',
  'Refus':      'bg-red-100 text-red-600',
  'À relancer': 'bg-[#F5C800]/30 text-yellow-800',
  'RDV pris':   'bg-gray-100 text-gray-600',
}

export default async function CommissionsPage() {
  const [commissions, leads, coachingsLus] = await Promise.all([getCommissions(), getLeads(), getCoachings()])
  const coachings = coachingsLus ?? {}
  const statutParLead = new Map(leads.map(l => [l.id, l.statut]))

  // Regroupement par période de paie (26 → 25), d'après la date du RDV figée à la création
  const parPeriode = new Map<string, Commission[]>()
  for (const c of commissions) {
    const key = periodeDe(c.date_rdv)
    parPeriode.set(key, [...(parPeriode.get(key) ?? []), c])
  }
  const actuelle = periodeActuelle()
  const duMois = parPeriode.get(actuelle) ?? []
  const historique = Array.from(new Set([...parPeriode.keys(), ...Object.keys(coachings)]))
    .filter(k => k < actuelle).sort().reverse()

  const totalRdv = (rows: Commission[]) => rows.reduce((s, c) => s + c.montant, 0)
  const nbCoachings = (p: string) => coachings[p] ?? 0
  const coachingsMois = nbCoachings(actuelle)
  const totalMois = totalRdv(duMois) + coachingsMois * COMMISSION_COACHING

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          💶 Commission Bonus
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {COMMISSION_PAR_RDV} € par RDV où le prospect était présent — vente ou non — et {COMMISSION_COACHING} € par coaching.
          Chaque période s’arrête le 25 du mois (du 26 au 25).
          Les commissions sont figées : supprimer un prospect ailleurs ne les retire pas.
        </p>
      </div>

      {coachingsLus === null && (
        <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700">
          ⚠ Les coachings n’ont pas pu être lus : les totaux ci-dessous ne les comptent pas. Recharge la page.
        </div>
      )}

      {/* Période en cours */}
      <div className="rounded-2xl border-2 border-[#F5C800] bg-white p-6 shadow-sm mb-8">
        <p className="label-condensed mb-1">{labelPeriode(actuelle)} — période en cours</p>
        <p className="text-xs text-gray-500 mb-2">{bornesPeriode(actuelle)}</p>
        <div className="flex items-end gap-3 flex-wrap">
          <p className="text-5xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
            {euros(totalMois)}
          </p>
          <p className="text-sm text-gray-500 pb-1.5">
            {duMois.length} RDV présent{duMois.length !== 1 ? 's' : ''} ({euros(totalRdv(duMois))})
            {' · '}
            <Link href="/coachings" className="underline hover:text-gray-900">
              {coachingsMois} coaching{coachingsMois !== 1 ? 's' : ''}
            </Link>
            {' '}({euros(coachingsMois * COMMISSION_COACHING)})
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
                    {new Date(c.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })}
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
          <p className="mt-4 text-sm text-gray-400">Aucun RDV présent sur cette période pour l’instant.</p>
        )}
        <p className="mt-4 text-xs text-gray-500">
          Coachings : à noter dans l’onglet <Link href="/coachings" className="underline hover:text-gray-900">💪 Coachings</Link>.
        </p>
      </div>

      {/* Historique */}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Historique</h2>
      {historique.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-400 text-sm">Pas encore d’historique — il se remplira période après période.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 label-condensed">Période</th>
                <th className="text-right px-4 py-2.5 label-condensed">RDV présents</th>
                <th className="text-right px-4 py-2.5 label-condensed">Coachings</th>
                <th className="text-right px-4 py-2.5 label-condensed">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historique.map(key => {
                const rows = parPeriode.get(key) ?? []
                const nb = nbCoachings(key)
                return (
                  <tr key={key} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <details>
                        <summary className="text-gray-900 font-medium cursor-pointer select-none">
                          {labelPeriode(key)} <span className="text-xs text-gray-400">(détail)</span>
                          <span className="block text-[11px] text-gray-400 font-normal">{bornesPeriode(key)}</span>
                        </summary>
                        <ul className="mt-2 space-y-1.5">
                          {rows.length === 0 && <li className="text-xs text-gray-400">Aucun RDV présent.</li>}
                          {rows.map(c => {
                            const statut = c.lead_id ? statutParLead.get(c.lead_id) : undefined
                            return (
                              <li key={c.id} className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="whitespace-nowrap">
                                  {new Date(c.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })}
                                </span>
                                {c.lead_id && statut ? (
                                  <Link href={`/leads/${c.lead_id}`} className="font-medium text-gray-700 hover:text-[#F5C800] truncate">
                                    {c.nom}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-gray-700 truncate">{c.nom}</span>
                                )}
                                {statut ? (
                                  <span className={`font-medium px-2 py-0.5 rounded-full ${ISSUE_BADGE[statut] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {statut === 'Vendu' ? 'Vendu ✓' : statut === 'RDV pris' ? 'En cours' : statut}
                                  </span>
                                ) : (
                                  <span className="font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                                    Supprimé du CRM
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </details>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{rows.length}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{nb}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {euros(totalRdv(rows) + nb * COMMISSION_COACHING)}
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
