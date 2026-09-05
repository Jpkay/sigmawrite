import type { AIProvider } from "@/lib/ai/provider";
import { getAIProvider } from "@/lib/ai";

/**
 * Rubric-grounded feedback on a free production (roadmap 5.3). The
 * deterministic score (target forms + grammar error rate + genre length band)
 * is the anchor; the model's score is clamped to ±25 of it and its comment
 * must name one priority only and cite rules solely from the vetted list
 * passed in. Anything else falls back to the deterministic feedback.
 */
export type ProductionRubricInput = {
  text: string;
  genreLabel: string;
  genreBrief: string;
  nodeLabel: string;
  rulePattern: string;
  demonstrated: boolean;
  grammarErrorCount: number;
  words: number;
  minimumWords: number;
  maximumWords: number;
  provider?: AIProvider;
};

export type ProductionRubric = {
  score: number;
  deterministicScore: number;
  modelScore: number | null;
  content: number | null;
  structure: number | null;
  language: number | null;
  priorityFr: string;
  praiseFr: string | null;
  source: "blended" | "deterministic";
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function deterministicProductionScore(input: Pick<ProductionRubricInput, "demonstrated" | "grammarErrorCount" | "words" | "minimumWords" | "maximumWords">): number {
  const errorRate = input.grammarErrorCount / Math.max(1, input.words);
  const language = clamp(100 - Math.round(errorRate * 1000), 0, 100);
  const target = input.demonstrated ? 100 : 40;
  const length = input.words >= input.minimumWords && input.words <= input.maximumWords ? 100 : 60;
  return Math.round(language * 0.5 + target * 0.3 + length * 0.2);
}

/** A priority sentence is acceptable only if it is short, single and cites nothing outside the vetted rule. */
export function priorityIsGrounded(priority: string, rulePattern: string, nodeLabel: string): boolean {
  if (priority.length < 15 || priority.length > 320) return false;
  const sentences = priority.split(/(?<=[.!?])\s+/u).filter(Boolean);
  if (sentences.length > 2) return false;
  const quoted = priority.match(/«\s*([^»]{3,})\s*»/gu) ?? [];
  const vetted = `${rulePattern} ${nodeLabel}`.toLocaleLowerCase("fr");
  return quoted.every((fragment) => vetted.includes(fragment.replace(/[«»]/gu, "").trim().toLocaleLowerCase("fr")));
}

export async function scoreProductionWithAI(input: ProductionRubricInput): Promise<ProductionRubric> {
  const deterministicScore = deterministicProductionScore(input);
  const fallbackPriority = !input.demonstrated
    ? `Une seule priorité : ${input.nodeLabel.toLocaleLowerCase("fr")}. ${input.rulePattern}`
    : input.grammarErrorCount > 0
      ? `Une seule priorité : relis pour corriger ${input.grammarErrorCount} point(s) de langue signalé(s).`
      : `Texte conforme au genre « ${input.genreLabel} » et à la compétence visée. Continue avec un texte plus long la prochaine fois.`;
  try {
    const model = await (input.provider ?? getAIProvider()).scoreSummary({
      textBody: `Genre attendu : ${input.genreLabel}. ${input.genreBrief}\nCompétence visée : ${input.nodeLabel}. Règle de référence : ${input.rulePattern}`,
      studentSummary: input.text,
      rubric: "Évalue le texte d’un collégien selon le genre attendu et la compétence visée. Donne contenu, structure et langue sur 100. Dans feedbackFr : une seule priorité d’amélioration en une ou deux phrases, formulée comme un conseil concret, sans énoncer d’autre règle que la règle de référence ; si tu cites une règle, cite la règle de référence entre « ». Pas de compliment générique : une remarque positive n’est permise que si elle désigne un passage précis du texte.",
    });
    const bounded = clamp(model.score, Math.max(0, deterministicScore - 25), Math.min(100, deterministicScore + 25));
    const grounded = priorityIsGrounded(model.feedbackFr ?? "", input.rulePattern, input.nodeLabel);
    return {
      score: Math.round((deterministicScore + bounded) / 2),
      deterministicScore,
      modelScore: model.score,
      content: model.contentScore ?? null,
      structure: model.structureScore ?? null,
      language: model.languageScore ?? null,
      priorityFr: grounded ? model.feedbackFr : fallbackPriority,
      praiseFr: null,
      source: "blended",
    };
  } catch {
    return { score: deterministicScore, deterministicScore, modelScore: null, content: null, structure: null, language: null, priorityFr: fallbackPriority, praiseFr: null, source: "deterministic" };
  }
}
