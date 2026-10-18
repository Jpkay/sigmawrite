/**
 * Student-facing copy for "Tu es le héros" (roadmap H.1–H.6). French, warm,
 * short and never punitive (rule 4): no counts of missed days, no "wrong".
 * Pure module: safe in client and server components.
 */

export const STORY_COPY = {
  navLabel: "Mon aventure",
  eyebrow: "Tu es le héros",
  libraryTitle: "Ton aventure t’attend",
  libraryDescription: "Une histoire écrite pour toi, chapitre après chapitre. C’est toi qui choisis la suite.",
  resumeEyebrow: "Ton aventure en cours",
  resume: "Reprendre ma lecture",
  readToday: "Lire le chapitre du jour",
  pickerTitle: "Choisis ta prochaine aventure",
  pickerHelp: "Chaque histoire est écrite à la manière d’un auteur différent. Laquelle te tente ?",
  pickThis: "Je choisis celle-ci",
  shelfTitle: "Ta bibliothèque d’auteurs",
  shelfTerm: "Ce trimestre :",
  shelfTermUnit: "auteurs rencontrés",
  newStyle: "Nouvel auteur pour toi",
  endingInRecueil: "ta fin est dans ton recueil",
  reread: "Revoir",
  writeEnding: "Écrire ma fin",
  shelfEmpty: "Ta première aventure t’attend : chaque histoire te fera rencontrer un auteur.",
  completedTitle: "Tes aventures terminées",
  heroTitle: "Qui sera le héros ?",
  heroHelp: "Choisis un prénom ou un surnom, et ton avatar. Laisse vide si tu préfères que l’histoire te dise « tu ».",
  heroNameLabel: "Prénom ou surnom (facultatif)",
  heroNameHint: "Pas de nom de famille ni d’école : juste le nom de ton héros.",
  heroAvatarLabel: "Ton avatar",
  heroGenderLabel: "Dans l’histoire, ton héros est…",
  heroGender: { f: "une héroïne", m: "un héros", n: "comme tu veux (« tu »)" },
  start: "Commencer l’aventure",
  starting: "On ouvre le livre…",
  back: "Retour",
  writingTitle: "Ton aventure s’écrit…",
  writingHelp: "La plume cherche ses mots. Encore quelques secondes.",
  writingLonger: "La plume hésite entre deux idées… le chapitre arrive.",
  unavailableTitle: "Ce chapitre se fait attendre",
  unavailableHelp: "Il sera prêt un peu plus tard. Ton aventure t’attend exactement où tu l’as laissée.",
  retry: "Réessayer",
  chapter: (index: number, count: number) => `Chapitre ${index} sur ${count}`,
  whatNext: "Et maintenant, que fais-tu ?",
  taskEyebrow: "Avant d’ouvrir ce chemin",
  taskCorrect: "Bien vu !",
  taskGentle: (word: string, definition: string) => `Presque ! Ici, « ${word} » veut dire : ${definition}. On le revoit bientôt.`,
  comprehensionGentle: (answer: string, explanation: string | null) => `Presque ! ${explanation ?? `La réponse était : ${answer}.`} Ton chemin s’ouvre quand même.`,
  sceneBonusTitle: "Scène bonus débloquée",
  sceneBonusHelp: "Ta bonne réponse t’ouvre un petit moment en plus de l’histoire.",
  openNext: "Ouvrir la suite",
  opening: "La page se tourne…",
  finish: "Lire la fin de l’aventure",
  ratingLabel: "Ce chapitre t’a plu ?",
  ratings: { happy: "J’ai adoré", neutral: "Bof", sad: "Pas trop" },
  lockedTitle: "La suite s’ouvre demain",
  lockedHelp: "Comme un vrai feuilleton : un chapitre par jour. Ta mission du jour terminée t’offre un chapitre bonus.",
  lockedChoice: (label: string) => `Tu as choisi : ${label}`,
  lockedBack: "Retour à l’accueil",
  bonus: "Chapitre bonus : ta mission du jour l’a débloqué !",
  report: "Signaler ce texte",
  reportTitle: "Qu’est-ce qui ne va pas ?",
  reportReasons: {
    inappropriate: "Ça me met mal à l’aise",
    confusing: "Je ne comprends pas",
    error: "Il y a une erreur",
    boring: "C’est ennuyeux",
    other: "Autre chose",
  },
  reportNote: "Tu peux préciser (facultatif)",
  reportSend: "Envoyer",
  reportCancel: "Annuler",
  reportThanks: "Merci ! Une personne de l’équipe va relire ce passage.",
  reportError: "Ton signalement n’est pas parti. Réessaie dans un instant.",
  finaleEyebrow: "Fin de l’aventure",
  finaleTitle: "Tu as terminé ton aventure !",
  styleCardTitle: "Le secret de l’auteur",
  readTheReal: (name: string) => `Lis le vrai ${name}`,
  endingTitle: "Et si la fin était différente ?",
  endingHelp: "Écris ta propre fin. Utilise ces trois mots :",
  endingLabel: "Ta fin de l’histoire",
  endingChallenge: (manner: string) => `Je relève le défi : écrire ${manner}`,
  endingWords: (count: number, min: number, max: number) => `${count} mot${count > 1 ? "s" : ""} · entre ${min} et ${max}`,
  endingSave: "Ranger ma fin dans mon recueil",
  endingSaving: "On range ta fin…",
  endingSaved: "Ta fin est rangée dans ton recueil. Bravo, écrivain !",
  endingOpenRecueil: "Voir mon recueil",
  newAdventure: "Choisir une nouvelle aventure",
  homeEyebrow: "Ton aventure",
  homeStart: "Une histoire dont tu es le héros",
  homeStartHelp: "Choisis un thème que tu aimes : l’histoire s’écrit pour toi, et c’est toi qui décides de la suite.",
  homeStartCta: "Découvrir",
  homeReady: (index: number) => `Le chapitre ${index} est prêt`,
  homeLocked: "La suite s’ouvre demain",
  homeFinale: "Ta fin d’histoire t’attend",
  error: "Un souci technique. Réessaie dans un instant.",
} as const;

/** "à la manière de Jules Verne", "à la manière d’Alphonse Daudet", "à la manière d’un auteur…". */
export function mannerOf(name: string): string {
  const trimmed = name.trim();
  if (/^(?:la |le |les )/iu.test(trimmed)) return `à la manière ${trimmed.toLowerCase().startsWith("le ") ? `du ${trimmed.slice(3)}` : trimmed.toLowerCase().startsWith("les ") ? `des ${trimmed.slice(4)}` : `de ${trimmed}`}`;
  return /^[aeiouyàâäéèêëîïôöùûüœæh]/iu.test(trimmed) ? `à la manière d’${trimmed}` : `à la manière de ${trimmed}`;
}

export type StoryRating = "happy" | "neutral" | "sad";
export const STORY_RATINGS: ReadonlyArray<{ key: StoryRating; emoji: string }> = [
  { key: "happy", emoji: "😀" },
  { key: "neutral", emoji: "😐" },
  { key: "sad", emoji: "🙁" },
];

export type ReportReason = keyof typeof STORY_COPY.reportReasons;
export const REPORT_REASONS = Object.keys(STORY_COPY.reportReasons) as ReportReason[];
