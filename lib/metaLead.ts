// Lecture des réponses d'un formulaire Meta (Lead Ads).
// Meta nomme les champs selon la langue du formulaire (full_name, nom_complet, prénom,
// nom_de_famille, phone_number, numéro_de_téléphone…) : on se fie d'abord au TYPE de la
// question dans la définition du formulaire, puis au nom du champ en secours.

export type MetaFieldDatum = { name: string; values: string[] }
export type MetaQuestion = { key: string; label?: string; type?: string; options?: { key: string; value: string }[] }

type Role = 'nomComplet' | 'prenom' | 'nomFamille' | 'telephone' | 'email'

const PAR_TYPE: Record<string, Role> = {
  FULL_NAME: 'nomComplet',
  FIRST_NAME: 'prenom',
  LAST_NAME: 'nomFamille',
  PHONE: 'telephone',
  EMAIL: 'email',
  // Coordonnées pro : ne servent que si le formulaire n'a pas de téléphone / e-mail personnel
  WORK_PHONE_NUMBER: 'telephone',
  WORK_EMAIL: 'email',
}

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const PAR_NOM: [Role, RegExp][] = [
  ['nomComplet', /^(full_?name|nom_complet|nom_et_prenom|prenom_et_nom|nom_prenom)$/],
  ['prenom', /^(first_?name|prenom)$/],
  ['nomFamille', /^(last_?name|nom_de_famille|nom)$/],
  ['telephone', /^(phone(_number)?|numero_de_telephone|numero_de_portable|telephone|portable|mobile)$/],
  ['email', /^(e-?mail|e_mail|adresse_e-?mail|adresse_e_mail|courriel)$/],
]

// Champs techniques ajoutés par Meta, sans intérêt pour la commerciale
const IGNORES = new Set(['inbox_url'])

function roleDe(cle: string, type: string | undefined): Role | null {
  if (type && PAR_TYPE[type]) return PAR_TYPE[type]
  const c = sansAccents(cle)
  for (const [role, re] of PAR_NOM) if (re.test(c)) return role
  return null
}

// Réponses à choix : Meta renvoie la clé de l'option (« l'après-midi_(14h-18h) »), dont le
// texte affiché est dans la définition du formulaire. Sans définition, on nettoie la clé.
function valeurAffichee(v: string, q: MetaQuestion | undefined): string {
  const option = q?.options?.find(o => o.key === v)
  if (option?.value) return option.value
  if (q && (!q.options || q.options.length === 0)) return v // réponse libre : telle quelle
  return v.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

// Question d'horaire d'appel (« Quand préférez-vous être appelé(e) ? », « À quelle heure vous rappeler ? »)
// → « Préfère être appelé(e) ». Le mot d'horaire écarte « Acceptez-vous d'être rappelé(e) ? » ou « Comment vous appelez-vous ? ».
const QUESTION_HORAIRE_APPEL = /\b(quand|heure|horaire|moment|creneau|disponib)/
const MOT_APPELE = /appel|joindre/

function libelle(cle: string, label: string | undefined): string {
  const brut = (label ?? cle.replace(/_/g, ' ')).replace(/\s*\?\s*$/, '').trim()
  const c = sansAccents(brut)
  if (QUESTION_HORAIRE_APPEL.test(c) && MOT_APPELE.test(c)) return 'Préfère être appelé(e)'
  return brut.charAt(0).toUpperCase() + brut.slice(1)
}

export type LeadMetaLu = {
  nom: string | null
  telephone: string | null  // tel que saisi (à normaliser par l'appelant)
  email: string | null
  reponses: string[]        // autres questions : « Préfère être appelé(e) : l'après-midi (14h-18h) »
}

export function lireLeadMeta(fieldData: MetaFieldDatum[], questions: MetaQuestion[] = []): LeadMetaLu {
  const questionDe = new Map(questions.map(q => [q.key, q]))
  const contact: Partial<Record<Role, string>> = {}
  const reponses: string[] = []

  const pro: Partial<Record<Role, string>> = {}
  for (const f of fieldData) {
    const valeurs = (f.values ?? []).map(v => String(v).trim()).filter(Boolean)
    if (!f.name || valeurs.length === 0 || IGNORES.has(f.name)) continue
    const q = questionDe.get(f.name)
    const role = roleDe(f.name, q?.type)
    if (role) {
      const cible = q?.type?.startsWith('WORK_') ? pro : contact
      if (!cible[role]) cible[role] = valeurs[0]
      continue
    }
    reponses.push(`${libelle(f.name, q?.label)} : ${valeurs.map(v => valeurAffichee(v, q)).join(', ')}`.slice(0, 200))
  }
  for (const role of Object.keys(pro) as Role[]) if (!contact[role]) contact[role] = pro[role]

  const nom = contact.nomComplet?.replace(/\s+/g, ' ').trim()
    || [contact.prenom, contact.nomFamille].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    || null

  return {
    nom,
    telephone: contact.telephone ?? null,
    email: contact.email?.trim() || null,
    reponses,
  }
}
