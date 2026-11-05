'use client'

import { useRouter } from 'next/navigation'
import { lienSms } from '@/lib/sms'

// Ouvre Messages sur le téléphone avec le SMS déjà écrit (gratuit, envoyé par la commerciale)
// et note le SMS dans l'historique du prospect.
export default function SmsButton({ leadId, telephone, texte, label = 'SMS' }: {
  leadId: string
  telephone: string | null
  texte: string
  label?: string
}) {
  const router = useRouter()
  if (!telephone) return null

  function noter() {
    fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ajouter_appel: `${new Date().toISOString()}|sms` }),
      keepalive: true,
    }).then(() => router.refresh()).catch(() => {})
  }

  return (
    <a
      href={lienSms(telephone, texte)}
      onClick={noter}
      title={texte}
      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap"
    >
      💬 {label}
    </a>
  )
}
