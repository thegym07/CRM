'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CommissionDelete({ id, nom }: { id: string; nom: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Retirer la commission de ${nom} ?`)) return
    setLoading(true)
    await fetch(`/api/commissions/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Retirer cette commission"
      className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 text-sm"
    >
      {loading ? '…' : '✕'}
    </button>
  )
}
