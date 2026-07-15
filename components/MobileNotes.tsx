'use client'

import { useState, useEffect } from 'react'

export default function MobileNotes({ leadId, value, nom }: { leadId: string; value: string | null; nom: string }) {
  const [note, setNote] = useState(value ?? '')
  const [draft, setDraft] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasNote = note.trim().length > 0

  // Bloque le scroll de la page quand la modale est ouverte
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  async function save() {
    const val = draft.trim()
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: val || null }),
    })
    setNote(val)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setDraft(note); setOpen(true) }}
        className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
          hasNote
            ? 'bg-[#F5C800]/20 border-[#F5C800] text-yellow-700'
            : 'bg-white border-gray-300 text-gray-400'
        }`}
        title="Note du prospect"
      >
        📝
        {hasNote && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setOpen(false)}>
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" />
          {/* bottom sheet */}
          <div
            className="relative w-full bg-white rounded-t-2xl p-4 pb-6 shadow-2xl animate-[slideup_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate">Note — {nom}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl leading-none px-2">×</button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={4}
              placeholder="Saisir une note…"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary flex-1 text-sm disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
