import LeadForm from '@/components/LeadForm'
import Link from 'next/link'

export default function NouveauLeadPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold text-white">Nouveau prospect</h1>
      </div>
      <LeadForm mode="create" />
    </div>
  )
}
