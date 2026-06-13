/**
 * Deterministic summary scorer (PRD §K summarization). Phase 1 uses a
 * transparent heuristic; Phase 2 swaps in AIProvider.scoreSummary for
 * rubric-based feedback. Kept pure so it is unit-testable (PRD §26).
 */
export type SummaryEval = {
  score: number; // 0–100
  capturedMainIdea: boolean;
  feedbackFr: string;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function scoreSummary(
  text: string,
  opts: { keywords: string[]; minWords?: number }
): SummaryEval {
  const minWords = opts.minWords ?? 12;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hay = normalize(text);
  const hits = opts.keywords.filter((k) => hay.includes(normalize(k)));
  const keywordRatio = opts.keywords.length
    ? hits.length / opts.keywords.length
    : 1;

  if (wordCount < 5) {
    return {
      score: 20,
      capturedMainIdea: false,
      feedbackFr: "Ton résumé est trop court. Essaie d'écrire au moins deux phrases.",
    };
  }

  // Length component (caps once long enough) + concept-coverage component.
  const lengthScore = Math.min(1, wordCount / minWords) * 40;
  const conceptScore = keywordRatio * 60;
  const score = Math.round(lengthScore + conceptScore);
  const capturedMainIdea = keywordRatio >= 0.5;

  let feedbackFr: string;
  if (score >= 80) feedbackFr = "Bon résumé : tu as gardé l'idée principale.";
  else if (capturedMainIdea)
    feedbackFr = "Tu tiens l'idée principale. Sois un peu plus précis sur les détails clés.";
  else
    feedbackFr =
      "Pense à inclure l'idée principale du texte et les mots-clés importants.";

  return { score, capturedMainIdea, feedbackFr };
}
