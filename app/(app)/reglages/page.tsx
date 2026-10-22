import { getReglages } from '@/lib/reglages'
import { getCoaches } from '@/lib/agenda'
import { smsConfigure } from '@/lib/sms'
import { SmsProspects, SmsCoachs } from './ReglagesClient'

export const dynamic = 'force-dynamic'

export default async function ReglagesPage() {
  const [reglages, coaches] = await Promise.all([getReglages(), getCoaches()])
  const configure = smsConfigure()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          ⚙️ Réglages
        </h1>
        <p className="text-gray-500 text-sm mt-1">Notifications par SMS — active ou coupe quand tu veux.</p>
      </div>

      {!configure && (
        <div className="rounded-xl border-2 border-[#F5C800] bg-yellow-50 p-4 text-sm text-gray-800">
          ⚠ <strong>Service SMS pas encore branché.</strong> Les réglages s'enregistrent, mais aucun SMS ne partira
          tant que la clé du service SMS n'est pas installée.
        </div>
      )}

      <SmsProspects initial={reglages.smsProspects} />
      <SmsCoachs
        initial={reglages.smsCoachRdv}
        coaches={coaches.map(c => ({ id: c.id, nom: c.nom, couleur: c.couleur, telephone: c.telephone ?? '' }))}
      />
    </div>
  )
}
