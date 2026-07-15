'use client'

import { useState } from 'react'

type Props = {
  leadId: string
  field: string
  value: string | boolean
  options: { label: string; value: string }[]
  colorMap?: Record<string, string>
  styleMap?: Record<string, { bg: string; fg: string }>
  onSaved?: (value: string) => void
}

export default function InlineSelect({ leadId, field, value, options, colorMap, styleMap, onSaved }: Props) {
  const [current, setCurrent] = useState(String(value))
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value
    setCurrent(newValue)
    setSaving(true)
    let payload: unknown = newValue
    if (field === 'rdv_honore') {
      payload = newValue === 'true' ? true : newValue === 'false' ? false : null
    } else if (newValue === 'null' || newValue === '') {
      payload = null
    }
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: payload }),
    })
    setSaving(false)
    onSaved?.(newValue)
  }

  const color = colorMap?.[current] ?? ''
  const inlineStyle = styleMap?.[current]

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={saving}
      className={`text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer font-semibold transition-colors ${inlineStyle ? '' : (color || 'bg-gray-100 text-gray-600')} ${saving ? 'opacity-50' : ''}`}
      style={inlineStyle ? { backgroundColor: inlineStyle.bg, color: inlineStyle.fg } : undefined}
      onClick={e => e.stopPropagation()}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
