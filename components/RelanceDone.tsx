'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Bouton « Relancé » : enregistre une tentative de contact maintenant
 * (ajoutée à l'historique d'appels) et met donc à jour la date du dernier contact.
 */
export default function RelanceDone({ leadId, appels }: { leadId: string; appels: string[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appels: [...(appels ?? []), new Date().toISOString()] }),
    })
    setSaving(false)
    setDone(true)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving || done}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap ${
        done
          ? 'bg-green-100 text-green-700'
          : 'bg-[#F5C800] text-black hover:bg-[#e6ba00]'
      }`}
      title="Enregistre la relance d'aujourd'hui"
    >
      {done ? '✓ Relancé' : saving ? '…' : '📞 Relancé'}
    </button>
  )
}
