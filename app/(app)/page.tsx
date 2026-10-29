import { getLeads } from '@/lib/db'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import SourceTag from '@/components/SourceTag'

export const dynamic = 'force-dynamic'

type SearchParams = { periode?: string }

// Filtres de période pour les statistiques
const PERIODES = [
  { key: '',     label: 'Tout' },
  { key: '90j',  label: '90 jours' },
  { key: 'mois', label: 'Mois en cours' },
]

function debutPeriode(periode: string): Date | null {
  const now = new Date()
  if (periode === 'mois') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (periode === '90j') {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d
  }
  return null // "Tout"
}

// Clé "YYYY-MM" en heure française
const cleMois = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }).slice(0, 7)

function labelMois(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const periode = params.periode ?? ''

  const all = await getLeads()

  // Historique : un filtre par mois où des prospects sont entrés dans l'entonnoir
  const moisDisponibles = Array.from(new Set(all.map(l => cleMois(l.created_at)))).sort().reverse()

  // Stats filtrées sur la date d'ajout du prospect ; les compteurs reflètent
  // la phase de l'entonnoir où chacun est descendu depuis (statut actuel).
  const estMois = /^\d{4}-\d{2}$/.test(periode)
  const debut = debutPeriode(periode)
  const filtered = estMois
    ? all.filter(l => cleMois(l.created_at) === periode)
    : debut ? all.filter(l => new Date(l.created_at) >= debut) : all

  const total = filtered.length
  const nouveaux = filtered.filter(l => l.statut === 'Nouveau prospect').length
  const vendus = filtered.filter(l => l.statut === 'Vendu').length
  const aRelancer = filtered.filter(l => l.statut === 'À relancer').length

  // ── À faire aujourd'hui (toujours global, indépendant du filtre) ──
  const cleJour = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const aujourdhui = cleJour(new Date().toISOString())

  // RDV du jour
  const rdvDuJour = all
    .filter(l => l.statut === 'RDV pris' && l.date_rdv && cleJour(l.date_rdv) === aujourdhui)
    .sort((a, b) => new Date(a.date_rdv!).getTime() - new Date(b.date_rdv!).getTime())

  // Prospects qui dorment : jamais rappelés depuis plus de 48 h (dernier appel, sinon date d'ajout)
  const DORMANT_MS = 48 * 3600 * 1000
  const dernierContact = (l: (typeof all)[number]) => {
    const appels = l.appels ?? []
    return appels.length > 0 ? Math.max(...appels.map(a => new Date(a).getTime())) : new Date(l.created_at).getTime()
  }
  const dormants = all
    .filter(l => (l.statut === 'Nouveau prospect' || l.statut === 'Contacté sans réponse') && Date.now() - dernierContact(l) > DORMANT_MS)
    .sort((a, b) => dernierContact(a) - dernierContact(b))
  const joursSans = (l: (typeof all)[number]) => Math.floor((Date.now() - dernierContact(l)) / 86400000)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })}</p>
      </div>

      {/* Filtres de période */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[...PERIODES, ...moisDisponibles.map(m => ({ key: m, label: labelMois(m) }))].map(p => {
          const active = periode === p.key
          return (
            <Link key={p.label} href={`/${p.key ? `?periode=${p.key}` : ''}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-[#F5C800] text-black border-[#F5C800]'
                  : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-500 bg-white'
              }`}>
              {p.label}
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8 lg:grid-cols-4">
        <StatCard label="Total prospects" value={total} color="default" />
        <StatCard label="Nouveaux prospects" value={nouveaux} color="yellow" />
        <StatCard label="Vendus" value={vendus} color="green" />
        <StatCard label="À relancer" value={aRelancer} color="red" />
      </div>

      {/* À faire aujourd'hui */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              📅 RDV du jour
              {rdvDuJour.length > 0 && (
                <span className="ml-2 text-sm bg-[#F5C800]/20 text-yellow-800 border border-[#F5C800] px-2 py-0.5 rounded-full">
                  {rdvDuJour.length}
                </span>
              )}
            </h2>
            <Link href="/show-up" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Voir tout →
            </Link>
          </div>
          {rdvDuJour.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">Aucun RDV aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rdvDuJour.map(lead => (
                <div key={lead.id}
                  className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 p-4 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#F5C800]/20 flex items-center justify-center text-yellow-700 font-semibold text-sm flex-shrink-0">
                    {new Date(lead.date_rdv!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 text-sm hover:text-[#F5C800]">{lead.nom}</Link>
                    <SourceTag source={lead.source} />
                    {lead.activite && <p className="text-xs text-gray-500 truncate">{lead.activite}</p>}
                  </div>
                  {lead.telephone && (
                    <a href={`tel:${lead.telephone}`}
                      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors flex-shrink-0 bg-white">
                      📞
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              😴 Prospects qui dorment
              {dormants.length > 0 && (
                <span className="ml-2 text-sm bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                  {dormants.length}
                </span>
              )}
            </h2>
            <Link href="/leads" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Voir tout →
            </Link>
          </div>
          <p className="text-xs text-gray-400 -mt-1 mb-3">Jamais rappelés depuis plus de 48 h — chaque lead coûte de la pub, on ne le laisse pas refroidir.</p>
          {dormants.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">Personne ne dort — tout le monde a été rappelé 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dormants.slice(0, 5).map(lead => (
                <div key={lead.id}
                  className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-xl border border-red-200 p-4 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-semibold text-sm flex-shrink-0">
                    {lead.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 text-sm hover:text-[#F5C800]">{lead.nom}</Link>
                    <p className="text-xs text-red-500 font-semibold">{joursSans(lead)} jour{joursSans(lead) > 1 ? 's' : ''} sans appel · {(lead.appels ?? []).length} appel{(lead.appels ?? []).length !== 1 ? 's' : ''} passé{(lead.appels ?? []).length !== 1 ? 's' : ''}</p>
                  </div>
                  {lead.telephone && (
                    <a href={`tel:${lead.telephone}`}
                      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors flex-shrink-0 bg-white">
                      📞 Appeler
                    </a>
                  )}
                </div>
              ))}
              {dormants.length > 5 && (
                <Link href="/leads" className="block text-center text-sm text-gray-500 hover:text-gray-900 py-3 transition-colors">
                  + {dormants.length - 5} autres
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
