import LeadForm from '@/components/LeadForm'
import Link from 'next/link'

export default function NouveauLeadPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau prospect</h1>
      </div>
      <LeadForm mode="create" />
    </div>
  )
}
