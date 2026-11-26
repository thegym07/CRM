import { bilanResume, type BilanFiche } from '@/lib/bilan'

// Ce que la commerciale doit savoir avant d'appeler un prospect venu du Bilan
// Forme : son profil, son objectif, s'il a postulé à la séance d'essai + le
// lien vers son bilan complet.

const CANAL: Record<string, string> = { wa: 'WhatsApp', ig: 'Instagram', story: 'story', bio: 'bio Instagram', ads: 'pub', fb: 'Facebook', site: 'site', qr: 'QR code', sms: 'SMS', google: 'fiche Google', 'google-post': 'post Google', 'google-produit': 'tarif sur Google',
  'site-fiche': 'site, venu de la fiche Google', 'site-google': 'site, venu d’une recherche Google', 'site-fb': 'site, venu de Facebook', 'site-ig': 'site, venu d’Instagram', 'site-direct': 'site, accès direct', 'site-autre': 'site, venu d’un autre site' }

export default function BilanResume({ leadId, fiche }: { leadId: string; fiche: BilanFiche | null }) {
  if (!fiche?.answers) return null
  const c = fiche.candidature
  return (
    <div className="space-y-1 text-xs">
      <p className="text-gray-700">🧭 {bilanResume(fiche)}</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {c ? (
          <span className="font-semibold text-orange-600">🔥 Veut sa séance d’essai</span>
        ) : (
          <span className="text-gray-400">Bilan fait, pas encore postulé{fiche.src && CANAL[fiche.src] ? ` · via ${CANAL[fiche.src]}` : ''}</span>
        )}
        <a href={`/bilan?r=${leadId}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 underline underline-offset-2">
          Voir son bilan ↗
        </a>
      </p>
    </div>
  )
}
