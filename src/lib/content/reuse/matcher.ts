export type ReuseContract = {
  releases: { taxonomyReleaseId: string; lexicalReleaseId: string };
  topic: { interestId?: string };
  content: { textType?: string; lengthWords: { min: number; max: number } };
  difficulty: {
    predictedSuccess: { min: number; max: number };
    knownVocabularyCoverageMin: number;
  };
  competencies: { targetIds: string[] };
  constructions: { targetIds: string[] };
  conjugation: { targetTenses: string[]; excludedTenses: string[] };
  concepts: { requiredIds: string[] };
};

export type ReusablePassage = {
  versionId: string;
  status: "draft" | "approved" | "published" | "retired";
  qaStatus: "pending" | "passed" | "failed";
  taxonomyReleaseId: string;
  lexicalReleaseId: string;
  predictedSuccess: number;
  knownVocabularyCoverage: number;
  wordCount: number;
  competencyIds: string[];
  constructionIds: string[];
  tenseIds: string[];
  conceptIds: string[];
  topicSimilarity: number;
  riskClass: "low" | "medium" | "high";
  sourceVerified: boolean;
  interestKey?: string | null;
  textType?: string | null;
  lastUsedAt?: string;
};

export type ReuseWeights = {
  competencies: number;
  constructions: number;
  tenses: number;
  concepts: number;
  difficulty: number;
  lexical: number;
  topic: number;
};

export type ReusePolicy = {
  minimumScore: number;
  recentExclusionDays: number;
  maximumCandidates: number;
  weights: ReuseWeights;
};

export const DEFAULT_REUSE_WEIGHTS: ReuseWeights = {
  competencies: .28,
  constructions: .16,
  tenses: .16,
  concepts: .10,
  difficulty: .16,
  lexical: .09,
  topic: .05,
};

export const DEFAULT_REUSE_POLICY: ReusePolicy = {
  minimumScore: .78,
  recentExclusionDays: 30,
  maximumCandidates: 10,
  weights: DEFAULT_REUSE_WEIGHTS,
};

const coverage = (needed: string[], actual: string[]) =>
  needed.length ? needed.filter((id) => actual.includes(id)).length / needed.length : 1;

function normalizedWeights(weights: ReuseWeights): ReuseWeights {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return DEFAULT_REUSE_WEIGHTS;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.max(0, value) / total]),
  ) as ReuseWeights;
}

export function matchReusablePassage(
  contract: ReuseContract,
  passages: ReusablePassage[],
  now: string,
  recentVersionIds: string[],
  policy: ReusePolicy = DEFAULT_REUSE_POLICY,
) {
  const excluded: Record<string, string[]> = {};
  const recent = new Set(recentVersionIds);
  const cutoff = Date.parse(now) - policy.recentExclusionDays * 86_400_000;
  const weights = normalizedWeights(policy.weights);
  const eligible = passages.filter((passage) => {
    const reasons: string[] = [];
    if (passage.status !== "published") reasons.push("not_published");
    if (passage.qaStatus !== "passed") reasons.push("qa_not_passed");
    if (passage.taxonomyReleaseId !== contract.releases.taxonomyReleaseId) reasons.push("taxonomy_release_mismatch");
    if (passage.lexicalReleaseId !== contract.releases.lexicalReleaseId) reasons.push("lexical_release_mismatch");
    if (passage.riskClass === "high" && !passage.sourceVerified) reasons.push("unverified_high_risk");
    if (recent.has(passage.versionId) || (passage.lastUsedAt && Date.parse(passage.lastUsedAt) >= cutoff)) reasons.push("recent_repetition");
    if (passage.wordCount < contract.content.lengthWords.min || passage.wordCount > contract.content.lengthWords.max) reasons.push("length_outside_contract");
    if (passage.knownVocabularyCoverage < contract.difficulty.knownVocabularyCoverageMin) reasons.push("lexical_coverage_too_low");
    if (passage.predictedSuccess < contract.difficulty.predictedSuccess.min || passage.predictedSuccess > contract.difficulty.predictedSuccess.max) reasons.push("difficulty_outside_contract");
    if (contract.conjugation.excludedTenses.some((tense) => passage.tenseIds.includes(tense))) reasons.push("excluded_tense");
    if (contract.content.textType && passage.textType && passage.textType !== contract.content.textType) reasons.push("text_type_mismatch");
    if (reasons.length) excluded[passage.versionId] = reasons;
    return reasons.length === 0;
  });
  const ranked = eligible.map((passage) => {
    const competencies = coverage(contract.competencies.targetIds, passage.competencyIds);
    const constructions = coverage(contract.constructions.targetIds, passage.constructionIds);
    const tenses = coverage(contract.conjugation.targetTenses, passage.tenseIds);
    const concepts = coverage(contract.concepts.requiredIds, passage.conceptIds);
    const center = (contract.difficulty.predictedSuccess.min + contract.difficulty.predictedSuccess.max) / 2;
    const difficultyFit = 1 - Math.min(1, Math.abs(passage.predictedSuccess - center) / .2);
    const lexicalFit = contract.difficulty.knownVocabularyCoverageMin === 0
      ? 1
      : Math.min(1, passage.knownVocabularyCoverage / contract.difficulty.knownVocabularyCoverageMin);
    const topic = Math.max(0, Math.min(1, passage.topicSimilarity));
    const score =
      weights.competencies * competencies +
      weights.constructions * constructions +
      weights.tenses * tenses +
      weights.concepts * concepts +
      weights.difficulty * difficultyFit +
      weights.lexical * lexicalFit +
      weights.topic * topic;
    return {
      passage,
      score: Number(score.toFixed(4)),
      breakdown: { competencies, constructions, tenses, concepts, difficultyFit, lexicalFit, topic },
    };
  }).sort((a, b) => b.score - a.score || a.passage.versionId.localeCompare(b.passage.versionId))
    .slice(0, policy.maximumCandidates);
  const selected = ranked[0]?.score >= policy.minimumScore ? ranked[0] : null;
  return {
    decision: selected ? "reuse" as const : "generate" as const,
    selectedVersionId: selected?.passage.versionId ?? null,
    score: selected?.score ?? null,
    ranked,
    excluded,
    explanation: selected
      ? { reason: "eligible_pedagogical_match", breakdown: selected.breakdown }
      : { reason: "no_eligible_match_above_threshold", threshold: policy.minimumScore, eligibleCount: eligible.length },
  };
}
