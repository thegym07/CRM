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

// Date de la vente : le RDV (la vente se fait pendant la séance), sinon la mise à jour
const dateVente = (l: Lead) => l.date_rdv ?? l.updated_at

export default async function RentabilitePage() {
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
  const revenus = new Map<string, number>()
  for (const v of ventes) {
    const offre = v.offre_souscrite ? OFFRES[v.offre_souscrite] : undefined
    if (!offre) continue
    let mois = cleMois(dateVente(v))
    for (let i = 0; i < offre.duree; i++) {
      if (mois <= moisCourant) revenus.set(mois, (revenus.get(mois) ?? 0) + offre.prix)
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

  // ── Taux par mois (RDV pointés / ventes) sur la date du RDV ──
  const tauxDe = (key: string) => {
    const duMois = leads.filter(l => l.rdv_honore !== null && l.date_rdv && cleMois(l.date_rdv) === key)
    const presents = duMois.filter(l => l.rdv_honore === true)
    const venduPresents = presents.filter(l => l.statut === 'Vendu')
    return { rdv: duMois.length, presents: presents.length, ventes: venduPresents.length }
  }

  // ── Mois en cours ──
  const revM = revenus.get(moisCourant) ?? 0
  const depM = depensesDe(moisCourant)
  const totalDepM = depM.pub + depM.salaire + depM.com
  const resultatM = revM - totalDepM
  const tauxM = tauxDe(moisCourant)

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
        <p className="label-condensed mb-1">{labelMois(moisCourant)} — mois en cours</p>
        <div className="flex items-end gap-3 flex-wrap">
          <p className={`text-5xl font-bold ${resultatM >= 0 ? 'text-green-600' : 'text-red-500'}`} style={{ letterSpacing: '-0.03em' }}>
            {resultatM >= 0 ? '+' : ''}{euros(resultatM)}
          </p>
          <p className="text-sm text-gray-500 pb-1.5">{resultatM >= 0 ? 'On gagne de l’argent 🎉' : 'On en perd pour l’instant'}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm max-w-md">
          <span className="text-gray-500">Revenus (ventes + mensualités)</span>
          <span className="font-semibold text-gray-900 text-right">{euros(revM)}</span>
          <span className="text-gray-500">Pub ({PUB_PAR_JOUR} € × {aujourdhui} j)</span>
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
          <p className="label-condensed mb-1">RDV pointés ce mois</p>
          <p className="text-3xl font-bold text-gray-900">{pct(tauxM.presents, tauxM.rdv)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tauxM.presents} présents / {tauxM.rdv} RDV</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="label-condensed mb-1">Taux de vente ce mois</p>
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
              return (
                <tr key={key} className={`hover:bg-gray-50 ${key === moisCourant ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{labelMois(key)}</td>
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
