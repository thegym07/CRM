'use client'

import { useState } from 'react'

function Interrupteur({ actif, onChange, disabled }: { actif: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${actif ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${actif ? 'translate-x-6' : ''}`} />
    </button>
  )
}

async function sauver(body: Record<string, unknown>) {
  const res = await fetch('/api/reglages', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, erreur: data?.error as string | undefined }
}

function BoutonTest({ email }: { email: string }) {
  const [etat, setEtat] = useState<string | null>(null)
  async function tester() {
    setEtat('Envoi…')
    const res = await fetch('/api/reglages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => null)
    setEtat(res.ok ? '✓ E-mail de test envoyé, regarde ta boîte' : `✕ ${data?.error ?? 'Échec'}`)
  }
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={tester} disabled={!email.trim()}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-500 disabled:opacity-40">
        Envoyer un e-mail test
      </button>
      {etat && <span className={`text-xs ${etat.startsWith('✕') ? 'text-red-600' : 'text-gray-500'}`}>{etat}</span>}
    </span>
  )
}

// ── E-mail à la commerciale à chaque nouveau prospect ──
export function EmailProspects({ initial }: { initial: { actif: boolean; email: string } }) {
  const [actif, setActif] = useState(initial.actif)
  const [email, setEmail] = useState(initial.email)
  const [msg, setMsg] = useState<string | null>(null)

  async function basculer(v: boolean) {
    if (v && !email.trim()) { setMsg('Renseigne d’abord l’adresse e-mail ci-dessous.'); return }
    setActif(v)
    const res = await sauver({ emailProspects: { actif: v, email } })
    if (!res.ok) { setActif(!v); setMsg(res.erreur ?? 'Erreur'); return }
    setMsg(v ? '✓ Activé' : 'Désactivé')
  }

  async function enregistrerEmail() {
    const res = await sauver({ emailProspects: { actif, email } })
    setMsg(res.ok ? '✓ Adresse enregistrée' : (res.erreur ?? 'Erreur'))
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">📩 E-mail à chaque nouveau prospect</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Dès qu’un prospect arrive (pub Meta ou formulaire du site), un e-mail part avec son nom et son téléphone, pour le rappeler tout de suite.
          </p>
        </div>
        <Interrupteur actif={actif} onChange={basculer} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail de la commerciale"
          type="email" inputMode="email" className="input-field !w-64 text-sm" />
        <button type="button" onClick={enregistrerEmail} disabled={email === initial.email && !msg}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-500">
          Enregistrer
        </button>
        <BoutonTest email={email} />
      </div>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}
    </div>
  )
}

// ── E-mail au coach à chaque nouveau RDV ──
type CoachLite = { id: string; nom: string; couleur: string; email: string }

export function EmailCoachs({ initial, coaches }: { initial: { actif: boolean }; coaches: CoachLite[] }) {
  const [actif, setActif] = useState(initial.actif)
  const [msg, setMsg] = useState<string | null>(null)

  async function basculer(v: boolean) {
    setActif(v)
    const res = await sauver({ emailCoachRdv: { actif: v } })
    if (!res.ok) { setActif(!v); setMsg(res.erreur ?? 'Erreur'); return }
    setMsg(v ? '✓ Activé' : 'Désactivé')
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">💪 E-mail au coach à chaque nouveau RDV</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Quand un créneau est réservé, le coach reçoit tout de suite un e-mail : jour, heure, nom et téléphone de la cliente.
          </p>
        </div>
        <Interrupteur actif={actif} onChange={basculer} />
      </div>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}

      <div className="border-t border-gray-100 pt-3 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">E-mail des coachs</p>
        {coaches.length === 0 && <p className="text-sm text-gray-400">Aucun coach — ajoute-les dans l’onglet Agenda.</p>}
        {coaches.map(c => <EmailCoach key={c.id} coach={c} />)}
      </div>
    </div>
  )
}

function EmailCoach({ coach }: { coach: CoachLite }) {
  const [mail, setMail] = useState(coach.email)
  const [saved, setSaved] = useState(coach.email)
  const [msg, setMsg] = useState<string | null>(null)

  async function enregistrer() {
    const res = await fetch(`/api/coaches/${coach.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok) { setSaved(mail); setMsg('✓') } else setMsg(data?.error ?? 'Erreur')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: coach.couleur }} />
      <span className="text-sm font-medium text-gray-900 w-24">{coach.nom}</span>
      <input value={mail} onChange={e => setMail(e.target.value)} placeholder="adresse@gmail.com" type="email" inputMode="email" className="input-field !w-56 text-sm" />
      <button type="button" onClick={enregistrer} disabled={mail === saved}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-500 disabled:opacity-40">
        Enregistrer
      </button>
      {!saved && <span className="text-[11px] text-yellow-700">pas d’adresse → pas d’e-mail</span>}
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  )
}
