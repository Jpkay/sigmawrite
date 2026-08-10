export type VocabularyEvidenceKind =
  | "exposure"
  | "help_lookup"
  | "recognition"
  | "meaning_recall"
  | "contextual_use"
  | "correct_spelling";

export type VocabularyEvidence = Record<VocabularyEvidenceKind, number> & {
  successfulProductionDates: string[];
};

export type VocabularyStatus = "new" | "review" | "maintenance";

export const EMPTY_VOCABULARY_EVIDENCE: VocabularyEvidence = {
  exposure: 0,
  help_lookup: 0,
  recognition: 0,
  meaning_recall: 0,
  contextual_use: 0,
  correct_spelling: 0,
  successfulProductionDates: [],
};

export function recordVocabularyEvidence(
  previous: VocabularyEvidence,
  kind: VocabularyEvidenceKind,
  input: { successful?: boolean; occurredAt: string },
): VocabularyEvidence {
  const base = { ...EMPTY_VOCABULARY_EVIDENCE, ...previous, successfulProductionDates: previous.successfulProductionDates ?? [] };
  const next = { ...base, [kind]: base[kind] + 1 };
  const productive = ["meaning_recall", "contextual_use", "correct_spelling"].includes(kind);
  if (!productive || !input.successful) return next;
  const day = input.occurredAt.slice(0, 10);
  return { ...next, successfulProductionDates: [...new Set([...base.successfulProductionDates, day])].sort() };
}

/** Exposure and help are deliberately excluded: mastery requires spaced typed production. */
export function vocabularyLearningState(evidence: VocabularyEvidence): {
  status: VocabularyStatus;
  mastery: number;
  productionDays: number;
} {
  const productionDays = evidence.successfulProductionDates.length;
  const hasMeaning = evidence.meaning_recall > 0;
  const hasUse = evidence.contextual_use > 0;
  const hasSpelling = evidence.correct_spelling > 0;
  const completeChannels = [hasMeaning, hasUse, hasSpelling].filter(Boolean).length;
  const mastery = productionDays < 2 ? 0 : Math.min(1, (productionDays / 3) * (completeChannels / 3));
  return {
    status: mastery >= 0.85 && productionDays >= 3 ? "maintenance" : productionDays > 0 ? "review" : "new",
    mastery: Number(mastery.toFixed(2)),
    productionDays,
  };
}

export type VocabularyReuseCandidate = {
  word: string;
  dueAt: string;
  relatedTopics: string[];
  status: VocabularyStatus;
};

export function planVocabularyReuse(candidates: VocabularyReuseCandidate[], topic: string, now: string) {
  const normalizedTopic = topic.toLocaleLowerCase("fr");
  return candidates
    .filter((candidate) => Date.parse(candidate.dueAt) <= Date.parse(now))
    .filter((candidate) => candidate.relatedTopics.some((related) => normalizedTopic.includes(related.toLocaleLowerCase("fr")) || related.toLocaleLowerCase("fr").includes(normalizedTopic)))
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
    .slice(0, 3)
    .map((candidate) => ({ ...candidate, presentation: "contextual_reappearance" as const, forced: false as const }));
}
