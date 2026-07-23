'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Lead } from '@/lib/supabase'
import LeadForm from '@/components/LeadForm'
import CallTracker from '@/components/CallTracker'

export default function LeadDetailClient({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Supprimer ${lead.nom} ? Cette action est irréversible.`)) return
    setDeleting(true)
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
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
          <h1 className="text-2xl font-bold text-gray-900">{lead.nom}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Ajouté le {new Date(lead.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)}
            className="btn-primary text-sm">
            Modifier
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm rounded-xl transition-colors">
            {deleting ? '…' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="Contact">
          <Row label="Téléphone">
            {lead.telephone ? <a href={`tel:${lead.telephone}`} className="text-blue-400 hover:underline">{lead.telephone}</a> : <Empty />}
          </Row>
          <Row label="Email">
            {lead.email ? <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">{lead.email}</a> : <Empty />}
          </Row>
          <Row label="Source"><span className="text-gray-900">{lead.source || '—'}</span></Row>
        </Section>

        <Section title="Suivi des appels">
          <div className="px-4 py-3">
            <CallTracker leadId={lead.id} appels={lead.appels ?? []} />
          </div>
        </Section>

        <Section title="Rendez-vous">
          <Row label="Date & heure">
            {lead.date_rdv
              ? <span className="text-gray-900">{new Date(lead.date_rdv).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
              : <Empty />}
          </Row>
          <Row label="Activité"><span className="text-gray-900">{lead.activite || '—'}</span></Row>
        </Section>

        <Section title="Vente">
          <Row label="Offre souscrite"><span className="text-gray-900">{lead.offre_souscrite || '—'}</span></Row>
          <Row label="Coach assigné"><span className="text-gray-900">{lead.coach_assigne || '—'}</span></Row>
        </Section>

        <Section title="Relance">
          <Row label="Date de relance">
            {lead.date_relance
              ? <span className={new Date(lead.date_relance) <= new Date() ? 'text-red-500' : 'text-gray-900'}>
                  {new Date(lead.date_relance + 'T00:00:00').toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                </span>
              : <Empty />}
          </Row>
          <Row label="Motif"><span className="text-gray-900">{lead.motif_relance || '—'}</span></Row>
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
