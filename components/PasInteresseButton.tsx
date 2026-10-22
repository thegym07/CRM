'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Le prospect a dit lui-même qu'il n'est pas intéressé → suppression définitive,
// sans attendre les 7 tentatives d'appel exigées pour une suppression classique.
export default function PasInteresseButton({ leadId, leadNom, redirect }: { leadId: string; leadNom: string; redirect?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`${leadNom} n'est pas intéressé(e) ?\nIl/elle sera supprimé(e) définitivement du CRM.`)) return
    setLoading(true)
    const res = await fetch(`/api/leads/${leadId}?motif=pas-interesse`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      alert(data?.error ?? 'Suppression impossible.')
      setLoading(false)
      return
    }
    if (redirect) router.push(redirect)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Le prospect n'est pas intéressé : le supprimer du CRM"
      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap disabled:opacity-40"
    >
      {loading ? '…' : '🚫 Pas intéressé'}
    </button>
  )
}
