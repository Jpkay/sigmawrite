import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentLibraryItem } from "@/lib/db/content";
import {
  DEFAULT_REUSE_WEIGHTS,
  matchReusablePassage,
  type ReusablePassage,
  type ReuseContract,
  type ReuseWeights,
} from "./matcher";
import {
  calibrateReuseThreshold,
  type ReuseCalibrationOutcome,
  type ThresholdEvidence,
} from "./calibration";

export type ReusePolicyMode = "off" | "shadow" | "trial" | "live";

type ReusePolicyRow = {
  id: string;
  version: number;
  mode: ReusePolicyMode;
  minimum_score: number | string;
  recent_exclusion_days: number;
  maximum_candidates: number;
  trial_cohort_percent: number;
  minimum_calibration_observations: number;
  minimum_completion_rate: number | string;
  minimum_average_success: number | string;
  weights: unknown;
};

type ProfileRow = {
  text_version_id: string;
  taxonomy_release_id: string;
  lexical_release_id: string;
  qa_status: "pending" | "passed" | "failed";
  predicted_success: number | string;
  word_count: number;
  competency_ids: string[];
  construction_ids: string[];
  tense_keys: string[];
  concept_ids: string[];
  risk_class: "low" | "medium" | "high";
  source_verified: boolean;
  interest_key: string | null;
  text_type: string | null;
};

function weightsFrom(value: unknown): ReuseWeights {
  if (!value || typeof value !== "object") return DEFAULT_REUSE_WEIGHTS;
  const row = value as Record<string, unknown>;
  const parsed = Object.fromEntries(
    Object.keys(DEFAULT_REUSE_WEIGHTS).map((key) => [key, Number(row[key])]),
  ) as ReuseWeights;
  return Object.values(parsed).every((weight) => Number.isFinite(weight) && weight >= 0)
    ? parsed
    : DEFAULT_REUSE_WEIGHTS;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function loadActiveReusePolicy(db: SupabaseClient): Promise<ReusePolicyRow | null> {
  const { data, error } = await db.from("content_reuse_policies")
    .select("id,version,mode,minimum_score,recent_exclusion_days,maximum_candidates,trial_cohort_percent,minimum_calibration_observations,minimum_completion_rate,minimum_average_success,weights")
    .eq("policy_key", "student_reading_recommendation")
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ReusePolicyRow | null;
}

function isInTrialCohort(studentId: string, policy: ReusePolicyRow): boolean {
  const digest = createHash("sha256").update(`${policy.id}:${studentId}`).digest();
  const bucket = digest.readUInt32BE(0) / 0x1_0000_0000 * 100;
  return bucket < policy.trial_cohort_percent;
}

async function writeObservation(
  db: SupabaseClient,
  input: {
    studentId: string;
    policy: ReusePolicyRow;
    baselineIds: string[];
    recommendedIds: string[];
    result: ReturnType<typeof matchReusablePassage>;
    requestSnapshot: Record<string, unknown>;
    latencyMs: number;
    matcherExposed: boolean;
  },
) {
  const { error } = await db.from("content_reuse_observations").insert({
    student_id: input.studentId,
    policy_id: input.policy.id,
    request_key: randomUUID(),
    mode: input.policy.mode,
    matcher_exposed: input.matcherExposed,
    decision: input.result.decision,
    matched_text_version_id: input.result.selectedVersionId,
    score: input.result.score,
    recommended_text_version_ids: input.recommendedIds,
    baseline_text_version_ids: input.baselineIds,
    ranked_candidates: input.result.ranked.map((row) => ({
      textVersionId: row.passage.versionId,
      score: row.score,
      breakdown: row.breakdown,
    })),
    excluded_candidates: input.result.excluded,
    request_snapshot: input.requestSnapshot,
    policy_snapshot: {
      version: input.policy.version,
      mode: input.policy.mode,
      minimumScore: Number(input.policy.minimum_score),
      recentExclusionDays: input.policy.recent_exclusion_days,
      maximumCandidates: input.policy.maximum_candidates,
      trialCohortPercent: input.policy.trial_cohort_percent,
      minimumCalibrationObservations: input.policy.minimum_calibration_observations,
      minimumCompletionRate: Number(input.policy.minimum_completion_rate),
      minimumAverageSuccess: Number(input.policy.minimum_average_success),
      weights: weightsFrom(input.policy.weights),
    },
    matcher_version: "calibrated-reuse-v1",
    latency_ms: input.latencyMs,
  });
  if (error) throw new Error(error.message);
}

export type CalibratedRecommendationResult = {
  items: ContentLibraryItem[];
  mode: ReusePolicyMode;
  decision: "reuse" | "generate" | "not_observed";
  selectedVersionId: string | null;
  matcherExposed: boolean;
};

/**
 * Runs the contract-aware matcher against the same approved library used by
 * the live student page. Shadow mode records a counterfactual without changing
 * order; live mode promotes only a matcher hit and preserves the old ranker as
 * the miss fallback.
 */
export async function recommendWithCalibratedReuse(input: {
  db: SupabaseClient;
  studentId: string;
  interests: string[];
  baseline: ContentLibraryItem[];
  displayLimit?: number;
  now?: string;
}): Promise<CalibratedRecommendationResult> {
  const displayLimit = input.displayLimit ?? 3;
  const baseline = input.baseline;
  const baselineIds = baseline.slice(0, displayLimit).map((item) => item.id);
  if (!baselineIds.length) {
    return { items: [], mode: "off", decision: "not_observed", selectedVersionId: null, matcherExposed: false };
  }
  const policy = await loadActiveReusePolicy(input.db);
  if (!policy || policy.mode === "off") {
    return { items: baseline.slice(0, displayLimit), mode: "off", decision: "not_observed", selectedVersionId: null, matcherExposed: false };
  }

  const started = Date.now();
  const now = input.now ?? new Date().toISOString();
  const { data: profileData, error: profileError } = await input.db.from("content_contract_profiles")
    .select("text_version_id,taxonomy_release_id,lexical_release_id,qa_status,predicted_success,word_count,competency_ids,construction_ids,tense_keys,concept_ids,risk_class,source_verified,interest_key,text_type")
    .in("text_version_id", baseline.map((item) => item.id));
  if (profileError) throw new Error(profileError.message);
  const profiles = (profileData ?? []) as ProfileRow[];

  const [
    { data: targetData, error: targetError },
    { data: conceptData, error: conceptError },
    { data: taxonomyRelease, error: taxonomyError },
    { data: lexicalRelease, error: lexicalError },
  ] = await Promise.all([
    input.db.from("student_competency_estimates")
      .select("node_id,mastery_probability")
      .eq("student_id", input.studentId)
      .lt("mastery_probability", .85)
      .order("mastery_probability", { ascending: true })
      .limit(5),
    input.interests.length
      ? input.db.from("interest_concepts").select("concept_id").in("interest_key", input.interests)
      : Promise.resolve({ data: [], error: null }),
    input.db.from("taxonomy_releases").select("id").eq("status", "published")
      .order("published_at", { ascending: false }).limit(1).maybeSingle(),
    input.db.from("lexical_releases").select("id").eq("status", "published")
      .order("published_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const prerequisiteError = targetError ?? conceptError ?? taxonomyError ?? lexicalError;
  if (prerequisiteError) throw new Error(prerequisiteError.message);
  const targetIds = unique((targetData ?? []).map((row) => row.node_id as string));
  const conceptIds = unique((conceptData ?? []).map((row) => row.concept_id as string));
  const profileIds = profiles.map((profile) => profile.text_version_id);
  const cutoff = new Date(Date.parse(now) - policy.recent_exclusion_days * 86_400_000).toISOString();
  const [{ data: nodeData, error: nodeError }, { data: vocabularyData, error: vocabularyError }, { data: masteryData, error: masteryError }, { data: recentData, error: recentError }] = await Promise.all([
    targetIds.length
      ? input.db.from("competency_nodes").select("id,key,strand").in("id", targetIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? input.db.from("text_vocabulary").select("text_version_id,vocabulary_item_id,is_target_word").in("text_version_id", profileIds).eq("is_target_word", true)
      : Promise.resolve({ data: [], error: null }),
    input.db.from("student_word_mastery").select("vocabulary_item_id,mastery").eq("student_id", input.studentId),
    profileIds.length
      ? input.db.from("reading_sessions").select("text_version_id,started_at").eq("student_id", input.studentId).in("text_version_id", profileIds).gte("started_at", cutoff).order("started_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const lookupError = nodeError ?? vocabularyError ?? masteryError ?? recentError;
  if (lookupError) throw new Error(lookupError.message);

  const targetNodes = nodeData ?? [];
  const constructionIds = targetNodes.filter((node) => node.strand === "grammaire_syntaxe").map((node) => node.id as string);
  const tenseKeys = targetNodes.filter((node) => node.strand === "conjugaison").map((node) => node.key as string);
  const vocabularyByText = new Map<string, string[]>();
  for (const row of vocabularyData ?? []) {
    const textVersionId = row.text_version_id as string;
    vocabularyByText.set(textVersionId, [...(vocabularyByText.get(textVersionId) ?? []), row.vocabulary_item_id as string]);
  }
  const knownVocabulary = new Set((masteryData ?? [])
    .filter((row) => Number(row.mastery) >= .6)
    .map((row) => row.vocabulary_item_id as string));
  const lastUsed = new Map<string, string>();
  for (const row of recentData ?? []) {
    const versionId = row.text_version_id as string;
    if (!lastUsed.has(versionId)) lastUsed.set(versionId, row.started_at as string);
  }

  const currentTaxonomyReleaseId = (taxonomyRelease?.id as string | undefined) ?? "missing";
  const currentLexicalReleaseId = (lexicalRelease?.id as string | undefined) ?? "missing";
  const contract: ReuseContract = {
    releases: { taxonomyReleaseId: currentTaxonomyReleaseId, lexicalReleaseId: currentLexicalReleaseId },
    topic: { interestId: input.interests[0] },
    content: { lengthWords: { min: 150, max: 1500 } },
    difficulty: { predictedSuccess: { min: .75, max: .85 }, knownVocabularyCoverageMin: .6 },
    competencies: { targetIds },
    constructions: { targetIds: constructionIds },
    conjugation: { targetTenses: tenseKeys, excludedTenses: [] },
    concepts: { requiredIds: conceptIds },
  };
  const passages: ReusablePassage[] = profiles.map((profile) => {
    const vocabulary = vocabularyByText.get(profile.text_version_id) ?? [];
    const knownVocabularyCoverage = vocabulary.length
      ? vocabulary.filter((id) => knownVocabulary.has(id)).length / vocabulary.length
      : 1;
    const conceptOverlap = conceptIds.length
      ? profile.concept_ids.filter((id) => conceptIds.includes(id)).length / conceptIds.length
      : 0;
    return {
      versionId: profile.text_version_id,
      status: "published",
      qaStatus: profile.qa_status,
      taxonomyReleaseId: profile.taxonomy_release_id,
      lexicalReleaseId: profile.lexical_release_id,
      predictedSuccess: Number(profile.predicted_success),
      knownVocabularyCoverage,
      wordCount: profile.word_count,
      competencyIds: profile.competency_ids,
      constructionIds: profile.construction_ids,
      tenseIds: profile.tense_keys,
      conceptIds: profile.concept_ids,
      topicSimilarity: profile.interest_key && input.interests.includes(profile.interest_key) ? 1 : conceptOverlap,
      riskClass: profile.risk_class,
      sourceVerified: profile.source_verified,
      interestKey: profile.interest_key,
      textType: profile.text_type,
      lastUsedAt: lastUsed.get(profile.text_version_id),
    };
  });
  const result = matchReusablePassage(contract, passages, now, [...lastUsed.keys()], {
    minimumScore: Number(policy.minimum_score),
    recentExclusionDays: policy.recent_exclusion_days,
    maximumCandidates: policy.maximum_candidates,
    weights: weightsFrom(policy.weights),
  });
  const byId = new Map(baseline.map((item) => [item.id, item]));
  const matcherExposed = policy.mode === "live"
    || (policy.mode === "trial" && isInTrialCohort(input.studentId, policy));
  const liveIds = matcherExposed && result.selectedVersionId
    ? unique([result.selectedVersionId, ...baseline.map((item) => item.id)])
    : baseline.map((item) => item.id);
  const items = liveIds.flatMap((id) => byId.get(id) ? [byId.get(id)!] : []).slice(0, displayLimit);
  const recommendedIds = items.map((item) => item.id);
  await writeObservation(input.db, {
    studentId: input.studentId,
    policy,
    baselineIds,
    recommendedIds,
    result,
    requestSnapshot: {
      interests: input.interests,
      targetCompetencyIds: targetIds,
      targetConceptIds: conceptIds,
      taxonomyReleaseId: currentTaxonomyReleaseId,
      lexicalReleaseId: currentLexicalReleaseId,
      candidateCount: passages.length,
    },
    latencyMs: Date.now() - started,
    matcherExposed,
  });
  return { items, mode: policy.mode, decision: result.decision, selectedVersionId: result.selectedVersionId, matcherExposed };
}

type CalibrationOutcomeRow = {
  mode: ReusePolicyMode;
  matcher_exposed: boolean;
  score: number | string | null;
  matched_text_chosen: boolean | null;
  completed: boolean | null;
  abandoned: boolean | null;
  success_rate: number | string | null;
};

export type ReuseCalibrationReport = {
  policy: {
    id: string;
    version: number;
    mode: ReusePolicyMode;
    minimumScore: number;
    trialCohortPercent: number;
  };
  decision:
    | "disabled"
    | "keep_shadow"
    | "eligible_for_trial"
    | "keep_trial"
    | "eligible_for_live"
    | "return_to_shadow"
    | "monitor_live"
    | "live_healthy"
    | "rollback_recommended";
  recommendedThreshold: number | null;
  eligibleOutcomeCount: number;
  evidence: ThresholdEvidence[];
};

/**
 * Produces the evidence snapshot used by the policy transition RPC. Shadow
 * mode uses only natural overlap with the legacy ranker. Trial/live modes use
 * only requests where the matcher was actually allowed to change the order.
 */
export async function getContentReuseCalibrationReport(
  db: SupabaseClient,
): Promise<ReuseCalibrationReport> {
  const policy = await loadActiveReusePolicy(db);
  if (!policy) throw new Error("No active content reuse policy.");
  const policySummary = {
    id: policy.id,
    version: policy.version,
    mode: policy.mode,
    minimumScore: Number(policy.minimum_score),
    trialCohortPercent: policy.trial_cohort_percent,
  };
  if (policy.mode === "off") {
    return {
      policy: policySummary,
      decision: "disabled",
      recommendedThreshold: null,
      eligibleOutcomeCount: 0,
      evidence: [],
    };
  }

  let query = db.from("content_reuse_calibration_outcomes")
    .select("mode,matcher_exposed,score,matched_text_chosen,completed,abandoned,success_rate")
    .eq("policy_id", policy.id)
    .eq("decision", "reuse")
    .not("score", "is", null);
  if (policy.mode === "trial" || policy.mode === "live") {
    query = query.eq("matcher_exposed", true);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const outcomes: ReuseCalibrationOutcome[] = ((data ?? []) as CalibrationOutcomeRow[]).map((row) => ({
    score: Number(row.score),
    matchedTextChosen: Boolean(row.matched_text_chosen),
    completed: Boolean(row.completed),
    abandoned: Boolean(row.abandoned),
    successRate: row.success_rate == null ? null : Number(row.success_rate),
  }));
  const currentThreshold = Number(policy.minimum_score);
  const candidateThresholds = unique([currentThreshold, .82, .86, .90])
    .filter((threshold) => threshold >= currentThreshold && threshold <= 1);
  const calibration = calibrateReuseThreshold(outcomes, {
    minimumObservations: policy.minimum_calibration_observations,
    minimumCompletionRate: Number(policy.minimum_completion_rate),
    minimumAverageSuccess: Number(policy.minimum_average_success),
    candidateThresholds,
  });
  const currentEvidence = calibration.evidence.find((row) => row.threshold === currentThreshold)
    ?? calibration.evidence[0];
  const hasEnoughEvidence = (currentEvidence?.completed ?? 0) >= policy.minimum_calibration_observations;

  let decision: ReuseCalibrationReport["decision"];
  if (policy.mode === "shadow") {
    decision = calibration.decision === "eligible_for_live_trial" ? "eligible_for_trial" : "keep_shadow";
  } else if (policy.mode === "trial") {
    decision = calibration.decision === "eligible_for_live_trial"
      ? "eligible_for_live"
      : hasEnoughEvidence ? "return_to_shadow" : "keep_trial";
  } else {
    decision = calibration.decision === "eligible_for_live_trial"
      ? "live_healthy"
      : hasEnoughEvidence ? "rollback_recommended" : "monitor_live";
  }
  return {
    policy: policySummary,
    decision,
    recommendedThreshold: calibration.recommendedThreshold,
    eligibleOutcomeCount: outcomes.length,
    evidence: calibration.evidence,
  };
}
