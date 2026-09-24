'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import InlineSelect from '@/components/InlineSelect'
import InlineNotes from '@/components/InlineNotes'
import InlineDateTime from '@/components/InlineDateTime'
import DeleteButton from '@/components/DeleteButton'
import { FORMULES, type Lead } from '@/lib/supabase'

// Palette harmonisée : gris = en attente, jaune = à traiter, vert = positif, rouge = négatif
const PRESENCE_STYLE = {
  'null':  { bg: '#e5e7eb', fg: '#6b7280' }, // gris (en attente)
  'true':  { bg: '#22c55e', fg: '#ffffff' }, // vert
  'false': { bg: '#ef4444', fg: '#ffffff' }, // rouge
}

const RESULT_STYLE = {
  'Vendu':      { bg: '#22c55e', fg: '#ffffff' }, // vert
  'À relancer': { bg: '#F5C800', fg: '#111111' }, // jaune brand
  'Refus':      { bg: '#ef4444', fg: '#ffffff' }, // rouge
}

const presenceValue = (v: boolean | null) => v === true ? 'true' : v === false ? 'false' : 'null'

async function putLead(leadId: string, data: Record<string, unknown>) {
  await fetch(`/api/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

/**
 * Résultat du RDV : écrit directement le statut du prospect.
 * Vente => demande d'abord la formule (menu déroulant), puis enregistre les deux.
 * Refus => sort de l'entonnoir. À rappeler => bascule en section Relances.
 */
function ResultCell({ leadId, presence, onDone }: {
  leadId: string
  presence: string
  onDone: () => void
}) {
  const [venteEnCours, setVenteEnCours] = useState(false)
  const [saving, setSaving] = useState(false)

  if (presence === 'false') {
    return (
      <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: '#F5C800', color: '#111' }}>
        À relancer →
      </span>
    )
  }
  if (presence !== 'true') return <span className="text-xs text-gray-300">—</span>

  // Étape 2 : la vente est choisie, on demande la formule
  if (venteEnCours) {
    return (
      <select
        autoFocus
        defaultValue=""
        disabled={saving}
        onChange={async (e) => {
          const v = e.target.value
          if (v === '__retour') { setVenteEnCours(false); return }
          if (!v) return
          setSaving(true)
          await putLead(leadId, { statut: 'Vendu', offre_souscrite: v })
          onDone()
        }}
        className="text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer font-semibold"
        style={{ background: '#22c55e', color: '#fff' }}
      >
        <option value="">Formule ?</option>
        {FORMULES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        <option value="__retour">← Annuler</option>
      </select>
    )
  }

  // Étape 1 : choix du résultat
  return (
    <select
      value="RDV pris"
      disabled={saving}
      onChange={async (e) => {
        const v = e.target.value
        if (v === 'Vendu') { setVenteEnCours(true); return }
        if (v === 'À relancer' || v === 'Refus') {
          setSaving(true)
          await putLead(leadId, { statut: v })
          onDone()
        }
      }}
      onClick={e => e.stopPropagation()}
      className="text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer font-semibold bg-gray-100 text-gray-600"
    >
      <option value="RDV pris">—</option>
      <option value="Vendu">Vente ✓</option>
      <option value="À relancer">À rappeler →</option>
      <option value="Refus">Refus</option>
    </select>
  )
}

export default function ShowUpRow({ lead, faded }: { lead: Lead; faded: boolean }) {
  const router = useRouter()
  const [presence, setPresence] = useState(presenceValue(lead.rdv_honore))

  async function onPresence(v: string) {
    setPresence(v)
    if (v === 'false') {
      // Absent => part en Relances (même onglet, section du bas)
      await putLead(lead.id, { statut: 'À relancer', resultat_rdv: 'À relancer' })
      router.refresh()
    }
    if (v === 'null') {
      await putLead(lead.id, { resultat_rdv: null })
    }
  }

  const present = presence === 'true'

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${faded ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3">
        <Link href={`/leads/${lead.id}`} className={`font-medium transition-colors hover:text-[#F5C800] ${present ? 'text-gray-900' : 'text-red-600'}`}>
          {lead.nom}
        </Link>
        {lead.activite && <span className="block text-xs text-gray-500 mt-0.5">{lead.activite}</span>}
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
        <InlineDateTime leadId={lead.id} value={lead.date_rdv} />
      </td>
      <td className="px-4 py-3 text-center">
        <InlineSelect
          leadId={lead.id}
          field="rdv_honore"
          value={presenceValue(lead.rdv_honore)}
          options={[
            { label: 'En attente', value: 'null' },
            { label: 'Oui ✓',      value: 'true' },
            { label: 'Non',        value: 'false' },
          ]}
          styleMap={PRESENCE_STYLE}
          onSaved={onPresence}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <ResultCell leadId={lead.id} presence={presence} onDone={() => router.refresh()} />
      </td>
      <td className="px-4 py-3 align-top min-w-[220px]">
        <InlineNotes leadId={lead.id} value={lead.notes} />
      </td>
      <td className="px-2 py-3 text-center">
        <DeleteButton leadId={lead.id} leadNom={lead.nom} />
      </td>
    </tr>
  )
}

export function ShowUpCard({ lead, faded }: { lead: Lead; faded: boolean }) {
  const router = useRouter()
  const [presence, setPresence] = useState(presenceValue(lead.rdv_honore))

  async function onPresence(v: string) {
    setPresence(v)
    if (v === 'false') {
      await putLead(lead.id, { statut: 'À relancer', resultat_rdv: 'À relancer' })
      router.refresh()
    }
    if (v === 'null') {
      await putLead(lead.id, { resultat_rdv: null })
    }
  }

  const present = presence === 'true'

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm ${faded ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/leads/${lead.id}`} className={`font-semibold hover:text-[#F5C800] ${present ? 'text-gray-900' : 'text-red-600'}`}>
            {lead.nom}
          </Link>
          {lead.activite && <p className="text-xs text-gray-500 mt-0.5">{lead.activite}</p>}
        </div>
        <div className="flex items-center gap-1">
          <InlineDateTime leadId={lead.id} value={lead.date_rdv} />
          <DeleteButton leadId={lead.id} leadNom={lead.nom} />
        </div>
      </div>

      {lead.telephone && (
        <div className="flex items-center gap-1">
          <a href={`tel:${lead.telephone}`} className="font-mono text-sm text-gray-700">{lead.telephone}</a>
          <CopyButton text={lead.telephone} />
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <InlineSelect
          leadId={lead.id}
          field="rdv_honore"
          value={presenceValue(lead.rdv_honore)}
          options={[
            { label: 'En attente', value: 'null' },
            { label: 'Présent ✓',  value: 'true' },
            { label: 'Absent',     value: 'false' },
          ]}
          styleMap={PRESENCE_STYLE}
          onSaved={onPresence}
        />
        <ResultCell leadId={lead.id} presence={presence} onDone={() => router.refresh()} />
      </div>

      <InlineNotes leadId={lead.id} value={lead.notes} />
    </div>
  )
}
