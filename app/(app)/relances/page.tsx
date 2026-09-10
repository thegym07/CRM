import { redirect } from 'next/navigation'

// Fusionné avec l'onglet RDV & Relances
export default function RelancesRedirect() {
  redirect('/show-up')
}
