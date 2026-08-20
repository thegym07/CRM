'use client'

import { useRouter } from 'next/navigation'
import InlineSelect from './InlineSelect'

// Palette harmonisée : gris = en attente, jaune = à traiter, vert = positif
const STYLE_MAP = {
  'Nouveau prospect':       { bg: '#22c55e', fg: '#ffffff' }, // vert
  'Contacté sans réponse':  { bg: '#e5e7eb', fg: '#374151' }, // gris
  'À relancer':             { bg: '#F5C800', fg: '#111111' }, // jaune brand
  'RDV pris':               { bg: '#111111', fg: '#F5C800' }, // noir/jaune (part en RDV)
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
