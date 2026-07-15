'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUTS, SOURCES, ACTIVITES, type Lead } from '@/lib/supabase'

type LeadFormProps = {
  lead?: Lead
  mode: 'create' | 'edit'
}

export default function LeadForm({ lead, mode }: LeadFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nom: lead?.nom ?? '',
    telephone: lead?.telephone ?? '',
    email: lead?.email ?? '',
    source: lead?.source ?? 'Autre',
    date_rdv: lead?.date_rdv ? lead.date_rdv.slice(0, 16) : '',
    activite: lead?.activite ?? '',
    statut: lead?.statut ?? 'Nouveau prospect',
    offre_souscrite: lead?.offre_souscrite ?? '',
    coach_assigne: lead?.coach_assigne ?? '',
    date_relance: lead?.date_relance ?? '',
    motif_relance: lead?.motif_relance ?? '',
    notes: lead?.notes ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom est obligatoire'); return }
    setSaving(true)
    setError('')

    const data = {
      ...form,
      date_rdv: form.date_rdv || null,
      activite: form.activite || null,
      offre_souscrite: form.offre_souscrite || null,
      coach_assigne: form.coach_assigne || null,
      date_relance: form.date_relance || null,
      motif_relance: form.motif_relance || null,
      notes: form.notes || null,
      telephone: form.telephone || null,
      email: form.email || null,
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

    router.push(mode === 'create' ? '/leads' : `/leads/${lead!.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Informations</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom / Prénom *">
            <input name="nom" value={form.nom} onChange={handleChange} required className="input-field" placeholder="Marie Dupont" />
          </Field>
          <Field label="Téléphone">
            <input name="telephone" value={form.telephone} onChange={handleChange} className="input-field" placeholder="06 12 34 56 78" type="tel" />
          </Field>
          <Field label="Email">
            <input name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="marie@exemple.fr" type="email" />
          </Field>
          <Field label="Source">
            <select name="source" value={form.source} onChange={handleChange} className="input-field">
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Rendez-vous</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date & heure du RDV">
            <input name="date_rdv" value={form.date_rdv} onChange={handleChange} className="input-field" type="datetime-local" />
          </Field>
          <Field label="Activité">
            <select name="activite" value={form.activite} onChange={handleChange} className="input-field">
              <option value="">— Choisir —</option>
              {ACTIVITES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Statut & Vente</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Statut">
            <select name="statut" value={form.statut} onChange={handleChange} className="input-field">
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Offre souscrite">
            <input name="offre_souscrite" value={form.offre_souscrite} onChange={handleChange} className="input-field" placeholder="Abonnement mensuel, Carnet 10 séances…" />
          </Field>
          <Field label="Coach assigné">
            <input name="coach_assigne" value={form.coach_assigne} onChange={handleChange} className="input-field" placeholder="Romain, Camille…" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Relance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date de relance">
            <input name="date_relance" value={form.date_relance} onChange={handleChange} className="input-field" type="date" />
          </Field>
          <Field label="Motif de relance">
            <input name="motif_relance" value={form.motif_relance} onChange={handleChange} className="input-field" placeholder="Ex: Rappel offre printemps" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Notes libres</h3>
        <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field w-full min-h-[100px] resize-y" placeholder="Informations complémentaires…" />
      </section>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 bg-white text-zinc-900 font-semibold py-3 px-6 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer le prospect' : 'Sauvegarder'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
