import { getLeads } from '@/lib/db'
import { getCommissions } from '@/lib/commissions'
import Link from 'next/link'
import InlineSelect from '@/components/InlineSelect'
import type { Lead } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ── Paramètres économiques (à ajuster ici si ça change) ──
const PUB_PAR_JOUR = 10       // dépense publicitaire quotidienne (€)
const SALAIRE_MENSUEL = 150   // salaire fixe de la commerciale (€/mois)
const DEBUT_ACTIVITE = '2026-08' // début du calcul (lancement des pubs)

// Formules vendues : prix unique ou mensualité récurrente sur une durée
const OFFRES: Record<string, { label: string; prix: number; duree: number }> = {
  'Carnet 10 entrées':   { label: 'Carnet 10 entrées — 55 €',        prix: 55,  duree: 1 },
  'Carnet 20 entrées':   { label: 'Carnet 20 entrées — 105 €',       prix: 105, duree: 1 },
  'Abonnement 1 mois':   { label: 'Abonnement 1 mois — 59 €',             prix: 59,  duree: 1 },
  'Abonnement 3 mois':   { label: 'Abonnement 3 mois — 165 € (3× 55 €)',  prix: 55,  duree: 3 },
  'Abonnement 6 mois':   { label: 'Abonnement 6 mois — 270 € (6× 45 €)',  prix: 45,  duree: 6 },
  'Abonnement 1 an':     { label: 'Abonnement 1 an — 456 € (12× 38 €)',   prix: 38,  duree: 12 },
}

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const pct = (num: number, den: number) => den === 0 ? '—' : `${Math.round((num / den) * 100)} %`

const cleMois = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }).slice(0, 7)

function labelMois(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function moisSuivant(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

const joursDansMois = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// Date de la vente : la date figée au passage en Vendu (fallback anciens : RDV puis maj)
const dateVente = (l: Lead) => l.vendu_le ?? l.date_rdv ?? l.updated_at

type SearchParams = { mois?: string }

export default async function RentabilitePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [leads, commissions] = await Promise.all([getLeads(), getCommissions()])
  const moisCourant = cleMois(new Date().toISOString())
  const aujourdhui = new Date().getDate()

  // ── Liste des mois depuis le début d'activité ──
  const tousLesMois: string[] = []
  for (let k = DEBUT_ACTIVITE; k <= moisCourant; k = moisSuivant(k)) tousLesMois.push(k)

  // ── Ventes (depuis le début d'activité) ──
  const ventes = leads
    .filter(l => l.statut === 'Vendu' && cleMois(dateVente(l)) >= DEBUT_ACTIVITE)
    .sort((a, b) => new Date(dateVente(b)).getTime() - new Date(dateVente(a)).getTime())
  const ventesAQualifier = ventes.filter(l => !l.offre_souscrite || !OFFRES[l.offre_souscrite])

  // ── Revenus par mois (mensualités récurrentes étalées sur la durée) ──
  // + détail nominatif de ce qui compose chaque mois (pour l'historique dépliable)
  const revenus = new Map<string, number>()
  const detailMois = new Map<string, { nom: string; label: string; montant: number; leadId: string }[]>()
  for (const v of ventes) {
    const offre = v.offre_souscrite ? OFFRES[v.offre_souscrite] : undefined
    if (!offre) continue
    let mois = cleMois(dateVente(v))
    for (let i = 0; i < offre.duree; i++) {
      if (mois <= moisCourant) {
        revenus.set(mois, (revenus.get(mois) ?? 0) + offre.prix)
        const mensualite = offre.duree > 1 ? ` (mensualité ${i + 1}/${offre.duree})` : ''
        detailMois.set(mois, [
          ...(detailMois.get(mois) ?? []),
          { nom: v.nom, label: `${v.offre_souscrite}${mensualite}`, montant: offre.prix, leadId: v.id },
        ])
      }
      mois = moisSuivant(mois)
    }
  }

  // ── Dépenses par mois ──
  const comParMois = new Map<string, number>()
  for (const c of commissions) {
    const key = cleMois(c.date_rdv)
    comParMois.set(key, (comParMois.get(key) ?? 0) + c.montant)
  }
  const depensesDe = (key: string) => {
    const jours = key === moisCourant ? aujourdhui : joursDansMois(key)
    return { pub: jours * PUB_PAR_JOUR, salaire: SALAIRE_MENSUEL, com: comParMois.get(key) ?? 0 }
  }

  // ── Taux par mois (RDV pointés / ventes) ──
  // Les présences viennent des commissions FIGÉES (une ligne = un RDV présent) :
  // les fiches prospects sont modifiées après coup (relances, RDV repris) et
  // sous-comptaient les présents. Les absents restent lus sur les fiches.
  const statutParLead = new Map(leads.map(l => [l.id, l.statut]))
  const tauxDe = (key: string) => {
    const presents = commissions.filter(c => cleMois(c.date_rdv) === key)
    const absents = leads.filter(l => l.rdv_honore === false && l.date_rdv && cleMois(l.date_rdv) === key)
    const venduPresents = presents.filter(c => c.lead_id && statutParLead.get(c.lead_id) === 'Vendu')
    return { rdv: presents.length + absents.length, presents: presents.length, ventes: venduPresents.length }
  }

  // ── Mois affiché en grand : le mois en cours, ou celui cliqué dans l'historique ──
  const moisSel = params.mois && /^\d{4}-\d{2}$/.test(params.mois) && tousLesMois.includes(params.mois)
    ? params.mois : moisCourant
  const estCourant = moisSel === moisCourant
  const joursSel = estCourant ? aujourdhui : joursDansMois(moisSel)
  const revM = revenus.get(moisSel) ?? 0
  const depM = depensesDe(moisSel)
  const totalDepM = depM.pub + depM.salaire + depM.com
  const resultatM = revM - totalDepM
  const tauxM = tauxDe(moisSel)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          📈 Rentabilité
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Pub {PUB_PAR_JOUR} €/jour · Salaire {SALAIRE_MENSUEL} €/mois · Commissions incluses · Abonnements comptés en mensualités
        </p>
      </div>

      {/* Ventes à qualifier */}
      {ventesAQualifier.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-[#F5C800] bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            ⚠ {ventesAQualifier.length} vente{ventesAQualifier.length > 1 ? 's' : ''} sans formule — choisis-la pour compter le revenu :
          </p>
          <div className="space-y-2">
            {ventesAQualifier.map(v => (
              <div key={v.id} className="flex items-center gap-3 flex-wrap">
                <Link href={`/leads/${v.id}`} className="text-sm font-medium text-gray-900 hover:text-yellow-700">{v.nom}</Link>
                <InlineSelect
                  leadId={v.id}
                  field="offre_souscrite"
                  value={v.offre_souscrite ?? 'null'}
                  options={[
                    { label: '— Choisir la formule —', value: 'null' },
                    ...Object.entries(OFFRES).map(([value, o]) => ({ label: o.label, value })),
                  ]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mois en cours */}
      <div className={`rounded-2xl border-2 p-6 shadow-sm mb-4 bg-white ${resultatM >= 0 ? 'border-green-500' : 'border-red-400'}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <p className="label-condensed">{labelMois(moisSel)}{estCourant ? ' — mois en cours' : ''}</p>
          {!estCourant && (
            <Link href="/rentabilite" className="text-xs text-gray-500 hover:text-gray-900 underline">
              ← Revenir au mois en cours
            </Link>
          )}
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <p className={`text-5xl font-bold ${resultatM >= 0 ? 'text-green-600' : 'text-red-500'}`} style={{ letterSpacing: '-0.03em' }}>
            {resultatM >= 0 ? '+' : ''}{euros(resultatM)}
          </p>
          <p className="text-sm text-gray-500 pb-1.5">{resultatM >= 0 ? 'On gagne de l’argent 🎉' : estCourant ? 'On en perd pour l’instant' : 'Mois dans le rouge'}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm max-w-md">
          <span className="text-gray-500">Revenus (ventes + mensualités)</span>
          <span className="font-semibold text-gray-900 text-right">{euros(revM)}</span>
          <span className="text-gray-500">Pub ({PUB_PAR_JOUR} € × {joursSel} j)</span>
          <span className="font-semibold text-gray-900 text-right">−{euros(depM.pub)}</span>
          <span className="text-gray-500">Salaire commerciale</span>
          <span className="font-semibold text-gray-900 text-right">−{euros(depM.salaire)}</span>
          <span className="text-gray-500">Commissions bonus</span>
          <span className="font-semibold text-gray-900 text-right">−{euros(depM.com)}</span>
        </div>
      </div>

      {/* Axes d'amélioration */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="label-condensed mb-1">RDV pointés {estCourant ? 'ce mois' : `en ${labelMois(moisSel).toLowerCase()}`}</p>
          <p className="text-3xl font-bold text-gray-900">{pct(tauxM.presents, tauxM.rdv)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tauxM.presents} présents / {tauxM.rdv} RDV</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="label-condensed mb-1">Taux de vente {estCourant ? 'ce mois' : `en ${labelMois(moisSel).toLowerCase()}`}</p>
          <p className="text-3xl font-bold text-gray-900">{pct(tauxM.ventes, tauxM.presents)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tauxM.ventes} ventes / {tauxM.presents} présents</p>
        </div>
      </div>

      {/* Historique mensuel */}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Mois par mois</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2.5 label-condensed">Mois</th>
              <th className="text-right px-4 py-2.5 label-condensed">Revenus</th>
              <th className="text-right px-4 py-2.5 label-condensed">Dépenses</th>
              <th className="text-right px-4 py-2.5 label-condensed">Résultat</th>
              <th className="text-right px-4 py-2.5 label-condensed">Présence</th>
              <th className="text-right px-4 py-2.5 label-condensed">Ventes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...tousLesMois].reverse().map(key => {
              const rev = revenus.get(key) ?? 0
              const dep = depensesDe(key)
              const totalDep = dep.pub + dep.salaire + dep.com
              const res = rev - totalDep
              const t = tauxDe(key)
              const detail = detailMois.get(key) ?? []
              return (
                <tr key={key} className={`hover:bg-gray-50 align-top ${key === moisSel ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {detail.length > 0 ? (
                      <details>
                        <summary className="cursor-pointer select-none">
                          <Link href={`/rentabilite?mois=${key}`} className="hover:text-[#F5C800] underline decoration-gray-300 underline-offset-2">{labelMois(key)}</Link>
                          {' '}<span className="text-xs text-gray-400 font-normal">(détail)</span>
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {detail.map((d, i) => (
                            <li key={i} className="text-xs text-gray-500 font-normal whitespace-nowrap">
                              <Link href={`/leads/${d.leadId}`} className="hover:text-[#F5C800]">{d.nom}</Link>
                              {' — '}{d.label}{' — '}
                              <span className="font-semibold text-gray-700">{euros(d.montant)}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <Link href={`/rentabilite?mois=${key}`} className="hover:text-[#F5C800] underline decoration-gray-300 underline-offset-2">{labelMois(key)}</Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{euros(rev)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">−{euros(totalDep)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${res >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {res >= 0 ? '+' : ''}{euros(res)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{pct(t.presents, t.rdv)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{pct(t.ventes, t.presents)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Les abonnements 3/6/12 mois comptent leur mensualité chaque mois pendant la durée de l'engagement.
        Les dépenses du mois en cours courent jusqu'à aujourd'hui.
      </p>
    </div>
  )
}
