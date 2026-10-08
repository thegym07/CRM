import { getLeads } from '@/lib/db'
import { getCommissions, type Commission } from '@/lib/commissions'
import Link from 'next/link'
import CommissionDelete from './CommissionDelete'

export const dynamic = 'force-dynamic'

type SearchParams = { mois?: string }

// Montant de référence affiché dans le sous-titre (chaque ligne garde son
// propre montant figé en base).
const COMMISSION_PAR_RDV = 10

// Commission coach : séance plateau muscu accompagnée (présence Oui + coach assigné)
const COMMISSION_COACH = 30

// Clé "YYYY-MM" calculée en heure française (indépendante du fuseau serveur)
const moisKey = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }).slice(0, 7)
const cleMois = moisKey

// Date d'une séance coach = date du RDV (fallback : dernière mise à jour)
import type { Lead } from '@/lib/supabase'
const dateSeance = (l: Lead) => l.date_rdv ?? l.updated_at
const cleMoisDe = (l: Lead) => moisKey(dateSeance(l))

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

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [commissions, leads] = await Promise.all([getCommissions(), getLeads()])
  const statutParLead = new Map(leads.map(l => [l.id, l.statut]))

  // ── Commissions coachs : calculées en direct depuis les séances ──
  const seances = leads.filter(l =>
    l.activite === 'plateau muscu' && l.coach_assigne && l.rdv_honore === true
  )
  const moisDisponibles = Array.from(new Set(seances.map(s => cleMoisDe(s)))).sort().reverse()
  const moisActuel = cleMois(new Date().toISOString())
  const moisSel = params.mois && /^\d{4}-\d{2}$/.test(params.mois) ? params.mois : moisActuel
  const seancesMois = seances
    .filter(s => cleMoisDe(s) === moisSel)
    .sort((a, b) => new Date(dateSeance(b)).getTime() - new Date(dateSeance(a)).getTime())
  const parCoach = new Map<string, typeof seancesMois>()
  for (const s of seancesMois) {
    const nom = s.coach_assigne!
    parCoach.set(nom, [...(parCoach.get(nom) ?? []), s])
  }

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
                  <tr key={key} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <details>
                        <summary className="text-gray-900 font-medium cursor-pointer select-none">
                          {moisLabel(key)} <span className="text-xs text-gray-400">(détail)</span>
                        </summary>
                        <ul className="mt-2 space-y-1.5">
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

      {/* ══════════ Commissions coachs ══════════ */}
      <div className="mt-12">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            💪 Commissions coachs
          </h2>
          <a
            href={`/api/export/coachs?mois=${moisSel}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-500"
          >
            ⬇ Export CSV
          </a>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          {COMMISSION_COACH} € par séance plateau muscu accompagnée (présence Oui).
        </p>

        {/* Filtre par mois */}
        <div className="flex gap-2 flex-wrap mb-4">
          {Array.from(new Set([moisActuel, ...moisDisponibles])).sort().reverse().map(m => (
            <Link key={m} href={`/commissions?mois=${m}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                m === moisSel
                  ? 'bg-[#F5C800] text-black border-[#F5C800]'
                  : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-500 bg-white'
              }`}>
              {moisLabel(m)}
            </Link>
          ))}
        </div>

        {parCoach.size === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-400 text-sm">Aucune séance accompagnée ce mois-ci.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2.5 label-condensed">Coach</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Séances réalisées</th>
                  <th className="text-right px-4 py-2.5 label-condensed">Montant dû</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.from(parCoach.entries()).sort((a, b) => b[1].length - a[1].length).map(([coach, rows]) => (
                  <tr key={coach} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <details>
                        <summary className="font-medium text-gray-900 cursor-pointer select-none">
                          {coach} <span className="text-xs text-gray-400">(détail)</span>
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {rows.map(s => (
                            <li key={s.id} className="text-xs text-gray-500">
                              {new Date(dateSeance(s)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })}
                              {' — '}
                              <Link href={`/leads/${s.id}`} className="hover:text-[#F5C800]">{s.nom}</Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{rows.length}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{euros(rows.length * COMMISSION_COACH)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{seancesMois.length}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{euros(seancesMois.length * COMMISSION_COACH)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-2">
          Calculé en direct : si une présence repasse à « Non », la séance est retirée automatiquement.
        </p>
      </div>
    </div>
  )
}
