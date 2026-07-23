'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ACTIVITES } from '@/lib/supabase'

export default function InscriptionPage() {
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', activite: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Merci d’indiquer votre nom'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/inscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) setDone(true)
    else {
      const data = await res.json()
      setError(data.error ?? 'Une erreur est survenue')
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4] px-4">
        <div className="w-full max-w-md text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="THE GYM" width={80} height={80} className="rounded-full" />
          </div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Merci !</h1>
          <p className="text-gray-600 mt-2">Votre demande a bien été enregistrée. L’équipe THE GYM vous recontacte très vite.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="THE GYM" width={88} height={88} className="rounded-full shadow-md" />
          </div>
          <h1 className="text-3xl text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Rejoignez THE GYM
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Laissez vos coordonnées, on vous rappelle</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Nom / Prénom *</label>
            <input name="nom" value={form.nom} onChange={handleChange} required className="input-field" placeholder="Marie Dupont" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Téléphone</label>
            <input name="telephone" value={form.telephone} onChange={handleChange} type="tel" className="input-field" placeholder="06 12 34 56 78" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="input-field" placeholder="marie@exemple.fr" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Activité qui vous intéresse</label>
            <select name="activite" value={form.activite} onChange={handleChange} className="input-field">
              <option value="">— Choisir —</option>
              {ACTIVITES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Message (optionnel)</label>
            <textarea name="message" value={form.message} onChange={handleChange} className="input-field w-full min-h-[80px] resize-y" placeholder="Vos disponibilités, vos objectifs…" />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-3 rounded-xl disabled:opacity-50 text-base">
            {loading ? 'Envoi…' : 'Envoyer ma demande'}
          </button>
        </form>
      </div>
    </div>
  )
}
