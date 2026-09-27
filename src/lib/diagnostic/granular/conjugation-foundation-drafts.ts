/** Questions awaiting product-owner review, tied to existing approved evidence. */
export type ConjugationFoundationDraft = {
 key: string;
 nodeKey: "reconnaitre_present_indicatif" | "reconnaitre_radical_terminaison";
 prompt: string;
 answer: string;
 distractors: [string, string, string];
 reason: string;
};

const presentExamples: Array<[string, string, string, string, string]> = [
 ["draw", "Tu dessines une carte.", "Tu dessinais une carte.", "Tu dessineras une carte.", "Tu as dessiné une carte."],
 ["finish", "Nous finissons le puzzle.", "Nous finissions le puzzle.", "Nous finirons le puzzle.", "Nous avons fini le puzzle."],
 ["take", "Vous prenez le bus.", "Vous preniez le bus.", "Vous prendrez le bus.", "Vous avez pris le bus."],
 ["be", "Ils sont dans la cour.", "Ils étaient dans la cour.", "Ils seront dans la cour.", "Ils ont été dans la cour."],
 ["have", "Elle a une lampe.", "Elle avait une lampe.", "Elle aura une lampe.", "Elle a eu une lampe."],
 ["go", "Je vais au marché.", "J’allais au marché.", "J’irai au marché.", "Je suis allé au marché."],
 ["read", "Tu lis ce manga.", "Tu lisais ce manga.", "Tu liras ce manga.", "Tu as lu ce manga."],
 ["do", "Nous faisons une pause.", "Nous faisions une pause.", "Nous ferons une pause.", "Nous avons fait une pause."],
 ["come", "Vous venez au concert.", "Vous veniez au concert.", "Vous viendrez au concert.", "Vous êtes venus au concert."],
 ["write", "Elle écrit une chanson.", "Elle écrivait une chanson.", "Elle écrira une chanson.", "Elle a écrit une chanson."],
];
// Regular -er forms make the radical/ending boundary unambiguous; no claim
// about recognising an irregular verb's changing stems is attached to this pool.
const segmentationExamples: Array<[string, string, string, string, string]> = [
 ["chantons", "chant / ons", "chan / tons", "chanto / ns", "chanton / s"],
 ["parlez", "parl / ez", "par / lez", "parle / z", "pa / rlez"],
 ["jouais", "jou / ais", "jo / uais", "joua / is", "jouai / s"],
 ["marchait", "march / ait", "mar / chait", "marcha / it", "marchai / t"],
 ["dansions", "dans / ions", "dan / sions", "dansi / ons", "dansio / ns"],
 ["portiez", "port / iez", "por / tiez", "porti / ez", "portie / z"],
 ["regardons", "regard / ons", "regar / dons", "regardo / ns", "regardon / s"],
 ["dessinez", "dessin / ez", "dessi / nez", "dessine / z", "dess / inez"],
 ["lavions", "lav / ions", "la / vions", "lavi / ons", "lavio / ns"],
 ["trouvait", "trouv / ait", "trou / vait", "trouva / it", "trouvai / t"],
];
export const CONJUGATION_FOUNDATION_DRAFTS: readonly ConjugationFoundationDraft[] = [
 ...presentExamples.map(([key, answer, a, b, c]): ConjugationFoundationDraft => ({
  key: `present-${key}`, nodeKey: "reconnaitre_present_indicatif",
  prompt: "Quelle phrase contient un verbe au présent de l’indicatif ?",
  answer, distractors: [a,b,c],
  reason: "La réponse est au présent de l’indicatif. Les autres phrases sont à l’imparfait, au futur simple et au passé composé.",
 })),
 ...segmentationExamples.map(([form, answer, a, b, c]): ConjugationFoundationDraft => ({
  key: `segment-${form}`, nodeKey: "reconnaitre_radical_terminaison",
  prompt: `Dans « ${form} », où séparer le radical et la terminaison ? Le radical est la base du verbe ; la terminaison est la fin qui change avec la personne et le temps.`,
  answer, distractors: [a,b,c], reason: `La séparation attendue est ${answer}.`,
 })),
];
