'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACTIVITES, type Lead } from '@/lib/supabase'

type LeadFormProps = {
  lead?: Lead
  mode: 'create' | 'edit'
}

// Sépare un nom complet en prénom / nom (best effort)
function splitNom(full: string): { prenom: string; nom: string } {
  const parts = (full ?? '').trim().split(/\s+/)
  if (parts.length <= 1) return { prenom: parts[0] ?? '', nom: '' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

export default function LeadForm({ lead, mode }: LeadFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const initial = splitNom(lead?.nom ?? '')

  const [form, setForm] = useState({
    prenom: initial.prenom,
    nom: initial.nom,
    telephone: lead?.telephone ?? '',
    email: lead?.email ?? '',
    date_rdv: lead?.date_rdv ? lead.date_rdv.slice(0, 16) : '',
    activite: lead?.activite ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nomComplet = `${form.prenom.trim()} ${form.nom.trim()}`.trim()
    if (!nomComplet) { setError('Le nom ou le prénom est obligatoire'); return }
    setSaving(true)
    setError('')

    const data: Partial<Lead> = {
      nom: nomComplet,
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,
      date_rdv: form.date_rdv || null,
      activite: (form.activite || null) as Lead['activite'],
      // Un RDV renseigné => le prospect part directement dans RDV / Show Up
      ...(mode === 'create'
        ? { statut: form.date_rdv ? 'RDV pris' : 'Nouveau prospect' }
        : {}),
    }

    const url = mode === 'create' ? '/api/leads' : `/api/leads/${lead!.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Erreur serveur')
      setSaving(false)
      return
    }

    const dest = mode === 'create'
      ? (form.date_rdv ? '/show-up' : '/leads')
      : `/leads/${lead!.id}`
    router.push(dest)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <input name="prenom" value={form.prenom} onChange={handleChange} className="input-field" placeholder="Marie" autoFocus />
        </Field>
        <Field label="Nom">
          <input name="nom" value={form.nom} onChange={handleChange} className="input-field" placeholder="Dupont" />
        </Field>
        <Field label="Téléphone">
          <input name="telephone" value={form.telephone} onChange={handleChange} className="input-field" placeholder="06 12 34 56 78" type="tel" />
        </Field>
        <Field label="Adresse mail">
          <input name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="marie@exemple.fr" type="email" />
        </Field>
        <Field label="Date et heure du RDV">
          <input name="date_rdv" value={form.date_rdv} onChange={handleChange} className="input-field" type="datetime-local" />
        </Field>
        <Field label="Activité">
          <select name="activite" value={form.activite} onChange={handleChange} className="input-field">
            <option value="">— Choisir —</option>
            {ACTIVITES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le prospect' : 'Sauvegarder'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-500 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
