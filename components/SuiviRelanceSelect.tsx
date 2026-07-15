'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STYLE: Record<string, { bg: string; fg: string }> = {
  'À appeler':      { bg: '#e5e7eb', fg: '#374151' }, // gris
  'Pas de réponse': { bg: '#fb923c', fg: '#ffffff' }, // orange
  'RDV repris':     { bg: '#22c55e', fg: '#ffffff' }, // vert
  'Perdu':          { bg: '#ef4444', fg: '#ffffff' }, // rouge
}

export default function SuiviRelanceSelect({ leadId, value, nom }: { leadId: string; value: string; nom: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value

    // Perdu -> suppression définitive
    if (v === 'Perdu') {
      if (!confirm(`Marquer « ${nom} » comme perdu et le supprimer définitivement ?`)) return
      setSaving(true)
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      router.refresh()
      return
    }

    setCurrent(v)
    setSaving(true)

    // RDV repris -> retour dans Show-up (reset du process)
    if (v === 'RDV repris') {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'RDV pris',
          date_rdv: null,
          rdv_honore: null,
          resultat_rdv: null,
          suivi_relance: null,
        }),
      })
      router.push('/show-up')
      return
    }

    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suivi_relance: v }),
    })
    setSaving(false)
    router.refresh()
  }

  const style = STYLE[current] ?? STYLE['À appeler']

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={saving}
      className={`text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer font-semibold ${saving ? 'opacity-50' : ''}`}
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <option value="À appeler">À appeler</option>
      <option value="Pas de réponse">Pas de réponse</option>
      <option value="RDV repris">RDV repris →</option>
      <option value="Perdu">Perdu ✕</option>
    </select>
  )
}
