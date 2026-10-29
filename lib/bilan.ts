// =============================================================================
// Bilan Forme THE GYM (page publique /bilan) : questions, moteur de diagnostic
// et résultat personnalisé. Partagé page publique + API + CRM.
//
// Cible : des gens qui veulent perdre du poids, se remettre en forme ou se
// muscler, souvent pas sportifs. La personne décrit ce qu'elle fait (sa
// pratique, ce qui l'a freinée, comment elle se sent en salle…) et le moteur en
// déduit ce qui la freine VRAIMENT (1 principal + 2 secondaires max).
// Résultat court, droit au but : ce qui vous freine en une phrase, vos erreurs,
// ce qu'il faut mettre en place (chaque levier relié à THE GYM, sans redite),
// puis le plan à la salle (cours / musculation / cours doux) et la séance
// d'essai offerte, proposée tôt et en 3 champs.
//
// Faits sur la salle : site thegym07.fr (planning, cours, horaires) relevé le
// 22/10/2026. Rien d'autre n'est affirmé. Vouvoiement, formulations neutres
// (ni masculin ni féminin) : la salle est mixte.
// =============================================================================

export const INSTAGRAM = 'https://www.instagram.com/the.gym.rosieres/'

export type QuestionId =
  | 'objectif'
  | 'kilos'
  | 'pratique'
  | 'salle'
  | 'lache'
  | 'corps'
  | 'age'
  | 'envie'
  | 'creneaux'
export type Answers = Partial<Record<QuestionId, string | string[]>>

export interface Question {
  id: QuestionId
  title: string
  sub?: string
  multi?: boolean
  /** Libellé court dans la fiche CRM. */
  short: string
  options: { value: string; label: string }[]
  /** Question posée seulement si… */
  showIf?: (a: Answers) => boolean
}

export const QUESTIONS: Question[] = [
  {
    id: 'objectif',
    title: 'Quel est votre objectif ?',
    short: 'Objectif',
    options: [
      { value: 'perte', label: 'Perdre du poids' },
      { value: 'forme', label: 'Me remettre en forme, retrouver de l’énergie' },
      { value: 'muscle', label: 'Me muscler, me tonifier' },
      { value: 'mieux', label: 'Me sentir mieux : dos, souplesse, stress' },
    ],
  },
  {
    id: 'kilos',
    title: 'Combien de kilos aimeriez-vous perdre ?',
    short: 'Kilos',
    showIf: (a) => a.objectif === 'perte',
    options: [
      { value: 'lt5', label: 'Moins de 5 kg' },
      { value: '5_10', label: '5 à 10 kg' },
      { value: '10_20', label: '10 à 20 kg' },
      { value: 'gt20', label: 'Plus de 20 kg' },
    ],
  },
  {
    id: 'pratique',
    title: 'Le sport et vous, aujourd’hui ?',
    sub: 'Choisissez ce qui vous ressemble le plus',
    short: 'Pratique',
    options: [
      { value: 'jamais', label: 'Je n’en ai jamais vraiment fait' },
      { value: 'pause', label: 'J’ai arrêté depuis plusieurs mois (ou années)' },
      { value: 'periodes', label: 'J’en fais par périodes : à fond, puis plus rien' },
      { value: 'quand_temps', label: 'J’y vais quand j’ai le temps, sans régularité' },
      { value: 'stagne', label: 'Je m’entraîne régulièrement, mais je ne progresse plus' },
    ],
  },
  {
    id: 'salle',
    title: 'Dans une salle de sport, vous vous sentez…',
    short: 'En salle',
    options: [
      { value: 'jamais', label: 'Je n’y ai jamais mis les pieds' },
      { value: 'perdu', label: 'Je ne sais pas quoi faire, ni comment utiliser les machines' },
      { value: 'regard', label: 'Mal à l’aise : le regard des autres, la peur de mal faire' },
      { value: 'routine', label: 'À l’aise, mais je fais toujours la même chose' },
      { value: 'aise', label: 'À l’aise, je sais ce que je fais' },
    ],
  },
  {
    id: 'lache',
    title: 'Qu’est-ce qui vous a freiné jusqu’ici ?',
    sub: 'Plusieurs réponses possibles',
    multi: true,
    short: 'Ce qui freine',
    options: [
      { value: 'debut', label: 'Je ne sais pas par où commencer' },
      { value: 'motivation', label: 'La motivation retombe au bout de quelques semaines' },
      { value: 'temps', label: 'Le travail, la famille, le manque de temps' },
      { value: 'resultats', label: 'Je ne voyais pas de résultats' },
      { value: 'seul', label: 'Personne pour me guider ni me motiver' },
      { value: 'place', label: 'Je ne me sens pas à ma place en salle' },
      { value: 'douleur', label: 'Une douleur ou une blessure' },
    ],
  },
  {
    id: 'corps',
    title: 'Côté corps, en ce moment ?',
    sub: 'Plusieurs réponses possibles',
    multi: true,
    short: 'Corps',
    options: [
      { value: 'souffle', label: 'Je m’essouffle vite' },
      { value: 'dos', label: 'J’ai souvent mal au dos' },
      { value: 'articulations', label: 'Une douleur ou une ancienne blessure (genou, épaule…)' },
      { value: 'raide', label: 'Je me sens raide, je manque de souplesse' },
      { value: 'rien', label: 'Rien de particulier' },
    ],
  },
  {
    id: 'age',
    title: 'Vous avez…',
    short: 'Âge',
    options: [
      { value: 'lt30', label: 'Moins de 30 ans' },
      { value: '30_44', label: '30 à 44 ans' },
      { value: '45_59', label: '45 à 59 ans' },
      { value: '60p', label: '60 ans ou plus' },
    ],
  },
  {
    id: 'envie',
    title: 'Qu’est-ce qui vous donnerait envie de venir ?',
    short: 'Ce qui lui plaît',
    options: [
      { value: 'groupe', label: 'Un groupe, de la musique, un coach qui mène la séance' },
      { value: 'guide', label: 'Qu’on me dise quoi faire, pas à pas' },
      { value: 'progres', label: 'Voir mes progrès : plus fort, plus tonique' },
      { value: 'calme', label: 'Être tranquille, à mon rythme' },
      { value: 'doux', label: 'Du doux : souplesse, posture, respiration' },
    ],
  },
  {
    id: 'creneaux',
    title: 'Quand pourriez-vous venir ?',
    sub: 'Plusieurs réponses possibles',
    multi: true,
    short: 'Créneaux',
    options: [
      { value: 'tot', label: 'Tôt le matin, avant le travail' },
      { value: 'matinee', label: 'En matinée' },
      { value: 'midi', label: 'Le midi' },
      { value: 'soir', label: 'En fin de journée (17h-20h)' },
      { value: 'tard', label: 'Tard le soir' },
      { value: 'weekend', label: 'Le week-end' },
      { value: 'rien', label: 'Honnêtement, je ne vois pas quand' },
    ],
  },
]

/** Questions réellement posées, selon les réponses déjà données. */
export const questionsFor = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a))

export type ProfileId =
  | 'motivation'
  | 'savoir'
  | 'regard'
  | 'temps'
  | 'routine'
  | 'irregulier'
  | 'douleurs'
  | 'age'
  | 'reprise'

// name : libellé interne (CRM, pour la commerciale). problem : ce que la personne
// lit en tête de son bilan, en une phrase.
export const PROFILES: Record<ProfileId, { name: string; emoji: string; problem: string }> = {
  motivation: { name: 'La Motivation en dents de scie', emoji: '📉', problem: 'Tout repose sur votre motivation… et la motivation ne dure jamais.' },
  savoir: { name: 'Le Labyrinthe des machines', emoji: '🧭', problem: 'Vous ne savez pas par où commencer, alors vous ne commencez jamais vraiment.' },
  regard: { name: 'Le Regard des autres', emoji: '👀', problem: 'La peur du regard des autres vous empêche d’oser venir.' },
  temps: { name: 'L’Agenda plein', emoji: '⏱️', problem: 'Le sport attend « un moment de libre »… qui n’arrive jamais.' },
  routine: { name: 'Le Pilote automatique', emoji: '🔁', problem: 'Vous refaites les mêmes séances : votre corps ne change plus.' },
  irregulier: { name: 'Le Tout ou rien', emoji: '🎢', problem: 'Vous démarrez à fond… puis vous arrêtez tout.' },
  douleurs: { name: 'Le Corps qui proteste', emoji: '🩹', problem: 'Une douleur vous freine, alors vous bougez de moins en moins.' },
  age: { name: 'Le Corps qui a changé', emoji: '⏳', problem: 'Votre corps a changé : il lui faut une autre approche qu’à 25 ans.' },
  reprise: { name: 'Le Grand Retour', emoji: '🔄', problem: 'Après une longue pause, vous voulez reprendre trop vite.' },
}

export const isProfile = (v: unknown): v is ProfileId => typeof v === 'string' && v in PROFILES

const asList = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : v ? [v] : [])

/** « a, b et c ». */
function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

// --- Planning (thegym07.fr, relevé le 22/10/2026) ----------------------------

type Jour = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi'
export interface Cours { jour: Jour; heure: string; nom: string; espace: 'Fitness' | 'Training' }

const F = (jour: Jour, heure: string, nom: string): Cours => ({ jour, heure, nom, espace: 'Fitness' })
const T = (jour: Jour, heure: string, nom: string): Cours => ({ jour, heure, nom, espace: 'Training' })

export const PLANNING: Cours[] = [
  F('Lundi', '9h15', 'Tabata'), F('Mardi', '9h15', 'Body Barre'), F('Mercredi', '9h15', 'Tabata'),
  F('Jeudi', '9h15', 'CAF'), F('Vendredi', '9h15', 'Body Tonic'), F('Samedi', '9h15', 'CAF'),
  F('Lundi', '10h15', 'Stretching & mobilité'), F('Mardi', '10h15', 'Slow Yoga'), F('Mercredi', '10h15', 'Pilates'),
  F('Jeudi', '10h15', 'Hatha Yoga'), F('Vendredi', '10h15', 'Pilates'), F('Samedi', '10h15', 'Pilates'),
  F('Lundi', '17h30', 'CAF'), F('Mardi', '17h30', 'Mix Training'), F('Mercredi', '17h30', 'Burn calories'),
  F('Jeudi', '17h30', 'Tabata'),
  F('Lundi', '18h30', 'Body Barre'), F('Mardi', '18h30', 'Cardio Dance'), F('Jeudi', '18h30', '100% abdos'),
  F('Vendredi', '18h30', 'Swissball renfo'),
  F('Lundi', '19h30', 'Yoga Flow'), F('Mardi', '19h30', 'Stretching'), F('Jeudi', '19h30', 'Pilates'),
  T('Mardi', '17h30', 'TRX / WOD'), T('Vendredi', '17h30', 'Cross-training'),
  T('Mardi', '18h30', 'Biking'), T('Mercredi', '18h30', 'Cross-training'), T('Jeudi', '18h30', 'Biking'),
  T('Mercredi', '19h30', 'TRX / Renfo'),
]

/** En deux mots, ce que fait chaque cours (descriptions du site). */
const COURS_DESC: Record<string, string> = {
  Tabata: 'HIIT 20 s / 10 s pour brûler et renforcer',
  'Body Barre': 'renforcement global avec charges adaptées',
  CAF: 'cuisses, abdos, fessiers',
  'Body Tonic': 'renforcement + cardio, tout le corps',
  'Stretching & mobilité': 'souplesse et mobilité des articulations',
  Stretching: 'souplesse, moins de tensions',
  'Slow Yoga': 'force et souplesse, en douceur',
  Pilates: 'muscles profonds, posture, dos',
  'Hatha Yoga': 'postures et respiration',
  'Yoga Flow': 'enchaînements fluides, force et souplesse',
  'Mix Training': 'cardio et renforcement mélangés',
  'Burn calories': 'cardio + renfo pour un maximum de dépense',
  'Cardio Dance': 'chorégraphies cardio, on se défoule',
  '100% abdos': '30 minutes pour la sangle abdominale',
  'Swissball renfo': 'équilibre, gainage, muscles profonds',
  'TRX / WOD': 'sangles de suspension, entraînement fonctionnel',
  'TRX / Renfo': 'sangles de suspension, renforcement',
  'Cross-training': 'cardio, fonctionnel et musculation mélangés',
  Biking: 'vélo en musique, cardio et jambes',
}

// --- Moteur de diagnostic -----------------------------------------------------

/** Points apportés à chaque problème par chaque réponse. */
const SCORES: Partial<Record<QuestionId, Record<string, Partial<Record<ProfileId, number>>>>> = {
  objectif: {
    muscle: { routine: 1 },
    mieux: { douleurs: 1 },
  },
  pratique: {
    stagne: { routine: 5 },
    periodes: { irregulier: 5 },
    quand_temps: { irregulier: 2, temps: 3 },
    pause: { reprise: 4 },
    jamais: { savoir: 2, regard: 1, motivation: 1 },
  },
  salle: {
    perdu: { savoir: 4 },
    regard: { regard: 5 },
    routine: { routine: 3 },
    aise: { routine: 1 },
    jamais: { savoir: 2, regard: 2 },
  },
  lache: {
    debut: { savoir: 3 },
    motivation: { motivation: 3 },
    resultats: { routine: 2, motivation: 1 },
    temps: { temps: 3 },
    douleur: { douleurs: 3 },
    seul: { motivation: 3 },
    place: { regard: 3 },
  },
  corps: {
    dos: { douleurs: 4 },
    articulations: { douleurs: 4 },
    raide: { douleurs: 1, age: 1 },
    souffle: { reprise: 1 },
  },
  age: {
    '45_59': { age: 3 },
    '60p': { age: 5 },
  },
  creneaux: {
    rien: { temps: 4 },
  },
}

// En cas d'égalité, le problème le plus « bloquant » passe devant.
const PRIORITY: ProfileId[] = [
  'regard',
  'savoir',
  'douleurs',
  'reprise',
  'irregulier',
  'motivation',
  'routine',
  'temps',
  'age',
]

/** Problèmes détectés, du plus important au moins important. */
export function blockersOf(a: Answers): ProfileId[] {
  const score = Object.fromEntries(PRIORITY.map((p) => [p, 0])) as Record<ProfileId, number>
  for (const [qid, table] of Object.entries(SCORES) as [QuestionId, Record<string, Partial<Record<ProfileId, number>>>][]) {
    for (const v of asList(a[qid])) {
      for (const [p, pts] of Object.entries(table[v] ?? {}) as [ProfileId, number][]) score[p] += pts
    }
  }
  // Le corps qui change n'est un vrai sujet qu'à partir de 45 ans.
  if (a.age !== '45_59' && a.age !== '60p') score.age = 0
  // La reprise ne concerne que celles et ceux qui ont arrêté.
  if (a.pratique !== 'pause') score.reprise = 0

  const ranked = [...PRIORITY].sort((x, y) => score[y] - score[x])
  const top = score[ranked[0]]
  if (top === 0) return ['motivation']
  // Problèmes secondaires : au moins 3 points et 40 % du principal.
  return ranked.filter((p, i) => i === 0 || (score[p] >= 3 && score[p] * 5 >= top * 2)).slice(0, 3)
}

// --- Contenu du résultat ------------------------------------------------------

export interface Fix {
  /** Ce qu'il faut mettre en place (le « quoi »). */
  title: string
  /** Pourquoi et comment, en une ou deux phrases courtes. */
  text: string
  /** Comment THE GYM le met en place (le « comment »), en une phrase. */
  gym: string
}

export type Track = 'cours' | 'doux' | 'muscu'

export interface Plan {
  /** Recommandation principale, puis complément éventuel. */
  tracks: Track[]
  /** Cours conseillés sur ses créneaux (jour, heure, nom), 4 max. */
  cours: Cours[]
  /** Musculation en accès libre conseillée pour ses créneaux hors cours. */
  muscuHorsCours: boolean
  coaching: boolean
}

export interface BilanResult {
  profile: ProfileId
  secondaries: ProfileId[]
  errors: string[]
  fixes: Fix[]
  timeline: string | null
  plan: Plan
}

const TIMELINE_KG: Record<string, [string, string]> = {
  lt5: ['moins de 5 kg', '1 à 2 mois'],
  '5_10': ['5 à 10 kg', '2 à 4 mois'],
  '10_20': ['10 à 20 kg', '4 à 8 mois'],
  gt20: ['plus de 20 kg', '8 mois à un an'],
}

// Ordres de grandeur prudents (rythmes généraux, pas des résultats de la salle).
function timelineOf(a: Answers): string | null {
  switch (a.objectif) {
    case 'perte': {
      const t = TIMELINE_KG[a.kilos as string]
      return t
        ? `Pour perdre ${t[0]}, comptez de l’ordre de ${t[1]}, à raison de 0,5 à 1 kg par semaine. C’est le rythme d’une perte qui dure.`
        : 'Comptez de l’ordre de 0,5 à 1 kg par semaine : c’est le rythme d’une perte qui dure.'
    }
    case 'muscle':
      return 'Avec 2 à 3 séances par semaine, on se sent plus fort en quelques semaines, et ça commence à se voir après 2 à 3 mois.'
    case 'forme':
      return 'Avec 2 séances par semaine, la plupart des gens sentent la différence de souffle et d’énergie en 4 à 6 semaines.'
    case 'mieux':
      return 'Avec des séances douces et régulières, on se sent en général plus souple et plus détendu en quelques semaines.'
    default:
      return null
  }
}

// Cours les plus intenses : pas en premier pour un débutant, jamais avec une douleur.
const INTENSES = new Set(['Tabata', 'Cross-training', 'TRX / WOD'])

/** Cours conseillés selon l'objectif, le niveau et le corps (noms du planning). */
function coursConseilles(a: Answers, track: Track, detected: ProfileId[]): string[] {
  if (track === 'doux') return ['Pilates', 'Swissball renfo', 'Stretching & mobilité', 'Slow Yoga', 'Stretching', 'Hatha Yoga', 'Yoga Flow']
  const debutant = a.pratique === 'jamais' || a.pratique === 'pause' || detected.some((p) => p === 'regard' || p === 'savoir' || p === 'reprise')
  let list: string[]
  switch (a.objectif) {
    case 'perte':
      list = debutant
        ? ['Body Tonic', 'Cardio Dance', 'Burn calories', 'CAF', 'Biking', 'Mix Training']
        : ['Burn calories', 'Tabata', 'Biking', 'Cardio Dance', 'Cross-training', 'Mix Training']
      break
    case 'muscle':
      list = debutant
        ? ['Body Barre', 'CAF', 'TRX / Renfo', 'Body Tonic', '100% abdos']
        : ['Body Barre', 'Cross-training', 'TRX / WOD', 'TRX / Renfo', 'CAF', '100% abdos']
      break
    case 'mieux':
      list = ['Body Tonic', 'Swissball renfo', 'Pilates', 'Mix Training', 'CAF']
      break
    default:
      list = debutant
        ? ['Body Tonic', 'CAF', 'Cardio Dance', 'Mix Training', 'Biking']
        : ['Body Tonic', 'Cross-training', 'Cardio Dance', 'Mix Training', 'Biking', 'Tabata']
  }
  return detected.includes('douleurs') ? list.filter((n) => !INTENSES.has(n)) : list
}

const isMatin = (h: string) => h === '9h15' || h === '10h15'

function buildPlan(a: Answers, detected: ProfileId[]): Plan {
  const has = (p: ProfileId) => detected.includes(p)
  const w: Record<Track, number> = { cours: 0, doux: 0, muscu: 0 }
  const envie = a.envie as string | undefined
  if (envie === 'groupe') w.cours += 3
  if (envie === 'guide') w.cours += 2
  if (envie === 'progres') w.muscu += 3
  if (envie === 'calme') w.muscu += 3
  if (envie === 'doux') w.doux += 3
  if (has('regard')) w.cours += 2
  if (has('motivation')) w.cours += 2
  if (has('savoir')) w.cours += 1
  if (has('irregulier')) w.cours += 1
  if (has('routine')) w.muscu += 1
  if (has('temps')) w.muscu += 1
  if (has('douleurs')) w.doux += detected[0] === 'douleurs' ? 5 : 2
  if (has('age')) w.doux += 1
  if (a.objectif === 'muscle') w.muscu += 3
  if (a.objectif === 'perte') { w.cours += 1; w.muscu += 1 }
  if (a.objectif === 'forme') w.cours += 1
  if (a.objectif === 'mieux') w.doux += 2

  // À égalité, les cours doux passent devant quand la douleur est le problème principal.
  const order: Track[] = detected[0] === 'douleurs' ? ['doux', 'cours', 'muscu'] : ['cours', 'muscu', 'doux']
  const ranked = [...order].sort((x, y) => w[y] - w[x])
  const tracks: Track[] = [ranked[0]]
  if (w[ranked[1]] >= 2) tracks.push(ranked[1])

  // Cours sur ses créneaux : matinée → 9h15/10h15 (lun-sam), fin de journée → 17h30-19h30, week-end → samedi matin.
  const creneaux = asList(a.creneaux)
  const ok = (c: Cours) =>
    (creneaux.includes('matinee') && isMatin(c.heure) && c.jour !== 'Samedi') ||
    (creneaux.includes('soir') && !isMatin(c.heure)) ||
    (creneaux.includes('weekend') && c.jour === 'Samedi')
  // Un créneau par cours d'abord (de la variété), puis on complète jusqu'à 4.
  const cours: Cours[] = []
  const noms = tracks.filter((t) => t !== 'muscu').flatMap((t) => coursConseilles(a, t, detected))
  for (const unique of [true, false]) {
    for (const nom of noms) {
      for (const c of PLANNING.filter((c) => c.nom === nom && ok(c))) {
        if (cours.length >= 4 || cours.some((x) => x.jour === c.jour && x.heure === c.heure)) continue
        if (unique && cours.some((x) => x.nom === c.nom)) continue
        cours.push(c)
      }
    }
  }
  const order7 = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  cours.sort((x, y) => order7.indexOf(x.jour) - order7.indexOf(y.jour) || parseInt(x.heure) - parseInt(y.heure))

  // Créneaux sans cours (tôt, midi, tard) ou aucun créneau précis : la muscu en accès libre.
  const muscuHorsCours =
    tracks.includes('muscu') || creneaux.some((c) => c === 'tot' || c === 'midi' || c === 'tard' || c === 'rien') || creneaux.length === 0
  // Aucun cours sur ses créneaux (tôt, midi, tard) : la musculation passe devant.
  if (cours.length === 0 && creneaux.length > 0 && !creneaux.includes('rien')) {
    tracks.splice(0, tracks.length, 'muscu', ...tracks.filter((t) => t !== 'muscu').slice(0, 1))
  }

  const coaching = envie === 'guide' || has('douleurs') || (detected[0] === 'savoir' && envie !== 'groupe') || detected[0] === 'routine'
  return { tracks, cours, muscuHorsCours, coaching }
}

/** Résultat personnalisé à partir des réponses. */
export function buildResult(a: Answers): BilanResult {
  const ranked = blockersOf(a)
  const profile = ranked[0]
  const secondaries = ranked.slice(1, 3)
  const detected = [profile, ...secondaries]
  const lache = asList(a.lache)
  const corps = asList(a.corps)
  const creneaux = asList(a.creneaux)
  const over45 = a.age === '45_59' || a.age === '60p'
  const pain = corps.includes('dos') || corps.includes('articulations') || lache.includes('douleur')

  // --- Vos erreurs : une phrase courte chacune, celles de ses problèmes d'abord ---
  const errs: { tag: ProfileId; text: string }[] = []
  const err = (tag: ProfileId, text: string) => errs.push({ tag, text })
  if (a.salle === 'regard' || a.salle === 'jamais' || lache.includes('place'))
    err('regard', 'Attendre d’être « en forme » pour oser venir.')
  if (a.salle === 'perdu' || lache.includes('debut'))
    err('savoir', 'S’entraîner au hasard, sans plan clair.')
  if (a.pratique === 'periodes')
    err('irregulier', 'Démarrer trop fort, puis tout arrêter.')
  if (a.pratique === 'quand_temps' || lache.includes('temps') || creneaux.includes('rien'))
    err('temps', 'Attendre d’avoir le temps au lieu de bloquer un créneau.')
  if (a.pratique === 'stagne' || a.salle === 'routine')
    err('routine', 'Refaire toujours les mêmes séances.')
  if (lache.includes('motivation') || lache.includes('seul'))
    err('motivation', 'Compter sur la motivation pour tenir.')
  if (lache.includes('resultats'))
    err('routine', 'Juger ses progrès trop tôt, et arrêter juste avant qu’ils arrivent.')
  if (pain)
    err('douleurs', 'Arrêter de bouger à cause d’une douleur… ou forcer malgré elle.')
  if (a.pratique === 'pause')
    err('reprise', 'Vouloir reprendre au niveau d’avant.')
  if (over45)
    err('age', 'S’entraîner comme à 25 ans, ou ne plus oser forcer du tout.')
  if (a.pratique === 'jamais' && !lache.includes('debut'))
    err('motivation', 'Attendre le « bon moment » pour commencer.')
  const rank = (t: ProfileId) => (detected.includes(t) ? detected.indexOf(t) : 9)
  const errors = Array.from(
    new Set(
      errs
        .map((e, i) => ({ ...e, i }))
        .sort((x, y) => rank(x.tag) - rank(y.tag) || x.i - y.i)
        .map((e) => e.text),
    ),
  ).slice(0, 3)

  // --- Ce qu'il faut mettre en place : un levier par problème ---
  // Chaque fait sur la salle n'apparaît qu'à un seul endroit (ici ou dans le plan).
  const FIX: Record<ProfileId, Fix> = {
    motivation: {
      title: 'Remplacer la motivation par un rendez-vous',
      text: '2 séances fixes par semaine, quelqu’un qui mène, un groupe qui vous attend. La motivation suit, pas l’inverse.',
      gym: 'Vous réservez votre cours, le coach mène la séance : vous n’avez plus qu’à venir.',
    },
    savoir: {
      title: 'Avoir un plan clair dès la première séance',
      text: 'Quelques exercices de base, bien faits, dans le bon ordre. C’est tout ce qu’il faut pour démarrer.',
      gym: 'Votre séance d’essai se fait avec un coach : il vous montre les machines et par où commencer.',
    },
    regard: {
      title: 'Commencer avec un coach à vos côtés',
      text: 'On se sent à sa place quand on sait quoi faire. Ça vient en quelques séances, pas avant.',
      gym: 'Tous niveaux, sans jugement : en cours, chacun suit le coach à son rythme.',
    },
    temps: {
      title: 'Bloquer 2 créneaux courts',
      text: '45 minutes, deux fois par semaine, suffisent pour démarrer. Placez-les comme un rendez-vous.',
      gym: 'Musculation en accès libre 7j/7 de 5h à 23h : avant le travail, le midi ou tard le soir.',
    },
    routine: {
      title: 'Faire évoluer votre entraînement',
      text: 'Le corps change quand on lui en demande un peu plus : plus de charge, de nouveaux exercices.',
      gym: 'Les cours Training (TRX, Cross-training, Biking) pour casser la routine.',
    },
    irregulier: {
      title: 'Viser la régularité, pas l’intensité',
      text: '2 séances par semaine pendant 6 mois valent mieux que 5 séances pendant 3 semaines.',
      gym: 'Réservez vos 2 cours à l’avance : un cours réservé, on y va.',
    },
    douleurs: {
      title: 'Renforcer en douceur, sans forcer sur la douleur',
      text: 'Gainage, mobilité, renforcement progressif. Si la douleur persiste, demandez l’avis de votre médecin.',
      gym: 'Pilates, Swissball renfo, Stretching & mobilité : encadrés par des coachs diplômés.',
    },
    age: {
      title: 'Miser sur le renforcement, à bonne dose',
      text: 'Avec les années, garder son muscle devient la priorité : 2 séances progressives par semaine.',
      gym: 'Body Barre et renforcement accessibles à tous les niveaux, à votre rythme.',
    },
    reprise: {
      title: 'Reprendre par étapes',
      text: '2 à 3 semaines pour reprendre l’habitude, puis on augmente. Pas de record au début.',
      gym: 'Commencez par Body Tonic ou CAF, puis montez en intensité quand votre corps suit.',
    },
  }

  // Un levier lié à l'objectif quand il y en a peu, sans répéter un levier déjà affiché.
  const debutant = a.pratique === 'jamais' || a.pratique === 'pause'
  const OBJECTIF: Record<string, Fix & { saufSi?: ProfileId }> = {
    perte: {
      title: 'Combiner cardio et renforcement',
      text: 'Le cardio fait dépenser, le renforcement garde le muscle et affine la silhouette. Les deux ensemble, c’est ce qui marche.',
      gym: debutant ? 'Cardio Dance, Burn calories et Biking pour le cardio, Body Barre pour le renfo.' : 'Burn calories, Tabata et Biking pour le cardio, la musculation pour le renfo.',
    },
    forme: {
      title: 'Bouger 2 fois par semaine, en variant',
      text: 'Un peu de cardio pour le souffle, un peu de renfo pour le corps : c’est la base d’une forme qui revient.',
      gym: 'Body Tonic et Mix Training mélangent les deux en une seule séance.',
    },
    muscle: {
      title: 'Progresser en charge, pas à pas',
      text: '2 à 3 séances par semaine, avec des charges qui augmentent petit à petit, et du repos entre les deux.',
      gym: 'Body Barre et les cours Training complètent la musculation.',
      saufSi: 'routine',
    },
    mieux: {
      title: 'Allier mobilité et renforcement doux',
      text: 'Un peu de souplesse et de gainage chaque semaine : le corps se détend et se tient mieux.',
      gym: 'Pilates, Yoga et Stretching & mobilité, encadrés par nos coachs.',
      saufSi: 'douleurs',
    },
  }
  const fixes = detected.map((p) => FIX[p])
  const obj = OBJECTIF[a.objectif as string]
  if (obj && fixes.length < 3 && !(obj.saufSi && detected.includes(obj.saufSi))) fixes.push({ title: obj.title, text: obj.text, gym: obj.gym })

  return {
    profile,
    secondaries,
    errors,
    fixes,
    timeline: timelineOf(a),
    plan: buildPlan(a, detected),
  }
}

export const coursDesc = (nom: string) => COURS_DESC[nom] ?? ''

/** Libellé de la réponse à une question (fiche CRM). */
export function answerLabel(a: Answers, id: QuestionId, short = false): string | null {
  const q = QUESTIONS.find((x) => x.id === id)
  const labels = asList(a[id])
    .map((v) => q?.options.find((o) => o.value === v)?.label)
    .filter((l): l is string => !!l)
  if (!labels.length) return null
  return short ? labels.map((l) => l.split(/[,:(]/)[0].trim()).join(' · ') : labels.join(' · ')
}

/** Ne garde que des réponses connues (l'API reçoit du contenu public). */
export function sanitizeAnswers(input: unknown): Answers {
  const out: Answers = {}
  if (!input || typeof input !== 'object') return out
  const src = input as Record<string, unknown>
  for (const q of QUESTIONS) {
    const allowed = new Set(q.options.map((o) => o.value))
    const raw = src[q.id]
    if (q.multi) {
      const list = (Array.isArray(raw) ? raw : []).filter((v): v is string => typeof v === 'string' && allowed.has(v))
      if (list.length) out[q.id] = Array.from(new Set(list))
    } else if (typeof raw === 'string' && allowed.has(raw)) {
      out[q.id] = raw
    }
  }
  if (out.objectif !== 'perte') delete out.kilos
  return out
}

/** Ce qui est stocké sur le prospect (colonne `leads.diagnostic`). */
export interface BilanFiche {
  answers: Answers
  profile: ProfileId
  secondaries: ProfileId[]
  src: string | null
  at: string
  candidature?: { at: string; rappel?: string[] } | null
}

// --- Témoignages (vrais, publiés sur @the.gym.rosieres) ----------------------

export interface Testimonial {
  name: string
  result: string
  story: string
  quote?: string
  url: string
  /** Vidéo (reel) intégrable dans la page. */
  video: boolean
}

const TEMOIGNAGES = {
  priscillia: {
    name: 'Priscillia',
    result: '–8 kg et une nouvelle habitude',
    story: 'Elle avait peur du regard des autres et de ne pas être à la hauteur. Dès le premier jour, elle s’est sentie accueillie et à sa place : aujourd’hui, elle ne rate plus une séance.',
    quote: 'Je me sens tellement bien maintenant que j’ai envie de venir encore plus souvent !',
    url: 'https://www.instagram.com/reel/DM0IxjANQMN/',
    video: true,
  },
  olivier: {
    name: 'Olivier',
    result: 'Plus d’énergie et une vraie routine',
    story: 'Il voulait reprendre le sport, se sentir mieux dans son corps et retrouver un bon rythme. Aujourd’hui, il se sent bien dans sa peau, au travail comme à la maison.',
    url: 'https://www.instagram.com/reel/DNpkZ8GN0q8/',
    video: true,
  },
  doyenne: {
    name: 'Notre adhérente de 95 ans',
    result: '2 séances par semaine',
    story: 'Elle est venue pour son dos et pour retrouver de la force dans les jambes. Elle progresse séance après séance : la preuve qu’il n’y a pas d’âge pour s’y mettre.',
    url: 'https://www.instagram.com/p/CzBr9p_tAEZ/',
    video: false,
  },
} satisfies Record<string, Testimonial>

// --- Avis Google (vrais extraits, fiche « THE GYM Rosières », relevés le 22/10/2026) ---

export const GOOGLE = { note: '4,9', avis: 171, url: 'https://www.google.com/maps/place/THE+GYM+Rosi%C3%A8res/' }

interface Avis { name: string; text: string; tags: ProfileId[] }

const AVIS: Avis[] = [
  { name: 'Marine R.', text: 'Sans jugements. Des coaches qui s’adaptent parfaitement à tous les niveaux. Très bon accompagnement dans la pratique sportive.', tags: ['regard', 'savoir', 'reprise', 'douleurs'] },
  { name: 'Charlyne', text: 'Vous souhaitez vous remettre au sport, alors faîtes comme moi. Foncez chez The Gym à Rosières.', tags: ['reprise', 'motivation', 'irregulier'] },
  { name: 'Hélène B.', text: 'Elle est idéale pour s’entraîner seul ou pour suivre un cours collectif. Il y a une diversité de propositions et les coachs sont toujours à l’écoute et attentifs.', tags: ['savoir', 'routine', 'age', 'douleurs'] },
  { name: 'Jean-Louis C.', text: 'C’est un plaisir de s’y rendre plusieurs fois par semaine. On y entre froissé. On en ressort lessivé et repassé. Allez y !', tags: ['motivation', 'irregulier', 'temps', 'age'] },
  { name: 'Sandrine G.', text: 'Coachs très professionnels et très sympas. Cours collectifs au top. Super bonne ambiance.', tags: ['routine', 'motivation', 'savoir'] },
  { name: 'Ste F.', text: 'Une salle de sport superbe, des coach très sympas et très professionnels, des cours collectifs challengeant et chouettes! Bref, j’adore et je recommande!', tags: ['irregulier', 'temps', 'routine'] },
]

/** 2 avis Google proches de ses problèmes. */
export function pickAvis(a: Answers): Avis[] {
  const detected = blockersOf(a)
  const score = (v: Avis) => detected.reduce((s, p, i) => s + (v.tags.includes(p) ? 3 - i : 0), 0)
  return AVIS.map((v, i) => ({ v, i })).sort((x, y) => score(y.v) - score(x.v) || x.i - y.i).slice(0, 2).map((x) => x.v)
}

/** 2 témoignages : le plus proche de son problème principal, puis de sa situation. */
export function pickTestimonials(a: Answers): Testimonial[] {
  const [main] = blockersOf(a)
  const { priscillia, olivier, doyenne } = TEMOIGNAGES
  const corps = asList(a.corps)
  const senior = a.age === '60p' || main === 'age' || main === 'douleurs' || corps.includes('dos')
  const first = main === 'regard' || main === 'savoir' || a.objectif === 'perte' ? priscillia : olivier
  if (senior) return [doyenne, first]
  return first === priscillia ? [priscillia, olivier] : [olivier, priscillia]
}

/** Ligne de synthèse pour la commerciale : profil · objectif (kilos). */
export function bilanResume(fiche: Pick<BilanFiche, 'answers' | 'profile'>): string {
  const p = isProfile(fiche.profile) ? PROFILES[fiche.profile] : null
  const objectif = answerLabel(fiche.answers, 'objectif', true)
  const kilos = answerLabel(fiche.answers, 'kilos')
  return [p ? `${p.emoji} ${p.name}` : null, objectif && kilos ? `${objectif} (${kilos})` : objectif].filter(Boolean).join(' · ')
}
