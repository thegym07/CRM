'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function parseDate(v: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function formatLabel(d: Date): string {
  // Sans année : "mer. 17 juin · 14:30"
  return d.toLocaleString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).replace(',', ' ·')
}

const pad = (n: number) => String(n).padStart(2, '0')

// Créneaux de 15 min de 09:00 à 21:00
const HEURES: string[] = (() => {
  const slots: string[] = []
  for (let m = 9 * 60; m <= 21 * 60; m += 15) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
  }
  return slots
})()

export default function InlineDateTime({ leadId, value }: { leadId: string; value: string | null }) {
  const router = useRouter()
  const [current, setCurrent] = useState<string | null>(value)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const d = parseDate(current)
  const now = new Date()
  const [jour, setJour] = useState<string>(d ? String(d.getDate()) : '')
  const [mois, setMois] = useState<number>(d ? d.getMonth() : now.getMonth())
  const [heure, setHeure] = useState<string>(d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '')

  async function save() {
    if (!jour || !heure) { setEditing(false); return }
    const [h, m] = heure.split(':').map(Number)
    const year = now.getFullYear()
    let dt = new Date(year, mois, Number(jour), h, m)
    // Si la date est déjà passée (de plus d'un jour), on suppose l'année suivante
    if (dt.getTime() < now.getTime() - 86400000) {
      dt = new Date(year + 1, mois, Number(jour), h, m)
    }
    const iso = dt.toISOString()
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_rdv: iso }),
    })
    setCurrent(iso)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="number" min="1" max="31" value={jour}
          onChange={e => setJour(e.target.value)}
          placeholder="J"
          autoFocus
          className="w-12 text-sm px-2 py-1.5 rounded border border-gray-300 focus:border-[#F5C800] outline-none bg-white text-gray-900 text-center"
        />
        <select
          value={mois}
          onChange={e => setMois(Number(e.target.value))}
          className="text-sm px-2 py-1.5 rounded border border-gray-300 focus:border-[#F5C800] outline-none bg-white text-gray-900"
        >
          {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select
          value={heure}
          onChange={e => setHeure(e.target.value)}
          className="text-sm px-2 py-1.5 rounded border border-gray-300 focus:border-[#F5C800] outline-none bg-white text-gray-900"
        >
          <option value="">Heure</option>
          {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="text-sm font-bold px-3 py-1.5 rounded bg-[#F5C800] text-black hover:bg-[#e6ba00] transition-colors disabled:opacity-50"
        >
          ✓
        </button>
      </div>
    )
  }

  if (!current || !d) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="blink-warn inline-flex items-center gap-1.5 text-sm font-bold text-orange-700 bg-orange-100 border border-orange-300 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors"
      >
        📅 Ajouter la date
      </button>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors"
      title="Modifier la date"
    >
      📅 {formatLabel(d)}
    </button>
  )
}
