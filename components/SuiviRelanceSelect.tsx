'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Palette harmonisée : gris = en attente, jaune = à traiter, vert = positif, rouge = négatif
const STYLE: Record<string, { bg: string; fg: string }> = {
  'À appeler':      { bg: '#e5e7eb', fg: '#374151' }, // gris
  'Pas de réponse': { bg: '#F5C800', fg: '#111111' }, // jaune brand
  'RDV repris':     { bg: '#22c55e', fg: '#ffffff' }, // vert
  'Perdu':          { bg: '#ef4444', fg: '#ffffff' }, // rouge
}

export default function SuiviRelanceSelect({ leadId, value, nom }: { leadId: string; value: string; nom: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value

    // Pas intéressé -> suppression définitive (sans le minimum de 7 appels)
    if (v === 'Perdu') {
      if (!confirm(`${nom} n'est pas intéressé(e) ?\nIl/elle sera supprimé(e) définitivement du CRM.`)) return
      setSaving(true)
      const res = await fetch(`/api/leads/${leadId}?motif=pas-interesse`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error ?? 'Suppression impossible.')
        setSaving(false)
        return
      }
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
      setCurrent('À appeler')
      setSaving(false)
      router.refresh()
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
      <option value="Perdu">Pas intéressé ✕</option>
    </select>
  )
}
