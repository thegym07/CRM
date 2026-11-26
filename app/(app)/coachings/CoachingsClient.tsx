'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

type Etat = 'idle' | 'attente' | 'saving' | 'ok' | 'erreur'

const borner = (n: number) => Math.max(0, Math.min(999, Math.round(n) || 0))

function envoyer(periode: string, nombre: number, keepalive = false) {
  return fetch('/api/coachings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periode, nombre }),
    ...(keepalive ? { keepalive: true } : { signal: AbortSignal.timeout(10_000) }),
  })
}

// Enregistrement automatique, 600 ms après la dernière modification.
// Un seul envoi à la fois, et c'est toujours la DERNIÈRE valeur saisie qui part :
// un vieil envoi (réussi ou raté) ne peut jamais repasser par-dessus une saisie plus récente.
function useSauvegarde(periode: string, initial: number) {
  const router = useRouter()
  const [nombre, setNombreAffiche] = useState(initial)
  const [etat, setEtat] = useState<Etat>('idle')
  const voulu = useRef(initial)       // dernière valeur saisie
  const enregistre = useRef(initial)  // dernière valeur confirmée par le serveur
  const occupe = useRef(false)        // un envoi est en cours
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pousser = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    if (occupe.current) return // l'envoi en cours relancera s'il reste une saisie plus récente
    if (voulu.current === enregistre.current) return
    occupe.current = true
    setEtat('saving')
    const n = voulu.current
    const res = await envoyer(periode, n).catch(() => null)
    occupe.current = false
    if (!res?.ok) { setEtat('erreur'); return }
    enregistre.current = n
    if (voulu.current !== n) { void pousser(); return } // saisie arrivée pendant l'envoi
    setEtat('ok')
    router.refresh()
  }, [periode, router])

  const setNombre = (v: number) => {
    const n = borner(v)
    setNombreAffiche(n)
    voulu.current = n
    setEtat(n === enregistre.current && !occupe.current ? 'ok' : 'attente')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void pousser() }, 600)
  }

  // Recalage sur la base (saisie faite sur un autre téléphone) quand rien n'est en attente
  useEffect(() => {
    if (!occupe.current && voulu.current === enregistre.current) {
      voulu.current = initial
      enregistre.current = initial
      setNombreAffiche(initial)
    }
  }, [initial])

  useEffect(() => {
    // App en arrière-plan : on envoie tout de suite ; au retour, on renvoie si besoin et on relit la base
    const surVisibilite = () => {
      if (document.visibilityState === 'hidden') void pousser()
      else if (voulu.current !== enregistre.current) void pousser()
      else if (!occupe.current) router.refresh()
    }
    // Fermeture / rechargement de la page : dernier envoi qui survit à la fermeture
    const surDepart = () => {
      if (voulu.current !== enregistre.current) envoyer(periode, voulu.current, true).catch(() => {})
    }
    document.addEventListener('visibilitychange', surVisibilite)
    window.addEventListener('pagehide', surDepart)
    return () => {
      document.removeEventListener('visibilitychange', surVisibilite)
      window.removeEventListener('pagehide', surDepart)
      void pousser() // changement d'onglet du CRM : l'envoi continue, l'application reste ouverte
    }
  }, [periode, pousser, router])

  return { nombre, setNombre, etat, reessayer: () => { void pousser() } }
}

function Statut({ etat, reessayer }: { etat: Etat; reessayer: () => void }) {
  if (etat === 'attente' || etat === 'saving') return <span className="text-xs text-gray-400" role="status">Enregistrement…</span>
  if (etat === 'ok') return <span className="text-xs text-green-600" role="status">✓ Enregistré</span>
  if (etat === 'erreur') {
    return (
      <span className="text-xs text-red-500" role="status">
        Pas enregistré —{' '}
        <button type="button" onClick={reessayer} className="underline font-medium">Réessayer</button>
      </span>
    )
  }
  return null
}

/** Grand compteur de la période en cours. */
export function CompteurCoachings({ periode, initial, tarif }: { periode: string; initial: number; tarif: number }) {
  const { nombre, setNombre, etat, reessayer } = useSauvegarde(periode, initial)
  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setNombre(nombre - 1)} disabled={nombre === 0}
          aria-label="Retirer un coaching"
          className="w-14 h-14 rounded-xl border border-gray-300 bg-white text-2xl font-bold text-gray-700 hover:border-gray-500 disabled:opacity-30">
          −
        </button>
        <input type="number" inputMode="numeric" min={0} max={999} value={nombre}
          onChange={e => setNombre(Number(e.target.value))}
          aria-label="Nombre de coachings"
          className="w-24 h-14 text-center text-4xl font-bold text-gray-900 rounded-xl border border-gray-300 focus:border-[#F5C800] focus:outline-none" />
        <button type="button" onClick={() => setNombre(nombre + 1)}
          aria-label="Ajouter un coaching"
          className="w-14 h-14 rounded-xl bg-[#F5C800] text-2xl font-bold text-black hover:bg-[#e6ba00]">
          +
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <p className="text-sm text-gray-600">
          {nombre} coaching{nombre !== 1 ? 's' : ''} × {tarif} € = <span className="font-bold text-gray-900">{euros(nombre * tarif)}</span>
        </p>
        <Statut etat={etat} reessayer={reessayer} />
      </div>
    </div>
  )
}

/** Petite saisie pour corriger une période passée. */
export function SaisieCoachings({ periode, initial, tarif }: { periode: string; initial: number; tarif: number }) {
  const { nombre, setNombre, etat, reessayer } = useSauvegarde(periode, initial)
  return (
    <div className="flex items-center justify-end gap-2">
      <Statut etat={etat} reessayer={reessayer} />
      <input type="number" inputMode="numeric" min={0} max={999} value={nombre}
        onChange={e => setNombre(Number(e.target.value))}
        aria-label={`Coachings de la période ${periode}`}
        className="w-16 px-2 py-1 text-right text-sm rounded-lg border border-gray-300 focus:border-[#F5C800] focus:outline-none" />
      <span className="w-14 text-right text-sm font-semibold text-gray-900">{euros(nombre * tarif)}</span>
    </div>
  )
}
