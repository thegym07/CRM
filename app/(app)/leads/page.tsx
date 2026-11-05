import { getLeads } from '@/lib/db'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import StatutLeadSelect from '@/components/StatutLeadSelect'
import InlineNotes from '@/components/InlineNotes'
import PerduButton from '@/components/PerduButton'
import ReactiverButton from '@/components/ReactiverButton'
import SmsButton from '@/components/SmsButton'
import CallTracker from '@/components/CallTracker'
import MobileNotes from '@/components/MobileNotes'
import BilanResume from '@/components/BilanResume'
import SourceTag from '@/components/SourceTag'
import { aujourdhuiParis, dernierContact, nbAppels } from '@/lib/appels'
import { PREFIXE_PERTE, type Lead } from '@/lib/supabase'
import { smsProspect } from '@/lib/sms'

export const dynamic = 'force-dynamic'

type SearchParams = { statut?: string; q?: string }

// Prospects = jamais eus au téléphone. Le reste vit dans RDV & Relances.
const FILTRES = [
  { label: 'Tous',                  value: '' },
  { label: 'Nouveau prospect',      value: 'Nouveau prospect' },
  { label: 'Contacté sans réponse', value: 'Contacté sans réponse' },
  { label: 'Perdus',                value: 'Perdu' },
]

// SMS à proposer (après au moins un appel) : premier message, puis relance
const texteSms = (l: Lead) => smsProspect(l, nbAppels(l.appels))
const texteSmsApresAppel = (l: Lead) => smsProspect(l, nbAppels(l.appels) + 1)

// Prochain appel prévu plus tard que aujourd'hui (séquence de relance) : on l'affiche
function ProchainAppel({ lead, aujourdhui }: { lead: Lead; aujourdhui: string }) {
  if (!lead.date_relance || lead.date_relance <= aujourdhui) return null
  const d = new Date(`${lead.date_relance}T12:00:00`)
  return (
    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
      Rappel le {d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
    </span>
  )
}

const motifPerte = (l: Lead) => (l.motif_relance?.startsWith(PREFIXE_PERTE) ? l.motif_relance.slice(PREFIXE_PERTE.length) : 'motif non noté')


export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  // Prospects = jamais eus au téléphone (le suivi actif vit dans RDV & Relances).
  // Vue « Perdus » : les prospects sortis sans vente, avec leur motif.
  const vuePerdus = params.statut === 'Perdu'
  const tous = await getLeads()
  const nbPerdus = tous.filter(l => l.statut === 'Perdu').length
  let all = tous.filter(l =>
    vuePerdus ? l.statut === 'Perdu' : (l.statut === 'Nouveau prospect' || l.statut === 'Contacté sans réponse')
  )

  if (params.statut && params.statut !== 'Tous' && !vuePerdus) {
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
    if (vuePerdus) return false
    const dernier = dernierContact(l.appels) ?? new Date(l.created_at).getTime()
    return Date.now() - dernier > DORMANT_MS
  }

  // Ordre de la journée : à appeler aujourd'hui d'abord (les plus récents en tête,
  // c'est maintenant qu'ils sont chauds), puis ceux dont le rappel est programmé plus tard.
  const aujourdhui = aujourdhuiParis()
  const plusTard = (l: Lead) => !!l.date_relance && l.date_relance > aujourdhui
  filtered.sort((a, b) => {
    if (vuePerdus) return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    if (plusTard(a) !== plusTard(b)) return plusTard(a) ? 1 : -1
    if (plusTard(a)) return a.date_relance!.localeCompare(b.date_relance!)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const aAppeler = vuePerdus ? 0 : filtered.filter(l => !plusTard(l)).length

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Prospects
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {vuePerdus
              ? `${filtered.length} prospect${filtered.length !== 1 ? 's' : ''} perdu${filtered.length !== 1 ? 's' : ''} (archivés, rien n'est effacé)`
              : `${filtered.length} prospect${filtered.length !== 1 ? 's' : ''} · ${aAppeler} à appeler aujourd'hui`}
          </p>
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
              {f.label}{f.value === 'Perdu' && nbPerdus > 0 ? ` (${nbPerdus})` : ''}
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
                  <SourceTag source={lead.source} />
                  {dort(lead) && !plusTard(lead) && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      😴 +48 h
                    </span>
                  )}
                  {!vuePerdus && <ProchainAppel lead={lead} aujourdhui={aujourdhui} />}
                  {vuePerdus && <p className="text-xs text-gray-500 mt-0.5">Perdu : {motifPerte(lead)}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ajouté le {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })}
                    {lead.activite ? ` · ${lead.activite}` : ''}
                  </p>
                  <div className="mt-1.5"><BilanResume leadId={lead.id} fiche={lead.diagnostic} /></div>
                </div>
                <div className="flex items-center gap-1">
                  {vuePerdus ? <ReactiverButton leadId={lead.id} /> : <PerduButton leadId={lead.id} />}
                </div>
              </div>
              {lead.telephone && (
                <div className="flex items-center gap-1">
                  <a href={`tel:${lead.telephone}`} className="font-mono text-sm text-gray-700">{lead.telephone}</a>
                  <CopyButton text={lead.telephone} />
                  {!vuePerdus && texteSms(lead) && <span className="ml-auto"><SmsButton leadId={lead.id} telephone={lead.telephone} texte={texteSms(lead)!} /></span>}
                </div>
              )}
              {!vuePerdus && (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatutLeadSelect leadId={lead.id} value={lead.statut} />
                    <MobileNotes leadId={lead.id} value={lead.notes} nom={lead.nom} />
                  </div>
                  <CallTracker leadId={lead.id} appels={lead.appels ?? []} statut={lead.statut} dateRelance={lead.date_relance}
                    telephone={lead.telephone} smsApresAppel={texteSmsApresAppel(lead)} />
                </>
              )}
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
                      <SourceTag source={lead.source} />
                      {dort(lead) && !plusTard(lead) && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          😴 +48 h
                        </span>
                      )}
                      {!vuePerdus && <ProchainAppel lead={lead} aujourdhui={aujourdhui} />}
                      {vuePerdus && <span className="block text-xs text-gray-500 mt-0.5">Perdu : {motifPerte(lead)}</span>}
                      {lead.activite && <span className="block text-xs text-gray-500 mt-0.5">{lead.activite}</span>}
                    </Link>
                    <div className="mt-1"><BilanResume leadId={lead.id} fiche={lead.diagnostic} /></div>
                  </td>
                  <td className="px-4 py-3">
                    {lead.telephone ? (
                      <span className="flex items-center">
                        <a href={`tel:${lead.telephone}`} className="text-gray-700 hover:text-[#F5C800] font-mono text-xs">
                          {lead.telephone}
                        </a>
                        <CopyButton text={lead.telephone} />
                        {!vuePerdus && texteSms(lead) && <span className="ml-2"><SmsButton leadId={lead.id} telephone={lead.telephone} texte={texteSms(lead)!} /></span>}
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
                    {vuePerdus
                      ? <span className="text-xs text-gray-500">Perdu</span>
                      : <StatutLeadSelect leadId={lead.id} value={lead.statut} />}
                  </td>
                  <td className="px-4 py-3">
                    {!vuePerdus && <CallTracker leadId={lead.id} appels={lead.appels ?? []} statut={lead.statut} dateRelance={lead.date_relance}
                      telephone={lead.telephone} smsApresAppel={texteSmsApresAppel(lead)} />}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell align-top min-w-[240px]">
                    <InlineNotes leadId={lead.id} value={lead.notes} />
                  </td>
                  <td className="px-4 py-3 xl:hidden text-center">
                    <MobileNotes leadId={lead.id} value={lead.notes} nom={lead.nom} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {vuePerdus ? <ReactiverButton leadId={lead.id} /> : <PerduButton leadId={lead.id} />}
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
