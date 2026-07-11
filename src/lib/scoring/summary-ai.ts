import type { AIProvider } from "@/lib/ai/provider";
import { getAIProvider } from "@/lib/ai";
import { scoreSummary, type SummaryEval } from "./summary";

export type BlendedSummaryEval = SummaryEval & {
  heuristicScore: number;
  modelScore: number | null;
  modelScoreClamped: number | null;
  modelFlagged: boolean;
  rubric: { content: number | null; structure: number | null; language: number | null };
  source: "blended" | "heuristic_fallback";
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export async function scoreSummaryWithAI(input: {
  textBody: string;
  studentSummary: string;
  keywords: string[];
  minWords?: number;
  provider?: AIProvider;
  systemPrompt?: string;
}): Promise<BlendedSummaryEval> {
  const heuristic = scoreSummary(input.studentSummary, {
    keywords: input.keywords,
    minWords: input.minWords,
  });
  try {
    const model = await (input.provider ?? getAIProvider()).scoreSummary({
      textBody: input.textBody,
      studentSummary: input.studentSummary,
      rubric: "Évalue séparément contenu, structure et langue. Le score global reste un avis corroborant.",
    }, { systemPrompt: input.systemPrompt });
    const bounded = clamp(model.score, Math.max(0, heuristic.score - 25), Math.min(100, heuristic.score + 25));
    return {
      score: Math.round((heuristic.score + bounded) / 2),
      capturedMainIdea: heuristic.capturedMainIdea && model.capturedMainIdea,
      feedbackFr: model.feedbackFr || heuristic.feedbackFr,
      heuristicScore: heuristic.score,
      modelScore: model.score,
      modelScoreClamped: bounded,
      modelFlagged: Math.abs(model.score - heuristic.score) > 25,
      rubric: {
        content: model.contentScore ?? null,
        structure: model.structureScore ?? null,
        language: model.languageScore ?? null,
      },
      source: "blended",
    };
  } catch {
    return {
      ...heuristic,
      heuristicScore: heuristic.score,
      modelScore: null,
      modelScoreClamped: null,
      modelFlagged: true,
      rubric: { content: null, structure: null, language: null },
      source: "heuristic_fallback",
    };
  }
}
