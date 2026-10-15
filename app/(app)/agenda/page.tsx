import { getCoaches, getCreneaux, type Creneau } from '@/lib/agenda'
import { syncTousLesCoachs } from '@/lib/icalImport'
import Link from 'next/link'
import { AjouterDispo, SlotChip, GestionCoachs } from './AgendaClient'

export const dynamic = 'force-dynamic'

type SearchParams = { s?: string }

const jourFr = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

// Lundi de la semaine contenant la date donnée (en heure française)
function lundiDe(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const jour = (date.getDay() + 6) % 7 // 0 = lundi
  date.setDate(date.getDate() - jour)
  return date
}

const addJours = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const aujourdhui = jourFr(new Date())
  const lundi = lundiDe(params.s && /^\d{4}-\d{2}-\d{2}$/.test(params.s) ? params.s : aujourdhui)
  const jours = Array.from({ length: 7 }, (_, i) => addJours(lundi, i))
  const finSemaine = addJours(lundi, 7)

  // 1. Importe les dispos depuis les agendas perso des coachs (Google / iPhone)
  const coaches = await getCoaches()
  await syncTousLesCoachs(coaches)
  // 2. Puis charge la semaine affichée
  const creneaux = await getCreneaux(lundi.toISOString(), finSemaine.toISOString())
  const coachDe = (id: string) => coaches.find(c => c.id === id)

  // Regroupe les créneaux par jour (heure française)
  const parJour = new Map<string, Creneau[]>()
  for (const c of creneaux) {
    const key = jourFr(new Date(c.debut))
    parJour.set(key, [...(parJour.get(key) ?? []), c])
  }

  const semainePrec = jourFr(addJours(lundi, -7))
  const semaineSuiv = jourFr(addJours(lundi, 7))
  const labelSemaine = `${lundi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${addJours(lundi, 6).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            🗓️ Agenda
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Dispos des coachs (pointillés) et RDV bloqués (pleins) — une couleur par coach
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agenda?s=${semainePrec}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-400">←</Link>
          <span className="text-sm font-semibold text-gray-700 min-w-[170px] text-center">{labelSemaine}</span>
          <Link href={`/agenda?s=${semaineSuiv}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-400">→</Link>
          <Link href="/agenda" className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900">Aujourd'hui</Link>
        </div>
      </div>

      <AjouterDispo coaches={coaches} />

      {/* Grille semaine : 7 colonnes sur desktop, liste sur mobile */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {jours.map(j => {
          const key = jourFr(j)
          const duJour = parJour.get(key) ?? []
          const estAujourdhui = key === aujourdhui
          return (
            <div key={key} className={`rounded-xl border p-2 min-h-[90px] ${estAujourdhui ? 'border-[#F5C800] bg-yellow-50/50' : 'border-gray-200 bg-white'}`}>
              <p className={`text-xs font-semibold mb-2 capitalize ${estAujourdhui ? 'text-yellow-700' : 'text-gray-500'}`}>
                {j.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric' })}
              </p>
              <div className="space-y-1.5">
                {duJour.map(c => <SlotChip key={c.id} creneau={c} coach={coachDe(c.coach_id)} />)}
                {duJour.length === 0 && <p className="text-[11px] text-gray-300">—</p>}
              </div>
            </div>
          )
        })}
      </div>

      <GestionCoachs coaches={coaches} baseUrl="https://crm-thegym.vercel.app" />
    </div>
  )
}
