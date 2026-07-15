'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DailyReport } from '@/lib/reports'

export default function RapportForm({ date, initial }: { date: string; initial: DailyReport | null }) {
  const router = useRouter()
  const [appels, setAppels] = useState<string>(initial?.appels_passes?.toString() ?? '')
  const [personnes, setPersonnes] = useState<string>(initial?.personnes_au_tel?.toString() ?? '')
  const [rdv, setRdv] = useState<string>(initial?.rdv_pris?.toString() ?? '')
  const [sms, setSms] = useState<boolean>(initial?.sms_envoyes ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!sms) return
    setSaving(true)
    const body: DailyReport = {
      date,
      appels_passes: appels === '' ? null : parseInt(appels),
      personnes_au_tel: personnes === '' ? null : parseInt(personnes),
      rdv_pris: rdv === '' ? null : parseInt(rdv),
      sms_envoyes: sms,
    }
    await fetch('/api/rapport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label-condensed block mb-1.5">Appels passés</label>
          <input
            type="number" min="0" value={appels}
            onChange={e => setAppels(e.target.value)}
            placeholder="0"
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="label-condensed block mb-1.5">Personnes au tél</label>
          <input
            type="number" min="0" value={personnes}
            onChange={e => setPersonnes(e.target.value)}
            placeholder="0"
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="label-condensed block mb-1.5">RDV pris</label>
          <input
            type="number" min="0" value={rdv}
            onChange={e => setRdv(e.target.value)}
            placeholder="0"
            className="input-field w-full"
          />
        </div>
      </div>

      {/* SMS requis */}
      <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${sms ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <label className="flex items-center gap-3 cursor-pointer select-none w-full">
          <input
            type="checkbox"
            checked={sms}
            onChange={e => setSms(e.target.checked)}
            className="w-5 h-5 rounded accent-[#F5C800] flex-shrink-0 mt-0.5"
          />
          <div>
            <p className={`text-sm font-semibold ${sms ? 'text-green-700' : 'text-amber-700'}`}>
              {sms ? '✓ SMS de relance envoyés' : '📱 SMS de relance envoyés ?'}
            </p>
            {!sms && (
              <p className="text-xs text-amber-600 mt-0.5">À faire avant 18h — cochez pour pouvoir enregistrer</p>
            )}
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !sms}
          className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title={!sms ? 'Cochez "SMS de relance envoyés" pour enregistrer' : ''}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {!sms && (
          <span className="text-xs text-amber-600">Cochez les SMS d'abord</span>
        )}
        {saved && <span className="text-xs text-green-600 font-medium">✓ Sauvegardé</span>}
      </div>
    </div>
  )
}
