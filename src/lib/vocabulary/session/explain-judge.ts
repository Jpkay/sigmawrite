/**
 * Constrained model check for "Explique avec tes mots" (D.5), behind the
 * provider layer. Kept free of server-only imports so the offline golden-set
 * evaluation (scripts/eval-word-explanations.mts) can use it too.
 */
import type { AIProvider } from "@/lib/ai/provider";
import type { Judge } from "./explain";

export const EXPLAIN_SYSTEM_PROMPT = [
  "Tu vérifies si un élève de 9 à 15 ans a compris le sens d’un mot français.",
  "Tu reçois le mot, sa définition validée, des reformulations acceptées et la réponse de l’élève.",
  "Juge uniquement le SENS, jamais l’orthographe ni la grammaire de l’élève.",
  "score : 80 à 100 si la réponse dit l’essentiel de la définition validée (même avec d’autres mots ou un synonyme juste) ;",
  "40 à 79 si elle est en partie juste (une partie du sens, un sens voisin, trop vague) ; 0 à 39 si elle est fausse ou contraire.",
  "capturedMainIdea : true seulement si tu es sûr de ton jugement. En cas de doute, mets false.",
  "feedbackFr : une courte phrase neutre. N’invente aucune autre définition que la définition validée.",
].join("\n");

export function judgeFromProvider(provider: AIProvider): Judge {
  return async (input) => {
    const result = await provider.scoreSummary({
      textBody: `Mot : ${input.word}\nDéfinition validée : ${input.definition}\nReformulations acceptées : ${input.accepted.join(" ; ") || "aucune"}`,
      studentSummary: input.answer,
      rubric: "Sens du mot uniquement.",
    }, { systemPrompt: EXPLAIN_SYSTEM_PROMPT });
    const verdict = result.score >= 80 ? "correct" : result.score >= 40 ? "partial" : "wrong";
    // The model must say it is sure; a borderline score is never decisive.
    const margin = verdict === "correct" ? (result.score - 80) / 20 : verdict === "wrong" ? (39 - result.score) / 39 : 0.5;
    return { verdict, confidence: result.capturedMainIdea || verdict === "wrong" ? 0.7 + 0.3 * Math.max(0, Math.min(1, margin)) : 0.5 };
  };
}
