import { getReglages } from '@/lib/reglages'
import { getCoaches } from '@/lib/agenda'
import { emailConfigure } from '@/lib/email'
import { EmailProspects, EmailCoachs } from './ReglagesClient'

export const dynamic = 'force-dynamic'

export default async function ReglagesPage() {
  const [reglages, coaches] = await Promise.all([getReglages(), getCoaches()])
  const configure = emailConfigure()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          ⚙️ Réglages
        </h1>
        <p className="text-gray-500 text-sm mt-1">Notifications par e-mail (gratuites) : active ou coupe quand tu veux.</p>
      </div>

      {!configure && (
        <div className="rounded-xl border-2 border-[#F5C800] bg-yellow-50 p-4 text-sm text-gray-800">
          ⚠ <strong>Envoi d’e-mails pas encore branché.</strong> Les réglages s’enregistrent, mais aucun e-mail ne partira
          tant que la boîte Gmail de la salle n’est pas connectée.
        </div>
      )}

      <EmailProspects initial={reglages.emailProspects} />
      <EmailCoachs
        initial={reglages.emailCoachRdv}
        coaches={coaches.map(c => ({ id: c.id, nom: c.nom, couleur: c.couleur, email: c.email ?? '' }))}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        💡 <strong>Pour que les e-mails n’arrivent jamais en spam</strong> : chaque destinataire ajoute l’adresse de la salle
        à ses contacts, et si le premier e-mail tombe dans « Promotions » ou « Spam », il le déplace dans la boîte principale.
        Gmail retient le choix pour tous les suivants.
      </div>
    </div>
  )
}
