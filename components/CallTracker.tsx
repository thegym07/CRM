'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { lireContact, nbAppels, nbSansReponse, nouvelleEntree, prochainEssai, MAX_SANS_REPONSE } from '@/lib/appels'

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
}

const ICONE = { nr: '✗ pas répondu', rep: '✓ a répondu', sms: '💬 SMS', go: '↩ remis en prospect' } as const

function jourLisible(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  const demain = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  if (date === demain) return 'demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'numeric' })
}

/**
 * Résultat de l'appel en 1 clic.
 * « Pas répondu » : le CRM programme lui-même le prochain essai (J+1, J+1, J+2, J+3, J+7)
 * et propose de classer le prospect « Perdu — injoignable » au bout de 6 essais.
 * « A répondu » : la suite se choisit avec le statut (RDV pris, À rappeler, Perdu).
 */
export default function CallTracker({ leadId, appels, statut, dateRelance }: {
  leadId: string
  appels: string[]
  statut?: string
  dateRelance?: string | null
}) {
  const router = useRouter()
  const [list, setList] = useState<string[]>(appels ?? [])
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  // Ce qu'il y avait avant le dernier clic, pour que « Annuler » défasse tout (statut et relance)
  const [avant, setAvant] = useState<{ entree: string; statut?: string; date_relance: string | null } | null>(null)

  useEffect(() => { setList(appels ?? []) }, [appels])

  async function noter(r: 'nr' | 'rep') {
    const entree = nouvelleEntree(r)
    setAvant({ entree, statut, date_relance: dateRelance ?? null })
    setList(l => [...l, entree])
    setSaving(true)
    const patch: Record<string, unknown> = { ajouter_appel: entree }
    if (r === 'nr') {
      const sansReponse = nbSansReponse(list) + 1
      const prochain = prochainEssai(sansReponse)
      patch.date_relance = prochain
      if (statut === 'Nouveau prospect') patch.statut = 'Contacté sans réponse'
      setMessage(prochain
        ? `Prochain appel ${jourLisible(prochain)}. Pensez au SMS.`
        : `${sansReponse} appels sans réponse : classez-le en « Perdu », motif Injoignable.`)
    } else {
      patch.date_relance = null
      setMessage('Choisissez la suite avec le statut : RDV pris, À rappeler ou Perdu.')
    }
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
    // Pas de rafraîchissement ici : la fiche reste sous le doigt (avec son bouton SMS) ;
    // l'ordre de la liste se met à jour au prochain chargement.
  }

  // Annule le dernier appel noté (pas un SMS) et, s'il vient d'être noté, remet le statut et la relance d'avant
  async function undo() {
    const idx = avant && list.includes(avant.entree)
      ? list.lastIndexOf(avant.entree)
      : list.map(lireContact).map(c => c.r !== 'sms' && c.r !== 'go').lastIndexOf(true)
    if (idx < 0) return
    const next = list.filter((_, i) => i !== idx)
    setList(next)
    setSaving(true)
    const patch: Record<string, unknown> = { appels: next }
    if (avant && list[idx] === avant.entree) {
      patch.date_relance = avant.date_relance
      if (avant.statut) patch.statut = avant.statut
    }
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setAvant(null)
    setSaving(false)
    setMessage(null)
    router.refresh()
  }

  const count = nbAppels(list)
  const sansReponse = nbSansReponse(list)
  const last = list.length > 0 ? lireContact(list[list.length - 1]) : null

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <button
          onClick={() => noter('nr')}
          disabled={saving}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F5C800] text-black hover:bg-[#e6ba00] transition-colors disabled:opacity-50"
          title="Vous avez appelé, personne n'a répondu : le prochain essai est programmé tout seul"
        >
          📞 Pas répondu
        </button>
        <button
          onClick={() => noter('rep')}
          disabled={saving}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-900 text-[#F5C800] hover:bg-black transition-colors disabled:opacity-50"
          title="Vous avez eu la personne au téléphone"
        >
          ✓ A répondu
        </button>
        <button
          onClick={() => list.length > 0 && setOpen(o => !o)}
          className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-colors ${
            count === 0
              ? 'border-gray-200 text-gray-400'
              : sansReponse >= 4
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          title="Historique des appels et SMS"
        >
          {count} appel{count !== 1 ? 's' : ''}
        </button>
      </div>

      {message && <span className="text-[11px] font-semibold text-gray-700 text-right max-w-[260px]">{message}</span>}
      {!message && last && !open && (
        <span className="text-[11px] text-gray-400">dernier : {fmt(last.t)}{last.r ? ` · ${ICONE[last.r]}` : ''}</span>
      )}
      {!message && sansReponse >= MAX_SANS_REPONSE && (
        <span className="text-[11px] font-semibold text-red-600">{sansReponse} sans réponse : à classer « Perdu »</span>
      )}

      {open && list.length > 0 && (
        <div className="text-[11px] text-gray-500 text-right bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 max-w-[220px]">
          {list.map((e, i) => {
            const c = lireContact(e)
            return <div key={i}>{fmt(c.t)}{c.r ? ` — ${ICONE[c.r]}` : ' — appel'}</div>
          })}
          <button onClick={undo} disabled={saving} className="text-red-500 hover:underline mt-1">
            Annuler le dernier
          </button>
        </div>
      )}
    </div>
  )
}
