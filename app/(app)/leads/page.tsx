import { getLeads } from '@/lib/db'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import StatutLeadSelect from '@/components/StatutLeadSelect'
import InlineNotes from '@/components/InlineNotes'
import DeleteButton from '@/components/DeleteButton'
import PasInteresseButton from '@/components/PasInteresseButton'
import CallTracker from '@/components/CallTracker'
import MobileNotes from '@/components/MobileNotes'

export const dynamic = 'force-dynamic'

type SearchParams = { statut?: string; q?: string }

// Prospects = jamais eus au téléphone. Le reste vit dans RDV & Relances.
const FILTRES = [
  { label: 'Tous',                  value: '' },
  { label: 'Nouveau prospect',      value: 'Nouveau prospect' },
  { label: 'Contacté sans réponse', value: 'Contacté sans réponse' },
]


export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  // Prospects = jamais eus au téléphone (le suivi actif vit dans RDV & Relances)
  let all = (await getLeads()).filter(l =>
    l.statut === 'Nouveau prospect' || l.statut === 'Contacté sans réponse'
  )

  if (params.statut && params.statut !== 'Tous') {
    all = all.filter(l => l.statut === params.statut)
  }

  const filtered = params.q
    ? all.filter(l =>
        l.nom.toLowerCase().includes(params.q!.toLowerCase()) ||
        (l.telephone && l.telephone.includes(params.q!))
      )
    : all

  // Prospect « qui dort » : jamais rappelé depuis plus de 48 h
  const DORMANT_MS = 48 * 3600 * 1000
  const dort = (l: (typeof all)[number]) => {
    const appels = l.appels ?? []
    const dernier = appels.length > 0 ? Math.max(...appels.map(a => new Date(a).getTime())) : new Date(l.created_at).getTime()
    return Date.now() - dernier > DORMANT_MS
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Prospects
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{filtered.length} prospect{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/export/leads"
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-500">
            ⬇ Export
          </a>
          <Link href="/leads/nouveau" className="btn-primary text-sm">+ Nouveau</Link>
        </div>
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
        <>
        {/* Mobile : cartes */}
        <div className="md:hidden space-y-2">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/leads/${lead.id}`} className="font-semibold text-gray-900 hover:text-[#F5C800]">
                    {lead.nom}
                  </Link>
                  {dort(lead) && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      😴 +48 h
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ajouté le {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })}
                    {lead.activite ? ` · ${lead.activite}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <PasInteresseButton leadId={lead.id} leadNom={lead.nom} />
                  <DeleteButton leadId={lead.id} leadNom={lead.nom} />
                </div>
              </div>
              {lead.telephone && (
                <div className="flex items-center gap-1">
                  <a href={`tel:${lead.telephone}`} className="font-mono text-sm text-gray-700">{lead.telephone}</a>
                  <CopyButton text={lead.telephone} />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <StatutLeadSelect leadId={lead.id} value={lead.statut} />
                <MobileNotes leadId={lead.id} value={lead.notes} nom={lead.nom} />
              </div>
              <CallTracker leadId={lead.id} appels={lead.appels ?? []} />
            </div>
          ))}
        </div>

        {/* Desktop : tableau */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
                      {dort(lead) && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          😴 +48 h
                        </span>
                      )}
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
                      {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' })}
                      <span className="text-gray-400 ml-1">
                        {new Date(lead.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
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
                    <div className="flex items-center justify-center gap-1">
                      <PasInteresseButton leadId={lead.id} leadNom={lead.nom} />
                      <DeleteButton leadId={lead.id} leadNom={lead.nom} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
