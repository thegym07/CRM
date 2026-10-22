// =============================================================================
// Bilan Forme THE GYM (page publique /bilan) : questions, moteur de diagnostic
// et résultat personnalisé. Partagé page publique + API + CRM.
//
// La personne ne choisit pas son « profil » : elle décrit ce qu'elle fait (sa
// pratique, ce qui la fait lâcher, comment elle se sent en salle…) et le moteur
// en déduit son VRAI problème par un score (1 principal + 2 secondaires max).
// Le résultat lui renvoie ses propres mots, explique le mécanisme, liste ses
// erreurs, puis les leviers à mettre en place, chacun relié à THE GYM, et
// recommande cours collectifs / musculation / cours doux selon ce qu'elle aime.
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
  | 'rythme'
  | 'salle'
  | 'lache'
  | 'corps'
  | 'age'
  | 'assiette'
  | 'energie'
  | 'envie'
  | 'creneaux'
  | 'quand'
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
    title: 'Qu’est-ce qui vous amène, avant tout ?',
    short: 'Objectif',
    options: [
      { value: 'perte', label: 'Perdre du poids' },
      { value: 'muscle', label: 'Prendre du muscle, me sculpter' },
      { value: 'forme', label: 'Me remettre en forme, retrouver de l’énergie' },
      { value: 'mieux', label: 'Me sentir mieux : moins de douleurs, de stress, plus de souplesse' },
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
    title: 'Le sport et vous, en ce moment ?',
    short: 'Pratique',
    options: [
      { value: 'regulier', label: 'Je m’entraîne régulièrement' },
      { value: 'irregulier', label: 'J’en fais, mais pas régulièrement' },
      { value: 'pause', label: 'J’ai arrêté depuis plusieurs mois (ou années)' },
      { value: 'jamais', label: 'Je n’en ai jamais vraiment fait' },
    ],
  },
  {
    id: 'rythme',
    title: 'Quand vous vous mettez au sport, ça se passe plutôt comment ?',
    sub: 'Choisissez ce qui vous ressemble le plus',
    short: 'Rythme',
    options: [
      { value: 'fond', label: 'Je démarre à fond… puis j’arrête d’un coup' },
      { value: 'quand_temps', label: 'J’y vais quand j’ai le temps, sans vraie régularité' },
      { value: 'meme', label: 'J’y vais souvent, mais je fais toujours la même chose' },
      { value: 'hasard', label: 'Je fais un peu au hasard, sans savoir si c’est efficace' },
      { value: 'jamais', label: 'Je n’ai jamais vraiment réussi à m’y mettre' },
    ],
  },
  {
    id: 'salle',
    title: 'Dans une salle de sport, honnêtement, vous vous sentez…',
    short: 'En salle',
    options: [
      { value: 'perdu', label: 'Je ne sais pas quoi faire, ni comment utiliser les machines' },
      { value: 'regard', label: 'Mal à l’aise : le regard des autres, la peur de mal faire' },
      { value: 'routine', label: 'À l’aise, mais je tourne en rond' },
      { value: 'aise', label: 'À l’aise, je sais ce que je fais' },
      { value: 'jamais', label: 'Je n’y ai jamais mis les pieds' },
    ],
  },
  {
    id: 'lache',
    title: 'Les fois précédentes, qu’est-ce qui vous a fait arrêter ?',
    sub: 'Plusieurs réponses possibles',
    multi: true,
    short: 'Ce qui fait lâcher',
    options: [
      { value: 'motivation', label: 'La motivation est retombée au bout de quelques semaines' },
      { value: 'resultats', label: 'Je ne voyais pas de résultats' },
      { value: 'temps', label: 'Le travail, la famille, le manque de temps' },
      { value: 'douleur', label: 'Une douleur ou une blessure' },
      { value: 'seul', label: 'Personne pour me guider ni me motiver' },
      { value: 'place', label: 'Je ne me sentais pas à ma place' },
      { value: 'rien', label: 'Je n’ai jamais vraiment commencé' },
    ],
  },
  {
    id: 'corps',
    title: 'Côté corps, en ce moment ?',
    sub: 'Plusieurs réponses possibles',
    multi: true,
    short: 'Corps',
    options: [
      { value: 'dos', label: 'J’ai souvent mal au dos' },
      { value: 'articulations', label: 'Une douleur ou une ancienne blessure (genou, épaule…)' },
      { value: 'raide', label: 'Je me sens raide, je manque de souplesse' },
      { value: 'souffle', label: 'Je m’essouffle vite' },
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
    id: 'assiette',
    title: 'Et côté assiette ?',
    short: 'Assiette',
    options: [
      { value: 'ok', label: 'Je mange plutôt équilibré' },
      { value: 'craque', label: 'Je grignote ou je craque souvent' },
      { value: 'pouce', label: 'Je mange vite, ce qui est pratique' },
      { value: 'sais_pas', label: 'Je ne sais pas quoi manger pour mon objectif' },
      { value: 'bloque', label: 'Je fais attention… et pourtant rien ne bouge' },
    ],
  },
  {
    id: 'energie',
    title: 'Votre énergie, en ce moment ?',
    short: 'Énergie',
    options: [
      { value: 'fatigue', label: 'La fatigue est là presque tous les jours' },
      { value: 'stress', label: 'Le stress prend beaucoup de place' },
      { value: 'les_deux', label: 'Les deux' },
      { value: 'ok', label: 'Ça va plutôt bien' },
    ],
  },
  {
    id: 'envie',
    title: 'Qu’est-ce qui vous donne le plus envie de vous entraîner ?',
    short: 'Ce qui lui plaît',
    options: [
      { value: 'groupe', label: 'L’ambiance d’un groupe, la musique, un coach qui mène la séance' },
      { value: 'guide', label: 'Qu’on me dise quoi faire, pas à pas' },
      { value: 'progres', label: 'Voir mes progrès : plus lourd, plus fort, plus loin' },
      { value: 'calme', label: 'Être tranquille, à mon rythme, avec mes écouteurs' },
      { value: 'doux', label: 'Prendre soin de mon corps en douceur : souplesse, posture, respiration' },
    ],
  },
  {
    id: 'creneaux',
    title: 'Quand pourriez-vous venir vous entraîner ?',
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
  {
    id: 'quand',
    title: 'Quand aimeriez-vous commencer ?',
    short: 'Démarrage',
    options: [
      { value: 'now', label: 'Maintenant, j’en ai assez d’attendre' },
      { value: 'semaines', label: 'Dans les prochaines semaines' },
      { value: 'info', label: 'Je ne sais pas encore, je me renseigne' },
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
  | 'assiette'
  | 'douleurs'
  | 'age'
  | 'reprise'

export const PROFILES: Record<ProfileId, { name: string; emoji: string; pitch: string }> = {
  motivation: {
    name: 'La Motivation en dents de scie',
    emoji: '📉',
    pitch: 'Vous démarrez avec envie… puis la motivation retombe. Ce n’est pas un défaut : sans personne à ses côtés, presque tout le monde finit par lâcher.',
  },
  savoir: {
    name: 'Le Labyrinthe des machines',
    emoji: '🧭',
    pitch: 'Vous avez envie de bien faire, mais en salle, vous ne savez pas par où commencer. C’est le blocage le plus courant, et le plus simple à lever.',
  },
  regard: {
    name: 'Le Regard des autres',
    emoji: '👀',
    pitch: 'Ce n’est pas l’effort qui vous freine : c’est l’idée d’entrer dans une salle où tout le monde a l’air de savoir. Avec le bon cadre, ce malaise disparaît vite.',
  },
  temps: {
    name: 'L’Agenda plein',
    emoji: '⏱️',
    pitch: 'Vous avez envie de vous y mettre, mais vos journées sont déjà pleines. Il ne vous faut pas plus de temps : il vous faut un créneau qui tient.',
  },
  routine: {
    name: 'Le Pilote automatique',
    emoji: '🔁',
    pitch: 'Vous faites l’effort d’y aller, mais votre corps ne change plus. Il ne vous demande pas plus d’efforts : il vous demande du nouveau.',
  },
  irregulier: {
    name: 'Le Tout ou rien',
    emoji: '🎢',
    pitch: 'Quand vous y allez, c’est à fond… jusqu’au jour où tout s’arrête. Ce qui fait la différence, ce n’est pas l’intensité : c’est la régularité.',
  },
  assiette: {
    name: 'L’Assiette qui freine',
    emoji: '🍽️',
    pitch: 'Vous avez l’envie de bouger, mais votre assiette ne suit pas encore votre objectif. C’est souvent là que tout se joue.',
  },
  douleurs: {
    name: 'Le Corps qui proteste',
    emoji: '🩹',
    pitch: 'Un dos qui tire, une ancienne blessure, des raideurs : votre corps vous freine. Bien encadré, le renforcement se fait sans le brusquer.',
  },
  age: {
    name: 'Le Corps qui a changé',
    emoji: '⏳',
    pitch: 'Votre corps ne réagit plus comme avant. Ce n’est pas trop tard, loin de là : il a juste besoin d’une approche adaptée.',
  },
  reprise: {
    name: 'Le Grand Retour',
    emoji: '🔄',
    pitch: 'Le sport, vous connaissez. Mais après une longue pause, reprendre impressionne. Tout l’enjeu : bien redémarrer, sans vous blesser ni vous décourager.',
  },
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
    perte: { assiette: 1 },
    muscle: { routine: 1, assiette: 1 },
    mieux: { douleurs: 1 },
  },
  pratique: {
    regulier: { routine: 2 },
    irregulier: { irregulier: 2 },
    pause: { reprise: 4 },
    jamais: { savoir: 2, regard: 1 },
  },
  rythme: {
    fond: { irregulier: 4 },
    quand_temps: { irregulier: 2, temps: 2 },
    meme: { routine: 4 },
    hasard: { savoir: 3, routine: 1 },
    jamais: { motivation: 2, savoir: 1 },
  },
  salle: {
    perdu: { savoir: 4 },
    regard: { regard: 5 },
    routine: { routine: 3 },
    aise: { routine: 1 },
    jamais: { savoir: 2, regard: 2 },
  },
  lache: {
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
  assiette: {
    craque: { assiette: 3 },
    pouce: { assiette: 2, temps: 1 },
    sais_pas: { assiette: 3 },
    bloque: { assiette: 3, routine: 1 },
  },
  energie: {
    fatigue: { motivation: 1 },
    les_deux: { motivation: 1, irregulier: 1 },
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
  'assiette',
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
  // L'assiette pèse surtout quand on veut perdre du poids ou prendre du muscle.
  if (a.objectif !== 'perte' && a.objectif !== 'muscle') score.assiette = Math.min(score.assiette, 2)

  const ranked = [...PRIORITY].sort((x, y) => score[y] - score[x])
  const top = score[ranked[0]]
  if (top === 0) return ['motivation']
  // Problèmes secondaires : au moins 3 points et 40 % du principal.
  return ranked.filter((p, i) => i === 0 || (score[p] >= 3 && score[p] * 5 >= top * 2)).slice(0, 3)
}

// --- Contenu du résultat ------------------------------------------------------

// Ses réponses, reformulées.
const MIRROR: Partial<Record<QuestionId, Record<string, string>>> = {
  pratique: {
    irregulier: 'Vous faites du sport, mais pas de façon régulière.',
    pause: 'Vous avez arrêté le sport depuis plusieurs mois, voire plus.',
    jamais: 'Le sport n’a jamais vraiment fait partie de votre quotidien.',
  },
  rythme: {
    fond: 'Quand vous vous y mettez, vous démarrez à fond… puis vous arrêtez d’un coup.',
    quand_temps: 'Vous y allez quand vous avez le temps, sans vraie régularité.',
    meme: 'Vous y allez souvent, mais vous faites toujours un peu la même chose.',
    hasard: 'Vous vous entraînez un peu au hasard, sans savoir si c’est efficace.',
    jamais: 'Vous n’avez jamais vraiment réussi à vous y mettre.',
  },
  salle: {
    perdu: 'En salle, vous ne savez pas trop quoi faire, ni comment utiliser les machines.',
    regard: 'En salle, vous êtes mal à l’aise : le regard des autres, la peur de mal faire.',
    routine: 'En salle, vous êtes à l’aise… mais vous tournez en rond.',
    jamais: 'Vous n’avez jamais mis les pieds dans une salle de sport.',
  },
  lache: {
    motivation: 'Les fois précédentes, la motivation est retombée au bout de quelques semaines.',
    resultats: 'Vous avez déjà arrêté parce que les résultats ne venaient pas.',
    temps: 'Le travail, la famille et le manque de temps ont déjà eu raison de vos séances.',
    douleur: 'Une douleur ou une blessure vous a déjà fait arrêter.',
    seul: 'Vous n’aviez personne pour vous guider ni vous motiver.',
    place: 'Vous ne vous sentiez pas à votre place.',
  },
  corps: {
    dos: 'Vous avez souvent mal au dos.',
    articulations: 'Une douleur ou une ancienne blessure vous gêne encore.',
    raide: 'Vous vous sentez raide, vous manquez de souplesse.',
    souffle: 'Vous vous essoufflez vite.',
  },
  assiette: {
    craque: 'Côté assiette, vous grignotez ou vous craquez souvent.',
    pouce: 'Vous mangez vite, ce qui est pratique plutôt que ce qui vous aide.',
    sais_pas: 'Vous ne savez pas vraiment quoi manger pour votre objectif.',
    bloque: 'Vous faites attention à ce que vous mangez… et pourtant rien ne bouge.',
  },
  energie: {
    fatigue: 'La fatigue est là presque tous les jours.',
    stress: 'Le stress prend beaucoup de place en ce moment.',
    les_deux: 'Entre la fatigue et le stress, vous êtes pas mal à plat en ce moment.',
  },
  age: {
    '45_59': 'Et vous sentez que votre corps ne réagit plus tout à fait comme avant.',
    '60p': 'Et parfois, vous vous demandez s’il n’est pas un peu tard pour vous y mettre.',
  },
}

// Le mécanisme qui bloque, expliqué simplement.
const ROOT: Record<ProfileId, string> = {
  motivation:
    'Votre problème n’est pas un manque de volonté : c’est que tout repose sur votre motivation. Or la motivation monte et descend chez tout le monde, c’est normal. Les personnes qui tiennent ne sont pas plus motivées que vous : elles ont un rendez-vous fixe, quelqu’un qui les attend, et un cadre qui ne dépend pas de leur humeur du jour.',
  savoir:
    'Vous n’avez pas un problème d’envie, mais de repères. Quand on ne sait pas quoi faire en salle, on fait ce qu’on connaît, on tourne autour des mêmes machines, ou on n’ose pas y aller. Résultat : des séances qui n’avancent pas, et l’impression que « ce n’est pas pour vous ». Souvent, quelques séances bien guidées suffisent pour que tout devienne clair.',
  regard:
    'Ce qui vous retient n’a rien à voir avec vos capacités : c’est la peur du regard des autres et de ne pas être à la hauteur. C’est l’un des freins les plus fréquents, y compris chez des gens très sportifs. En réalité, en salle, chacun se concentre sur sa propre séance. Ce malaise se dissipe dès qu’on sait quoi faire et qu’on se sent à sa place, souvent en quelques séances seulement.',
  temps:
    'Votre problème n’est pas la motivation : c’est votre emploi du temps. Tant que le sport attend « un moment de libre », il passe après tout le reste. Ce qui marche, c’est l’inverse : choisir deux créneaux courts, aux heures où vous êtes vraiment disponible, et les traiter comme un rendez-vous.',
  routine:
    'Vous faites l’effort d’y aller, et c’est le plus dur. Mais votre corps s’est habitué : il s’adapte en quelques semaines à ce qu’on lui demande. Sans nouveauté, sans charge ni difficulté qui augmentent progressivement, il n’a plus de raison de changer. Ce n’est pas plus d’efforts qu’il vous faut : c’est un entraînement qui évolue.',
  irregulier:
    'Vous ne manquez pas d’énergie : vous la dépensez d’un coup. Démarrer à fond donne de vrais résultats… pendant trois semaines. Puis la fatigue, un imprévu ou une semaine chargée, et tout s’arrête. Le corps progresse avec la régularité, pas avec l’intensité : deux séances par semaine tenues pendant des mois valent bien plus que cinq séances pendant trois semaines.',
  assiette:
    'L’entraînement compte, mais pour votre objectif, l’assiette pèse lourd. Une séance de sport se « rattrape » très vite à table, sans même s’en rendre compte. Ce n’est pas une question de régime ni de privation : il s’agit d’avoir quelques repères simples, adaptés à votre objectif, pour que vos efforts en salle se voient enfin.',
  douleurs:
    'Une douleur ou une ancienne blessure crée souvent un cercle : on a peur de se faire mal, alors on bouge moins… et le corps perd en force et en mobilité, ce qui n’arrange rien. Le bon chemin passe en général par un renforcement progressif et encadré, qui ne force jamais sur la douleur. Et si elle persiste, l’avis de votre médecin ou d’un kiné reste le premier réflexe.',
  age:
    'Avec les années, on perd naturellement un peu de muscle et de souplesse, et le corps récupère moins vite. Ce n’est pas une raison de s’arrêter, c’est même la meilleure raison de s’y mettre : le renforcement musculaire, à bonne dose, aide à garder force, équilibre et énergie. Il faut simplement une approche adaptée, pas les méthodes qu’on suivait à 25 ans.',
  reprise:
    'Votre corps n’a pas oublié, il s’est déshabitué. Le piège de la reprise, c’est de vouloir repartir au niveau d’avant : courbatures, fatigue, parfois une petite blessure… et on arrête de nouveau. Une reprise réussie se fait par étapes : deux à trois semaines de remise en route, puis on accélère.',
}

export interface Fix {
  /** Le blocage auquel la carte répond, avec ses mots. */
  problem: string
  /** Ce qu'il faut mettre en place (le « quoi »). */
  title: string
  text: string
  /** Comment THE GYM le met en place (le « comment »). */
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
  mirror: string[]
  rootCause: string
  links: string[]
  errors: string[]
  fixes: Fix[]
  timeline: string | null
  plan: Plan
}

const TIMELINE_KG: Record<string, [string, string]> = {
  lt5: ['moins de 5 kg', 'quelques semaines à 2 mois'],
  '5_10': ['5 à 10 kg', '2 à 4 mois'],
  '10_20': ['10 à 20 kg', '4 à 8 mois'],
  gt20: ['plus de 20 kg', '8 mois à un an, parfois un peu plus'],
}

function timelineOf(a: Answers): string | null {
  switch (a.objectif) {
    case 'perte': {
      const t = TIMELINE_KG[a.kilos as string]
      return t
        ? `Une perte de poids durable tourne en général autour de 0,5 à 1 kg par semaine. Pour perdre ${t[0]}, comptez donc de l’ordre de ${t[1]}, avec un entraînement régulier et une alimentation adaptée. Chaque personne est différente : c’est un ordre de grandeur, pas une promesse.`
        : 'Une perte de poids durable tourne en général autour de 0,5 à 1 kg par semaine, avec un entraînement régulier et une alimentation adaptée. Chaque personne est différente : c’est un ordre de grandeur, pas une promesse.'
    }
    case 'muscle':
      return 'Avec 2 à 3 séances par semaine, on sent en général les premiers changements en quelques semaines (force, posture), et ils commencent à se voir après 2 à 3 mois de régularité. Chaque personne est différente : c’est un ordre de grandeur, pas une promesse.'
    case 'forme':
      return 'Avec 2 séances par semaine, la plupart des gens sentent une différence de souffle et d’énergie au bout de 4 à 6 semaines. Chaque personne est différente : c’est un ordre de grandeur, pas une promesse.'
    case 'mieux':
      return 'Avec des séances douces et régulières, beaucoup se sentent plus souples et plus détendus au bout de quelques semaines. En cas de douleur qui dure, demandez l’avis de votre médecin : on avance alors à votre rythme.'
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
  if (has('douleurs')) w.doux += detected[0] === 'douleurs' ? 4 : 2
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
  const tired = a.energie === 'fatigue' || a.energie === 'les_deux'
  const stressed = a.energie === 'stress' || a.energie === 'les_deux'
  const over45 = a.age === '45_59' || a.age === '60p'
  const foodIssue = ['craque', 'pouce', 'sais_pas', 'bloque'].includes(a.assiette as string)
  const pain = corps.includes('dos') || corps.includes('articulations') || lache.includes('douleur')

  // --- Ce que vous nous avez dit -------------------------------------------
  const mirror: string[] = []
  for (const qid of ['pratique', 'rythme', 'salle', 'lache', 'corps', 'assiette', 'energie', 'age'] as QuestionId[]) {
    for (const v of asList(a[qid]).slice(0, qid === 'lache' ? 2 : 1)) {
      const line = MIRROR[qid]?.[v]
      if (line) mirror.push(line)
    }
  }

  // --- Liens entre ses réponses -------------------------------------------
  const links: string[] = []
  if (tired && (profile === 'motivation' || profile === 'irregulier'))
    links.push('Et ce n’est pas un hasard si c’est dur de tenir : avec la fatigue que vous décrivez, chaque séance demande un effort de plus. C’est justement pour ça qu’un rendez-vous fixe, qui ne dépend pas de votre forme du jour, change tout.')
  else if (tired)
    links.push('Et la fatigue n’arrange rien : quand on est à plat, la séance passe toujours en dernier. Pourtant, bouger régulièrement est souvent ce qui aide le plus à retrouver de l’énergie.')
  if (stressed && !tired)
    links.push('Et le stress joue aussi : quand la tête est pleine, le sport passe en dernier, alors que c’est souvent ce qui aide le plus à décompresser.')
  if (lache.includes('seul') && profile !== 'motivation')
    links.push('Et ce n’est pas un hasard si vous avez lâché les fois précédentes : sans personne pour vous guider ni vous attendre, la moindre semaine chargée suffit à tout arrêter.')
  if (a.salle === 'perdu' && profile !== 'savoir')
    links.push('Et ne pas savoir quoi faire en salle n’aide pas : on y va beaucoup moins volontiers quand on n’a pas de plan.')
  if (a.pratique === 'pause' && corps.includes('souffle'))
    links.push('Et ce n’est pas un hasard si vous vous essoufflez vite : après une pause, le souffle est le premier à baisser… et aussi l’un des premiers à revenir.')
  if (over45 && profile !== 'age')
    links.push('À votre âge, le renforcement musculaire devient encore plus précieux : c’est lui qui aide à garder force, équilibre et énergie.')
  if (corps.includes('dos') && profile !== 'douleurs')
    links.push('Et votre dos doit faire partie du plan : un renforcement doux et bien guidé (gainage, posture, mobilité), sans jamais forcer sur la douleur.')
  if (foodIssue && a.objectif === 'perte' && profile !== 'assiette')
    links.push('Et pour perdre du poids, l’assiette compte autant que la salle : vos efforts doivent être soutenus par quelques repères simples à table.')

  // --- Vos erreurs (celles liées à ses problèmes d'abord) -------------------
  const errs: { tag: ProfileId; text: string }[] = []
  const err = (tag: ProfileId, text: string) => errs.push({ tag, text })
  if (a.rythme === 'fond')
    err('irregulier', 'Démarrer trop fort. Cinq séances la première semaine, plus rien la troisième : ni le corps ni l’emploi du temps ne suivent.')
  if (a.rythme === 'quand_temps' || a.pratique === 'irregulier' || lache.includes('temps'))
    err('temps', 'Attendre d’avoir le temps. Sans créneau fixe dans la semaine, la séance passe toujours après le reste.')
  if (creneaux.includes('rien'))
    err('temps', 'Croire qu’il faut de longues séances. 45 minutes, deux fois par semaine, suffisent pour bien démarrer.')
  if (a.rythme === 'meme' || a.salle === 'routine')
    err('routine', 'Refaire toujours les mêmes séances. Le corps s’habitue en quelques semaines : sans nouveauté ni progression, il ne change plus.')
  if (a.rythme === 'hasard' || a.salle === 'perdu')
    err('savoir', 'S’entraîner au hasard. Sans plan, on fait ce qu’on connaît… pas forcément ce qui sert votre objectif.')
  if (a.salle === 'regard' || a.salle === 'jamais' || lache.includes('place'))
    err('regard', 'Attendre d’être « en forme » pour oser venir. C’est l’inverse : on se sent à sa place après quelques séances, pas avant.')
  if (lache.includes('motivation') || lache.includes('seul'))
    err('motivation', 'Compter sur la motivation. Elle va et vient chez tout le monde : ce qui fait tenir, c’est un rendez-vous et un cadre.')
  if (lache.includes('resultats'))
    err('routine', 'Juger trop tôt. Les premiers changements se sentent avant de se voir : beaucoup arrêtent juste avant qu’ils apparaissent.')
  if (pain)
    err('douleurs', 'Arrêter de bouger à cause d’une douleur, ou forcer malgré elle. Les deux entretiennent le problème : il faut un renforcement progressif et adapté.')
  if (foodIssue && a.objectif === 'perte')
    err('assiette', 'Compter sur le sport seul pour perdre du poids. Sans ajuster un peu l’assiette, on compense souvent sans s’en rendre compte.')
  else if (foodIssue && a.objectif === 'muscle')
    err('assiette', 'Négliger l’assiette. Pour construire du muscle, il faut aussi manger assez, notamment des protéines.')
  else if (a.assiette === 'sais_pas')
    err('assiette', 'Manger « au feeling », sans repères adaptés à votre objectif.')
  if (a.pratique === 'pause')
    err('reprise', 'Vouloir reprendre au niveau d’avant. Après une longue pause, il faut quelques semaines de remise en route.')
  if (over45)
    err('age', 'S’entraîner comme à 25 ans… ou ne plus oser forcer du tout. Le bon dosage se situe entre les deux.')
  if (tired)
    err('motivation', 'Attendre d’avoir de l’énergie pour bouger. C’est souvent l’inverse : bouger régulièrement aide à en retrouver.')
  const rank = (t: ProfileId) => (detected.includes(t) ? detected.indexOf(t) : 9)
  const errors = errs
    .map((e, i) => ({ ...e, i }))
    .sort((x, y) => rank(x.tag) - rank(y.tag) || x.i - y.i)
    .slice(0, 4)
    .map((e) => e.text)

  // --- Ce que vous devez mettre en place (un levier par problème) -----------
  const dispo = creneaux.filter((c) => c !== 'rien')
  const DISPO: Record<string, string> = {
    tot: 'tôt le matin', matinee: 'en matinée', midi: 'le midi', soir: 'en fin de journée', tard: 'tard le soir', weekend: 'le week-end',
  }
  const dispoText = dispo.length ? ` (pour vous : ${joinFr(dispo.map((c) => DISPO[c]))})` : ''

  const FIX: Record<ProfileId, Fix> = {
    motivation: {
      problem: '« Ma motivation retombe »',
      title: 'Ne plus dépendre de votre motivation',
      text: 'Remplacez la motivation par un cadre : 2 rendez-vous fixes par semaine, quelqu’un qui mène la séance, et des gens qui vous attendent. La motivation finit par suivre, pas l’inverse.',
      gym: 'Plus de 30 h de cours collectifs par semaine, encadrés par nos coachs diplômés : vous réservez votre place, le coach mène la séance, le groupe vous entraîne. Vous n’avez plus qu’à venir.',
    },
    savoir: {
      problem: '« Je ne sais pas quoi faire en salle »',
      title: 'Avoir un plan clair, dès la première séance',
      text: 'Avant de chercher à en faire plus, sachez quoi faire : quelques exercices de base bien maîtrisés, dans le bon ordre, adaptés à votre objectif. C’est ce qui transforme une séance « au hasard » en séance utile.',
      gym: 'Votre séance d’essai se fait avec un coach : il vous montre les machines, les bons gestes et par où commencer. Et en cours collectif, vous n’avez rien à prévoir : le coach vous guide du début à la fin, à votre niveau.',
    },
    regard: {
      problem: '« J’ai peur du regard des autres »',
      title: 'Commencer dans un cadre où vous vous sentez à votre place',
      text: 'Le malaise disparaît avec les repères : savoir quoi faire, avoir quelqu’un pour vous guider, voir que d’autres débutent aussi. Commencez avec quelqu’un à vos côtés, plutôt qu’en solo au milieu des machines.',
      gym: 'Ici, tous les niveaux sont bienvenus, sans jugement. En cours collectif, chacun suit le coach à son rythme. Et pour la musculation, la salle est ouverte de 5h à 23h : vous pouvez aussi venir aux heures calmes.',
    },
    temps: {
      problem: '« Je n’ai pas le temps »',
      title: 'Bloquer 2 créneaux courts, aux bonnes heures',
      text: `Pas besoin d’y passer des heures : 2 séances de 45 minutes par semaine suffisent pour démarrer. Le secret, c’est de les placer là où vous êtes vraiment disponible${dispoText}, et de les traiter comme un rendez-vous.`,
      gym: 'La musculation est en accès libre 7j/7, de 5h à 23h : avant le travail, le midi ou tard le soir. Et les cours ont lieu en matinée (9h15, 10h15) et en fin de journée (17h30, 18h30, 19h30).',
    },
    routine: {
      problem: '« Je stagne »',
      title: 'Faire évoluer votre entraînement',
      text: 'Pour que le corps continue de changer, il faut lui en demander un peu plus, progressivement : des charges ou une difficulté qui augmentent, de nouveaux exercices, un programme qui change régulièrement.',
      gym: 'Un plateau de musculation complet (machines, poids libres) pour faire progresser vos charges, et les cours Training (TRX, Cross-training, Biking) pour bousculer vos habitudes. Envie d’un programme construit pour vous ? Nos coachs proposent aussi du coaching individuel.',
    },
    irregulier: {
      problem: '« C’est tout ou rien »',
      title: 'Viser la régularité plutôt que l’intensité',
      text: 'Mieux vaut 2 séances par semaine pendant 6 mois que 5 séances pendant 3 semaines. Commencez plus doucement que vous ne le voudriez, et gardez le même rythme, même les semaines chargées.',
      gym: 'Réservez vos 2 cours de la semaine à l’avance : un cours réservé, c’est un rendez-vous qu’on tient. Et les semaines chargées, la salle reste ouverte de 5h à 23h pour caser une séance courte.',
    },
    assiette:
      a.objectif === 'muscle'
        ? {
            problem: '« Mon assiette ne suit pas »',
            title: 'Manger assez pour construire du muscle',
            text: 'Le muscle se construit à l’entraînement… et à table : des protéines à chaque repas, et assez à manger pour soutenir vos séances. Sans ça, vos efforts en salle ne donnent pas tout ce qu’ils pourraient.',
            gym: 'La musculation et les cours Body Barre ou Cross-training donnent à votre corps une vraie raison de construire du muscle. Et votre séance d’essai est le bon moment pour en parler avec un coach.',
          }
        : {
            problem: '« Mon assiette ne suit pas »',
            title: 'Quelques repères simples à table, sans régime',
            text: 'Pas de privation ni d’aliments interdits : des repas qui calent (protéines, légumes), moins de grignotage et des quantités adaptées. C’est ce qui permet à vos efforts en salle de se voir.',
            gym: 'Côté entraînement, les cours Burn calories, Cardio Dance et Biking font grimper votre dépense, et la musculation aide à garder votre muscle pendant que vous perdez du poids. Votre séance d’essai est aussi le bon moment pour en parler avec un coach.',
          },
    douleurs: {
      problem: corps.includes('dos') ? '« J’ai mal au dos »' : '« Une douleur me freine »',
      title: 'Renforcer en douceur, sans forcer sur la douleur',
      text: 'Le gainage, la mobilité et un renforcement progressif sont souvent la meilleure base, à condition de ne jamais forcer sur la douleur. Si elle persiste, demandez l’avis de votre médecin ou d’un kiné avant de reprendre.',
      gym: 'Pilates, Swissball renfo, Stretching & mobilité, Yoga : des cours doux, encadrés par des coachs diplômés, pour renforcer en profondeur et gagner en mobilité. Signalez votre douleur au coach dès la première séance.',
    },
    age: {
      problem: '« Mon corps a changé »',
      title: 'Miser sur le renforcement musculaire, à bonne dose',
      text: 'Avec les années, garder son muscle devient la priorité : 2 séances de renforcement par semaine, progressives, complétées par de la mobilité. C’est ce qui aide à garder force, souplesse et énergie.',
      gym: 'Body Barre, Pilates, Swissball renfo, Stretching & mobilité… et la musculation, à votre rythme. L’une de nos adhérentes a 95 ans et s’entraîne deux fois par semaine : il n’y a pas d’âge pour commencer.',
    },
    reprise: {
      problem: '« Je reprends après une longue pause »',
      title: 'Reprendre par étapes',
      text: 'Les 2 à 3 premières semaines, l’objectif est simple : reprendre l’habitude, pas battre des records. Des séances modérées, deux fois par semaine, puis on augmente progressivement.',
      gym: 'Commencez par des cours accessibles comme Body Tonic, CAF ou Stretching, à votre rythme, puis passez à la musculation ou aux cours Training quand votre corps suit.',
    },
  }

  return {
    profile,
    secondaries,
    mirror,
    rootCause: ROOT[profile],
    links: links.slice(0, 2),
    errors,
    fixes: detected.map((p) => FIX[p]),
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

// --- Rappel par la commerciale ----------------------------------------------

export const RAPPEL: { value: string; label: string }[] = [
  { value: 'matin', label: 'Le matin (9h-12h)' },
  { value: 'midi', label: 'Le midi (12h-14h)' },
  { value: 'aprem', label: 'L’après-midi (14h-17h)' },
  { value: 'soir', label: 'En fin de journée (17h-19h30)' },
]

/** Ce qui est stocké sur le prospect (colonne `leads.diagnostic`). */
export interface BilanFiche {
  answers: Answers
  profile: ProfileId
  secondaries: ProfileId[]
  src: string | null
  at: string
  candidature?: { at: string; rappel: string[] } | null
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
  { name: 'Sandrine G.', text: 'Coachs très professionnels et très sympas. Cours collectifs au top. Super bonne ambiance.', tags: ['routine', 'assiette', 'motivation'] },
  { name: 'Ste F.', text: 'Une salle de sport superbe, des coach très sympas et très professionnels, des cours collectifs challengeant et chouettes! Bref, j’adore et je recommande!', tags: ['irregulier', 'assiette', 'temps'] },
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
  const first = main === 'regard' || main === 'savoir' || main === 'assiette' || a.objectif === 'perte' ? priscillia : olivier
  if (senior) return [doyenne, first]
  return first === priscillia ? [priscillia, olivier] : [olivier, priscillia]
}

/** Ligne de synthèse pour la commerciale : profil · objectif · démarrage. */
export function bilanResume(fiche: Pick<BilanFiche, 'answers' | 'profile'>): string {
  const p = isProfile(fiche.profile) ? PROFILES[fiche.profile] : null
  const objectif = answerLabel(fiche.answers, 'objectif', true)
  const quand = ({ now: 'veut commencer maintenant', semaines: 'dans les semaines à venir', info: 'se renseigne' } as Record<string, string>)[
    fiche.answers.quand as string
  ]
  return [p ? `${p.emoji} ${p.name}` : null, objectif, quand].filter(Boolean).join(' · ')
}

/** Créneaux de rappel lisibles (« le matin, en fin de journée »). */
export const rappelLabel = (values: string[]) =>
  joinFr(values.map((v) => RAPPEL.find((r) => r.value === v)?.label.split(' (')[0].toLowerCase()).filter((l): l is string => !!l))
