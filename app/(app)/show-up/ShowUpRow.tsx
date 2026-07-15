'use client'

import { useState } from 'react'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import InlineSelect from '@/components/InlineSelect'
import InlineNotes from '@/components/InlineNotes'
import InlineDateTime from '@/components/InlineDateTime'
import type { Lead } from '@/lib/supabase'

const PRESENCE_STYLE = {
  'null':  { bg: '#e5e7eb', fg: '#6b7280' }, // gris (en attente)
  'true':  { bg: '#22c55e', fg: '#ffffff' }, // vert
  'false': { bg: '#ef4444', fg: '#ffffff' }, // rouge
}

const RESULT_STYLE = {
  'Vendu':      { bg: '#22c55e', fg: '#ffffff' }, // vert
  'À relancer': { bg: '#fb923c', fg: '#ffffff' }, // orange
  'Refus':      { bg: '#ef4444', fg: '#ffffff' }, // rouge
}

const presenceValue = (v: boolean | null) => v === true ? 'true' : v === false ? 'false' : 'null'

async function putResult(leadId: string, value: string | null) {
  await fetch(`/api/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultat_rdv: value }),
  })
}

function ResultCell({ leadId, presence, result, setResult }: {
  leadId: string
  presence: string
  result: string
  setResult: (v: string) => void
}) {
  if (presence === 'true') {
    return (
      <InlineSelect
        leadId={leadId}
        field="resultat_rdv"
        value={result || 'null'}
        options={[
          { label: '—',          value: 'null' },
          { label: 'Vente ✓',    value: 'Vendu' },
          { label: 'À rappeler', value: 'À relancer' },
          { label: 'Refus',      value: 'Refus' },
        ]}
        styleMap={RESULT_STYLE}
        onSaved={setResult}
      />
    )
  }
  if (presence === 'false') {
    return (
      <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: '#fb923c', color: '#fff' }}>
        À relancer
      </span>
    )
  }
  return <span className="text-xs text-gray-300">—</span>
}

export default function ShowUpRow({ lead, faded }: { lead: Lead; faded: boolean }) {
  const [presence, setPresence] = useState(presenceValue(lead.rdv_honore))
  const [result, setResult] = useState(lead.resultat_rdv ?? '')

  function onPresence(v: string) {
    setPresence(v)
    if (v === 'false') { setResult('À relancer'); putResult(lead.id, 'À relancer') }
    if (v === 'null')  { setResult(''); putResult(lead.id, null) }
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
        <ResultCell leadId={lead.id} presence={presence} result={result} setResult={setResult} />
      </td>
      <td className="px-4 py-3 align-top min-w-[220px]">
        <InlineNotes leadId={lead.id} value={lead.notes} />
      </td>
    </tr>
  )
}

export function ShowUpCard({ lead, faded }: { lead: Lead; faded: boolean }) {
  const [presence, setPresence] = useState(presenceValue(lead.rdv_honore))
  const [result, setResult] = useState(lead.resultat_rdv ?? '')

  function onPresence(v: string) {
    setPresence(v)
    if (v === 'false') { setResult('À relancer'); putResult(lead.id, 'À relancer') }
    if (v === 'null')  { setResult(''); putResult(lead.id, null) }
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
        <InlineDateTime leadId={lead.id} value={lead.date_rdv} />
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
        <ResultCell leadId={lead.id} presence={presence} result={result} setResult={setResult} />
      </div>

      <InlineNotes leadId={lead.id} value={lead.notes} />
    </div>
  )
}
