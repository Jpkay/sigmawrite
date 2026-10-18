/**
 * Student-facing copy for word sessions (roadmap 2026-10 rules 3–4): warm,
 * short, never punitive. No overdue counts, lapses are "on le revoit",
 * reviews are "rappel éclair", returning words are celebrated.
 */
import { WORD_STATUS_LABELS } from "../word-status";
import type { WordStatus } from "../types";

export const WORD_SESSION_COPY = {
  title: "Rappel éclair",
  subtitle: "Quelques mots, une minute, et ta mémoire s’en souvient plus longtemps.",
  start: "C’est parti",
  backToPlan: "Retour au plan du jour",
  nothingToday: "Tes mots sont au chaud pour aujourd’hui.",
  nothingTodayHelp: "Ils reviendront juste au moment où ta mémoire en aura besoin.",
  holiday: "C’est les vacances : tes mots t’attendent tranquillement.",
  newWord: "Nouveau mot",
  metIn: "Tu l’as rencontré ici",
  meaning: "Ce que ça veut dire",
  example: "Un autre exemple",
  rebuild: "Remets les lettres dans l’ordre",
  rebuildHelp: "Touche les lettres une par une.",
  undo: "Effacer",
  hear: "Écoute et écris le mot",
  play: "Écouter",
  replay: "Réécouter",
  typeFromDefinition: "Quel mot correspond à cette définition ?",
  gap: "Écris le mot qui manque",
  miniDictation: "Mini-dictée : écoute chaque mot et écris-le",
  judge: (word: string) => `Dans quelle phrase « ${word} » est-il bien employé ?`,
  synonym: (word: string) => `Quel mot veut dire presque la même chose que « ${word} » ?`,
  antonym: (word: string) => `Quel mot veut dire le contraire de « ${word} » ?`,
  odd: "Trois mots vont ensemble. Lequel est l’intrus ?",
  explain: (word: string) => `Explique « ${word} » avec tes mots`,
  explainHelp: "Une phrase suffit. Pas besoin d’être parfait.",
  explainPlaceholder: "Ça veut dire…",
  pick: (word: string) => `Que veut dire « ${word} » ?`,
  answerLabel: "Ta réponse",
  check: "Vérifier",
  next: "Continuer",
  hint: "Un indice",
  hintFirstLetter: (letter: string) => `Il commence par « ${letter} ».`,
  hintLength: (letter: string, length: number) => `Il commence par « ${letter} » et a ${length} lettres.`,
  showWord: "Voir le mot",
  letters: (count: number) => `${count} lettres`,
  correct: ["Bien vu !", "Exact !", "Bravo !", "Parfait !", "Oui, c’est ça !"],
  accent: "Presque ! Regarde les accents :",
  near: "Tout près ! Regarde la partie en couleur :",
  wrong: "On le revoit dans un instant :",
  wrongChoice: "On le revoit dans un instant. La bonne réponse :",
  explainCorrect: "Tu as bien expliqué le mot.",
  explainPartial: "C’est en partie ça. Voici la définition complète :",
  explainWrong: "Pas tout à fait. Voici ce que ça veut dire :",
  explainUncertain: "Vérifions autrement, avec un choix :",
  introduced: (word: string) => `« ${word} » rejoint ton trésor de mots !`,
  rescued: (word: string) => `Tu as repêché « ${word} » !`,
  done: "Rappel terminé !",
  doneHelp: "Tes mots reviendront au bon moment.",
  wordsToday: (count: number) => (count === 1 ? "1 mot travaillé aujourd’hui" : `${count} mots travaillés aujourd’hui`),
  error: "Petit souci de connexion. Réessaie.",
  treasure: "Mon trésor de mots",
  treasureHelp: "Tous les mots que tu as rencontrés, rangés par centre d’intérêt.",
  treasureEmpty: "Ton trésor se remplit à chaque lecture. Lis un texte pour trouver tes premiers mots.",
  otherInterests: "Ailleurs",
  firstMet: "Rencontré dans :",
  optional: "Envie d’un rappel en plus ? C’est facultatif.",
} as const;

/** Chip labels in the ladder order (B.3). A lapse reads "On le revoit", never "oublié". */
export const TREASURE_STATUS_ORDER: WordStatus[] = ["ancre", "maitrise", "presque", "en_route", "a_revoir", "decouvert"];
export const statusLabel = (status: WordStatus) => WORD_STATUS_LABELS[status] ?? WORD_STATUS_LABELS.decouvert;

/** Deterministic praise so a reload shows the same words. */
export function praise(seed: string): string {
  let h = 0;
  for (const char of seed) h = (h * 31 + char.codePointAt(0)!) >>> 0;
  return WORD_SESSION_COPY.correct[h % WORD_SESSION_COPY.correct.length];
}
