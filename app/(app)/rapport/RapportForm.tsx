'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DailyReport } from '@/lib/reports'

// Rapport du jour : enregistrement automatique à chaque modification,
// modifiable autant de fois que nécessaire dans la journée.
const DELAI_MS = 800

const versNombre = (v: string) => (v === '' ? null : Math.max(0, parseInt(v, 10) || 0))

export default function RapportForm({ date, initial }: { date: string; initial: DailyReport | null }) {
  const router = useRouter()
  const [appels, setAppels] = useState<string>(initial?.appels_passes?.toString() ?? '')
  const [personnes, setPersonnes] = useState<string>(initial?.personnes_au_tel?.toString() ?? '')
  const [rdv, setRdv] = useState<string>(initial?.rdv_pris?.toString() ?? '')
  const [sms, setSms] = useState<boolean>(initial?.sms_envoyes ?? false)
  const [etat, setEtat] = useState<'idle' | 'attente' | 'saving' | 'saved' | 'erreur'>('idle')
  const [heure, setHeure] = useState<string | null>(null)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enAttente = useRef<DailyReport | null>(null)

  async function enregistrer(body: DailyReport) {
    setEtat('saving')
    try {
      const res = await fetch('/api/rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true, // l'envoi aboutit même si on quitte la page juste après
      })
      if (!res.ok) throw new Error()
      enAttente.current = null
      setEtat('saved')
      setHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      router.refresh()
    } catch {
      setEtat('erreur')
    }
  }

  function programmer(next: Partial<{ appels: string; personnes: string; rdv: string; sms: boolean }>) {
    const body: DailyReport = {
      date,
      appels_passes: versNombre(next.appels ?? appels),
      personnes_au_tel: versNombre(next.personnes ?? personnes),
      rdv_pris: versNombre(next.rdv ?? rdv),
      sms_envoyes: next.sms ?? sms,
    }
    enAttente.current = body
    setEtat('attente')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => enregistrer(body), DELAI_MS)
  }

  // Si on quitte la page ou change d'onglet avant la fin du délai, on enregistre tout de suite
  useEffect(() => {
    const vider = () => {
      if (enAttente.current) {
        if (timer.current) clearTimeout(timer.current)
        enregistrer(enAttente.current)
      }
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') vider() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', vider)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', vider)
      vider()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const champ = (
    label: string,
    value: string,
    set: (v: string) => void,
    cle: 'appels' | 'personnes' | 'rdv',
  ) => (
    <div>
      <label className="label-condensed block mb-1.5">{label}</label>
      <input
        type="number" min="0" inputMode="numeric" value={value}
        onChange={e => { set(e.target.value); programmer({ [cle]: e.target.value }) }}
        placeholder="0"
        className="input-field w-full"
      />
    </div>
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {champ('Appels passés', appels, setAppels, 'appels')}
        {champ('Personnes au tél', personnes, setPersonnes, 'personnes')}
        {champ('RDV pris', rdv, setRdv, 'rdv')}
      </div>

      {/* Rappel SMS de relance (ne bloque plus l'enregistrement) */}
      <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${sms ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <label className="flex items-center gap-3 cursor-pointer select-none w-full">
          <input
            type="checkbox"
            checked={sms}
            onChange={e => { setSms(e.target.checked); programmer({ sms: e.target.checked }) }}
            className="w-5 h-5 rounded accent-[#F5C800] flex-shrink-0 mt-0.5"
          />
          <div>
            <p className={`text-sm font-semibold ${sms ? 'text-green-700' : 'text-amber-700'}`}>
              {sms ? '✓ SMS de relance envoyés' : '📱 SMS de relance envoyés ?'}
            </p>
            {!sms && <p className="text-xs text-amber-600 mt-0.5">À faire avant 18h — coche quand c'est fait</p>}
          </div>
        </label>
      </div>

      {/* État de l'enregistrement automatique */}
      <p className="text-xs h-4">
        {etat === 'idle' && <span className="text-gray-400">Enregistrement automatique — modifiable toute la journée</span>}
        {etat === 'attente' && <span className="text-gray-400">Modification en cours…</span>}
        {etat === 'saving' && <span className="text-gray-500">Enregistrement…</span>}
        {etat === 'saved' && <span className="text-green-600 font-medium">✓ Enregistré automatiquement à {heure}</span>}
        {etat === 'erreur' && <span className="text-red-600 font-medium">⚠ Pas enregistré (connexion ?) — modifie un chiffre pour réessayer</span>}
      </p>
    </div>
  )
}
