'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Lead } from '@/lib/supabase'
import LeadForm from '@/components/LeadForm'
import CallTracker from '@/components/CallTracker'
import PerduButton from '@/components/PerduButton'
import ReactiverButton from '@/components/ReactiverButton'
import { PREFIXE_PERTE } from '@/lib/supabase'
import BilanResume from '@/components/BilanResume'
import SourceTag from '@/components/SourceTag'
import CopyButton from '@/components/CopyButton'

export default function LeadDetailClient({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Effacement réservé aux personnes qui le demandent (RGPD) ; sinon on classe « Perdu ».
  async function handleDelete() {
    if (!confirm(`${lead.nom} a demandé l'effacement de ses données ?\nLa fiche sera supprimée définitivement (irréversible).\nSinon, utilisez plutôt « Perdu ».`)) return
    setDeleting(true)
    const res = await fetch(`/api/leads/${lead.id}?rgpd=1`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      alert(data?.error ?? 'Suppression impossible.')
      setDeleting(false)
      return
    }
    router.push('/leads')
    router.refresh()
  }

  if (editing) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier — {lead.nom}</h1>
        <LeadForm lead={lead} mode="edit" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lead.nom}<SourceTag source={lead.source} /></h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Ajouté le {new Date(lead.created_at).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          {lead.statut === 'Perdu' ? <ReactiverButton leadId={lead.id} /> : <PerduButton leadId={lead.id} redirect="/leads" />}
          <button onClick={() => setEditing(true)}
            className="btn-primary text-sm">
            Modifier
          </button>
          <button onClick={handleDelete} disabled={deleting}
            title="Uniquement si la personne demande l'effacement de ses données (RGPD)"
            className="px-3 py-2 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 text-xs rounded-xl transition-colors">
            {deleting ? '…' : 'Effacer (demande RGPD)'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {lead.diagnostic && (
          <Section title="Bilan Forme">
            <div className="px-4 py-3 text-sm"><BilanResume leadId={lead.id} fiche={lead.diagnostic} /></div>
          </Section>
        )}
        <Section title="Contact">
          <Row label="Téléphone">
            {lead.telephone ? (
              <span className="inline-flex items-center gap-1">
                <a href={`tel:${lead.telephone}`} className="text-blue-400 hover:underline">{lead.telephone}</a>
                <CopyButton text={lead.telephone} />
              </span>
            ) : <Empty />}
          </Row>
          <Row label="Email">
            {lead.email ? <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">{lead.email}</a> : <Empty />}
          </Row>
          <Row label="Source">
            <span className="text-gray-900">{lead.source || '—'}</span>
            {lead.origine && <span className="block text-xs text-gray-500 mt-0.5">{lead.origine}</span>}
          </Row>
          {lead.statut === 'Perdu' && (
            <Row label="Perdu"><span className="text-gray-900">{lead.motif_relance?.startsWith(PREFIXE_PERTE) ? lead.motif_relance.slice(PREFIXE_PERTE.length) : 'motif non noté'}</span></Row>
          )}
        </Section>

        <Section title="Suivi des appels">
          <div className="px-4 py-3">
            <CallTracker leadId={lead.id} appels={lead.appels ?? []} statut={lead.statut} dateRelance={lead.date_relance} />
          </div>
        </Section>

        <Section title="Rendez-vous">
          <Row label="Date & heure">
            {lead.date_rdv
              ? <span className="text-gray-900">{new Date(lead.date_rdv).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })}</span>
              : <Empty />}
          </Row>
          <Row label="Activité"><span className="text-gray-900">{lead.activite || '—'}</span></Row>
        </Section>

        <Section title="Vente">
          <Row label="Offre souscrite"><span className="text-gray-900">{lead.offre_souscrite || '—'}</span></Row>
          <Row label="Coach assigné"><span className="text-gray-900">{lead.coach_assigne || '—'}</span></Row>
        </Section>

        {lead.notes && (
          <Section title="Notes">
            <p className="px-4 py-3 text-gray-900 text-sm whitespace-pre-wrap">{lead.notes}</p>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="text-sm text-gray-500 w-32 flex-shrink-0">{label}</span>
      <span className="text-sm flex-1">{children}</span>
    </div>
  )
}

function Empty() {
  return <span className="text-gray-400">—</span>
}
