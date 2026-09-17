import { getLeads } from '@/lib/db'
import Link from 'next/link'
import ShowUpRow, { ShowUpCard } from './ShowUpRow'
import SuiviRelanceSelect from '@/components/SuiviRelanceSelect'
import CopyButton from '@/components/CopyButton'
import DeleteButton from '@/components/DeleteButton'
import InlineNotes from '@/components/InlineNotes'
import RelanceDone from '@/components/RelanceDone'
import type { Lead } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type SearchParams = { relance?: string }

// Un prospect a « eu un RDV » s'il a une date de RDV ou une présence renseignée.
// C'est le critère de routage automatique entre les deux sous-onglets Relances.
const aEuRdv = (l: Lead) => l.date_rdv != null || l.rdv_honore != null

// Dernier contact = dernière tentative d'appel enregistrée (bouton Relancé ou 📞).
const dernierContact = (l: Lead): number | null => {
  const appels = l.appels ?? []
  if (appels.length === 0) return null
  return Math.max(...appels.map(a => new Date(a).getTime()))
}

// Les plus urgents en haut : jamais contactés d'abord, puis du plus ancien contact.
const parUrgence = (a: Lead, b: Lead) => (dernierContact(a) ?? 0) - (dernierContact(b) ?? 0)

export default async function RdvRelancesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const ongletRelance = params.relance === 'post' ? 'post' : 'rappeler'

  const leads = await getLeads()
  const today = new Date().toISOString().split('T')[0]

  // ── Section Rendez-vous : les "RDV pris" uniquement.
  // Un RDV passé non mis à jour reste ici (section dédiée) tant que son
  // issue n'est pas saisie — rien ne disparaît tout seul.
  const rdvLeads = leads.filter(l => l.statut === 'RDV pris')
  const withDate = rdvLeads
    .filter(l => l.date_rdv)
    .sort((a, b) => new Date(a.date_rdv!).getTime() - new Date(b.date_rdv!).getTime())
  const withoutDate = rdvLeads.filter(l => !l.date_rdv)
  const now = Date.now()
  const passes = withDate.filter(l => new Date(l.date_rdv!).getTime() < now)
  const aVenir = withDate.filter(l => new Date(l.date_rdv!).getTime() >= now)

  // ── Section Relances : routage auto en deux sous-onglets ──
  const relanceLeads = leads.filter(l =>
    l.statut === 'À relancer' ||
    (l.date_relance && l.date_relance <= today && l.statut !== 'RDV pris' && l.statut !== 'Vendu')
  )
  const aRappeler = relanceLeads.filter(l => !aEuRdv(l)).sort(parUrgence)
  const postSeance = relanceLeads.filter(aEuRdv).sort(parUrgence)
  const actifs = ongletRelance === 'post' ? postSeance : aRappeler

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
              {passes.length > 0 && (
                <span className="ml-2 text-red-500 font-semibold">⚠ {passes.length} passé{passes.length !== 1 ? 's' : ''} à mettre à jour</span>
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
            {passes.length > 0 && <BlocRdv titre="⚠ RDV passés — à mettre à jour (présence ? résultat ?)" leads={passes} warn />}
            {withoutDate.length > 0 && <BlocRdv titre="⚠ Sans date fixée" leads={withoutDate} warn />}
            {aVenir.length > 0 && <BlocRdv titre="À venir" leads={aVenir} />}
          </div>
        )}
      </section>

      {/* ══════════ RELANCES ══════════ */}
      <section id="relances">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            🔁 Relances
          </h2>
        </div>

        {/* Sous-onglets */}
        <div className="flex gap-2 mb-4">
          <Link
            href="/show-up#relances"
            scroll={false}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              ongletRelance === 'rappeler'
                ? 'bg-[#F5C800] text-black border-[#F5C800]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:text-gray-900'
            }`}
          >
            À rappeler ({aRappeler.length})
          </Link>
          <Link
            href="/show-up?relance=post#relances"
            scroll={false}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              ongletRelance === 'post'
                ? 'bg-[#F5C800] text-black border-[#F5C800]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500 hover:text-gray-900'
            }`}
          >
            Post-séance ({postSeance.length})
          </Link>
        </div>

        <p className="text-gray-500 text-xs mb-3">
          {ongletRelance === 'rappeler'
            ? 'Prospects jamais venus en salle — contactés au téléphone, pas encore de RDV fixé.'
            : 'Prospects déjà venus (ou absents à leur RDV) — à recontacter pour une formule.'}
        </p>

        {actifs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">Tout est à jour 🎉</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 label-condensed">Nom / Prénom</th>
                    <th className="text-left px-4 py-2.5 label-condensed">Téléphone</th>
                    <th className="text-left px-4 py-2.5 label-condensed">Dernier contact</th>
                    <th className="text-left px-4 py-2.5 label-condensed min-w-[220px]">Notes</th>
                    <th className="px-3 py-2.5"></th>
                    <th className="text-center px-3 py-2.5 label-condensed">Suivi</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {actifs.map(lead => <RelanceRow key={lead.id} lead={lead} noShowBadge={ongletRelance === 'post'} />)}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {actifs.map(lead => <RelanceCardMobile key={lead.id} lead={lead} noShowBadge={ongletRelance === 'post'} />)}
            </div>
          </>
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

// ── Sous-onglets Relances ──

function NoShow({ lead }: { lead: Lead }) {
  if (lead.rdv_honore !== false) return null
  return (
    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
      No-show
    </span>
  )
}

function DernierContact({ lead }: { lead: Lead }) {
  const t = dernierContactStatic(lead)
  if (t === null) return <span className="text-xs font-semibold text-red-500">Jamais</span>
  return (
    <span className="text-xs text-gray-600 whitespace-nowrap">
      {new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
      <span className="text-gray-400 ml-1">·&nbsp;{(lead.appels ?? []).length}×</span>
    </span>
  )
}

function dernierContactStatic(l: Lead): number | null {
  const appels = l.appels ?? []
  if (appels.length === 0) return null
  return Math.max(...appels.map(a => new Date(a).getTime()))
}

function RelanceRow({ lead, noShowBadge }: { lead: Lead; noShowBadge: boolean }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-[#F5C800] transition-colors">
          {lead.nom}
        </Link>
        {noShowBadge && <NoShow lead={lead} />}
        {lead.motif_relance && <span className="block text-xs text-gray-500 mt-0.5">{lead.motif_relance}</span>}
      </td>
      <td className="px-4 py-3">
        {lead.telephone ? (
          <span className="flex items-center gap-1">
            <a href={`tel:${lead.telephone}`} className="font-mono text-xs text-gray-700 hover:text-[#F5C800]">
              {lead.telephone}
            </a>
            <CopyButton text={lead.telephone} />
          </span>
        ) : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <DernierContact lead={lead} />
      </td>
      <td className="px-4 py-3 align-top min-w-[220px]">
        <InlineNotes leadId={lead.id} value={lead.notes} />
      </td>
      <td className="px-3 py-3 text-center">
        <RelanceDone leadId={lead.id} appels={lead.appels ?? []} />
      </td>
      <td className="px-3 py-3 text-center">
        <SuiviRelanceSelect leadId={lead.id} value={lead.suivi_relance ?? 'À appeler'} nom={lead.nom} />
      </td>
      <td className="px-2 py-3 text-center">
        <DeleteButton leadId={lead.id} leadNom={lead.nom} />
      </td>
    </tr>
  )
}

function RelanceCardMobile({ lead, noShowBadge }: { lead: Lead; noShowBadge: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/leads/${lead.id}`} className="font-semibold text-gray-900 hover:text-[#F5C800]">
            {lead.nom}
          </Link>
          {noShowBadge && <NoShow lead={lead} />}
          <p className="text-xs mt-0.5">
            <span className="text-gray-400">Dernier contact : </span>
            <DernierContact lead={lead} />
          </p>
        </div>
        <DeleteButton leadId={lead.id} leadNom={lead.nom} />
      </div>

      {lead.telephone && (
        <div className="flex items-center gap-1">
          <a href={`tel:${lead.telephone}`} className="font-mono text-sm text-gray-700">{lead.telephone}</a>
          <CopyButton text={lead.telephone} />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <RelanceDone leadId={lead.id} appels={lead.appels ?? []} />
        <SuiviRelanceSelect leadId={lead.id} value={lead.suivi_relance ?? 'À appeler'} nom={lead.nom} />
      </div>

      <InlineNotes leadId={lead.id} value={lead.notes} />
    </div>
  )
}
