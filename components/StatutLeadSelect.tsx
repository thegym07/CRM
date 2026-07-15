'use client'

import { useRouter } from 'next/navigation'
import InlineSelect from './InlineSelect'

const STYLE_MAP = {
  'Nouveau prospect':       { bg: '#22c55e', fg: '#ffffff' }, // vert
  'Contacté sans réponse':  { bg: '#fb923c', fg: '#ffffff' }, // orange
  'À relancer':             { bg: '#EEFF00', fg: '#000000' }, // fluo jaune
  'RDV pris':               { bg: '#fde047', fg: '#000000' }, // jaune
}

export default function StatutLeadSelect({ leadId, value }: { leadId: string; value: string }) {
  const router = useRouter()

  return (
    <InlineSelect
      leadId={leadId}
      field="statut"
      value={value}
      options={[
        { label: 'Nouveau prospect',      value: 'Nouveau prospect' },
        { label: 'Contacté sans réponse', value: 'Contacté sans réponse' },
        { label: 'À rappeler',            value: 'À relancer' },
        { label: 'RDV pris →',           value: 'RDV pris' },
      ]}
      styleMap={STYLE_MAP}
      onSaved={(v) => {
        if (v === 'RDV pris') router.push('/show-up')
        else router.refresh()
      }}
    />
  )
}
