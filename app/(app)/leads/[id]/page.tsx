import { getLead } from '@/lib/db'
import { STATUT_COLORS } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

export const dynamic = 'force-dynamic'

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = getLead(id)

  if (!lead) notFound()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Prospects
        </Link>
        <span className={`text-xs px-2 py-1 rounded-full border ${STATUT_COLORS[lead.statut] || 'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>
          {lead.statut}
        </span>
      </div>
      <LeadDetailClient lead={lead} />
    </div>
  )
}
