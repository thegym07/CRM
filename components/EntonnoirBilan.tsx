import { lireEntonnoir } from '@/lib/entonnoirBilanDb'
import { ETAPES_ENTONNOIR, LIBELLE_CANAL, LIBELLE_ETAPE, QUESTION_CONDITIONNELLE } from '@/lib/entonnoirBilan'

// Carte « Bilan Forme : entonnoir 30 jours » du tableau de bord (compteurs anonymes, sans cookie).
const pct = (n: number, base: number) => (base > 0 ? Math.round((100 * n) / base) : 0)

export default async function EntonnoirBilan() {
  const ent = await lireEntonnoir(30)
  const depuis = ent ? new Date(`${ent.depuis}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }) : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">📊 Bilan Forme : entonnoir 30 jours</h2>
      </div>
      <p className="text-xs text-gray-400 -mt-1 mb-3">
        Combien de visiteurs ouvrent le bilan, répondent à chaque question et laissent leur numéro (compteurs anonymes, mesurés depuis le 26/11).
      </p>
      {!ent ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">Compteurs indisponibles pour le moment.</p>
        </div>
      ) : ent.total.ouverture === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">Pas encore de visite du bilan depuis le {depuis}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="space-y-1.5">
            {ETAPES_ENTONNOIR.map((e, i) => {
              const n = ent.total[e]
              const precedent = i > 0 ? ent.total[ETAPES_ENTONNOIR[i - 1]] : n
              const perte = i > 0 && !QUESTION_CONDITIONNELLE.has(e) && precedent > 0 ? precedent - n : 0
              return (
                <div key={e} className="flex items-center gap-3 text-sm">
                  <span className="w-48 shrink-0 truncate text-gray-700" title={LIBELLE_ETAPE[e]}>
                    {LIBELLE_ETAPE[e]}
                    {QUESTION_CONDITIONNELLE.has(e) && <span className="text-gray-400"> (si concerné)</span>}
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#F5C800]" style={{ width: `${pct(n, ent.total.ouverture)}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right tabular-nums text-gray-900">
                    <b>{n}</b> <span className="text-gray-400">· {pct(n, ent.total.ouverture)} %</span>
                  </span>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-red-500">{perte > 0 ? `−${perte}` : ''}</span>
                </div>
              )
            })}
          </div>
          {ent.parCanal.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Par provenance</p>
              <div className="space-y-1">
                {ent.parCanal.map((c) => (
                  <div key={c.canal} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate text-gray-700">{LIBELLE_CANAL[c.canal] ?? c.canal}</span>
                    <span className="tabular-nums text-gray-500">{c.ouverture} ouverture{c.ouverture > 1 ? 's' : ''}</span>
                    <span className="w-28 text-right tabular-nums text-gray-900">
                      <b>{c.envoi}</b> prospect{c.envoi > 1 ? 's' : ''} <span className="text-gray-400">({pct(c.envoi, c.ouverture)} %)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ent.total.membre > 0 && (
            <p className="text-xs text-gray-400">+ {ent.total.membre} adhérent{ent.total.membre > 1 ? 's' : ''} ayant fait le bilan (pas de prospect créé).</p>
          )}
        </div>
      )}
    </div>
  )
}
