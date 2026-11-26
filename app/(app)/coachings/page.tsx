import Link from 'next/link'
import { getCoachings, COMMISSION_COACHING } from '@/lib/coachings'
import { periodeActuelle, labelPeriode, bornesPeriode, moisPrecedent } from '@/lib/periodes'
import { CompteurCoachings, SaisieCoachings } from './CoachingsClient'

export const dynamic = 'force-dynamic'

export default async function CoachingsPage() {
  const coachings = await getCoachings()
  const actuelle = periodeActuelle()

  const entete = (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
        💪 Coachings
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        Note ici le nombre de coachings faits sur la période : {COMMISSION_COACHING} € par coaching,
        ajoutés à ta <Link href="/commissions" className="underline hover:text-gray-900">Commission Bonus</Link>.
        Chaque période s’arrête le 25 du mois. Ça s’enregistre tout seul.
      </p>
    </div>
  )

  // Lecture impossible : surtout ne pas afficher 0 (une saisie écraserait la vraie valeur)
  if (coachings === null) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {entete}
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-700">
          ⚠ Impossible de lire les coachings pour le moment. Recharge la page dans quelques secondes.
        </div>
      </div>
    )
  }

  // Périodes passées : les 6 dernières + toute période déjà renseignée
  const passees = new Set<string>()
  for (let p = moisPrecedent(actuelle), i = 0; i < 6; p = moisPrecedent(p), i++) passees.add(p)
  for (const p of Object.keys(coachings)) if (p < actuelle) passees.add(p)
  const historique = Array.from(passees).sort().reverse()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {entete}

      <div className="rounded-2xl border-2 border-[#F5C800] bg-white p-6 shadow-sm mb-8">
        <p className="label-condensed mb-1">{labelPeriode(actuelle)} — période en cours</p>
        <p className="text-xs text-gray-500 mb-4">{bornesPeriode(actuelle)}</p>
        <CompteurCoachings key={actuelle} periode={actuelle} initial={coachings[actuelle] ?? 0} tarif={COMMISSION_COACHING} />
      </div>

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Périodes précédentes</h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        {historique.map(p => (
          <div key={p} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{labelPeriode(p)}</p>
              <p className="text-xs text-gray-400">{bornesPeriode(p)}</p>
            </div>
            <SaisieCoachings periode={p} initial={coachings[p] ?? 0} tarif={COMMISSION_COACHING} />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Oubli ou erreur sur une période passée : corrige le nombre directement ici.</p>
    </div>
  )
}
