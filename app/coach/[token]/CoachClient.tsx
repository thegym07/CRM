'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

async function action(token: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/coach/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

// ── Étape 1 : brancher son agenda (iPhone ou Google) ──
export function ConnecterAgenda({ token }: { token: string }) {
  const router = useRouter()
  const [choix, setChoix] = useState<'iphone' | 'google' | null>(null)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function connecter() {
    setBusy(true)
    setErreur(null)
    const res = await action(token, { action: 'connecter', url })
    setBusy(false)
    if (!res.ok) { setErreur(res.data?.error ?? 'Oups, réessaie.'); return }
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-white border-2 border-[#F5C800] p-4 shadow-sm space-y-4">
      <div>
        <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Étape 1 — une seule fois</p>
        <p className="font-bold text-lg mt-1">Connecte ton agenda</p>
        <p className="text-sm text-gray-600 mt-1">Tu notes tes rendez-vous où ?</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {([['iphone', '📱 iPhone'], ['google', '📅 Google Agenda']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setChoix(k)}
            className={`py-3 rounded-xl text-sm font-semibold border ${choix === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {choix === 'iphone' && (
        <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
          <li>Ouvre l'app <strong>Calendrier</strong> de ton iPhone.</li>
          <li>Touche <strong>Calendriers</strong> (en bas de l'écran).</li>
          <li>Touche le petit <strong>ⓘ</strong> à côté du calendrier où tu notes tes rendez-vous.</li>
          <li>Tout en bas, active <strong>Calendrier public</strong>, puis touche <strong>Partager le lien…</strong> → <strong>Copier</strong>.</li>
          <li>Reviens ici, colle le lien dans la case ci-dessous et touche <strong>Connecter</strong>.</li>
          <li className="text-xs text-gray-500 list-none -ml-5 pt-1">
            Pas de « Calendrier public » ? Ton calendrier n'est pas sur iCloud : préviens THE GYM, on t'aide.
          </li>
        </ol>
      )}

      {choix === 'google' && (
        <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
          <li>Sur un <strong>ordinateur</strong>, va sur <strong>calendar.google.com</strong>.</li>
          <li>Clique sur la roue ⚙️ en haut à droite → <strong>Paramètres</strong>.</li>
          <li>À gauche, clique sur <strong>ton agenda</strong> (ton nom).</li>
          <li>Descends jusqu'à <strong>Adresse secrète au format iCal</strong> et copie-la.</li>
          <li>Colle-la dans la case ci-dessous et touche <strong>Connecter</strong>.</li>
          <li className="text-xs text-gray-500 list-none -ml-5 pt-1">
            Pas d'ordinateur ? Envoie simplement ce lien à THE GYM, on le branche pour toi.
          </li>
        </ol>
      )}

      {choix && (
        <div className="space-y-2">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Colle ton lien ici"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 bg-white"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <button type="button" onClick={connecter} disabled={busy || !url.trim()}
            className="w-full rounded-xl bg-[#F5C800] text-black font-bold py-3.5 disabled:opacity-40">
            {busy ? 'Vérification…' : 'Connecter'}
          </button>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        </div>
      )}
    </div>
  )
}

// ── Débrancher (en cas de mauvais lien) ──
export function Deconnecter({ token }: { token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function go() {
    if (!confirm('Déconnecter ton agenda ? Tes dispos ne seront plus mises à jour.')) return
    setBusy(true)
    await action(token, { action: 'deconnecter' })
    router.refresh()
  }
  return (
    <button type="button" onClick={go} disabled={busy} className="text-xs text-gray-400 underline">
      Changer d'agenda
    </button>
  )
}

// ── Bouton copier (lien d'abonnement Google) ──
export function CopierLien({ texte }: { texte: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button"
      onClick={async () => { await navigator.clipboard.writeText(texte); setOk(true); setTimeout(() => setOk(false), 2000) }}
      className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-white border border-gray-300">
      {ok ? '✓ Copié' : 'Copier le lien'}
    </button>
  )
}
