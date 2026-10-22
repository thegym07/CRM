'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import type { Coach, Creneau } from '@/lib/agenda'

const pad = (n: number) => String(n).padStart(2, '0')

// Créneaux de 15 min de 06:00 à 21:00
const HEURES: string[] = (() => {
  const out: string[] = []
  for (let m = 6 * 60; m <= 21 * 60; m += 15) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
  return out
})()

const DUREES = [
  { label: '30 min', min: 30 },
  { label: '45 min', min: 45 },
  { label: '1 h', min: 60 },
  { label: '1 h 30', min: 90 },
]

// ── Ajouter une disponibilité ──
export function AjouterDispo({ coaches }: { coaches: Coach[] }) {
  const router = useRouter()
  const [coachId, setCoachId] = useState(coaches[0]?.id ?? '')
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }))
  const [heure, setHeure] = useState('09:00')
  const [duree, setDuree] = useState(60)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')

  if (coaches.length === 0) return null

  async function ajouter() {
    setErreur('')
    setSaving(true)
    const [h, m] = heure.split(':').map(Number)
    const [y, mo, d] = date.split('-').map(Number)
    const debut = new Date(y, mo - 1, d, h, m)
    const fin = new Date(debut.getTime() + duree * 60000)
    const res = await fetch('/api/creneaux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_id: coachId, debut: debut.toISOString(), fin: fin.toISOString() }),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json()
      setErreur(j.error ?? 'Erreur')
      return
    }
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="label-condensed mb-2">Ajouter une disponibilité</p>
      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Coach</label>
          <select value={coachId} onChange={e => setCoachId(e.target.value)} className="input-field !w-auto text-sm">
            {coaches.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Jour</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field !w-auto text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Heure</label>
          <select value={heure} onChange={e => setHeure(e.target.value)} className="input-field !w-auto text-sm">
            {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Durée</label>
          <select value={duree} onChange={e => setDuree(Number(e.target.value))} className="input-field !w-auto text-sm">
            {DUREES.map(d => <option key={d.min} value={d.min}>{d.label}</option>)}
          </select>
        </div>
        <button onClick={ajouter} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          {saving ? '…' : '+ Ajouter'}
        </button>
      </div>
      {erreur && <p className="text-xs text-red-500 mt-2">{erreur}</p>}
    </div>
  )
}

// ── Pastille de créneau dans la grille ──
export function SlotChip({ creneau, coach }: { creneau: Creneau; coach: Coach | undefined }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const couleur = coach?.couleur ?? '#9ca3af'
  const heure = new Date(creneau.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const reserve = creneau.lead_id != null

  async function supprimer() {
    if (!confirm(`Supprimer la dispo de ${coach?.nom ?? 'ce coach'} à ${heure} ?`)) return
    setDeleting(true)
    await fetch(`/api/creneaux/${creneau.id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (reserve) {
    return (
      <Link
        href={creneau.lead_id ? `/leads/${creneau.lead_id}` : '#'}
        className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
        style={{ background: couleur }}
        title={`${coach?.nom ?? ''} — RDV ${creneau.lead_nom ?? ''}`}
      >
        {heure} · {creneau.lead_nom}
        <span className="block text-[10px] font-normal opacity-80">{coach?.nom}</span>
      </Link>
    )
  }

  return (
    <div
      className="flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-xs font-medium border-2 border-dashed"
      style={{ borderColor: couleur, color: couleur, background: `${couleur}14` }}
      title={`${coach?.nom ?? ''} — disponible`}
    >
      <span>{heure} · {coach?.nom}</span>
      <button onClick={supprimer} disabled={deleting} className="opacity-60 hover:opacity-100 font-bold">✕</button>
    </div>
  )
}

// ── Gestion des coachs (ajout / retrait / URL iCal) ──
const COULEURS = ['#F5C800', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f97316', '#14b8a6', '#ec4899']

export function GestionCoachs({ coaches, baseUrl }: { coaches: Coach[]; baseUrl: string }) {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [couleur, setCouleur] = useState(COULEURS[0])
  const [saving, setSaving] = useState(false)

  async function ajouter() {
    if (!nom.trim()) return
    setSaving(true)
    await fetch('/api/coaches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, couleur }),
    })
    setNom('')
    setSaving(false)
    router.refresh()
  }

  async function retirer(c: Coach) {
    if (!confirm(`Retirer ${c.nom} ? Ses dispos libres seront supprimées (l'historique de ses RDV est conservé).`)) return
    await fetch(`/api/coaches/${c.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="label-condensed mb-3">Coachs</p>

      <div className="space-y-4 mb-4">
        {coaches.map(c => {
          const pageCoach = `${baseUrl}/coach/${c.ical_token}`
          const message = `Salut ${c.nom} ! Voici ta page THE GYM pour brancher ton agenda (2 minutes, une seule fois) : ${pageCoach}`
          return (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.couleur }} />
                <span className="text-sm font-medium text-gray-900 w-24">{c.nom}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.ical_import_url ? 'bg-green-100 text-green-700' : 'bg-[#F5C800]/30 text-yellow-800'}`}>
                  {c.ical_import_url ? '🔗 Agenda connecté' : '⏳ Agenda pas encore connecté'}
                </span>
                <button onClick={() => retirer(c)} className="ml-auto text-gray-300 hover:text-red-500 text-sm">✕</button>
              </div>
              <div className="flex items-center gap-2 flex-wrap pl-6">
                <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:opacity-90">
                  💬 Envoyer sa page par WhatsApp
                </a>
                <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 min-w-0">
                  <span className="text-[11px] text-gray-500 truncate max-w-[200px]">{pageCoach}</span>
                  <CopyButton text={pageCoach} />
                </span>
              </div>
              <details className="pl-6">
                <summary className="text-[11px] text-gray-400 cursor-pointer select-none">Brancher son agenda à sa place</summary>
                <div className="mt-2"><LienAgendaCoach coach={c} /></div>
              </details>
            </div>
          )
        })}
        {coaches.length === 0 && <p className="text-sm text-gray-400">Aucun coach — ajoute le premier ci-dessous.</p>}
      </div>

      <div className="flex items-center gap-2 flex-wrap border-t border-gray-100 pt-3">
        <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Prénom du coach" className="input-field !w-40 text-sm" />
        <div className="flex gap-1">
          {COULEURS.map(c => (
            <button key={c} onClick={() => setCouleur(c)}
              className={`w-6 h-6 rounded-full border-2 ${couleur === c ? 'border-gray-900' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>
        <button onClick={ajouter} disabled={saving || !nom.trim()} className="btn-primary text-sm disabled:opacity-40">
          + Ajouter
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        👉 <strong>Comment ça marche</strong> : envoie à chaque coach <strong>sa page perso</strong> (bouton WhatsApp). Sur son téléphone, il branche
        son agenda iPhone ou Google en suivant les étapes (une seule fois), et ajoute ses RDV THE GYM à son agenda en un clic.
        Ensuite il note <strong>« Dispo »</strong> dans son agenda quand il est libre : ça crée les créneaux ici. Tout autre rendez-vous
        (client perso, dentiste…) annule automatiquement les créneaux qui le chevauchent. Un créneau déjà réservé par une cliente n'est jamais annulé tout seul.
      </p>
    </div>
  )
}

// ── Lien de l'agenda perso du coach → import automatique de ses dispos ──
function LienAgendaCoach({ coach }: { coach: Coach }) {
  const router = useRouter()
  const [url, setUrl] = useState(coach.ical_import_url ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const connecte = !!coach.ical_import_url

  async function enregistrer() {
    setSaving(true)
    setMsg(null)
    const res = await fetch(`/api/coaches/${coach.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ical_import_url: url }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      setMsg(d?.error ?? 'Erreur')
      return
    }
    setMsg(url.trim() ? '✓ Connecté — ses événements « Dispo » deviennent des créneaux' : '✓ Déconnecté')
    router.refresh()
  }

  return (
    <div className="pl-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-semibold ${connecte ? 'text-green-600' : 'text-gray-400'}`}>
          {connecte ? '🔗 Agenda connecté' : 'Son agenda (Google / iPhone) :'}
        </span>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Coller ici le lien privé de son agenda…"
          className="input-field !w-64 text-xs"
        />
        <button onClick={enregistrer} disabled={saving || url === (coach.ical_import_url ?? '')}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-500 disabled:opacity-40">
          {saving ? '…' : 'Enregistrer'}
        </button>
      </div>
      {msg && <p className="text-[11px] mt-1 text-gray-500">{msg}</p>}
    </div>
  )
}
