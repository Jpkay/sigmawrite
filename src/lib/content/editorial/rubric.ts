import { z } from "zod";
import calibration from "./fixtures/ai-tells-calibration.json";
import { getStyleCard } from "./styles";

/**
 * Literary quality rubric (roadmap H.19), shared by every reviewer agent and by
 * the blind panel (H.12). Scores 1–5 per dimension. Anchors keep scores stable
 * across models and over time:
 *  - level 5: verbatim public-domain excerpts taken from the corpus (never typed by hand);
 *  - level 3: a real naive AI draft from the calibration fixtures;
 *  - level 1: an example written for this rubric (not attributed to anyone).
 */

export const RUBRIC_DIMENSIONS = [
  { key: "voice", label: "Voix", one: "Narrateur neutre, interchangeable, sans personnalité.", three: "Une voix perceptible mais intermittente, ou qui ne ressemble pas à la carte de style.", five: "Un narrateur reconnaissable de bout en bout, fidèle à la carte de style (humour, regard, rythme)." },
  { key: "concreteness", label: "Concret", one: "Généralités (« c'était beau », « une grande aventure »).", three: "Quelques détails précis noyés dans des formules générales.", five: "Des détails sensoriels précis et inattendus, propres à cet univers, à chaque paragraphe." },
  { key: "rhythm", label: "Rythme", one: "Phrases toutes pareilles, lecture monotone ou heurtée.", three: "Rythme correct mais prévisible.", five: "Phrases variées au service de l'action ; se lit à voix haute sans trébucher." },
  { key: "dialogue", label: "Dialogue", one: "Répliques explicatives, symétriques, qui disent les émotions.", three: "Répliques plausibles mais plates.", five: "Répliques vivantes, inégales, avec sous-entendus, justes pour l'âge et l'époque (ou absence de dialogue assumée par le style)." },
  { key: "showDontTell", label: "Montrer plutôt que dire", one: "Émotions nommées (« il était triste »).", three: "Mélange de gestes et d'émotions nommées.", five: "Les émotions passent uniquement par des gestes, des objets, des silences." },
  { key: "surprise", label: "Surprise", one: "Tout est attendu.", three: "Une idée un peu originale.", five: "Au moins une image ou un retournement vraiment inattendu." },
  { key: "noMoralizing", label: "Pas de morale", one: "Leçon explicite ou fin qui explique ce qu'il fallait comprendre.", three: "Fin un peu trop bouclée.", five: "Aucune leçon ; la fin s'arrête sur une image ou une réplique." },
  { key: "vocabulary", label: "Vocabulaire", one: "Pauvre, ou trop difficile pour l'âge ; mots cibles plaqués.", three: "Correct ; mots cibles visibles comme dans un exercice.", five: "Riche et adapté à l'âge ; les mots cibles arrivent naturellement, le contexte aide à les comprendre." },
  { key: "language", label: "Langue", one: "Fautes d'accord, de conjugaison ou de ponctuation.", three: "Une ou deux maladresses.", five: "Français correct et soigné (accords, ponctuation, typographie française)." },
] as const;

export type RubricKey = (typeof RUBRIC_DIMENSIONS)[number]["key"];
export const rubricScoresSchema = z.object(Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d.key, z.coerce.number().min(1).max(5)])) as Record<RubricKey, z.ZodCoercedNumber>);
export type RubricScores = z.infer<typeof rubricScoresSchema>;

/** Quality bars (roadmap: library ≥ 4.3, live ≥ 4.0). */
export const RUBRIC_BARS = { library: 4.3, live: 4.0 } as const;

export function rubricMean(scores: RubricScores): number {
  const values = RUBRIC_DIMENSIONS.map((d) => scores[d.key]);
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
}

/** A text passes only if the mean reaches the bar and no dimension is below 3 (language below 4 fails). */
export function rubricPasses(scores: RubricScores, bar: number): boolean {
  if (scores.language < 4) return false;
  if (RUBRIC_DIMENSIONS.some((d) => scores[d.key] < 3)) return false;
  return rubricMean(scores) >= bar;
}

const LEVEL_ONE_EXAMPLE = "Dans un monde où les rêves devenaient réalité, Lucas était un garçon courageux, gentil et curieux. Un jour, il décida de partir à l'aventure. Il était très excité. Soudain, il vit un dragon magnifique et mystérieux. « Bonjour, je suis un dragon », dit le dragon. « Bonjour, je suis Lucas », dit Lucas. Ils devinrent amis. Lucas comprit que l'amitié est la plus belle des richesses.";

export function rubricAnchors(): string {
  const five = [["renard", 2], ["colette", 1], ["daudet", 2]] as const;
  const fiveText = five.map(([key, index]) => {
    const card = getStyleCard(key);
    const excerpt = card.excerpts[index] ?? card.excerpts[0];
    return excerpt ? `— ${card.displayName}, ${excerpt.source} :\n« ${excerpt.text} »` : "";
  }).filter(Boolean).join("\n\n");
  const three = calibration.ai[2]?.text.split(/\n{2,}/u).slice(0, 2).join("\n\n") ?? "";
  return `ANCRES DE NOTATION (pour calibrer, ne jamais imiter mot pour mot)
Niveau 5 (extraits authentiques du domaine public) :
${fiveText}

Niveau 3 (brouillon d'IA typique : correct, fluide, mais prévisible, émotions nommées, images toutes faites) :
« ${three} »

Niveau 1 (exemple fabriqué pour cette grille) :
« ${LEVEL_ONE_EXAMPLE} »`;
}

export function rubricPrompt(): string {
  const lines = RUBRIC_DIMENSIONS.map((d) => `- ${d.key} (${d.label}) — 1 : ${d.one} · 3 : ${d.three} · 5 : ${d.five}`).join("\n");
  return `GRILLE LITTÉRAIRE (notes entières ou demi-points de 1 à 5) :\n${lines}\n\nSois exigeant : 5 est réservé à ce qu'un éditeur jeunesse publierait sans retouche ; un texte fluide mais générique vaut 3.`;
}
