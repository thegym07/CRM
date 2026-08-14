import Image from 'next/image'

export const metadata = { title: 'Politique de confidentialité — THE GYM' }

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="THE GYM" width={72} height={72} className="rounded-full shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Politique de confidentialité
          </h1>
          <p className="text-gray-500 mt-1 text-sm">THE GYM — Rosières, Ardèche</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="font-bold text-gray-900 mb-1.5">Qui sommes-nous ?</h2>
            <p>
              THE GYM est une salle de sport située à Rosières (Ardèche, France). La présente politique décrit
              comment nous collectons et utilisons vos données personnelles lorsque vous nous laissez vos
              coordonnées, notamment via nos formulaires de contact et nos publicités Facebook / Instagram.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-1.5">Données collectées</h2>
            <p>
              Lorsque vous remplissez un formulaire (sur notre site, en salle ou via une publicité Meta),
              nous collectons uniquement les informations que vous nous transmettez : nom, prénom,
              numéro de téléphone, adresse e-mail et, le cas échéant, l’activité qui vous intéresse.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-1.5">Utilisation de vos données</h2>
            <p>
              Ces informations servent exclusivement à vous recontacter au sujet de votre demande
              (essai, rendez-vous, abonnement) et au suivi commercial interne de la salle. Elles ne sont
              jamais vendues, louées ni transmises à des tiers à des fins publicitaires.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-1.5">Conservation et sécurité</h2>
            <p>
              Vos données sont stockées de manière sécurisée dans notre outil de gestion interne, accessible
              uniquement à l’équipe de THE GYM. Elles sont conservées le temps nécessaire au traitement de
              votre demande, puis supprimées.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-1.5">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression de
              vos données. Pour l’exercer, contactez-nous : par message sur la page Facebook ou Instagram de
              THE GYM, ou directement à l’accueil de la salle. Votre demande sera traitée dans les meilleurs délais.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-2">Dernière mise à jour : août 2026</p>
        </div>
      </div>
    </div>
  )
}
