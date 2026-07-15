export type Lead = {
  id: string
  nom: string
  telephone: string | null
  email: string | null
  source: 'Meta Ads' | 'Bouche-à-oreille' | 'Passage' | 'Formulaire web' | 'Autre'
  date_rdv: string | null
  activite: 'cours collectif' | 'plateau muscu' | 'coaching' | null
  rdv_honore: boolean | null
  resultat_rdv: 'Vendu' | 'À relancer' | 'Refus' | null
  statut: 'Nouveau prospect' | 'Contacté sans réponse' | 'À relancer' | 'RDV pris' | 'Vendu' | 'Refus'
  offre_souscrite: string | null
  coach_assigne: string | null
  date_relance: string | null
  motif_relance: string | null
  suivi_relance: 'À appeler' | 'Pas de réponse' | 'RDV repris' | 'Perdu' | null
  notes: string | null
  appels: string[]            // horodatages ISO des tentatives d'appel
  created_at: string
  updated_at: string
}

// Statuts du parcours prospect (formulaire + liste)
export const STATUTS = ['Nouveau prospect', 'Contacté sans réponse', 'À relancer', 'RDV pris'] as const

export const SOURCES = ['Meta Ads', 'Bouche-à-oreille', 'Passage', 'Formulaire web', 'Autre'] as const
export const ACTIVITES = ['cours collectif', 'plateau muscu', 'coaching'] as const

export const STATUT_COLORS: Record<string, string> = {
  'Nouveau prospect':        'bg-green-200 text-green-900 border-green-300',
  'Contacté sans réponse':   'bg-orange-200 text-orange-900 border-orange-300',
  'À relancer':              'bg-[#F5C800] text-black border-yellow-500',
  'RDV pris':                'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Vendu':                   'bg-green-100 text-green-700 border-green-300',
  'Refus':                   'bg-gray-100 text-gray-500 border-gray-300',
}
