import { getLeads } from '@/lib/db'
import Link from 'next/link'
import ShowUpRow, { ShowUpCard } from './ShowUpRow'
import SuiviRelanceSelect from '@/components/SuiviRelanceSelect'
import CallTracker from '@/components/CallTracker'
import CopyButton from '@/components/CopyButton'
import DeleteButton from '@/components/DeleteButton'
import InlineNotes from '@/components/InlineNotes'
import type { Lead } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function RdvRelancesPage() {
  const leads = await getLeads()
  const today = new Date().toISOString().split('T')[0]

  // ── Section Rendez-vous : les "RDV pris" uniquement ──
  const rdvLeads = leads.filter(l => l.statut === 'RDV pris')
  const withDate = rdvLeads
    .filter(l => l.date_rdv)
    .sort((a, b) => new Date(a.date_rdv!).getTime() - new Date(b.date_rdv!).getTime())
  const withoutDate = rdvLeads.filter(l => !l.date_rdv)

  // ── Section Relances : statut "À relancer" ou relance datée échue ──
  const relanceLeads = leads.filter(l =>
    l.statut === 'À relancer' ||
    (l.date_relance && l.date_relance <= today && l.statut !== 'RDV pris' && l.statut !== 'Vendu')
  )

  return (
    <div className="p-4 md:p-6 space-y-10">
      {/* ══════════ RENDEZ-VOUS ══════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
              📅 Rendez-vous
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {rdvLeads.length} RDV en cours
              {withoutDate.length > 0 && (
                <span className="ml-2 text-yellow-600 font-semibold">⚠ {withoutDate.length} sans date</span>
              )}
            </p>
          </div>
          <Link href="/leads/nouveau" className="btn-primary text-sm">+ Nouveau</Link>
        </div>

        {rdvLeads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-8 text-center bg-white">
            <p className="text-gray-500 text-sm">Aucun RDV en cours</p>
          </div>
        ) : (
          <div className="space-y-5">
            {withoutDate.length > 0 && <BlocRdv titre="⚠ Sans date fixée" leads={withoutDate} warn />}
            {withDate.length > 0 && <BlocRdv titre="Programmés" leads={withDate} />}
          </div>
        )}
      </section>

      {/* ══════════ RELANCES ══════════ */}
      <section>
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            🔁 Relances
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {relanceLeads.length > 0
              ? `${relanceLeads.length} prospect${relanceLeads.length !== 1 ? 's' : ''} à recontacter`
              : 'Aucune relance en attente'}
          </p>
        </div>

        {relanceLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">Tout est à jour 🎉</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl">
            {relanceLeads.map(lead => <RelanceCard key={lead.id} lead={lead} today={today} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function BlocRdv({ titre, leads, warn }: { titre: string; leads: Lead[]; warn?: boolean }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${warn ? 'text-yellow-600' : 'text-gray-500'}`}>
        {titre} — {leads.length}
      </h3>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2.5 label-condensed">Nom</th>
              <th className="text-left px-4 py-2.5 label-condensed">Téléphone</th>
              <th className="text-left px-4 py-2.5 label-condensed">Date & heure RDV</th>
              <th className="text-center px-4 py-2.5 label-condensed">Présence</th>
              <th className="text-center px-4 py-2.5 label-condensed">Résultat</th>
              <th className="text-left px-4 py-2.5 label-condensed min-w-[220px]">Notes</th>
              <th className="px-2 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map(lead => <ShowUpRow key={lead.id} lead={lead} faded={false} />)}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {leads.map(lead => <ShowUpCard key={lead.id} lead={lead} faded={false} />)}
      </div>
    </div>
  )
}

function RelanceCard({ lead, today }: { lead: Lead; today: string }) {
  const overdue = !!(lead.date_relance && lead.date_relance < today)
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${overdue ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${overdue ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
          {lead.nom.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:underline text-sm">
            {lead.nom}
          </Link>
          {overdue && <p className="text-xs text-red-500 mt-0.5 font-medium">⚠ Relance en retard</p>}
          {lead.motif_relance && <p className="text-xs text-gray-500 mt-0.5">{lead.motif_relance}</p>}
          <div className="mt-2 max-w-sm">
            <InlineNotes leadId={lead.id} value={lead.notes} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <SuiviRelanceSelect
              leadId={lead.id}
              value={lead.suivi_relance ?? 'À appeler'}
              nom={lead.nom}
            />
            <DeleteButton leadId={lead.id} leadNom={lead.nom} />
          </div>
          <CallTracker leadId={lead.id} appels={lead.appels ?? []} />
          {lead.telephone && (
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <a href={`tel:${lead.telephone}`} className="text-xs font-mono text-gray-700 hover:text-[#F5C800]">
                {lead.telephone}
              </a>
              <CopyButton text={lead.telephone} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
