'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Un prospect « Perdu » qui revient (il rappelle, il redemande une séance) : on le remet dans la liste.
export default function ReactiverButton({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function reactiver() {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'Nouveau prospect', motif_relance: null, date_relance: null, ajouter_appel: `${new Date().toISOString()}|go` }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={reactiver}
      disabled={saving}
      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap disabled:opacity-40"
    >
      {saving ? '…' : '↩ Remettre en prospect'}
    </button>
  )
}
