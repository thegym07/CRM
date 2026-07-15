'use client'

import { useState } from 'react'

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function CallTracker({ leadId, appels }: { leadId: string; appels: string[] }) {
  const [list, setList] = useState<string[]>(appels ?? [])
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  async function logCall() {
    const next = [...list, new Date().toISOString()]
    setList(next)
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appels: next }),
    })
    setSaving(false)
  }

  async function undo() {
    const next = list.slice(0, -1)
    setList(next)
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appels: next }),
    })
    setSaving(false)
  }

  const count = list.length
  const last = count > 0 ? list[count - 1] : null

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={logCall}
          disabled={saving}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F5C800] text-black hover:bg-[#e6ba00] transition-colors disabled:opacity-50"
          title="Cliquez à chaque fois que vous tentez d'appeler ce prospect"
        >
          📞 + Tentative d’appel
        </button>
        <button
          onClick={() => count > 0 && setOpen(o => !o)}
          className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-colors ${
            count === 0
              ? 'border-gray-200 text-gray-400'
              : count >= 4
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          title="Historique des appels"
        >
          {count} appel{count !== 1 ? 's' : ''}
        </button>
      </div>

      {last && !open && (
        <span className="text-[11px] text-gray-400">dernier : {fmt(last)}</span>
      )}

      {open && count > 0 && (
        <div className="text-[11px] text-gray-500 text-right bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 max-w-[180px]">
          {list.map((t, i) => (
            <div key={i}>#{i + 1} — {fmt(t)}</div>
          ))}
          <button onClick={undo} disabled={saving} className="text-red-500 hover:underline mt-1">
            Annuler le dernier
          </button>
        </div>
      )}
    </div>
  )
}
