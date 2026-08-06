"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentStudentId, getStudentStateData } from "@/lib/db/student";
import { FRENCH_BACKGROUNDS } from "@/lib/types";
import { getContentLibrary, getPublishedReadingText, recommendPublishedTextKey } from "@/lib/db/content";
import { rankInterestSignals } from "@/lib/content/recommend";
import { scoreSession } from "@/lib/scoring/session";
import { updateSkillEstimate, updateSkillsFromSession } from "@/lib/scoring/skill-estimate";
import { buildRetrievalCards } from "@/lib/content/retrieval-cards";
import { dueAtFrom, gradeRetrieval, INITIAL_SCHEDULE } from "@/lib/scoring/retrieval";
import { scheduleFsrs } from "@/lib/scoring/fsrs";
import { fireImplicitUpdates } from "@/lib/graph/fire";
import { effectiveMastery } from "@/lib/scoring/decay";
import { buildSessionPlan } from "@/lib/learning/session-plan";
import { eloUpdate, itemRatingFromDifficulty } from "@/lib/scoring/elo";
import { nextScaffoldState } from "@/lib/practice/scaffolding";
import { fallbackModeration, moderateStudentText } from "@/lib/safety/moderate-input";
import { logAudit } from "@/lib/audit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getActivePrompt } from "@/lib/db/ai";
import { nextDiagnosticItem, frontierForStudent, diagnosticRequirement, type LiveDiagnosticItem } from "@/lib/diagnostic/live";
import { diagnosticDimensionPatch } from "@/lib/diagnostic/lifecycle";
import {
  assessDiagnosticBankReadiness,
  diagnosticSection,
  DIAGNOSTIC_ITEM_BANK_RELEASE_KEY,
  DIAGNOSTIC_MAX_TOTAL_PROBES,
  DIAGNOSTIC_MIN_TOTAL_PROBES,
  DIAGNOSTIC_PROTOCOL_VERSION,
  DIAGNOSTIC_SECTIONS,
  DIAGNOSTIC_TAXONOMY_RELEASE_KEY,
  evaluateDiagnosticSection,
  nextDiagnosticSection,
  selectDiagnosticTargets,
  sectionForStrand,
  type DiagnosticBankSectionReadiness,
  type DiagnosticSectionKey,
  type DiagnosticSectionProgress,
} from "@/lib/diagnostic/protocol";
import { buildDiagnosticLearningPath, type DiagnosticPathEstimate } from "@/lib/diagnostic/learning-path";
import {
  buildDiagnosticPriorStateSnapshot,
  mergeDiagnosticHistorySnapshots,
} from "@/lib/diagnostic/history";
import type { DiagnosticEvidenceExpectation } from "@/lib/diagnostic/item-bank";
import { nodePracticeEvidenceExpectation } from "@/lib/diagnostic/practice-evidence";
import { requireStudentLearningUnlocked } from "@/lib/diagnostic/access";
import { bktUpdate, bktUpdateWeighted, guessFromChoices, masteryUncertainty } from "@/lib/scoring/bkt";
import { validateAnswer } from "@/lib/linguistic/validator";
import { getCatchUpPlan } from "@/lib/db/practice";
import { evaluateWriting } from "@/lib/writing/evaluate";
import { calculateStreak } from "@/lib/motivation";
import { trackServer } from "@/lib/analytics-server";
import { createHash } from "node:crypto";
import { sanitizeStudentTopic } from "@/lib/safety/topic";

const answersSchema = z.record(z.string().min(1), z.number().int().min(0).max(20));
const uuidSchema = z.string().uuid();
const dateTimeSchema = z.string().datetime({ offset: true });

const onboardingSchema = z.object({
  grade: z.number().int().min(5).max(12),
  frenchBackground: z.enum(FRENCH_BACKGROUNDS),
  interests: z.array(z.string().min(1).max(64)).min(3).max(20),
  studentType: z.enum(["french_first_language", "french_second_language", "heritage", "bilingual", "allophone", "immersion"]).optional(),
  homeLanguage: z.string().trim().max(100).optional(),
  exposure: z.enum(["home", "school", "class_only", "immersion", "self_study"]).optional(),
  goalType: z.enum(["catch_up", "improve_writing", "grammar_spelling", "improve_speaking", "prepare_delf", "prepare_ap_ib", "enter_french_school", "literature_class"]).optional(),
  targetLevel: z.string().trim().max(30).optional(),
});
const startSessionSchema = z.object({ textKey: z.string().min(1).max(100), startedAt: dateTimeSchema });
const answerSchema = z.object({
  sessionId: uuidSchema, textKey: z.string().min(1).max(100), questionKey: z.string().min(1).max(40), choiceIndex: z.number().int().min(0).max(20), nextPhase: z.enum(["questions", "summary"]).optional(),
});
const summarySchema = z.object({ sessionId: uuidSchema, textKey: z.string().min(1).max(100), summaryText: z.string().trim().min(1).max(5000) });
const completeSessionSchema = z.object({
  sessionId: uuidSchema,
  textKey: z.string().min(1).max(100),
  answers: answersSchema,
  summaryText: z.string().trim().min(1).max(5000),
  retrievalText: z.string().trim().min(1).max(5000),
  startedAt: dateTimeSchema,
  completedAt: dateTimeSchema,
});
const retrievalSchema = z.object({ cardId: uuidSchema, answerText: z.string().trim().min(1).max(5000), attemptedAt: dateTimeSchema });
const skillPracticeSchema = z.object({ skillKey: z.string().min(1).max(100), corrects: z.array(z.boolean()).min(1).max(30) });
const textKeySchema = z.object({ textKey: z.string().min(1).max(100) });
const emptySchema = z.object({}).strict();
const adaptiveProbeSchema = z.object({
  runId: uuidSchema, runItemId: uuidSchema, itemId: uuidSchema, idempotencyKey: uuidSchema,
  selectedChoiceId: uuidSchema.optional(), answerText: z.string().trim().max(2000).optional(),
  startedAt: dateTimeSchema,
}).refine((value) => value.selectedChoiceId || value.answerText, "Réponse requise");
const practiceAttemptSchema = z.object({ nodeId: uuidSchema, itemId: uuidSchema, selectedChoiceId: uuidSchema.optional(), answerText: z.string().trim().max(2000).optional(), startedAt: dateTimeSchema, hintsUsed: z.number().int().min(0).max(2).optional() }).refine((value) => value.selectedChoiceId || value.answerText, "Réponse requise");
const writingFeedbackSchema = z.object({ textKey: z.string().min(1).max(100) });
const writingRevisionSchema = writingFeedbackSchema.extend({ revisedText: z.string().trim().min(5).max(5000) });
const onDemandRequestSchema = z.object({ clientRequestId: uuidSchema, topicKey: z.string().trim().min(1).max(80), topic: z.string().trim().min(1).max(160), textType: z.enum(["narrative", "explanatory", "argumentative", "source_based"]) });

function checked<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error("Données invalides.");
  return parsed.data;
}

async function context() {
  await requireRole(["student"]);
  const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  return { supabase, studentId };
}

type AssignedDiagnosticItem = LiveDiagnosticItem & {
  runItemId: string;
  assignedAt: string;
};

type DiagnosticSectionRow = {
  section_key: DiagnosticSectionKey;
  status: DiagnosticSectionProgress["status"];
  probe_count: number;
  distinct_nodes_tested: number;
  confirmed_node_count: number;
  target_node_count: number;
  resolved_node_count: number;
  mean_uncertainty: number | string;
  confidence: "low" | "medium" | "high";
  stopping_reason: DiagnosticSectionProgress["stoppingReason"] | null;
};

async function loadDiagnosticProgress(runId: string, db: SupabaseClient) {
  const { data, error } = await db.from("diagnostic_run_sections")
    .select("section_key,status,probe_count,distinct_nodes_tested,confirmed_node_count,target_node_count,resolved_node_count,mean_uncertainty,confidence,stopping_reason")
    .eq("run_id", runId)
    .order("position");
  if (error) throw new Error(error.message);
  return ((data ?? []) as DiagnosticSectionRow[]).map((row) => ({
    key: row.section_key,
    status: row.status,
    probeCount: Number(row.probe_count),
    distinctNodesTested: Number(row.distinct_nodes_tested),
    confirmedNodeCount: Number(row.confirmed_node_count),
    targetNodeCount: Number(row.target_node_count),
    resolvedNodeCount: Number(row.resolved_node_count),
    meanUncertainty: Number(row.mean_uncertainty),
    nextInformationGain: 0,
    eligibleItemCount: 1,
    confidence: row.confidence,
    stoppingReason: row.stopping_reason ?? undefined,
  })) satisfies DiagnosticSectionProgress[];
}

async function assignDiagnosticItem(input: {
  db: SupabaseClient;
  studentId: string;
  runId: string;
  sectionKey: DiagnosticSectionKey;
  candidate?: LiveDiagnosticItem | null;
}): Promise<AssignedDiagnosticItem | null> {
  const { data: outstanding, error: outstandingError } = await input.db
    .from("diagnostic_run_items")
    .select("id,item_snapshot,assigned_at")
    .eq("run_id", input.runId)
    .eq("section_key", input.sectionKey)
    .is("answered_at", null)
    .order("position")
    .limit(1)
    .maybeSingle();
  if (outstandingError) throw new Error(outstandingError.message);
  if (outstanding) {
    return {
      ...(outstanding.item_snapshot as LiveDiagnosticItem),
      runItemId: outstanding.id as string,
      assignedAt: outstanding.assigned_at as string,
    };
  }
  const candidate = input.candidate ?? await nextDiagnosticItem(
    input.studentId,
    input.runId,
    input.sectionKey,
    input.db,
  );
  if (!candidate) return null;
  const { data: latest, error: latestError } = await input.db.from("diagnostic_run_items")
    .select("position")
    .eq("run_id", input.runId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw new Error(latestError.message);
  const assignedAt = new Date().toISOString();
  const { data: assignment, error } = await input.db.from("diagnostic_run_items").insert({
    run_id: input.runId,
    item_id: candidate.id,
    node_id: candidate.nodeId,
    section_key: input.sectionKey,
    position: Number(latest?.position ?? 0) + 1,
    item_snapshot: candidate,
    information_gain: candidate.informationGain,
    assigned_at: assignedAt,
  }).select("id").single();
  if (error || !assignment) throw new Error(error?.message ?? "Question non assignée.");
  return { ...candidate, runItemId: assignment.id as string, assignedAt };
}

async function abandonDiagnosticRun(db: SupabaseClient, runId: string) {
  const { error } = await db.from("diagnostic_runs").update({
    status: "abandoned",
    completed_at: new Date().toISOString(),
  }).eq("id", runId).eq("status", "running");
  if (error) throw new Error(error.message);
}

async function refreshSectionProgress(input: {
  db: SupabaseClient;
  runId: string;
  sectionKey: DiagnosticSectionKey;
  candidate: LiveDiagnosticItem | null;
}) {
  const [{ count: probes, error: probeError }, { data: directRows, error: directError }, { data: resultRows, error: resultError }, { data: sectionRow, error: sectionError }] = await Promise.all([
    input.db.from("diagnostic_run_items").select("id", { count: "exact", head: true }).eq("run_id", input.runId).eq("section_key", input.sectionKey).not("answered_at", "is", null),
    input.db.from("diagnostic_node_results").select("node_id,direct_evidence_count,evidence_coverage_confirmed").eq("run_id", input.runId).eq("section_key", input.sectionKey).eq("evidence_kind", "direct"),
    input.db.from("diagnostic_node_results").select("node_id,uncertainty,classification").eq("run_id", input.runId).eq("section_key", input.sectionKey),
    input.db.from("diagnostic_run_sections").select("target_node_count,status").eq("run_id", input.runId).eq("section_key", input.sectionKey).single(),
  ]);
  if (probeError || directError || resultError || sectionError) {
    throw new Error(probeError?.message ?? directError?.message ?? resultError?.message ?? sectionError?.message);
  }
  const uncertainties = (resultRows ?? []).map((row) => Number(row.uncertainty));
  return {
    key: input.sectionKey,
    status: sectionRow.status as DiagnosticSectionProgress["status"],
    probeCount: probes ?? 0,
    distinctNodesTested: new Set((directRows ?? []).map((row) => row.node_id as string)).size,
    confirmedNodeCount: (directRows ?? []).filter((row) => Boolean(row.evidence_coverage_confirmed)).length,
    targetNodeCount: Number(sectionRow.target_node_count),
    resolvedNodeCount: (resultRows ?? []).filter((row) => row.classification !== "unknown").length,
    meanUncertainty: uncertainties.length
      ? uncertainties.reduce((total, value) => total + value, 0) / uncertainties.length
      : 1,
    nextInformationGain: input.candidate?.informationGain ?? 0,
    eligibleItemCount: input.candidate ? 1 : 0,
  } satisfies DiagnosticSectionProgress;
}

async function reconcileDiagnosticSection(input: {
  db: SupabaseClient;
  studentId: string;
  runId: string;
  sectionKey: DiagnosticSectionKey;
  at: string;
}) {
  const { data: outstanding, error: outstandingError } = await input.db
    .from("diagnostic_run_items")
    .select("item_snapshot")
    .eq("run_id", input.runId)
    .eq("section_key", input.sectionKey)
    .is("answered_at", null)
    .order("position")
    .limit(1)
    .maybeSingle();
  if (outstandingError) throw new Error(outstandingError.message);
  const candidate = outstanding
    ? outstanding.item_snapshot as LiveDiagnosticItem
    : await nextDiagnosticItem(input.studentId, input.runId, input.sectionKey, input.db);
  const progress = await refreshSectionProgress({
    db: input.db,
    runId: input.runId,
    sectionKey: input.sectionKey,
    candidate,
  });
  const decision = evaluateDiagnosticSection(progress);
  const status = decision.stop
    ? decision.reason === "insufficient_items" ? "insufficient_items" : "completed"
    : "active";
  const { error } = await input.db.from("diagnostic_run_sections").update({
    status,
    probe_count: progress.probeCount,
    distinct_nodes_tested: progress.distinctNodesTested,
    confirmed_node_count: progress.confirmedNodeCount,
    resolved_node_count: progress.resolvedNodeCount,
    mean_uncertainty: progress.meanUncertainty,
    coverage_ratio: decision.coverageRatio,
    confidence: decision.confidence,
    stopping_reason: decision.stop ? decision.reason : null,
    completed_at: decision.stop ? input.at : null,
  }).eq("run_id", input.runId).eq("section_key", input.sectionKey);
  if (error) throw new Error(error.message);
  return { candidate, progress, decision };
}

const DIMENSION_COLUMN = {
  receptiveScore: "receptive",
  productiveScore: "productive",
  writtenScore: "written",
  oralScore: "oral",
} as const;

async function consumeActionLimit(supabase: SupabaseClient, scope: "submit_answer" | "diagnostic_answer" | "free_text" | "start_session") {
  const { data, error } = await supabase.rpc("consume_student_action", { p_scope: scope });
  if (error) throw new Error("La vérification de sécurité a échoué. Réessaie.");
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.allowed) throw new Error("Tu vas un peu vite. Fais une courte pause puis réessaie.");
}

async function moderateOrReject(input: {
  supabase: SupabaseClient;
  studentId: string;
  text: string;
  field: "diagnostic_summary" | "reading_summary" | "initial_retrieval" | "memory_retrieval";
}) {
  await consumeActionLimit(input.supabase, "free_text");
  const { data: budget, error: budgetError } = await input.supabase.rpc("consume_student_llm_budget", {
    p_student_id: input.studentId,
    p_units: 1,
  });
  const budgetResult = Array.isArray(budget) ? budget[0] : budget;
  if (budgetError || !budgetResult?.allowed) {
    throw new Error("La limite quotidienne est atteinte. Tu pourras reprendre demain.");
  }
  const moderation = await moderateStudentText(input.text);
  if (moderation.allowed) return moderation;
  await logAudit("student.free_text_rejected", {
    targetType: "student",
    targetId: input.studentId,
    metadata: {
      field: input.field,
      categories: moderation.categories,
      moderationSource: moderation.source,
      characterCount: input.text.length,
    },
  });
  throw new Error("Ta réponse n'a pas pu être enregistrée.");
}

async function moderateDiagnosticAnswer(input: {
  supabase: SupabaseClient;
  studentId: string;
  text?: string;
}) {
  // Diagnostic responses are short, deterministically graded, and never sent
  // to an LLM. Keep the normal answer-rate limit and local safety rules without
  // consuming the learner's daily AI budget on every controlled-production item.
  await consumeActionLimit(input.supabase, "diagnostic_answer");
  if (!input.text) return;
  const moderation = fallbackModeration(input.text);
  if (moderation.allowed) return;
  await logAudit("student.free_text_rejected", {
    targetType: "student",
    targetId: input.studentId,
    metadata: {
      field: "diagnostic_answer",
      categories: moderation.categories,
      moderationSource: moderation.source,
      characterCount: input.text.length,
    },
  });
  throw new Error("Ta réponse n'a pas pu être enregistrée.");
}

type DirectEstimateScorePatch = Partial<{
  receptive_score: number;
  productive_score: number;
  written_score: number;
  oral_score: number;
  fluency_score: number;
  accuracy_score: number;
}>;

/** Persist one trusted, node-aligned observation and notify the active graph
 * path with its exact evidence channel. Direct evidence must also retract any
 * stale inference provenance left by a diagnostic projection. */
async function recordDirectCompetencyEvidence(input: {
  service: SupabaseClient;
  studentId: string;
  nodeId: string;
  at: string;
  evidenceExpectation: DiagnosticEvidenceExpectation;
  updateMastery: (priorMastery: number) => number;
  scorePatch?: DirectEstimateScorePatch;
  practiced?: boolean;
  pathMastery?: (mastery: number) => number;
  /** When provided, folds the observation into the node's FSRS memory state. */
  correct?: boolean;
}) {
  const { data: prior, error: priorError } = await input.service
    .from("student_competency_estimates")
    .select("mastery_probability,evidence_count,estimate_source,memory_stability,memory_difficulty,last_evidence_at")
    .eq("student_id", input.studentId)
    .eq("node_id", input.nodeId)
    .maybeSingle();
  if (priorError) throw new Error(priorError.message);
  // A graph inference is useful for selection, but is not a direct prior from
  // which one ordinary exercise may instantly claim confirmed mastery.
  const priorMastery = prior?.estimate_source === "diagnostic_inference"
    ? 0.5
    : Number(prior?.mastery_probability ?? 0.1);
  const evidenceCount = Number(prior?.evidence_count ?? 0) + 1;
  const mastery = input.updateMastery(priorMastery);
  let memoryPatch: { memory_stability: number; memory_difficulty: number } | undefined;
  if (input.correct !== undefined) {
    const prevState = prior?.memory_stability != null && prior?.memory_difficulty != null
      ? { stability: Number(prior.memory_stability), difficulty: Number(prior.memory_difficulty) }
      : null;
    const elapsedDays = prior?.last_evidence_at
      ? Math.max(0, (Date.parse(input.at) - Date.parse(prior.last_evidence_at)) / 86_400_000)
      : 0;
    const next = scheduleFsrs(prevState, input.correct ? "good" : "forgot", elapsedDays);
    memoryPatch = { memory_stability: next.stability, memory_difficulty: next.difficulty };
  }
  const { error: estimateError } = await input.service
    .from("student_competency_estimates")
    .upsert({
      student_id: input.studentId,
      node_id: input.nodeId,
      mastery_probability: mastery,
      uncertainty: masteryUncertainty(mastery, evidenceCount),
      evidence_count: evidenceCount,
      ...(memoryPatch ?? {}),
      ...(input.scorePatch ?? {}),
      ...(input.practiced ? { last_practiced_at: input.at } : {}),
      estimate_source: "direct",
      inferred_from_node_id: null,
      last_diagnostic_run_id: null,
      last_evidence_at: input.at,
      updated_at: input.at,
    }, { onConflict: "student_id,node_id" });
  if (estimateError) throw new Error(estimateError.message);

  const { error: pathError } = await input.service.rpc("advance_student_learning_path", {
    p_student_id: input.studentId,
    p_node_id: input.nodeId,
    p_mastery: input.pathMastery?.(mastery) ?? mastery,
    p_completed_at: input.at,
    p_evidence_expectation: input.evidenceExpectation,
  });
  if (pathError) throw new Error(pathError.message);
  return { mastery, evidenceCount };
}

async function evaluateAndStoreWriting(input: {
  service: SupabaseClient; studentId: string; summaryId: string; revisionNumber: 0 | 1;
  sourceText: string; studentText: string; keywords: string[]; systemPrompt: string;
}) {
  const { data: rows } = await input.service.from("error_node_mappings").select("rule_id,node_id,explanation_fr,evidence_weight,competency_nodes!inner(key,label_fr)");
  const mappings = (rows ?? []).map((row) => { const node = row.competency_nodes as unknown as { key: string; label_fr: string }; return { ruleId: row.rule_id as string, nodeId: row.node_id as string, nodeKey: node.key, nodeLabel: node.label_fr, explanationFr: row.explanation_fr as string, evidenceWeight: Number(row.evidence_weight) }; });
  const evaluation = await evaluateWriting({ textBody: input.sourceText, studentText: input.studentText, keywords: input.keywords, mappings, systemPrompt: input.systemPrompt });
  const { error } = await input.service.from("writing_evaluations").upsert({ student_summary_id: input.summaryId, student_id: input.studentId, revision_number: input.revisionNumber, submitted_text: input.studentText, rubric: evaluation.rubric, annotations: evaluation.annotations, revision_plan: evaluation.revisionPlan, degraded: evaluation.degraded }, { onConflict: "student_summary_id,revision_number" });
  if (error) throw new Error(error.message);
  const evaluatedAt = new Date().toISOString();
  for (const plan of evaluation.revisionPlan) {
    await recordDirectCompetencyEvidence({
      service: input.service,
      studentId: input.studentId,
      nodeId: plan.nodeId,
      at: evaluatedAt,
      evidenceExpectation: "independent_production",
      updateMastery: (prior) => bktUpdateWeighted(prior, false, plan.evidenceWeight),
      correct: false,
      scorePatch: {
        productive_score: Math.max(0, 1 - plan.errorCount * 0.2),
        written_score: Math.max(0, 1 - plan.errorCount * 0.2),
      },
      // The current rubric supplies only an error signal. Even when a strong
      // historical aggregate remains above threshold, a detected error cannot
      // be treated as a positive independent-production verification.
      pathMastery: (mastery) => Math.min(mastery, 0.84),
    });
  }
  return evaluation;
}

/** FIRe: fold one direct observation into the implicit-repetition credit of
 * encompassed sub-skills (success) or encompassing skills (failure). Updates
 * existing estimate rows only; never touches the learning path. */
async function propagateImplicitRepetitions(service: SupabaseClient, studentId: string, nodeId: string, correct: boolean, at: string) {
  const { data: edgeRows, error: edgeError } = await service.from("competency_edges")
    .select("source_node_id,target_node_id,strength").eq("edge_type", "encompasses");
  if (edgeError) throw new Error(edgeError.message);
  if (!edgeRows?.length) return;
  const { data: estimateRows, error: estimateError } = await service.from("student_competency_estimates")
    .select("node_id,mastery_probability,memory_stability,memory_difficulty,last_evidence_at")
    .eq("student_id", studentId);
  if (estimateError) throw new Error(estimateError.message);
  const updates = fireImplicitUpdates({
    practicedNodeId: nodeId,
    correct,
    nowMs: Date.parse(at),
    edges: edgeRows.map((edge) => ({
      sourceNodeId: edge.source_node_id as string,
      targetNodeId: edge.target_node_id as string,
      strength: Number(edge.strength),
    })),
    estimates: new Map((estimateRows ?? []).map((row) => [row.node_id as string, {
      mastery: Number(row.mastery_probability),
      memoryStability: row.memory_stability == null ? null : Number(row.memory_stability),
      memoryDifficulty: row.memory_difficulty == null ? null : Number(row.memory_difficulty),
      lastEvidenceAt: row.last_evidence_at as string | null,
    }])),
  });
  for (const update of updates) {
    const { error } = await service.from("student_competency_estimates").update({
      mastery_probability: update.mastery,
      ...(update.memoryStability != null
        ? { memory_stability: update.memoryStability, memory_difficulty: update.memoryDifficulty, last_evidence_at: at }
        : {}),
      updated_at: at,
    }).eq("student_id", studentId).eq("node_id", update.nodeId);
    if (error) throw new Error(error.message);
  }
}

async function recordDailyActivity(db: SupabaseClient, studentId: string, at: string, kind: "reading" | "practice" | "retrieval", completesGoal: boolean) {
  const day=at.slice(0,10);const {data:row}=await db.from("student_daily_activity").select("reading_sessions,practice_steps,retrieval_reviews,goal_completed").eq("student_id",studentId).eq("activity_date",day).maybeSingle();
  const values={student_id:studentId,activity_date:day,reading_sessions:Number(row?.reading_sessions??0)+(kind==="reading"?1:0),practice_steps:Number(row?.practice_steps??0)+(kind==="practice"?1:0),retrieval_reviews:Number(row?.retrieval_reviews??0)+(kind==="retrieval"?1:0),goal_completed:!!row?.goal_completed||completesGoal};
  const {error}=await db.from("student_daily_activity").upsert(values,{onConflict:"student_id,activity_date"});if(error)throw new Error(error.message);
}

async function contentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  textKey: string,
  questionKey?: string,
  choiceIndex?: number
) {
  let { data: text, error: textError } = await supabase.from("texts").select("id").eq("slug", textKey).maybeSingle();
  if (!text && uuidSchema.safeParse(textKey).success) {
    const byId = await supabase.from("texts").select("id").eq("id", textKey).maybeSingle();
    text = byId.data;
    textError = byId.error;
  }
  if (textError || !text) throw new Error("Texte introuvable.");
  const { data: version, error: versionError } = await supabase.from("text_versions").select("id").eq("text_id", text.id)
    .in("review_status", ["human_approved", "benchmark_locked"]).order("version_number", { ascending: false }).limit(1).single();
  if (versionError || !version) throw new Error("Version du texte introuvable.");
  if (questionKey === undefined) return { textVersionId: version.id as string };
  const { data: question, error: questionError } = await supabase.from("questions").select("id").eq("text_version_id", version.id).eq("question_key", questionKey).single();
  if (questionError || !question) throw new Error("Question introuvable.");
  if (choiceIndex === undefined) return { textVersionId: version.id as string, questionId: question.id as string };
  const { data: choice, error: choiceError } = await supabase.from("question_choices").select("id,is_correct").eq("question_id", question.id).eq("choice_index", choiceIndex).single();
  if (choiceError || !choice) throw new Error("Réponse introuvable.");
  return { textVersionId: version.id as string, questionId: question.id as string, choiceId: choice.id as string, isCorrect: !!choice.is_correct };
}

export async function loadStudentState() {
  const { supabase, studentId } = await context();
  return getStudentStateData(studentId, supabase);
}

export async function loadReadingText(input: unknown) {
  const data = checked(textKeySchema, input);
  const { supabase } = await context();
  const text = await getPublishedReadingText(data.textKey, supabase);
  if (!text) throw new Error("Texte introuvable.");
  return text;
}

export async function recommendReadingText(input: unknown) {
  checked(emptySchema, input);
  const { supabase, studentId } = await context();
  const { data } = await supabase.from("student_interests").select("interest_key").eq("student_id", studentId);
  const key = await recommendPublishedTextKey((data ?? []).map((row) => row.interest_key as string), supabase);
  const text = await getPublishedReadingText(key, supabase);
  if (!text) throw new Error("Aucun texte disponible.");
  return text;
}

export async function recommendReadingTexts(input: unknown) {
  checked(emptySchema, input); const { supabase, studentId } = await context();
  const [{ data: declared }, { data: stats }, library] = await Promise.all([
    supabase.from("student_interests").select("interest_key,declared_strength,inferred_strength").eq("student_id", studentId),
    supabase.from("student_interest_stats").select("interest_key,completion_rate,avg_success,avg_time_on_task,abandon_count,inferred_strength").eq("student_id", studentId),
    getContentLibrary(supabase),
  ]);
  const statsByKey = new Map((stats ?? []).map((row) => [row.interest_key as string, row]));
  const ranked = rankInterestSignals((declared ?? []).map((row) => { const stat = statsByKey.get(row.interest_key as string); return { interestKey: row.interest_key as string, declaredStrength: Number(row.declared_strength ?? 0), inferredStrength: Number(stat?.inferred_strength ?? row.inferred_strength ?? 0), completionRate: Number(stat?.completion_rate ?? 0), avgSuccess: Number(stat?.avg_success ?? 0.75), avgTimeOnTask: Number(stat?.avg_time_on_task ?? 0), abandonCount: Number(stat?.abandon_count ?? 0) }; }));
  const ordered = [...library].sort((a,b) => (ranked.findIndex((rank) => rank.interestKey === a.primaryInterest) < 0 ? 999 : ranked.findIndex((rank) => rank.interestKey === a.primaryInterest)) - (ranked.findIndex((rank) => rank.interestKey === b.primaryInterest) < 0 ? 999 : ranked.findIndex((rank) => rank.interestKey === b.primaryInterest)));
  const selected = ordered.slice(0,3); return Promise.all(selected.map((item) => getPublishedReadingText(item.slug, supabase))).then((rows) => rows.filter((row): row is NonNullable<typeof row> => !!row));
}

export async function selectInterests(input: unknown) {
  const data = checked(onboardingSchema, input);
  const { supabase, studentId } = await context();
  const { error: studentError } = await supabase.from("students").update({
    current_grade: data.grade,
    french_background: data.frenchBackground,
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", studentId);
  if (studentError) throw new Error(studentError.message);
  const { error: deleteError } = await supabase.from("student_interests").delete().eq("student_id", studentId);
  if (deleteError) throw new Error(deleteError.message);
  const { error: interestsError } = await supabase.from("student_interests").insert(
    data.interests.map((interestKey) => ({ student_id: studentId, interest_key: interestKey, declared_strength: 1 }))
  );
  if (interestsError) throw new Error(interestsError.message);
  const studentType = data.studentType ?? (data.frenchBackground === "native" ? "french_first_language" : data.frenchBackground === "bilingual" ? "bilingual" : "french_second_language");
  const { error: profileError } = await supabase.from("learner_profiles").upsert({
    student_id: studentId, student_type: studentType,
    home_language: data.homeLanguage || null,
    exposure: data.exposure ?? (studentType === "french_first_language" ? "home" : "school"),
    updated_at: new Date().toISOString(),
  }, { onConflict: "student_id" });
  if (profileError) throw new Error(profileError.message);
  await supabase.from("learning_goals").update({ status: "paused" }).eq("student_id", studentId).eq("status", "active");
  const fsl = ["french_second_language", "allophone", "immersion"].includes(studentType);
  const { error: goalError } = await supabase.from("learning_goals").insert({
    student_id: studentId, goal_type: data.goalType ?? "catch_up", target_framework: fsl ? "cefr" : "native_grade",
    target_level: fsl ? "B1" : data.targetLevel ?? String(data.grade), target_grade: fsl ? null : data.grade,
    scope: { strands: fsl
      ? ["grammaire_syntaxe", "conjugaison", "orthographe_lexicale", "orthographe_grammaticale", "lexique", "comprehension_orale", "comprehension_ecrite", "expression_ecrite"]
      : ["grammaire_syntaxe", "conjugaison", "orthographe_lexicale", "orthographe_grammaticale", "comprehension_ecrite", "expression_ecrite"],
      modalities: fsl ? ["reading", "listening", "writing", "grammar_analysis", "dictee"] : ["reading", "writing", "grammar_analysis", "dictee"], mastery_threshold: 0.85 },
  });
  if (goalError) throw new Error(goalError.message);
  revalidatePath("/student");
  return getStudentStateData(studentId, supabase);
}

export async function startAdaptiveDiagnostic(input: unknown) {
  checked(emptySchema, input);
  if (process.env.ADAPTIVE_DIAGNOSTIC_ENABLED === "false") throw new Error("Diagnostic adaptatif désactivé pour cet environnement.");
  const { supabase, studentId } = await context();
  const service = createServiceClient();
  const { data: existingRun } = await supabase.from("diagnostic_runs")
    .select("id,started_at,current_section,taxonomy_release_id,item_bank_release_id,is_pilot")
    .eq("student_id", studentId)
    .eq("status", "running")
    .eq("protocol_version", DIAGNOSTIC_PROTOCOL_VERSION)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingRun) {
    const [progress, targetCountResult, releaseIdentity, bankIdentity] = await Promise.all([
      loadDiagnosticProgress(existingRun.id as string, service),
      service.from("diagnostic_run_targets")
        .select("node_id", { count: "exact", head: true })
        .eq("run_id", existingRun.id),
      service.from("taxonomy_releases")
        .select("release_key")
        .eq("id", existingRun.taxonomy_release_id)
        .maybeSingle(),
      service.from("diagnostic_item_bank_releases")
        .select("bank_key")
        .eq("id", existingRun.item_bank_release_id)
        .maybeSingle(),
    ]);
    if (targetCountResult.error || releaseIdentity.error || bankIdentity.error) {
      throw new Error(targetCountResult.error?.message ?? releaseIdentity.error?.message ?? bankIdentity.error?.message);
    }
    const targetCount = targetCountResult.count;
    const expectedTargetCount = progress.reduce((total, section) => total + section.targetNodeCount, 0);
    const wrongV2Release = releaseIdentity.data?.release_key !== DIAGNOSTIC_TAXONOMY_RELEASE_KEY
      || bankIdentity.data?.bank_key !== DIAGNOSTIC_ITEM_BANK_RELEASE_KEY;
    if (wrongV2Release || progress.length !== DIAGNOSTIC_SECTIONS.length || !expectedTargetCount || targetCount !== expectedTargetCount) {
      await abandonDiagnosticRun(service, existingRun.id as string);
    } else {
      let currentProgress = progress;
      const recordedSection = existingRun.current_section as DiagnosticSectionKey | null;
      let sectionKey = recordedSection && progress.find((section) => section.key === recordedSection)?.status === "active"
        ? recordedSection
        : nextDiagnosticSection(currentProgress);
      for (let transitionCount = 0; transitionCount <= DIAGNOSTIC_SECTIONS.length; transitionCount += 1) {
        if (!sectionKey) {
          if (currentProgress.some((section) => section.status === "insufficient_items")) {
            throw new Error("Ce diagnostic est suspendu : une section manque encore de questions validées.");
          }
          const completed = await finalizeAdaptiveDiagnostic({
            service,
            studentId,
            runId: existingRun.id as string,
            completedAt: new Date().toISOString(),
            probeCount: currentProgress.reduce((total, section) => total + section.probeCount, 0),
          });
          return { done: true as const, ...completed };
        }
        const reconciledAt = new Date().toISOString();
        const reconciled = await reconcileDiagnosticSection({
          db: service,
          studentId,
          runId: existingRun.id as string,
          sectionKey,
          at: reconciledAt,
        });
        if (!reconciled.decision.stop) {
          const item = await assignDiagnosticItem({
            db: service,
            studentId,
            runId: existingRun.id as string,
            sectionKey,
            candidate: reconciled.candidate,
          });
          if (!item) {
            await abandonDiagnosticRun(service, existingRun.id as string);
            throw new Error("La banque ne permet pas de reprendre cette section.");
          }
          return {
            runId: existingRun.id as string,
            startedAt: existingRun.started_at as string,
            item,
            progress: await loadDiagnosticProgress(existingRun.id as string, service),
            minTotalProbes: DIAGNOSTIC_MIN_TOTAL_PROBES,
            maxTotalProbes: DIAGNOSTIC_MAX_TOTAL_PROBES,
            resumed: true,
            isPilot: Boolean(existingRun.is_pilot),
            done: false as const,
          };
        }
        if (reconciled.decision.reason === "insufficient_items") {
          throw new Error("Ce diagnostic est suspendu : une section manque encore de questions validées.");
        }
        currentProgress = await loadDiagnosticProgress(existingRun.id as string, service);
        const nextSectionKey = nextDiagnosticSection(currentProgress);
        if (!nextSectionKey) {
          sectionKey = null;
          continue;
        }
        const [runTransition, sectionTransition] = await Promise.all([
          service.from("diagnostic_runs").update({ current_section: nextSectionKey }).eq("id", existingRun.id),
          service.from("diagnostic_run_sections").update({
            status: "active",
            started_at: reconciledAt,
          }).eq("run_id", existingRun.id).eq("section_key", nextSectionKey).eq("status", "pending"),
        ]);
        if (runTransition.error || sectionTransition.error) {
          throw new Error(runTransition.error?.message ?? sectionTransition.error?.message);
        }
        sectionKey = nextSectionKey;
      }
      throw new Error("Le diagnostic n’a pas pu reprendre sa section active.");
    }
  }
  await supabase.from("diagnostic_runs")
    .update({ status: "abandoned", completed_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("status", "running");
  const requirement = await diagnosticRequirement(studentId, service);
  const [{ data: goal, error: goalError }, publishedReleaseLookup, { data: estimates, error: estimatesError }, pilotContextLookup] = await Promise.all([
    supabase.from("learning_goals").select("id,target_framework,target_level,target_grade").eq("student_id", studentId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    service.from("taxonomy_releases").select("id").eq("release_key", DIAGNOSTIC_TAXONOMY_RELEASE_KEY).eq("status", "published").maybeSingle(),
    service.from("student_competency_estimates").select("node_id,mastery_probability,uncertainty,evidence_count,receptive_score,productive_score,written_score,oral_score,last_evidence_at").eq("student_id", studentId),
    service.rpc("diagnostic_pilot_context", { p_student_id: studentId }),
  ]);
  if (goalError || estimatesError) throw new Error(goalError?.message ?? estimatesError?.message);
  if (!goal) throw new Error("Choisis d’abord ton objectif.");
  if (pilotContextLookup.error) throw new Error(pilotContextLookup.error.message);
  const pilotContext = pilotContextLookup.data as {
    enrollmentId: string;
    taxonomyReleaseId: string;
    bankReleaseId: string;
    expiresAt: string;
  } | null;
  const isPilot = Boolean(pilotContext);
  const pilotReleaseLookup = pilotContext
    ? await service.from("taxonomy_releases")
      .select("id")
      .eq("id", pilotContext.taxonomyReleaseId)
      .eq("release_key", DIAGNOSTIC_TAXONOMY_RELEASE_KEY)
      .in("status", ["validating", "published"])
      .maybeSingle()
    : null;
  const release = isPilot ? pilotReleaseLookup?.data : publishedReleaseLookup.data;
  const releaseError = isPilot ? pilotReleaseLookup?.error : publishedReleaseLookup.error;
  if (releaseError || !release?.id) {
    throw new Error(`La taxonomie ${DIAGNOSTIC_TAXONOMY_RELEASE_KEY} n’est pas publiée.`);
  }
  const [itemBankLookup, priorRunLookup] = await Promise.all([
    (pilotContext
      ? service.from("diagnostic_item_bank_releases")
        .select("id")
        .eq("id", pilotContext.bankReleaseId)
        .eq("bank_key", DIAGNOSTIC_ITEM_BANK_RELEASE_KEY)
        .eq("taxonomy_release_id", release.id)
        .in("status", ["draft", "validating"])
      : service.from("diagnostic_item_bank_releases")
      .select("id")
      .eq("bank_key", DIAGNOSTIC_ITEM_BANK_RELEASE_KEY)
      .eq("taxonomy_release_id", release.id)
      .eq("status", "published"))
      .maybeSingle(),
    service.from("diagnostic_runs")
      .select("id,taxonomy_release_id,protocol_version,completed_at")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .eq("is_pilot", isPilot)
      .eq("taxonomy_release_id", release.id)
      .eq("protocol_version", DIAGNOSTIC_PROTOCOL_VERSION)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const { data: itemBank, error: itemBankError } = itemBankLookup;
  const { data: latestCompatibleRun, error: priorRunError } = priorRunLookup;
  if (itemBankError || priorRunError) {
    throw new Error(itemBankError?.message ?? priorRunError?.message);
  }
  if (!itemBank) {
    throw new Error(isPilot
      ? "La banque pilote n’est plus disponible. Contacte l’équipe de test."
      : `La banque ${DIAGNOSTIC_ITEM_BANK_RELEASE_KEY} n’est pas publiée pour la taxonomie v2.`);
  }
  const { data: priorDiagnosticRows, error: priorDiagnosticError } = latestCompatibleRun
    ? await service.from("diagnostic_node_results")
      .select("node_id,mastery_probability,uncertainty,direct_evidence_count,evidence_coverage_confirmed,evidence_kind,classification,section_key")
      .eq("run_id", latestCompatibleRun.id)
    : { data: [], error: null };
  if (priorDiagnosticError) throw new Error(priorDiagnosticError.message);
  const priorStateSnapshot = buildDiagnosticPriorStateSnapshot({
    taxonomyReleaseId: release.id as string,
    protocolVersion: DIAGNOSTIC_PROTOCOL_VERSION,
    globalEstimates: (estimates ?? []) as Record<string, unknown>[],
    latestCompletedDiagnostic: latestCompatibleRun ? {
      runId: latestCompatibleRun.id as string,
      taxonomyReleaseId: latestCompatibleRun.taxonomy_release_id as string,
      protocolVersion: latestCompatibleRun.protocol_version as string,
      completedAt: latestCompatibleRun.completed_at as string | null,
      resultRows: (priorDiagnosticRows ?? []) as Record<string, unknown>[],
    } : null,
  });
  const readinessResult = await service.rpc(isPilot
    ? "diagnostic_pilot_bank_readiness"
    : "diagnostic_bank_readiness", {
    p_taxonomy_release_id: release.id,
    p_bank_release_id: itemBank.id,
  });
  if (readinessResult.error) throw new Error(readinessResult.error.message);
  const rawReadiness = readinessResult.data as { ready?: boolean; sections?: DiagnosticBankSectionReadiness[] } | null;
  const readiness = assessDiagnosticBankReadiness(rawReadiness?.sections ?? []);
  if (!rawReadiness?.ready || !readiness.ready) {
    const missing = readiness.sections.filter((section) => !section.ready)
      .map((section) => diagnosticSection(section.key).labelFr)
      .join(", ");
    throw new Error(`Le diagnostic n’est pas encore prêt pour : ${missing}.`);
  }
  const { data: memberships, error: membershipError } = await service
    .from("taxonomy_release_memberships")
    .select("record_id,record_type,stable_key,record_snapshot")
    .eq("release_id", release.id)
    .in("record_type", ["competency_node", "progression_mapping", "competency_edge"]);
  if (membershipError) throw new Error(membershipError.message);
  const releaseNodeIds = (memberships ?? [])
    .filter((row) => row.record_type === "competency_node")
    .map((row) => row.record_id as string);
  const mappingMemberships = (memberships ?? []).filter((row) => row.record_type === "progression_mapping");
  const edgeMemberships = (memberships ?? []).filter((row) => row.record_type === "competency_edge");
  if (!releaseNodeIds.length || !mappingMemberships.length) {
    throw new Error("La taxonomie v2 publiée ne contient pas la progression requise.");
  }
  const diagnosticNodes = (memberships ?? [])
    .filter((membership) => membership.record_type === "competency_node")
    .flatMap((membership) => {
      const snapshot = membership.record_snapshot as Record<string, unknown> | null;
      const sectionKey = sectionForStrand(
        snapshot?.strand as Parameters<typeof sectionForStrand>[0],
      );
      return sectionKey ? [{ id: membership.record_id as string, sectionKey }] : [];
    });
  const releaseNodeByKey = new Map((memberships ?? [])
    .filter((row) => row.record_type === "competency_node")
    .map((row) => [row.stable_key as string, row.record_id as string]));
  const releaseMappings = mappingMemberships.flatMap((membership) => {
    const snapshot = membership.record_snapshot as Record<string, unknown> | null;
    const nodeKey = String(membership.stable_key).split(":", 1)[0];
    const nodeId = releaseNodeByKey.get(nodeKey);
    return nodeId && snapshot
      && typeof snapshot.learnerMode === "string"
      && typeof snapshot.framework === "string"
      ? [{
          nodeId,
          learnerMode: snapshot.learnerMode,
          framework: snapshot.framework,
          levelMin: typeof snapshot.levelMin === "string" ? snapshot.levelMin : null,
        }]
      : [];
  });
  const releaseEdges = edgeMemberships.flatMap((membership) => {
    const snapshot = membership.record_snapshot as Record<string, unknown> | null;
    const sourceNodeId = typeof snapshot?.source === "string"
      ? releaseNodeByKey.get(snapshot.source)
      : undefined;
    const targetNodeId = typeof snapshot?.target === "string"
      ? releaseNodeByKey.get(snapshot.target)
      : undefined;
    if (!sourceNodeId || !targetNodeId || snapshot?.type !== "prerequisite") return [];
    return [{
      sourceNodeId,
      targetNodeId,
      prerequisiteClass: snapshot.prerequisiteClass === "hard"
        ? "hard" as const
        : snapshot.prerequisiteClass === "soft"
          ? "soft" as const
          : null,
    }];
  });
  const targetFramework = goal.target_framework as string;
  const targetLevel = String(goal.target_level ?? goal.target_grade ?? "");
  const targetScope = selectDiagnosticTargets({
    nodes: diagnosticNodes,
    mappings: releaseMappings,
    edges: releaseEdges,
    goal: {
      learnerMode: targetFramework === "cefr"
        ? "french_second_language"
        : "french_first_language",
      framework: targetFramework,
      targetLevel,
    },
    assessmentKind: requirement.kind,
    focusNodeIds: requirement.targetNodeIds,
    focusReason: requirement.reason === "inactivity" ? "stale" : "uncertain",
  });
  if (targetScope.insufficientGoalSections.length) {
    const missing = targetScope.insufficientGoalSections
      .map((key) => diagnosticSection(key).labelFr)
      .join(", ");
    throw new Error(`L’objectif ${targetLevel || "actif"} ne fournit pas assez de compétences pour : ${missing}.`);
  }
  const assessmentNodes = targetScope.targets;
  const firstSection = DIAGNOSTIC_SECTIONS[0].key;
  const { data: run, error } = await supabase.from("diagnostic_runs").insert({
    student_id: studentId,
    learning_goal_id: goal.id,
    run_type: requirement.kind === "calibration" ? "calibration" : requirement.kind,
    trigger_reason: requirement.reason,
    taxonomy_release_id: release.id,
    item_bank_release_id: itemBank.id,
    is_pilot: isPilot,
    pilot_enrollment_id: pilotContext?.enrollmentId ?? null,
    protocol_version: DIAGNOSTIC_PROTOCOL_VERSION,
    current_section: firstSection,
    total_min_probes: DIAGNOSTIC_MIN_TOTAL_PROBES,
    total_max_probes: DIAGNOSTIC_MAX_TOTAL_PROBES,
    config_snapshot: {
      inactivity_days: 60,
      uncertainty_threshold: .65,
      uncertainty_target: .4,
      graph_coverage_target: .7,
      target_framework: targetFramework,
      target_level: targetLevel,
      target_scope_fallback_sections: targetScope.fallbackSections,
      sections: DIAGNOSTIC_SECTIONS,
    },
    prior_state_snapshot: priorStateSnapshot,
  }).select("id,started_at").single();
  if (error?.code === "23505") {
    throw new Error("Un diagnostic vient déjà de démarrer. Réessaie pour le reprendre.");
  }
  if (error || !run) throw new Error(error?.message ?? "Diagnostic non créé.");
  const { error: targetError } = await service.from("diagnostic_run_targets").insert(
    assessmentNodes.map((node) => ({
      run_id: run.id,
      node_id: node.id,
      target_reason: node.targetReason,
    })),
  );
  if (targetError) {
    await abandonDiagnosticRun(service, run.id as string);
    throw new Error(targetError.message);
  }
  const { error: sectionError } = await service.from("diagnostic_run_sections").insert(
    DIAGNOSTIC_SECTIONS.map((section, index) => ({
      run_id: run.id,
      section_key: section.key,
      position: index + 1,
      status: index === 0 ? "active" : "pending",
      min_probes: section.minProbes,
      max_probes: section.maxProbes,
      min_distinct_nodes: section.minDistinctNodes,
      target_node_count: assessmentNodes.filter((node) => node.sectionKey === section.key).length,
      started_at: index === 0 ? new Date().toISOString() : null,
    })),
  );
  if (sectionError) {
    await abandonDiagnosticRun(service, run.id as string);
    throw new Error(sectionError.message);
  }
  const item = await assignDiagnosticItem({ db: service, studentId, runId: run.id as string, sectionKey: firstSection });
  if (!item) {
    await abandonDiagnosticRun(service, run.id as string);
    throw new Error("La banque d’items ne contient pas encore assez de questions.");
  }
  return {
    runId: run.id as string,
    startedAt: run.started_at as string,
    item,
    progress: await loadDiagnosticProgress(run.id as string, service),
    minTotalProbes: DIAGNOSTIC_MIN_TOTAL_PROBES,
    maxTotalProbes: DIAGNOSTIC_MAX_TOTAL_PROBES,
    resumed: false,
    isPilot,
    done: false as const,
  };
}

export async function loadDiagnosticRequirement(input: unknown) {
  checked(emptySchema, input);
  const { studentId } = await context();
  return diagnosticRequirement(studentId, createServiceClient());
}

export async function requestOnDemandGeneration(input: unknown) {
  const data = checked(onDemandRequestSchema, input); const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  const sanitized = sanitizeStudentTopic(data.topic); if (!sanitized.allowed) throw new Error("Ce sujet ne peut pas être utilisé.");
  const service = createServiceClient(); const { data: policy } = await service.from("generation_rollout_policies").select("id,stage,enabled,low_risk_topic_allowlist").eq("active", true).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!policy?.enabled || policy.stage === "off") throw new Error("La création à la demande n’est pas encore disponible.");
  if (!(policy.low_risk_topic_allowlist as string[]).includes(data.topicKey)) throw new Error("Ce sujet n’est pas encore disponible pendant le déploiement progressif.");
  const idempotencyKey = createHash("sha256").update(`${studentId}:${data.clientRequestId}`).digest("hex");
  const { data: run, error } = await service.from("on_demand_workflow_runs").upsert({ student_id: studentId, idempotency_key: idempotencyKey, input_payload: { topicKey: data.topicKey, topic: sanitized.value, textType: data.textType, rolloutPolicyId: policy.id } }, { onConflict: "student_id,idempotency_key", ignoreDuplicates: false }).select("id,status,current_stage,created_at").single();
  if (error || !run) throw new Error(error?.message ?? "Demande non créée."); await trackServer(studentId, "on_demand_generation_requested", { workflow_run_id: run.id, topic_key: data.topicKey }); return run;
}

export async function loadStudentCatchUpPlan(input: unknown) {
  checked(emptySchema, input); const { supabase, studentId } = await context();
  if (process.env.CATCH_UP_PLAN_ENABLED === "false") return [];
  return getCatchUpPlan(studentId, supabase);
}

export type SessionPlanEntry = {
  type: "practice" | "review_node" | "review_card";
  role: "new" | "compression" | "review";
  nodeId?: string;
  cardId?: string;
  label: string;
  mastery?: number;
  href: string;
};

/** Today's itinerary: due reviews (compressed through encompassing tasks),
 * then new learning, interleaved to keep confusable skills apart. */
export async function loadStudentSessionPlan(input: unknown): Promise<SessionPlanEntry[]> {
  checked(emptySchema, input);
  const { supabase, studentId } = await context();
  if (process.env.CATCH_UP_PLAN_ENABLED === "false") return [];
  const service = createServiceClient();
  const nowMs = Date.now();

  const [steps, edgeRows, estimateRows, dueCardRows] = await Promise.all([
    getCatchUpPlan(studentId, supabase),
    service.from("competency_edges").select("source_node_id,target_node_id,edge_type,strength").in("edge_type", ["encompasses", "same_family"]),
    service.from("student_competency_estimates").select("node_id,mastery_probability,memory_stability,last_evidence_at").eq("student_id", studentId),
    service.from("retrieval_schedules")
      .select("retrieval_card_id,due_at,retrieval_cards!inner(id,student_id,node_id)")
      .eq("retrieval_cards.student_id", studentId)
      .eq("status", "due")
      .lte("due_at", new Date(nowMs).toISOString()),
  ]);
  if (edgeRows.error) throw new Error(edgeRows.error.message);
  if (estimateRows.error) throw new Error(estimateRows.error.message);
  if (dueCardRows.error) throw new Error(dueCardRows.error.message);

  // Nodes whose raw mastery cleared the gate but whose decayed mastery fell
  // back below it: due for a memory refresh.
  const dueNodeReviews = (estimateRows.data ?? []).flatMap((row) => {
    const mastery = Number(row.mastery_probability);
    const stability = row.memory_stability == null ? null : Number(row.memory_stability);
    const lastAt = row.last_evidence_at as string | null;
    if (mastery < 0.85 || stability == null || !lastAt) return [];
    const effective = effectiveMastery({ mastery, memoryStability: stability, lastEvidenceAt: lastAt }, nowMs);
    if (effective >= 0.85) return [];
    const elapsedDays = Math.max(0, (nowMs - Date.parse(lastAt)) / 86_400_000);
    return [{ nodeId: row.node_id as string, overdueDays: Math.max(0, elapsedDays - stability) }];
  });

  const dueCards = (dueCardRows.data ?? []).map((row) => {
    const card = row.retrieval_cards as unknown as { id: string; node_id: string | null };
    return {
      cardId: card.id,
      nodeId: card.node_id,
      overdueDays: Math.max(0, (nowMs - Date.parse(row.due_at as string)) / 86_400_000),
    };
  });

  const availableSteps = steps.filter((step) => step.status !== "pending" && step.requiredEvidenceExpectation !== "independent_production");
  const plan = buildSessionPlan({
    dueNodeReviews,
    dueCards,
    newSteps: availableSteps.map((step, index) => ({ nodeId: step.nodeId, position: index })),
    encompassingEdges: (edgeRows.data ?? [])
      .filter((edge) => edge.edge_type === "encompasses")
      .map((edge) => ({ sourceNodeId: edge.source_node_id as string, targetNodeId: edge.target_node_id as string, strength: Number(edge.strength) })),
    familyPairs: (edgeRows.data ?? [])
      .filter((edge) => edge.edge_type === "same_family")
      .map((edge) => [edge.source_node_id as string, edge.target_node_id as string] as [string, string]),
  });

  const nodeIds = [...new Set(plan.flatMap((activity) => "nodeId" in activity && activity.nodeId ? [activity.nodeId] : []))];
  const { data: nodeRows } = nodeIds.length
    ? await service.from("competency_nodes").select("id,label_fr").in("id", nodeIds)
    : { data: [] as Array<{ id: string; label_fr: string }> };
  const labelById = new Map((nodeRows ?? []).map((node) => [node.id as string, node.label_fr as string]));
  const masteryByNode = new Map((estimateRows.data ?? []).map((row) => [row.node_id as string, Number(row.mastery_probability)]));

  return plan.map((activity): SessionPlanEntry => {
    if (activity.type === "review_card") {
      return {
        type: "review_card",
        role: "review",
        cardId: activity.cardId,
        nodeId: activity.nodeId ?? undefined,
        label: activity.nodeId ? `Réactiver : ${labelById.get(activity.nodeId) ?? "notion"}` : "Rappel de lecture",
        href: "/student/memory",
      };
    }
    const label = labelById.get(activity.nodeId) ?? activity.nodeId;
    if (activity.type === "review_node") {
      return {
        type: "review_node", role: "review", nodeId: activity.nodeId,
        label: `Réviser : ${label}`,
        mastery: masteryByNode.get(activity.nodeId),
        href: `/student/practice/${activity.nodeId}`,
      };
    }
    return {
      type: "practice", role: activity.role, nodeId: activity.nodeId, label,
      mastery: masteryByNode.get(activity.nodeId),
      href: `/student/practice/${activity.nodeId}`,
    };
  });
}

export async function submitNodePractice(input: unknown) {
  const data = checked(practiceAttemptSchema, input); const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  if (data.answerText) await moderateOrReject({ supabase, studentId, text: data.answerText, field: "memory_retrieval" });
  const service = createServiceClient();
  const { data: item } = await service.from("competency_items").select("id,primary_node_id,learner_mode,modality,response_type,validator_type,validator_config,correct_answer,acceptable_answers,competency_item_choices(id,is_correct,feedback_fr)").eq("id", data.itemId).eq("primary_node_id", data.nodeId).in("review_status", ["auto_approved", "human_approved"]).single();
  if (!item) throw new Error("Exercice introuvable.");
  const choices = item.competency_item_choices as unknown as Array<{ id: string; is_correct: boolean; feedback_fr: string | null }>;
  let correct = false; let feedbackFr: string | null = null;
  if (data.selectedChoiceId) { const selected = choices.find((choice) => choice.id === data.selectedChoiceId); if (!selected) throw new Error("Choix invalide."); correct = selected.is_correct; feedbackFr = selected.feedback_fr; }
  else { const validation = await validateAnswer(data.answerText ?? "", { validatorType: item.validator_type as "exact" | "regex" | "conjugator", config: item.validator_config as Record<string, unknown> | undefined, correctAnswer: item.correct_answer as string | undefined, acceptableAnswers: item.acceptable_answers as string[] }); correct = validation.pass; feedbackFr = validation.reason ?? null; }
  const now = new Date().toISOString();
  const hintsUsed = data.hintsUsed ?? 0;
  await service.from("competency_attempts").insert({ student_id: studentId, item_id: item.id, node_id: data.nodeId, learner_mode: item.learner_mode, modality: item.modality, answer_text: data.answerText ?? null, selected_choice_id: data.selectedChoiceId ?? null, is_correct: correct, score: correct ? 1 : 0, latency_ms: Math.max(0, Date.now()-Date.parse(data.startedAt)), hints_used: hintsUsed, context: "practice", attempted_at: now });
  const { mastery } = await recordDirectCompetencyEvidence({
    service,
    studentId,
    nodeId: data.nodeId,
    at: now,
    evidenceExpectation: nodePracticeEvidenceExpectation(item.response_type as string),
    // Hinted successes are weaker evidence: down-weight by the ladder depth.
    updateMastery: (prior) => correct && hintsUsed > 0
      ? bktUpdateWeighted(prior, true, 1 / (1 + hintsUsed))
      : bktUpdate(prior, correct, {}, guessFromChoices(choices.length)),
    correct,
    practiced: true,
    // Only unaided successes may confirm the 0.85 mastery gate.
    pathMastery: (value) => correct && hintsUsed === 0 ? value : Math.min(value, 0.84),
  });
  const {data:scaffold}=await service.from("student_competency_estimates").select("scaffold_level,unaided_success_streak").eq("student_id",studentId).eq("node_id",data.nodeId).single();
  const scaffoldState=nextScaffoldState({level:Number(scaffold?.scaffold_level??0),unaidedSuccessStreak:Number(scaffold?.unaided_success_streak??0)},correct,hintsUsed);
  const{error:scaffoldError}=await service.from("student_competency_estimates").update({scaffold_level:scaffoldState.level,unaided_success_streak:scaffoldState.unaidedSuccessStreak}).eq("student_id",studentId).eq("node_id",data.nodeId);if(scaffoldError)throw new Error(scaffoldError.message);
  await propagateImplicitRepetitions(service, studentId, data.nodeId, correct, now);
  await updateEloRatings(service, studentId, item.id, data.nodeId, correct, now);
  // Failure protocol: a second consecutive miss on this node routes the
  // student to its weakest prerequisite (graph-guided remediation).
  let remediation: { nodeId: string; label: string } | null = null;
  if (!correct) {
    const { data: previousAttempts } = await service.from("competency_attempts")
      .select("is_correct").eq("student_id", studentId).eq("node_id", data.nodeId)
      .eq("context", "practice").lt("attempted_at", now)
      .order("attempted_at", { ascending: false }).limit(1);
    if (previousAttempts?.length && previousAttempts[0].is_correct === false) {
      remediation = await weakestPrerequisite(service, studentId, data.nodeId);
    }
  }
  if (mastery >= 0.85) {
    const { data: node } = await service.from("competency_nodes").select("label_fr").eq("id", data.nodeId).single();
    const { data: card } = await service.from("retrieval_cards").upsert({ student_id: studentId, node_id: data.nodeId, card_type: "competency_node", prompt_fr: `Explique avec tes mots : ${node?.label_fr ?? "cette compétence"}.`, rubric: { node_id: data.nodeId } }, { onConflict: "student_id,node_id" }).select("id").single();
    if (card) await service.from("retrieval_schedules").upsert({ retrieval_card_id: card.id, due_at: dueAtFrom(Date.now(), 1), interval_days: 1, ease_factor: 2.5, repetitions: 0, status: "due" }, { onConflict: "retrieval_card_id" });
    await recordDailyActivity(service,studentId,now,"practice",true);
  }
  revalidatePath("/student"); revalidatePath("/student/frontier");
  return { correct, feedbackFr, mastery, mastered: mastery >= 0.85, remediation, scaffoldLevel: scaffoldState.level };
}

/** Online Elo/1PL calibration: the answer is a match between learner and
 * item; both ratings move with an uncertainty-decayed K. */
async function updateEloRatings(service: SupabaseClient, studentId: string, itemId: string, nodeId: string, correct: boolean, at: string) {
  const [{ data: node }, { data: item }, ] = await Promise.all([
    service.from("competency_nodes").select("strand").eq("id", nodeId).single(),
    service.from("competency_items").select("difficulty,difficulty_rating,rating_attempts").eq("id", itemId).single(),
  ]);
  if (!node || !item) return;
  const strand = node.strand as string;
  const { data: learner } = await service.from("student_ability_ratings")
    .select("rating,attempts").eq("student_id", studentId).eq("strand", strand).maybeSingle();
  const theta = Number(learner?.rating ?? 0);
  const learnerAttempts = Number(learner?.attempts ?? 0);
  const itemRating = item.difficulty_rating != null
    ? Number(item.difficulty_rating)
    : itemRatingFromDifficulty(item.difficulty == null ? null : Number(item.difficulty));
  const itemAttempts = Number(item.rating_attempts ?? 0);

  const nextTheta = eloUpdate(theta, itemRating, correct, learnerAttempts);
  // The item's rating moves opposite to the learner's outcome.
  const nextItemRating = eloUpdate(itemRating, theta, !correct, itemAttempts);

  const { error: learnerError } = await service.from("student_ability_ratings").upsert({
    student_id: studentId, strand, rating: nextTheta, attempts: learnerAttempts + 1, updated_at: at,
  }, { onConflict: "student_id,strand" });
  if (learnerError) throw new Error(learnerError.message);
  const { error: itemError } = await service.from("competency_items").update({
    difficulty_rating: nextItemRating, rating_attempts: itemAttempts + 1,
  }).eq("id", itemId);
  if (itemError) throw new Error(itemError.message);
}

/** The direct prerequisite the student is weakest on (decayed mastery < 0.85). */
async function weakestPrerequisite(service: SupabaseClient, studentId: string, nodeId: string) {
  const { data: prereqEdges } = await service.from("competency_edges")
    .select("source_node_id").eq("target_node_id", nodeId).eq("edge_type", "prerequisite");
  const prereqIds = (prereqEdges ?? []).map((edge) => edge.source_node_id as string);
  if (!prereqIds.length) return null;
  const [{ data: estimateRows }, { data: nodeRows }] = await Promise.all([
    service.from("student_competency_estimates")
      .select("node_id,mastery_probability,memory_stability,last_evidence_at")
      .eq("student_id", studentId).in("node_id", prereqIds),
    service.from("competency_nodes").select("id,label_fr").in("id", prereqIds),
  ]);
  const nowMs = Date.now();
  const masteryById = new Map((estimateRows ?? []).map((row) => [row.node_id as string, effectiveMastery({
    mastery: Number(row.mastery_probability),
    memoryStability: row.memory_stability == null ? null : Number(row.memory_stability),
    lastEvidenceAt: row.last_evidence_at as string | null,
  }, nowMs)]));
  let weakest: { nodeId: string; mastery: number } | null = null;
  for (const id of prereqIds) {
    const value = masteryById.get(id) ?? 0;
    if (value < 0.85 && (weakest === null || value < weakest.mastery)) weakest = { nodeId: id, mastery: value };
  }
  if (!weakest) return null;
  const label = (nodeRows ?? []).find((node) => node.id === weakest!.nodeId)?.label_fr as string | undefined;
  return { nodeId: weakest.nodeId, label: label ?? "un prérequis" };
}

export async function loadWritingFeedback(input: unknown) {
  const data = checked(writingFeedbackSchema, input); const { supabase, studentId } = await context();
  if (process.env.WRITING_EVALUATION_ENABLED === "false") return null;
  const { textVersionId } = await contentIds(supabase, data.textKey);
  const { data: session } = await supabase.from("reading_sessions").select("id").eq("student_id", studentId).eq("text_version_id", textVersionId).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (!session) return null;
  const { data: summary } = await supabase.from("student_summaries").select("id,summary_text").eq("session_id", session.id).maybeSingle();
  if (!summary) return null;
  const { data: evaluations } = await supabase.from("writing_evaluations").select("revision_number,submitted_text,rubric,annotations,revision_plan,degraded,created_at").eq("student_summary_id", summary.id).order("revision_number");
  return { summaryId: summary.id as string, originalText: summary.summary_text as string, evaluations: evaluations ?? [] };
}

export async function reviseSummary(input: unknown) {
  const data = checked(writingRevisionSchema, input); const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  await moderateOrReject({ supabase, studentId, text: data.revisedText, field: "reading_summary" });
  const current = await loadWritingFeedback({ textKey: data.textKey });
  if (!current) throw new Error("Résumé introuvable.");
  if (current.evaluations.some((evaluation) => Number(evaluation.revision_number) === 1)) throw new Error("La révision a déjà été envoyée.");
  const text = await getPublishedReadingText(data.textKey, supabase); if (!text) throw new Error("Texte introuvable.");
  const service = createServiceClient(); const prompt = await getActivePrompt("summary_scoring", service);
  const evaluation = await evaluateAndStoreWriting({ service, studentId, summaryId: current.summaryId, revisionNumber: 1, sourceText: text.body.join("\n\n"), studentText: data.revisedText, keywords: text.concepts, systemPrompt: prompt.promptText });
  revalidatePath(`/student/results/${data.textKey}`); revalidatePath("/student/frontier");
  return evaluation;
}

async function finalizeAdaptiveDiagnostic(input: {
  service: SupabaseClient;
  studentId: string;
  runId: string;
  completedAt: string;
  probeCount: number;
}) {
  const { data: run, error: runError } = await input.service.from("diagnostic_runs")
    .select("id,learning_goal_id,taxonomy_release_id,protocol_version,prior_state_snapshot,is_pilot")
    .eq("id", input.runId)
    .eq("student_id", input.studentId)
    .single();
  if (runError || !run?.taxonomy_release_id) throw new Error(runError?.message ?? "Version du diagnostic introuvable.");
  const [{ data: memberships, error: membershipError }, { data: targetRows, error: targetError }, { data: resultRows, error: resultError }, { data: student, error: studentError }, { data: goal, error: goalError }, { data: learnerProfile, error: profileError }, progress] = await Promise.all([
    input.service.from("taxonomy_release_memberships").select("record_id,record_type,stable_key,record_snapshot").eq("release_id", run.taxonomy_release_id).in("record_type", ["competency_node", "competency_edge", "mastery_evidence", "progression_mapping"]),
    input.service.from("diagnostic_run_targets").select("node_id").eq("run_id", input.runId),
    input.service.from("diagnostic_node_results").select("node_id,mastery_probability,uncertainty,direct_evidence_count,evidence_coverage_confirmed,evidence_kind,classification,section_key").eq("run_id", input.runId),
    input.service.from("students").select("current_grade").eq("id", input.studentId).single(),
    input.service.from("learning_goals").select("target_framework,target_level,target_grade").eq("id", run.learning_goal_id).single(),
    input.service.from("learner_profiles").select("student_type").eq("student_id", input.studentId).maybeSingle(),
    loadDiagnosticProgress(input.runId, input.service),
  ]);
  if (membershipError || targetError || resultError || studentError || goalError || profileError) {
    throw new Error(membershipError?.message ?? targetError?.message ?? resultError?.message ?? studentError?.message ?? goalError?.message ?? profileError?.message);
  }
  const releaseNodeIds = new Set((memberships ?? [])
    .filter((row) => row.record_type === "competency_node")
    .map((row) => row.record_id as string));
  const nodeIds = (targetRows ?? []).map((row) => row.node_id as string);
  if (!nodeIds.length || nodeIds.some((nodeId) => !releaseNodeIds.has(nodeId))) {
    throw new Error("La portée du diagnostic ne correspond pas à sa taxonomie publiée.");
  }
  const nodeIdSet = new Set(nodeIds);
  const { data: nodeRows, error: nodeError } = await input.service.from("competency_nodes")
    .select("id,key,label_fr,strand")
    .in("id", nodeIds);
  if (nodeError) throw new Error(nodeError.message);
  const nodeIdByKey = new Map((nodeRows ?? []).map((row) => [row.key as string, row.id as string]));
  const mergedEstimateSnapshots = mergeDiagnosticHistorySnapshots(
    run.prior_state_snapshot,
    (resultRows ?? []) as Record<string, unknown>[],
    {
      taxonomyReleaseId: run.taxonomy_release_id as string,
      protocolVersion: run.protocol_version as string,
    },
  );
  const estimates = new Map([...mergedEstimateSnapshots]
    .filter(([nodeId]) => nodeIdSet.has(nodeId))
    .map(([nodeId, estimate]) => [
      nodeId,
      {
        masteryProbability: estimate.masteryProbability,
        uncertainty: estimate.uncertainty,
        directEvidenceCount: estimate.directEvidenceCount,
        evidenceCoverageConfirmed: estimate.evidenceCoverageConfirmed,
        evidenceKind: estimate.evidenceKind,
        classification: estimate.classification,
      } satisfies DiagnosticPathEstimate,
    ]));
  const requiresIndependentVerification = new Set((memberships ?? [])
    .flatMap((membership) => {
      const snapshot = membership.record_snapshot as Record<string, unknown> | null;
      const nodeKey = String(membership.stable_key).split(":", 1)[0];
      const nodeId = nodeIdByKey.get(nodeKey);
      return membership.record_type === "mastery_evidence"
        && snapshot?.expectation === "independent_production"
        && nodeId
        ? [nodeId]
        : [];
    }));
  const releasePathEdges = (memberships ?? []).flatMap((membership) => {
    const snapshot = membership.record_snapshot as Record<string, unknown> | null;
    const sourceNodeId = typeof snapshot?.source === "string"
      ? nodeIdByKey.get(snapshot.source)
      : undefined;
    const targetNodeId = typeof snapshot?.target === "string"
      ? nodeIdByKey.get(snapshot.target)
      : undefined;
    return membership.record_type === "competency_edge"
      && snapshot?.type === "prerequisite"
      && sourceNodeId
      && targetNodeId
      ? [{
          sourceNodeId,
          targetNodeId,
          prerequisiteClass: snapshot.prerequisiteClass === "soft"
            ? "soft" as const
            : snapshot.prerequisiteClass === "hard"
              ? "hard" as const
              : null,
        }]
      : [];
  });
  const path = buildDiagnosticLearningPath({
    nodes: (nodeRows ?? []).map((node) => ({
      id: node.id as string,
      key: node.key as string,
      label: node.label_fr as string,
      strand: node.strand as Parameters<typeof sectionForStrand>[0],
    })),
    edges: releasePathEdges,
    estimates,
    requiresIndependentVerification,
  });
  const { data: existingPath, error: existingPathError } = await input.service.from("student_learning_paths")
    .select("id")
    .eq("source_diagnostic_run_id", input.runId)
    .maybeSingle();
  if (existingPathError) throw new Error(existingPathError.message);
  let persistedPath = existingPath;
  if (!persistedPath) {
    await input.service.from("student_learning_paths")
      .update({ status: "superseded" })
      .eq("student_id", input.studentId)
      .eq("status", "active");
    const insertedPath = await input.service.from("student_learning_paths")
      .insert({
        student_id: input.studentId,
        source_diagnostic_run_id: input.runId,
        learning_goal_id: run.learning_goal_id,
        taxonomy_release_id: run.taxonomy_release_id,
        provisional: Boolean(run.is_pilot),
        summary: { sectionCounts: path.sectionCounts, firstStepBySection: path.firstStepBySection },
      })
      .select("id")
      .single();
    if (insertedPath.error || !insertedPath.data) throw new Error(insertedPath.error?.message ?? "Parcours non créé.");
    persistedPath = insertedPath.data;
  }
  if (path.steps.length) {
    const { error: stepsError } = await input.service.from("student_learning_path_steps").upsert(
      path.steps.map((step) => ({
        path_id: persistedPath.id,
        node_id: step.nodeId,
        section_key: step.section,
        position: step.position,
        stage: step.stage,
        mastery_snapshot: step.mastery,
        uncertainty_snapshot: step.uncertainty,
        prerequisite_node_ids: step.prerequisiteNodeIds,
        rationale_fr: step.rationaleFr,
        required_evidence_expectation: requiresIndependentVerification.has(step.nodeId)
          ? "independent_production"
          : null,
        status: step.prerequisiteNodeIds.length ? "pending" : "available",
      })), { onConflict: "path_id,node_id", ignoreDuplicates: true },
    );
    if (stepsError) throw new Error(stepsError.message);
    const { error: recommendationError } = await input.service.from("diagnostic_recommendations").upsert(
      path.steps.slice(0, 24).map((step) => ({
        run_id: input.runId,
        student_id: input.studentId,
        recommendation_type: "starting_pathway",
        target_node_id: step.nodeId,
        priority: step.position,
        rationale: step.rationaleFr,
        payload: { pathId: persistedPath.id, section: step.section, stage: step.stage },
      })), { onConflict: "run_id,recommendation_type,target_node_id" },
    );
    if (recommendationError) throw new Error(recommendationError.message);
  }
  const frontier = await frontierForStudent(input.studentId, input.service, {
    releaseId: run.taxonomy_release_id as string,
    runId: input.runId,
  });
  const readingNodeIds = new Set((resultRows ?? [])
    .filter((row) => row.section_key === "reading_comprehension" && row.classification === "mastered")
    .map((row) => row.node_id as string));
  const progressionMemberships = (memberships ?? [])
    .filter((row) => row.record_type === "progression_mapping");
  const targetFramework = String(goal?.target_framework ?? "native_grade");
  const targetLevel = String(goal?.target_level ?? goal?.target_grade ?? "");
  const profileLearnerMode = String(learnerProfile?.student_type ?? "");
  const canonicalLearnerMode = targetFramework === "cefr"
    ? "french_second_language"
    : "french_first_language";
  const pinnedPlacements = progressionMemberships.flatMap((membership) => {
    const nodeKey = String(membership.stable_key).split(":", 1)[0];
    const nodeId = nodeIdByKey.get(nodeKey);
    const snapshot = membership.record_snapshot as Record<string, unknown> | null;
    return nodeId && readingNodeIds.has(nodeId) && snapshot?.framework === targetFramework
      && typeof snapshot.learnerMode === "string"
      && typeof snapshot.levelMin === "string"
      ? [{ nodeId, learnerMode: snapshot.learnerMode, level: snapshot.levelMin }]
      : [];
  });
  const exactModePlacements = pinnedPlacements.filter((mapping) =>
    mapping.learnerMode === profileLearnerMode
  );
  const applicablePlacements = exactModePlacements.length
    ? exactModePlacements
    : pinnedPlacements.filter((mapping) => mapping.learnerMode === canonicalLearnerMode);
  const currentGrade = Math.max(5, Math.min(12, Number(student?.current_grade ?? 7)));
  const nativePlacements = applicablePlacements
    .map((mapping) => Number(mapping.level))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);
  const cefrOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const cefrPlacements = applicablePlacements
    .map((mapping) => mapping.level.toUpperCase())
    .filter((level) => cefrOrder.includes(level))
    .sort((left, right) => cefrOrder.indexOf(left) - cefrOrder.indexOf(right));
  const placementLevel = targetFramework === "native_grade"
    ? String(nativePlacements.length
        ? nativePlacements[Math.floor((nativePlacements.length - 1) / 2)]
        : currentGrade)
    : targetFramework === "cefr" && cefrPlacements.length
      ? cefrPlacements[Math.floor((cefrPlacements.length - 1) / 2)]
      : null;
  const grade = targetFramework === "native_grade"
    ? Math.max(5, Math.min(12, Number(placementLevel)))
    : currentGrade;
  const readingSectionHighConfidence = progress.find(
    (section) => section.key === "reading_comprehension",
  )?.confidence === "high";
  const placementReliable = readingSectionHighConfidence && applicablePlacements.length >= 2;
  const derivedReadingBand = targetFramework === "native_grade"
    ? `Grade ${grade.toFixed(1)}`
    : targetFramework === "cefr"
      ? placementLevel
        ? `CEFR ${placementLevel}${placementReliable ? "" : " · à confirmer"}`
        : `CEFR à confirmer${targetLevel ? ` · objectif ${targetLevel}` : ""}`
      : `${targetFramework}${placementLevel ? ` ${placementLevel}` : targetLevel ? ` · objectif ${targetLevel}` : ""}`;
  const allHighConfidence = progress.every((section) =>
    section.status === "completed" && section.confidence === "high"
  );
  const overallConfidence = allHighConfidence
    ? "high"
    : progress.some((section) => section.confidence === "low")
      ? "low"
      : "medium";
  const runStoppingReason = progress.some((section) => section.stoppingReason === "max_probes")
    ? "max_probes"
    : progress.some((section) => section.stoppingReason === "low_information_gain")
      ? "low_information_gain"
      : "resolved";
  const summaryPayload = {
    studentFr: "Ton profil par domaine est prêt et ton parcours commence par les prérequis les plus utiles.",
    parentFr: `${frontier.report.missing.length} fondation(s) et ${frontier.report.fragile.length} compétence(s) à consolider ont été repérées.`,
    teacherFr: `Diagnostic en quatre sections terminé après ${input.probeCount} questions; parcours de ${path.steps.length} étapes généré.`,
    system: {
      provisional: Boolean(run.is_pilot),
      mastered: frontier.report.mastered,
      fragile: frontier.report.fragile,
      missing: frontier.report.missing,
      unknown: frontier.report.unknown,
      pathId: persistedPath.id,
      sectionCounts: path.sectionCounts,
      placement: {
        framework: targetFramework,
        level: placementLevel,
        targetLevel,
        learnerMode: exactModePlacements.length ? profileLearnerMode : canonicalLearnerMode,
        reliable: placementReliable,
        legacyNumericBand: targetFramework === "native_grade" ? "derived" : "profile_grade_placeholder",
      },
    },
  };
  const legacyConfidence = targetFramework === "native_grade" ? overallConfidence : "low";
  const { error: readingEstimateError } = await input.service.from("student_reading_estimates").upsert({
    student_id: input.studentId,
    diagnostic_run_id: input.runId,
    estimate_type: "adaptive_diagnostic",
    grade_min: Math.max(5, grade - .5),
    grade_max: Math.min(12, grade + .5),
    confidence: legacyConfidence,
    evidence_count: input.probeCount,
    provisional: Boolean(run.is_pilot),
  }, { onConflict: "diagnostic_run_id" });
  if (readingEstimateError) throw new Error(readingEstimateError.message);
  const { error: diagnosticResultError } = await input.service.from("diagnostic_results").upsert({
    student_id: input.studentId,
    diagnostic_run_id: input.runId,
    grade_min: Math.max(5, grade - .5),
    grade_max: Math.min(12, grade + .5),
    confidence: legacyConfidence,
    recommended_starting_level: `Graph pathway · ${derivedReadingBand}`,
    narrative_estimate: grade,
    expository_estimate: grade,
    argumentative_estimate: grade,
    source_based_estimate: grade,
    summary_text: summaryPayload.studentFr,
    completed_at: input.completedAt,
    provisional: Boolean(run.is_pilot),
  }, { onConflict: "diagnostic_run_id" });
  if (diagnosticResultError) throw new Error(diagnosticResultError.message);
  // Mark the run complete last. If any derived artifact write above fails, the
  // still-running assessment can be retried without asking the learner to
  // repeat the diagnostic.
  const { error: completionError } = await input.service.from("diagnostic_runs").update({
    status: "completed",
    completed_at: input.completedAt,
    current_section: null,
    frontier_report: frontier,
    coverage_report: { sections: progress, pathSteps: path.steps.length },
    stopping_reason: runStoppingReason,
    summary_payload: summaryPayload,
    derived_reading_band: derivedReadingBand,
  }).eq("id", input.runId).eq("student_id", input.studentId).eq("status", "running");
  if (completionError) throw new Error(completionError.message);
  return {
    isPilot: Boolean(run.is_pilot),
    frontier,
    grade,
    placement: summaryPayload.system.placement,
    progress,
    state: await getStudentStateData(input.studentId, input.service),
    learningPath: {
      id: persistedPath.id as string,
      stepCount: path.steps.length,
      sectionCounts: path.sectionCounts,
      firstSteps: path.steps.slice(0, 8),
    },
  };
}

export async function submitAdaptiveDiagnosticProbe(input: unknown) {
  const data = checked(adaptiveProbeSchema, input);
  const { supabase, studentId } = await context();
  const service = createServiceClient();
  const { data: run } = await supabase.from("diagnostic_runs")
    .select("id,probe_count,status,current_section,taxonomy_release_id,is_pilot")
    .eq("id", data.runId)
    .eq("student_id", studentId)
    .eq("status", "running")
    .single();
  if (!run) throw new Error("Diagnostic introuvable.");
  const allowedReviewStatuses = run.is_pilot
    ? ["needs_human_review", "auto_approved", "human_approved"]
    : ["auto_approved", "human_approved"];
  const [{ data: assignment, error: assignmentError }, { data: item, error: itemError }] = await Promise.all([
    service.from("diagnostic_run_items").select("id,item_id,node_id,section_key,item_snapshot,answered_at").eq("id", data.runItemId).eq("run_id", data.runId).single(),
    service.from("competency_items")
      .select("id,primary_node_id,validator_type,validator_config,correct_answer,acceptable_answers,learner_mode,modality,competency_item_choices(id,is_correct)")
      .eq("id", data.itemId).in("review_status", allowedReviewStatuses).single(),
  ]);
  if (itemError || !item) throw new Error("Question introuvable.");
  if (assignmentError || !assignment || assignment.item_id !== data.itemId || assignment.node_id !== item?.primary_node_id) {
    throw new Error("Cette question n’appartient pas à ce diagnostic.");
  }
  const { data: existingResponse } = await service.from("diagnostic_responses")
    .select("id,is_correct,run_id,run_item_id")
    .eq("student_id", studentId)
    .eq("idempotency_key", data.idempotencyKey)
    .maybeSingle();
  if (existingResponse && (
    existingResponse.run_id !== data.runId || existingResponse.run_item_id !== data.runItemId
  )) {
    throw new Error("Cette clé de réponse a déjà été utilisée pour une autre question.");
  }
  if (assignment.answered_at && !existingResponse) {
    throw new Error("Cette réponse a déjà été enregistrée.");
  }
  if (!existingResponse) {
    await moderateDiagnosticAnswer({ supabase, studentId, text: data.answerText });
  }
  const choices = item.competency_item_choices as unknown as Array<{ id: string; is_correct: boolean }>;
  let correct = !!existingResponse?.is_correct;
  if (!existingResponse && data.selectedChoiceId) {
    const choice = choices.find((row) => row.id === data.selectedChoiceId);
    if (!choice) throw new Error("Choix invalide.");
    correct = choice.is_correct;
  } else if (!existingResponse) {
    const validation = await validateAnswer(data.answerText ?? "", {
      validatorType: item.validator_type as "exact" | "regex" | "conjugator",
      config: (item.validator_config ?? undefined) as Record<string, unknown> | undefined,
      correctAnswer: item.correct_answer as string | undefined,
      acceptableAnswers: item.acceptable_answers as string[] | undefined,
    });
    correct = validation.pass;
  }
  const attemptedAt = new Date().toISOString();
  const latencyMs = Math.max(0, Date.now() - Date.parse(data.startedAt));
  const itemSnapshot = assignment.item_snapshot as Pick<LiveDiagnosticItem, "masteryEvidenceId" | "evidenceExpectation">;
  const sectionKey = assignment.section_key as DiagnosticSectionKey;
  const dimensionPatch = diagnosticDimensionPatch(item.modality, correct ? 1 : 0, {
    sectionKey,
    expectation: itemSnapshot.evidenceExpectation,
  });
  const dimensions = Object.keys(dimensionPatch).map((key) =>
    DIMENSION_COLUMN[key as keyof typeof DIMENSION_COLUMN]
  );
  const submission = await service.rpc("submit_section_diagnostic_response", {
    p_student_id: studentId,
    p_run_id: data.runId,
    p_run_item_id: data.runItemId,
    p_item_id: data.itemId,
    p_idempotency_key: data.idempotencyKey,
    p_selected_choice_id: data.selectedChoiceId ?? null,
    p_answer_text: data.answerText ?? null,
    p_is_correct: correct,
    p_latency_ms: latencyMs,
    p_dimensions: dimensions,
    p_mastery_evidence_id: itemSnapshot.masteryEvidenceId,
  });
  if (submission.error) throw new Error(submission.error.message);
  const probeCount = Number((submission.data as { probeCount?: number } | null)?.probeCount ?? run.probe_count);
  const candidate = await nextDiagnosticItem(studentId, data.runId, sectionKey, service);
  const sectionProgress = await refreshSectionProgress({ db: service, runId: data.runId, sectionKey, candidate });
  const decision = evaluateDiagnosticSection(sectionProgress);
  const sectionStatus = decision.stop
    ? decision.reason === "insufficient_items" ? "insufficient_items" : "completed"
    : "active";
  const { error: sectionUpdateError } = await service.from("diagnostic_run_sections").update({
    status: sectionStatus,
    probe_count: sectionProgress.probeCount,
    distinct_nodes_tested: sectionProgress.distinctNodesTested,
    confirmed_node_count: sectionProgress.confirmedNodeCount,
    resolved_node_count: sectionProgress.resolvedNodeCount,
    mean_uncertainty: sectionProgress.meanUncertainty,
    coverage_ratio: decision.coverageRatio,
    confidence: decision.confidence,
    stopping_reason: decision.stop ? decision.reason : null,
    completed_at: decision.stop ? attemptedAt : null,
  }).eq("run_id", data.runId).eq("section_key", sectionKey);
  if (sectionUpdateError) throw new Error(sectionUpdateError.message);
  if (!decision.stop) {
    const nextItem = await assignDiagnosticItem({ db: service, studentId, runId: data.runId, sectionKey, candidate });
    if (!nextItem) throw new Error("Aucune question adaptée n’est disponible.");
    return {
      correct,
      done: false as const,
      item: nextItem,
      probeCount,
      progress: await loadDiagnosticProgress(data.runId, service),
      sectionTransition: false,
    };
  }
  if (decision.reason === "insufficient_items") {
    return {
      correct,
      done: false as const,
      blocked: true as const,
      reason: "insufficient_items" as const,
      probeCount,
      progress: await loadDiagnosticProgress(data.runId, service),
    };
  }
  const progress = await loadDiagnosticProgress(data.runId, service);
  const nextSectionKey = nextDiagnosticSection(progress);
  if (nextSectionKey) {
    const [runTransition, sectionTransition] = await Promise.all([
      service.from("diagnostic_runs").update({ current_section: nextSectionKey }).eq("id", data.runId),
      service.from("diagnostic_run_sections").update({ status: "active", started_at: attemptedAt }).eq("run_id", data.runId).eq("section_key", nextSectionKey).eq("status", "pending"),
    ]);
    if (runTransition.error || sectionTransition.error) {
      throw new Error(runTransition.error?.message ?? sectionTransition.error?.message);
    }
    const nextItem = await assignDiagnosticItem({ db: service, studentId, runId: data.runId, sectionKey: nextSectionKey });
    if (!nextItem) throw new Error(`La section ${diagnosticSection(nextSectionKey).labelFr} manque de questions.`);
    return {
      correct,
      done: false as const,
      item: nextItem,
      probeCount,
      progress: await loadDiagnosticProgress(data.runId, service),
      sectionTransition: true,
    };
  }
  const completed = await finalizeAdaptiveDiagnostic({ service, studentId, runId: data.runId, completedAt: attemptedAt, probeCount });
  revalidatePath("/student"); revalidatePath("/student/frontier"); revalidatePath("/parent");
  return { correct, done: true as const, probeCount, ...completed };
}

export async function startReadingSession(input: unknown) {
  const data = checked(startSessionSchema, input);
  const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  await consumeActionLimit(supabase, "start_session");
  if (!(await getPublishedReadingText(data.textKey, supabase))) throw new Error("Texte introuvable.");
  const { textVersionId } = await contentIds(supabase, data.textKey);
  const { data: resume } = await supabase.from("reading_sessions").select("id,started_at").eq("student_id", studentId).eq("text_version_id", textVersionId).is("completed_at", null).order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (resume) {
    const { error: phaseError } = await supabase.from("reading_sessions").update({ current_phase: "questions" }).eq("id", resume.id);
    if (phaseError) throw new Error(phaseError.message);
    return { sessionId: resume.id as string, studentId, previousSuccessRate: undefined, resumed: true, startedAt: resume.started_at as string };
  }
  const { data: previous } = await supabase.from("reading_sessions").select("success_rate")
    .eq("student_id", studentId).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  const { data: session, error } = await supabase.from("reading_sessions").insert({
    student_id: studentId, text_version_id: textVersionId, started_at: data.startedAt, current_phase: "questions",
  }).select("id").single();
  if (error || !session) throw new Error(error?.message ?? "Séance non créée.");
  return { sessionId: session.id as string, studentId, previousSuccessRate: previous?.success_rate == null ? undefined : Number(previous.success_rate) };
}

export async function submitAnswer(input: unknown) {
  const data = checked(answerSchema, input);
  const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  await consumeActionLimit(supabase, "submit_answer");
  const ids = await contentIds(supabase, data.textKey, data.questionKey, data.choiceIndex);
  const { error } = await supabase.from("student_answers").upsert({
    session_id: data.sessionId, question_id: ids.questionId, selected_choice_id: ids.choiceId,
    is_correct: ids.isCorrect, score: ids.isCorrect ? 1 : 0,
  }, { onConflict: "session_id,question_id" });
  if (error) throw new Error(error.message);
  if (data.nextPhase) await supabase.from("reading_sessions").update({ current_phase: data.nextPhase }).eq("id", data.sessionId);
  return { ok: true };
}

export async function submitSummary(input: unknown) {
  const data = checked(summarySchema, input);
  const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  await moderateOrReject({ supabase, studentId, text: data.summaryText, field: "reading_summary" });
  const text = await getPublishedReadingText(data.textKey, supabase);
  if (!text) throw new Error("Texte introuvable.");
  const service = createServiceClient();
  const prompt = await getActivePrompt("summary_scoring", service);
  const { data: session } = await supabase.from("reading_sessions").select("id").eq("id", data.sessionId).single();
  if (!session) throw new Error("Séance introuvable.");
  const { data: summaryRow, error } = await service.from("student_summaries").upsert({ session_id: data.sessionId, summary_text: data.summaryText, ai_score: {} }, { onConflict: "session_id" }).select("id").single();
  if (error || !summaryRow) throw new Error(error?.message ?? "Résumé non enregistré.");
  const writing = await evaluateAndStoreWriting({ service, studentId, summaryId: summaryRow.id as string, revisionNumber: 0, sourceText: text.body.join("\n\n"), studentText: data.summaryText, keywords: text.concepts, systemPrompt: prompt.promptText });
  const evaluation = writing.rubric;
  await service.from("student_summaries").update({ ai_score: evaluation }).eq("id", summaryRow.id);
  await supabase.from("reading_sessions").update({ current_phase: "retrieval" }).eq("id", data.sessionId);
  return { ok: true, evaluation };
}

export async function completeReadingSession(input: unknown) {
  const data = checked(completeSessionSchema, input);
  const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  await moderateOrReject({ supabase, studentId, text: data.summaryText, field: "reading_summary" });
  await moderateOrReject({ supabase, studentId, text: data.retrievalText, field: "initial_retrieval" });
  const text = await getPublishedReadingText(data.textKey, supabase);
  if (!text) throw new Error("Texte introuvable.");
  const { data: ownedSession, error: sessionError } = await supabase.from("reading_sessions").select("id,text_version_id").eq("id", data.sessionId).eq("student_id", studentId).single();
  if (sessionError || !ownedSession) throw new Error("Séance introuvable.");

  for (const [questionKey, choiceIndex] of Object.entries(data.answers)) {
    const ids = await contentIds(supabase, data.textKey, questionKey, choiceIndex);
    const { error } = await supabase.from("student_answers").upsert({
      session_id: data.sessionId, question_id: ids.questionId, selected_choice_id: ids.choiceId,
      is_correct: ids.isCorrect, score: ids.isCorrect ? 1 : 0,
    }, { onConflict: "session_id,question_id" });
    if (error) throw new Error(error.message);
  }
  const service = createServiceClient();
  const prompt = await getActivePrompt("summary_scoring", service);
  const { data: summaryRow, error: summaryError } = await service.from("student_summaries").upsert({ session_id: data.sessionId, summary_text: data.summaryText, ai_score: {} }, { onConflict: "session_id" }).select("id").single();
  if (summaryError || !summaryRow) throw new Error(summaryError?.message ?? "Résumé non enregistré.");
  const writingEvaluation = await evaluateAndStoreWriting({ service, studentId, summaryId: summaryRow.id as string, revisionNumber: 0, sourceText: text.body.join("\n\n"), studentText: data.summaryText, keywords: text.concepts, systemPrompt: prompt.promptText });
  const summaryEvaluation = writingEvaluation.rubric;
  await service.from("student_summaries").update({ ai_score: summaryEvaluation }).eq("id", summaryRow.id);

  const { data: previous } = await supabase.from("reading_sessions").select("success_rate")
    .eq("student_id", studentId).neq("id", data.sessionId).not("completed_at", "is", null)
    .order("completed_at", { ascending: false }).limit(1).maybeSingle();
  const result = scoreSession({
    studentId, text, answers: data.answers, summaryText: data.summaryText,
    retrievalText: data.retrievalText, startedAt: data.startedAt, completedAt: data.completedAt,
    previousSuccessRate: previous?.success_rate == null ? undefined : Number(previous.success_rate),
    summaryScoreOverride: summaryEvaluation.score,
  });

  const { data: mappedNodes } = await service.from("text_version_nodes").select("node_id").eq("text_version_id", ownedSession.text_version_id);
  for (const mapping of mappedNodes ?? []) {
    const successfulReadingEvidence = result.successRate >= 0.8;
    await recordDirectCompetencyEvidence({
      service,
      studentId,
      nodeId: mapping.node_id as string,
      at: data.completedAt,
      evidenceExpectation: "receptive",
      updateMastery: (prior) => bktUpdate(prior, successfulReadingEvidence, {
        pTransit: 0.08,
        pSlip: 0.18,
        pGuess: 0.25,
      }),
      correct: successfulReadingEvidence,
      scorePatch: { receptive_score: result.successRate },
      practiced: true,
      pathMastery: (mastery) => successfulReadingEvidence
        ? mastery
        : Math.min(mastery, 0.84),
    });
  }

  const { data: skillRows } = await supabase.from("student_skill_estimates").select("skill_id,ability,uncertainty,evidence_count").eq("student_id", studentId);
  const { data: skills } = await supabase.from("skills").select("id,key");
  const skillById = new Map((skills ?? []).map((row) => [row.id as string, row.key as string]));
  const skillIdByKey = new Map((skills ?? []).map((row) => [row.key as string, row.id as string]));
  const currentSkills = Object.fromEntries((skillRows ?? []).flatMap((row) => {
    const key = skillById.get(row.skill_id as string);
    return key ? [[key, { ability: Number(row.ability), uncertainty: Number(row.uncertainty), evidenceCount: row.evidence_count as number }]] : [];
  }));
  const nextSkills = updateSkillsFromSession(currentSkills, text, data.answers);
  const skillUpserts = Object.entries(nextSkills).flatMap(([key, estimate]) => {
    const skillId = skillIdByKey.get(key);
    return skillId ? [{ student_id: studentId, skill_id: skillId, ability: estimate.ability, uncertainty: estimate.uncertainty, evidence_count: estimate.evidenceCount, last_evidence_at: data.completedAt }] : [];
  });
  if (skillUpserts.length) {
    const { error } = await supabase.from("student_skill_estimates").upsert(skillUpserts, { onConflict: "student_id,skill_id" });
    if (error) throw new Error(error.message);
  }

  const { error: completionError } = await supabase.from("reading_sessions").update({
    completed_at: data.completedAt, abandoned: false, success_rate: result.successRate,
    literal_score: result.literalScore, inference_score: result.inferenceScore,
    vocabulary_score: result.vocabularyScore, summary_score: result.summaryScore,
    retrieval_score: result.retrievalScore, time_on_task_seconds: result.timeOnTaskSeconds,
    hints_used: result.hintsUsed, recommended_next_action: result.recommendedNextAction,
    target_node_id: mappedNodes?.[0]?.node_id ?? null,
  }).eq("id", data.sessionId);
  if (completionError) throw new Error(completionError.message);

  let firstCardId: string | null = null;
  for (const seed of buildRetrievalCards(text)) {
    const { data: card, error } = await supabase.from("retrieval_cards").upsert({
      student_id: studentId, source_session_id: data.sessionId,
      source_text_version_id: ownedSession.text_version_id, card_type: "concept",
      prompt_fr: seed.promptFr,
      rubric: { keywords: seed.keywords, concept_label: seed.conceptLabel, source_text_key: seed.sourceTextId },
    }, { onConflict: "source_session_id,prompt_fr" }).select("id").single();
    if (error || !card) throw new Error(error?.message ?? "Carte non créée.");
    firstCardId ??= card.id as string;
    const { error: scheduleError } = await supabase.from("retrieval_schedules").upsert({
      retrieval_card_id: card.id, due_at: dueAtFrom(Date.parse(data.completedAt), INITIAL_SCHEDULE.intervalDays),
      interval_days: INITIAL_SCHEDULE.intervalDays, ease_factor: INITIAL_SCHEDULE.ease,
      repetitions: INITIAL_SCHEDULE.repetitions, status: "due",
    }, { onConflict: "retrieval_card_id" });
    if (scheduleError) throw new Error(scheduleError.message);
  }
  if (firstCardId) {
    const initialResult = gradeRetrieval(data.retrievalText, buildRetrievalCards(text)[0]?.keywords ?? []);
    const { error } = await service.from("retrieval_attempts").insert({
      retrieval_card_id: firstCardId, student_id: studentId, answer_text: data.retrievalText,
      score: result.retrievalScore, result: initialResult, attempted_at: data.completedAt,
    });
    if (error) throw new Error(error.message);
  }

  const { data: vocabulary } = await supabase.from("vocabulary_items").select("id,display_word").in("display_word", text.targetVocabulary.map((item) => item.word));
  for (const item of vocabulary ?? []) {
    const { data: existing } = await supabase.from("student_word_mastery").select("exposures").eq("student_id", studentId).eq("vocabulary_item_id", item.id).maybeSingle();
    const exposures = Number(existing?.exposures ?? 0) + 1;
    const { error } = await supabase.from("student_word_mastery").upsert({
      student_id: studentId, vocabulary_item_id: item.id, exposures,
      mastery: Math.min(1, exposures / 5), last_seen_at: data.completedAt,
    }, { onConflict: "student_id,vocabulary_item_id" });
    if (error) throw new Error(error.message);
  }
  const { error: eventError } = await supabase.from("reading_session_events").insert({
    session_id: data.sessionId, student_id: studentId, event_type: "completed",
    event_payload: { success_rate: result.successRate, next_action: result.recommendedNextAction },
  });
  if (eventError) throw new Error(eventError.message);
  const { error: interestError } = await service.rpc("record_interest_session", { p_student_id: studentId, p_interest_key: text.primaryInterest, p_completed: true, p_success: result.successRate, p_time_seconds: result.timeOnTaskSeconds });
  if (interestError) throw new Error(interestError.message);
  await recordDailyActivity(service,studentId,data.completedAt,"reading",true);
  const since = new Date(Date.parse(data.completedAt) - 7 * 86_400_000).toISOString();
  const { count: sessionsThisWeek } = await service.from("reading_sessions").select("id", { count: "exact", head: true }).eq("student_id", studentId).not("completed_at", "is", null).gte("completed_at", since);
  if (sessionsThisWeek === 3) await trackServer(studentId, "three_sessions_week_1", { window_days: 7 });
  revalidatePath("/student"); revalidatePath("/parent"); revalidatePath("/teacher");
  return { result, state: await getStudentStateData(studentId, supabase) };
}

export async function submitRetrievalAttempt(input: unknown) {
  const data = checked(retrievalSchema, input);
  const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  await moderateOrReject({ supabase, studentId, text: data.answerText, field: "memory_retrieval" });
  const { data: card, error: cardError } = await supabase.from("retrieval_cards").select("id,rubric").eq("id", data.cardId).eq("student_id", studentId).single();
  if (cardError || !card) throw new Error("Carte introuvable.");
  const rubric = (card.rubric && typeof card.rubric === "object" ? card.rubric : {}) as Record<string, unknown>;
  const keywords = Array.isArray(rubric.keywords) ? rubric.keywords.filter((value): value is string => typeof value === "string") : [];
  const result = gradeRetrieval(data.answerText, keywords);
  const { data: schedule, error: scheduleError } = await supabase.from("retrieval_schedules").select("interval_days,repetitions,stability,difficulty,desired_retention,last_reviewed_at").eq("retrieval_card_id", data.cardId).single();
  if (scheduleError || !schedule) throw new Error("Programme de révision introuvable.");
  const attemptedMs = Date.parse(data.attemptedAt);
  const prevState = schedule.stability != null && schedule.difficulty != null
    ? { stability: Number(schedule.stability), difficulty: Number(schedule.difficulty) }
    : null;
  const elapsedDays = schedule.last_reviewed_at
    ? Math.max(0, (attemptedMs - Date.parse(schedule.last_reviewed_at)) / 86_400_000)
    : (schedule.interval_days ?? 1);
  const next = scheduleFsrs(prevState, result, elapsedDays, Number(schedule.desired_retention ?? 0.9));
  const service = createServiceClient();
  const { error: attemptError } = await service.from("retrieval_attempts").insert({
    retrieval_card_id: data.cardId, student_id: studentId, answer_text: data.answerText,
    score: result === "easy" ? 1 : result === "good" ? 0.8 : result === "hard" ? 0.5 : 0,
    result, attempted_at: data.attemptedAt,
  });
  if (attemptError) throw new Error(attemptError.message);
  const { error: updateError } = await supabase.from("retrieval_schedules").update({
    due_at: dueAtFrom(attemptedMs, next.intervalDays), interval_days: next.intervalDays,
    stability: next.stability, difficulty: next.difficulty, last_reviewed_at: data.attemptedAt,
    repetitions: result === "forgot" ? 0 : schedule.repetitions + 1, last_result: result, status: "due",
  }).eq("retrieval_card_id", data.cardId);
  if (updateError) throw new Error(updateError.message);
  await recordDailyActivity(service,studentId,data.attemptedAt,"retrieval",false);
  return { result, state: await getStudentStateData(studentId, supabase) };
}

export async function loadReadingResume(input: unknown) {
  const data=checked(textKeySchema,input);const{supabase,studentId}=await context();const{textVersionId}=await contentIds(supabase,data.textKey);
  const{data:session}=await supabase.from("reading_sessions").select("id,started_at,current_phase").eq("student_id",studentId).eq("text_version_id",textVersionId).is("completed_at",null).order("started_at",{ascending:false}).limit(1).maybeSingle();if(!session)return null;
  const[{data:answers},{data:summary}]=await Promise.all([supabase.from("student_answers").select("questions!inner(question_key),question_choices!inner(choice_index)").eq("session_id",session.id),supabase.from("student_summaries").select("summary_text").eq("session_id",session.id).maybeSingle()]);
  const answerMap=Object.fromEntries((answers??[]).map(row=>{const q=row.questions as unknown as{question_key:string};const c=row.question_choices as unknown as{choice_index:number};return[q.question_key,c.choice_index];}));
  return{sessionId:session.id as string,startedAt:session.started_at as string,phase:session.current_phase as "read"|"questions"|"summary"|"retrieval",answers:answerMap,summary:summary?.summary_text as string|undefined};
}

export async function loadLatestReadingResume(input: unknown) {
  checked(emptySchema,input);const{supabase,studentId}=await context();const{data}=await supabase.from("reading_sessions").select("id,current_phase,text_versions!inner(title,texts!inner(slug))").eq("student_id",studentId).is("completed_at",null).order("started_at",{ascending:false}).limit(1).maybeSingle();if(!data)return null;const version=data.text_versions as unknown as{title:string;texts:{slug:string}};return{sessionId:data.id as string,textKey:version.texts.slug,title:version.title,phase:data.current_phase as string};
}

export async function loadStudentMotivation(input: unknown) {
  checked(emptySchema,input);const{supabase,studentId}=await context();const{data}=await supabase.from("student_daily_activity").select("activity_date,goal_completed,reading_sessions,practice_steps,retrieval_reviews").eq("student_id",studentId).order("activity_date",{ascending:false}).limit(14);const rows=data??[];const todayKey=new Date().toISOString().slice(0,10);
  return{streak:calculateStreak(rows.filter(row=>row.goal_completed).map(row=>row.activity_date as string),Date.now()),today:rows.find(row=>row.activity_date===todayKey)??null,week:rows.slice(0,7)};
}

export async function submitSkillPractice(input: unknown) {
  const data = checked(skillPracticeSchema, input);
  const { supabase, studentId } = await context();
  await requireStudentLearningUnlocked(supabase, studentId);
  const { data: skill, error: skillError } = await supabase.from("skills").select("id").eq("key", data.skillKey).single();
  if (skillError || !skill) throw new Error("Compétence introuvable.");
  const { data: current } = await supabase.from("student_skill_estimates").select("ability,uncertainty,evidence_count").eq("student_id", studentId).eq("skill_id", skill.id).maybeSingle();
  let estimate = current ? { ability: Number(current.ability), uncertainty: Number(current.uncertainty), evidenceCount: current.evidence_count as number } : undefined;
  for (const correct of data.corrects) estimate = updateSkillEstimate(estimate, correct);
  const { error } = await supabase.from("student_skill_estimates").upsert({
    student_id: studentId, skill_id: skill.id, ability: estimate!.ability,
    uncertainty: estimate!.uncertainty, evidence_count: estimate!.evidenceCount,
    last_evidence_at: new Date().toISOString(),
  }, { onConflict: "student_id,skill_id" });
  if (error) throw new Error(error.message);
  return { state: await getStudentStateData(studentId, supabase) };
}
