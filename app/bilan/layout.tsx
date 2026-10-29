import type { Metadata } from 'next'
import { Barlow, Bebas_Neue } from 'next/font/google'

// Page publique (hors CRM) : partagée sur WhatsApp, Instagram, en story ou en bio.
// Polices du site thegym07.fr : Bebas Neue (titres) + Barlow (texte).
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })
const barlow = Barlow({ weight: ['400', '500', '600', '700', '800'], subsets: ['latin'], variable: '--font-barlow' })

export const metadata: Metadata = {
  metadataBase: new URL('https://crm-thegym.vercel.app'),
  title: 'Mon Bilan Forme en 2 minutes — THE GYM Rosières',
  description:
    'Perdre du poids, vous remettre en forme, vous muscler ? En 2 minutes, découvrez ce qui vous freine et ce qu’il faut mettre en place pour y arriver.',
  openGraph: {
    title: 'Perdre du poids, vous remettre en forme, vous muscler ?',
    description: 'Mon Bilan Forme en 2 minutes, offert : ce qui vous freine et ce qu’il faut mettre en place pour y arriver.',
    images: [{ url: '/bilan/salle.jpg', width: 1200, height: 800 }],
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function BilanLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${bebas.variable} ${barlow.variable}`}>{children}</div>
}
