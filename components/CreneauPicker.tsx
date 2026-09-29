'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export type CreneauLibre = {
  id: string
  debut: string
  fin: string
  coach_nom: string
}

export function labelCreneau(c: CreneauLibre): string {
  const d = new Date(c.debut)
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  return `${jour} · ${heure} — ${c.coach_nom}`
}

export function useCreneauxLibres() {
  const [creneaux, setCreneaux] = useState<CreneauLibre[] | null>(null)
  useEffect(() => {
    fetch('/api/creneaux')
      .then(r => r.json())
      .then(d => setCreneaux(Array.isArray(d) ? d : []))
      .catch(() => setCreneaux([]))
  }, [])
  return creneaux // null = chargement
}

/** Sélecteur contrôlé (formulaire Nouveau prospect). */
export function CreneauSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const creneaux = useCreneauxLibres()
  if (creneaux === null) return <p className="text-sm text-gray-400">Chargement des créneaux…</p>
  if (creneaux.length === 0) {
    return <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
      Aucune dispo coach — ajoute des disponibilités dans l'onglet Agenda.
    </p>
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
      <option value="">— Choisir un créneau coach —</option>
      {creneaux.map(c => <option key={c.id} value={c.id}>{labelCreneau(c)}</option>)}
    </select>
  )
}

/** Sélecteur inline (onglet Rendez-vous) : réserve immédiatement le créneau. */
export default function CreneauInline({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const creneaux = useCreneauxLibres()

  async function reserver(id: string) {
    if (!id) return
    setSaving(true)
    setErreur('')
    const res = await fetch(`/api/creneaux/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json()
      setErreur(j.error ?? 'Erreur')
      return
    }
    router.refresh()
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="blink-warn inline-flex items-center gap-1.5 text-sm font-bold text-black bg-[#F5C800] border border-yellow-500 px-3 py-2 rounded-lg hover:bg-[#e6ba00] transition-colors"
      >
        💪 Choisir un créneau coach
      </button>
    )
  }

  if (creneaux === null) return <span className="text-xs text-gray-400">Chargement…</span>
  if (creneaux.length === 0) {
    return <span className="text-xs text-yellow-700">Aucune dispo coach — voir l'onglet Agenda</span>
  }

  return (
    <span>
      <select
        autoFocus
        defaultValue=""
        disabled={saving}
        onChange={e => reserver(e.target.value)}
        onBlur={() => !saving && setOuvert(false)}
        className="text-xs px-2 py-1.5 rounded border border-gray-300 focus:border-[#F5C800] outline-none bg-white text-gray-900 max-w-[220px]"
      >
        <option value="">— Créneau coach —</option>
        {creneaux.map(c => <option key={c.id} value={c.id}>{labelCreneau(c)}</option>)}
      </select>
      {erreur && <span className="block text-[11px] text-red-500 mt-1">{erreur}</span>}
    </span>
  )
}
