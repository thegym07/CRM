import type { Metadata } from 'next'
import { Barlow, Bebas_Neue } from 'next/font/google'

// Page publique (hors CRM) : partagée sur WhatsApp, Instagram, en story ou en bio.
// Polices du site thegym07.fr : Bebas Neue (titres) + Barlow (texte).
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })
const barlow = Barlow({ weight: ['400', '500', '600', '700', '800'], subsets: ['latin'], variable: '--font-barlow' })

export const metadata: Metadata = {
  metadataBase: new URL('https://crm-thegym.vercel.app'),
  title: 'Votre Bilan Forme — THE GYM Rosières',
  description:
    'Vous stagnez ? En 2 minutes, découvrez vos erreurs, ce qui vous bloque et ce que vous devez mettre en place pour avancer enfin.',
  openGraph: {
    title: 'Vous stagnez ? Faites votre Bilan Forme',
    description: 'En 2 minutes : vos erreurs, ce qui vous bloque et quoi mettre en place pour avancer enfin. Offert.',
    images: [{ url: '/bilan/salle.jpg', width: 1200, height: 800 }],
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function BilanLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${bebas.variable} ${barlow.variable}`}>{children}</div>
}
