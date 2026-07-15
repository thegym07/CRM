'use client'

import { useState, useRef, useEffect } from 'react'

export default function InlineNotes({ leadId, value }: { leadId: string; value: string | null }) {
  const [text, setText] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  // Recalcule la hauteur à chaque changement de texte (y compris au montage)
  useEffect(() => { resize() }, [text])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(e.target.value), 800)
  }

  async function save(val: string) {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: val || null }),
    })
    setSaving(false)
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={text}
        onChange={handleChange}
        onClick={e => e.stopPropagation()}
        rows={1}
        placeholder="Notes…"
        style={{ fieldSizing: 'content' } as React.CSSProperties}
        className="w-full block bg-white border border-gray-200 rounded px-2 py-1.5 text-xs leading-snug text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 overflow-hidden break-words"
      />
      {saving && <span className="absolute top-1 right-1 text-[10px] text-gray-400">…</span>}
    </div>
  )
}
