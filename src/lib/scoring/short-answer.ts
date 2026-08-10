const normalize = (value: string) => value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ").trim();

export type ShortAnswerCriterion = { label: string; conceptIds: string[]; points: number };

export function evaluateConceptAnswer(answer: string, acceptedConcepts: string[], criteria: ShortAnswerCriterion[]) {
  const normalized = normalize(answer);
  const matchedConcepts = acceptedConcepts.filter((concept) => {
    const tokens = normalize(concept).split(" ").filter((token) => token.length > 2);
    return tokens.length > 0 && tokens.every((token) => normalized.includes(token));
  });
  const matched = new Set(matchedConcepts);
  const earned = criteria.reduce((sum, criterion) => sum + (criterion.conceptIds.some((concept) => matched.has(concept)) ? criterion.points : 0), 0);
  const possible = criteria.reduce((sum, criterion) => sum + criterion.points, 0) || acceptedConcepts.length || 1;
  const score = Math.min(1, earned / possible);
  return { score: Number(score.toFixed(2)), pass: score >= 0.6, matchedConcepts };
}

export function scoreSeedQuestion(
  question: { answerFormat?: "multiple_choice" | "short_answer"; correctIndex?: number; acceptedConcepts?: string[]; scoringCriteria?: ShortAnswerCriterion[] },
  answer: number | string | undefined,
) {
  if (question.answerFormat === "short_answer") {
    if (typeof answer !== "string") return 0;
    return evaluateConceptAnswer(answer, question.acceptedConcepts ?? [], question.scoringCriteria ?? []).score;
  }
  return typeof answer === "number" && answer === question.correctIndex ? 1 : 0;
}
