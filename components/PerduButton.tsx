'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOTIFS_PERTE, PREFIXE_PERTE } from '@/lib/supabase'

// Sortie de l'entonnoir sans vente : le prospect passe en « Perdu » avec son motif.
// Rien n'est effacé : il reste visible dans Prospects > Perdus et peut être réactivé.
export default function PerduButton({ leadId, redirect, motifParDefaut }: {
  leadId: string
  redirect?: string
  motifParDefaut?: (typeof MOTIFS_PERTE)[number]
}) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [saving, setSaving] = useState(false)

  async function classer(motif: string) {
    setSaving(true)
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'Perdu', motif_relance: PREFIXE_PERTE + motif, date_relance: null }),
    })
    if (!res.ok) {
      alert('Enregistrement impossible, réessayez.')
      setSaving(false)
      return
    }
    if (redirect) router.push(redirect)
    router.refresh()
  }

  if (ouvert) {
    return (
      <select
        autoFocus
        defaultValue={motifParDefaut ?? ''}
        disabled={saving}
        onClick={e => e.stopPropagation()}
        onBlur={() => !saving && setOuvert(false)}
        onChange={e => {
          const v = e.target.value
          if (v === '__annuler') return setOuvert(false)
          if (v) classer(v)
        }}
        className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 outline-none"
      >
        <option value="">Motif ?</option>
        {MOTIFS_PERTE.map(m => <option key={m} value={m}>{m}</option>)}
        <option value="__annuler">← Annuler</option>
      </select>
    )
  }

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); setOuvert(true) }}
      title="Sortir ce prospect de la liste (archivé avec son motif, rien n'est effacé)"
      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 whitespace-nowrap"
    >
      Perdu
    </button>
  )
}
