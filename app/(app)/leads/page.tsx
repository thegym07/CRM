import { getLeads } from '@/lib/db'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import StatutLeadSelect from '@/components/StatutLeadSelect'
import InlineNotes from '@/components/InlineNotes'
import DeleteButton from '@/components/DeleteButton'
import CallTracker from '@/components/CallTracker'
import MobileNotes from '@/components/MobileNotes'

export const dynamic = 'force-dynamic'

type SearchParams = { statut?: string; q?: string }

// Filtres affichés (RDV pris exclu : géré dans Show-up)
const FILTRES = [
  { label: 'Tous',                 value: '' },
  { label: 'Nouveau prospect',     value: 'Nouveau prospect' },
  { label: 'Contacté sans réponse', value: 'Contacté sans réponse' },
  { label: 'À rappeler',           value: 'À relancer' },
]


export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  // Les prospects "RDV pris" sont gérés dans Show-up
  let all = (await getLeads()).filter(l => l.statut !== 'RDV pris')

  if (params.statut && params.statut !== 'Tous') {
    all = all.filter(l => l.statut === params.statut)
  }

  const filtered = params.q
    ? all.filter(l =>
        l.nom.toLowerCase().includes(params.q!.toLowerCase()) ||
        (l.telephone && l.telephone.includes(params.q!))
      )
    : all

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
            Prospects
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{filtered.length} prospect{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/leads/nouveau" className="btn-primary text-sm">+ Nouveau</Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-3">
        {FILTRES.map(f => {
          const active = (params.statut === f.value) || (!params.statut && f.value === '')
          return (
            <Link key={f.label} href={`/leads${f.value ? `?statut=${encodeURIComponent(f.value)}` : ''}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-[#F5C800] text-black border-[#F5C800]'
                  : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-500 bg-white'
              }`}>
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Recherche */}
      <form className="mb-4">
        {params.statut && <input type="hidden" name="statut" value={params.statut} />}
        <input name="q" defaultValue={params.q} type="search" className="input-field max-w-xs"
          placeholder="Rechercher par nom ou téléphone…" />
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center bg-white">
          <p className="text-gray-500">Aucun prospect trouvé</p>
          <Link href="/leads/nouveau" className="inline-block mt-4 text-sm text-[#F5C800] hover:underline">
            Créer le premier prospect
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 label-condensed">Nom / Prénom</th>
                <th className="text-left px-4 py-3 label-condensed">Téléphone</th>
                <th className="text-left px-4 py-3 label-condensed">Date d'ajout</th>
                <th className="text-center px-4 py-3 label-condensed">Statut</th>
                <th className="text-center px-4 py-3 label-condensed">Appels</th>
                <th className="text-left px-4 py-3 label-condensed hidden xl:table-cell min-w-[240px]">Notes</th>
                <th className="px-4 py-3 label-condensed xl:hidden w-10"></th>
                <th className="px-4 py-3 label-condensed w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="block hover:text-[#F5C800] transition-colors">
                      <span className="font-medium text-gray-900">{lead.nom}</span>
                      {lead.activite && <span className="block text-xs text-gray-500 mt-0.5">{lead.activite}</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {lead.telephone ? (
                      <span className="flex items-center">
                        <a href={`tel:${lead.telephone}`} className="text-gray-700 hover:text-[#F5C800] font-mono text-xs">
                          {lead.telephone}
                        </a>
                        <CopyButton text={lead.telephone} />
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      <span className="text-gray-400 ml-1">
                        {new Date(lead.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatutLeadSelect leadId={lead.id} value={lead.statut} />
                  </td>
                  <td className="px-4 py-3">
                    <CallTracker leadId={lead.id} appels={lead.appels ?? []} />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell align-top min-w-[240px]">
                    <InlineNotes leadId={lead.id} value={lead.notes} />
                  </td>
                  <td className="px-4 py-3 xl:hidden text-center">
                    <MobileNotes leadId={lead.id} value={lead.notes} nom={lead.nom} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DeleteButton leadId={lead.id} leadNom={lead.nom} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
