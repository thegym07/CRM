'use client'

import { useState } from 'react'
import { FORMULES, PREFIXE_PERTE } from '@/lib/supabase'

// Fin de la séance d'essai : quoi proposer (script court, vouvoiement) et résultat en 1 clic.
// Tarifs officiels (thegym07.fr), aucun frais d'adhésion. Aucune offre promotionnelle tant que
// les associés ne l'ont pas validée.

// Formules dans l'ordre où on les propose : l'annuel d'abord, le carnet en dernier
const ORDRE = ['Abonnement 1 an', 'Abonnement 6 mois', 'Abonnement 3 mois', 'Abonnement 1 mois', 'Carnet 10 entrées', 'Carnet 20 entrées']
export const FORMULES_FIN_ESSAI = [...FORMULES].sort((a, b) => ORDRE.indexOf(a.value) - ORDRE.indexOf(b.value))

const ETAPES: { titre: string; texte: string }[] = [
  { titre: 'Le ressenti', texte: '« Comment vous êtes-vous senti(e) pendant cette séance ? » Écoutez, puis reprenez ses mots.' },
  { titre: "L'annuel d'abord", texte: "« Pour [son objectif], le plus simple, c'est de venir régulièrement. À l'année, c'est 38 € par mois, accès illimité, cours compris, sans frais d'adhésion. Ça vous irait ? »" },
  { titre: "S'il hésite", texte: '« Un an, c\'est long ? Il y a 6 mois à 45 € par mois. » Puis 3 mois à 55 €, sans engagement à 59 €.' },
  { titre: 'Le carnet en dernier', texte: "10 entrées 55 €, 20 entrées 105 €. Argument : dès 7 séances par mois, l'annuel coûte autant que le carnet, et on vient autant qu'on veut." },
  { titre: 'Conclure', texte: '« On fait l\'inscription maintenant à l\'accueil ? » S\'il veut réfléchir : « Je vous rappelle après-demain, plutôt le matin ou l\'après-midi ? »' },
]

/** Lien « 💡 Que proposer ? » qui déplie le script de fin d'essai. `ouvert` : déplié d'office. */
export function AideFinEssai({ ouvert = false, flottant = false }: { ouvert?: boolean; flottant?: boolean }) {
  const [vu, setVu] = useState(ouvert)
  const panneau = (
    <ol className="space-y-1.5 text-xs text-gray-700 text-left">
      {ETAPES.map((e, i) => (
        <li key={i}><b className="text-gray-900">{i + 1}. {e.titre}</b> — {e.texte}</li>
      ))}
    </ol>
  )
  if (ouvert) return panneau
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setVu(v => !v) }}
        className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 underline decoration-dotted"
      >
        💡 Que proposer ?
      </button>
      {vu && (
        <div className={`${flottant ? 'absolute z-20 right-0 mt-1 w-80 shadow-lg' : 'mt-2 w-full max-w-md'} bg-white border border-gray-200 rounded-xl p-3`}>
          {panneau}
        </div>
      )}
    </span>
  )
}

const dansDeuxJours = () => new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

async function putLead(leadId: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) alert('Enregistrement impossible, réessayez.')
}

/**
 * Résultat de la fin d'essai (prospect présent) :
 * Vente → choix de la formule (annuel en premier) · Réfléchit → rappel dans 2 jours (Relances > Post-séance)
 * · Pas intéressé → « Perdu » avec ce motif (rien n'est effacé).
 */
export function ResultatEssai({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const [vente, setVente] = useState(false)
  const [saving, setSaving] = useState(false)

  if (vente) {
    return (
      <select
        autoFocus
        defaultValue=""
        disabled={saving}
        onChange={async (e) => {
          const v = e.target.value
          if (v === '__retour') { setVente(false); return }
          if (!v) return
          setSaving(true)
          await putLead(leadId, { statut: 'Vendu', resultat_rdv: 'Vendu', offre_souscrite: v, date_relance: null })
          onDone()
        }}
        className="text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer font-semibold"
        style={{ background: '#22c55e', color: '#fff' }}
      >
        <option value="">Formule ?</option>
        {FORMULES_FIN_ESSAI.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        <option value="__retour">← Annuler</option>
      </select>
    )
  }

  return (
    <select
      value=""
      disabled={saving}
      onChange={async (e) => {
        const v = e.target.value
        if (v === 'vente') { setVente(true); return }
        if (v === 'reflechit') {
          setSaving(true)
          await putLead(leadId, { statut: 'À relancer', resultat_rdv: 'À relancer', date_relance: dansDeuxJours(), motif_relance: "Réfléchit après l'essai" })
          onDone()
        }
        if (v === 'non') {
          setSaving(true)
          await putLead(leadId, { statut: 'Perdu', resultat_rdv: 'Refus', motif_relance: PREFIXE_PERTE + 'Pas intéressé', date_relance: null })
          onDone()
        }
      }}
      onClick={e => e.stopPropagation()}
      className="text-xs px-2 py-1 rounded border-0 outline-none cursor-pointer font-semibold bg-gray-100 text-gray-600"
    >
      <option value="">—</option>
      <option value="vente">Vente ✓</option>
      <option value="reflechit">Réfléchit → rappel J+2</option>
      <option value="non">Pas intéressé</option>
    </select>
  )
}
