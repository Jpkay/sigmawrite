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
import { dueAtFrom, gradeRetrieval, INITIAL_SCHEDULE, scheduleNext } from "@/lib/scoring/retrieval";
import { moderateStudentText } from "@/lib/safety/moderate-input";
import { logAudit } from "@/lib/audit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getActivePrompt } from "@/lib/db/ai";
import { nextDiagnosticItem, frontierForStudent } from "@/lib/diagnostic/live";
import { bktUpdate, bktUpdateWeighted, guessFromChoices, masteryUncertainty } from "@/lib/scoring/bkt";
import { validateAnswer } from "@/lib/linguistic/validator";
import { getCatchUpPlan } from "@/lib/db/practice";
import { evaluateWriting } from "@/lib/writing/evaluate";
import { calculateStreak } from "@/lib/motivation";
import { trackServer } from "@/lib/analytics-server";

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
  runId: uuidSchema, itemId: uuidSchema, selectedChoiceId: uuidSchema.optional(),
  answerText: z.string().trim().max(2000).optional(), startedAt: dateTimeSchema,
}).refine((value) => value.selectedChoiceId || value.answerText, "Réponse requise");
const practiceAttemptSchema = z.object({ nodeId: uuidSchema, itemId: uuidSchema, selectedChoiceId: uuidSchema.optional(), answerText: z.string().trim().max(2000).optional(), startedAt: dateTimeSchema }).refine((value) => value.selectedChoiceId || value.answerText, "Réponse requise");
const writingFeedbackSchema = z.object({ textKey: z.string().min(1).max(100) });
const writingRevisionSchema = writingFeedbackSchema.extend({ revisedText: z.string().trim().min(5).max(5000) });

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

async function consumeActionLimit(supabase: SupabaseClient, scope: "submit_answer" | "free_text" | "start_session") {
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

async function evaluateAndStoreWriting(input: {
  service: SupabaseClient; studentId: string; summaryId: string; revisionNumber: 0 | 1;
  sourceText: string; studentText: string; keywords: string[]; systemPrompt: string;
}) {
  const { data: rows } = await input.service.from("error_node_mappings").select("rule_id,node_id,explanation_fr,evidence_weight,competency_nodes!inner(key,label_fr)");
  const mappings = (rows ?? []).map((row) => { const node = row.competency_nodes as unknown as { key: string; label_fr: string }; return { ruleId: row.rule_id as string, nodeId: row.node_id as string, nodeKey: node.key, nodeLabel: node.label_fr, explanationFr: row.explanation_fr as string, evidenceWeight: Number(row.evidence_weight) }; });
  const evaluation = await evaluateWriting({ textBody: input.sourceText, studentText: input.studentText, keywords: input.keywords, mappings, systemPrompt: input.systemPrompt });
  const { error } = await input.service.from("writing_evaluations").upsert({ student_summary_id: input.summaryId, student_id: input.studentId, revision_number: input.revisionNumber, submitted_text: input.studentText, rubric: evaluation.rubric, annotations: evaluation.annotations, revision_plan: evaluation.revisionPlan, degraded: evaluation.degraded }, { onConflict: "student_summary_id,revision_number" });
  if (error) throw new Error(error.message);
  for (const plan of evaluation.revisionPlan) {
    const { data: prior } = await input.service.from("student_competency_estimates").select("mastery_probability,evidence_count").eq("student_id", input.studentId).eq("node_id", plan.nodeId).maybeSingle();
    const evidenceCount = Number(prior?.evidence_count ?? 0) + 1; const mastery = bktUpdateWeighted(Number(prior?.mastery_probability ?? 0.1), false, plan.evidenceWeight);
    await input.service.from("student_competency_estimates").upsert({ student_id: input.studentId, node_id: plan.nodeId, mastery_probability: mastery, uncertainty: masteryUncertainty(mastery, evidenceCount), evidence_count: evidenceCount, productive_score: Math.max(0, 1 - plan.errorCount * 0.2), last_evidence_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "student_id,node_id" });
  }
  return evaluation;
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
    target_level: data.targetLevel ?? (fsl ? "B1" : String(data.grade)), target_grade: fsl ? null : data.grade,
    scope: { strands: fsl
      ? ["grammaire_syntaxe", "conjugaison", "lexique", "comprehension_orale", "comprehension_ecrite", "expression_ecrite"]
      : ["grammaire_syntaxe", "conjugaison", "orthographe_grammaticale", "comprehension_ecrite", "expression_ecrite"],
      modalities: fsl ? ["reading", "listening", "writing", "grammar_analysis"] : ["reading", "writing", "grammar_analysis"], mastery_threshold: 0.85 },
  });
  if (goalError) throw new Error(goalError.message);
  revalidatePath("/student");
  return getStudentStateData(studentId, supabase);
}

export async function startAdaptiveDiagnostic(input: unknown) {
  checked(emptySchema, input);
  if (process.env.ADAPTIVE_DIAGNOSTIC_ENABLED === "false") throw new Error("Diagnostic adaptatif désactivé pour cet environnement.");
  const { supabase, studentId } = await context();
  await supabase.from("diagnostic_runs").update({ status: "abandoned", completed_at: new Date().toISOString() }).eq("student_id", studentId).eq("status", "running");
  const { data: goal } = await supabase.from("learning_goals").select("id").eq("student_id", studentId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!goal) throw new Error("Choisis d’abord ton objectif.");
  const { data: run, error } = await supabase.from("diagnostic_runs").insert({ student_id: studentId, learning_goal_id: goal.id }).select("id,started_at").single();
  if (error || !run) throw new Error(error?.message ?? "Diagnostic non créé.");
  const item = await nextDiagnosticItem(studentId, run.id as string, createServiceClient());
  if (!item) throw new Error("La banque d’items ne contient pas encore assez de questions.");
  return { runId: run.id as string, startedAt: run.started_at as string, item };
}

export async function loadStudentCatchUpPlan(input: unknown) {
  checked(emptySchema, input); const { supabase, studentId } = await context();
  if (process.env.CATCH_UP_PLAN_ENABLED === "false") return [];
  return getCatchUpPlan(studentId, supabase);
}

export async function submitNodePractice(input: unknown) {
  const data = checked(practiceAttemptSchema, input); const { supabase, studentId } = await context();
  if (data.answerText) await moderateOrReject({ supabase, studentId, text: data.answerText, field: "memory_retrieval" });
  const service = createServiceClient();
  const { data: item } = await service.from("competency_items").select("id,primary_node_id,learner_mode,modality,validator_type,validator_config,correct_answer,acceptable_answers,competency_item_choices(id,is_correct,feedback_fr)").eq("id", data.itemId).eq("primary_node_id", data.nodeId).in("review_status", ["auto_approved", "human_approved"]).single();
  if (!item) throw new Error("Exercice introuvable.");
  const choices = item.competency_item_choices as unknown as Array<{ id: string; is_correct: boolean; feedback_fr: string | null }>;
  let correct = false; let feedbackFr: string | null = null;
  if (data.selectedChoiceId) { const selected = choices.find((choice) => choice.id === data.selectedChoiceId); if (!selected) throw new Error("Choix invalide."); correct = selected.is_correct; feedbackFr = selected.feedback_fr; }
  else { const validation = await validateAnswer(data.answerText ?? "", { validatorType: item.validator_type as "exact" | "regex" | "conjugator", config: item.validator_config as Record<string, unknown> | undefined, correctAnswer: item.correct_answer as string | undefined, acceptableAnswers: item.acceptable_answers as string[] }); correct = validation.pass; feedbackFr = validation.reason ?? null; }
  const now = new Date().toISOString();
  await service.from("competency_attempts").insert({ student_id: studentId, item_id: item.id, node_id: data.nodeId, learner_mode: item.learner_mode, modality: item.modality, answer_text: data.answerText ?? null, selected_choice_id: data.selectedChoiceId ?? null, is_correct: correct, score: correct ? 1 : 0, latency_ms: Math.max(0, Date.now()-Date.parse(data.startedAt)), context: "practice", attempted_at: now });
  const { data: previous } = await service.from("student_competency_estimates").select("mastery_probability,evidence_count").eq("student_id", studentId).eq("node_id", data.nodeId).maybeSingle();
  const evidenceCount = Number(previous?.evidence_count ?? 0) + 1; const mastery = bktUpdate(Number(previous?.mastery_probability ?? 0.1), correct, {}, guessFromChoices(choices.length));
  await service.from("student_competency_estimates").upsert({ student_id: studentId, node_id: data.nodeId, mastery_probability: mastery, uncertainty: masteryUncertainty(mastery, evidenceCount), evidence_count: evidenceCount, last_practiced_at: now, last_evidence_at: now, updated_at: now }, { onConflict: "student_id,node_id" });
  if (mastery >= 0.85) {
    const { data: node } = await service.from("competency_nodes").select("label_fr").eq("id", data.nodeId).single();
    const { data: card } = await service.from("retrieval_cards").upsert({ student_id: studentId, node_id: data.nodeId, card_type: "competency_node", prompt_fr: `Explique avec tes mots : ${node?.label_fr ?? "cette compétence"}.`, rubric: { node_id: data.nodeId } }, { onConflict: "student_id,node_id" }).select("id").single();
    if (card) await service.from("retrieval_schedules").upsert({ retrieval_card_id: card.id, due_at: dueAtFrom(Date.now(), 1), interval_days: 1, ease_factor: 2.5, repetitions: 0, status: "due" }, { onConflict: "retrieval_card_id" });
    await recordDailyActivity(service,studentId,now,"practice",true);
  }
  revalidatePath("/student"); revalidatePath("/student/frontier");
  return { correct, feedbackFr, mastery, mastered: mastery >= 0.85 };
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

export async function submitAdaptiveDiagnosticProbe(input: unknown) {
  const data = checked(adaptiveProbeSchema, input);
  const { supabase, studentId } = await context();
  if (data.answerText) await moderateOrReject({ supabase, studentId, text: data.answerText, field: "diagnostic_summary" });
  const service = createServiceClient();
  const [{ data: run }, { data: item, error: itemError }] = await Promise.all([
    supabase.from("diagnostic_runs").select("id,probe_count,status").eq("id", data.runId).eq("student_id", studentId).eq("status", "running").single(),
    service.from("competency_items")
      .select("id,primary_node_id,validator_type,validator_config,correct_answer,acceptable_answers,learner_mode,modality,competency_item_choices(id,is_correct)")
      .eq("id", data.itemId).in("review_status", ["auto_approved", "human_approved"]).single(),
  ]);
  if (!run) throw new Error("Diagnostic introuvable.");
  if (itemError || !item) throw new Error("Question introuvable.");
  const choices = item.competency_item_choices as unknown as Array<{ id: string; is_correct: boolean }>;
  let correct = false;
  if (data.selectedChoiceId) {
    const choice = choices.find((row) => row.id === data.selectedChoiceId);
    if (!choice) throw new Error("Choix invalide.");
    correct = choice.is_correct;
  } else {
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
  const [{ error: attemptError }, { data: previous }] = await Promise.all([
    service.from("competency_attempts").insert({
      student_id: studentId, item_id: data.itemId, node_id: item.primary_node_id, learner_mode: item.learner_mode,
      modality: item.modality, answer_text: data.answerText ?? null, selected_choice_id: data.selectedChoiceId ?? null,
      is_correct: correct, score: correct ? 1 : 0, latency_ms: latencyMs, context: "diagnostic", diagnostic_run_id: data.runId, attempted_at: attemptedAt,
    }),
    service.from("student_competency_estimates").select("mastery_probability,evidence_count").eq("student_id", studentId).eq("node_id", item.primary_node_id).maybeSingle(),
  ]);
  if (attemptError) throw new Error(attemptError.message);
  const evidenceCount = Number(previous?.evidence_count ?? 0) + 1;
  const mastery = bktUpdate(Number(previous?.mastery_probability ?? 0.5), correct, {}, guessFromChoices(choices.length));
  const probeCount = Number(run.probe_count) + 1;
  const [{ error: estimateError }] = await Promise.all([
    service.from("student_competency_estimates").upsert({
      student_id: studentId, node_id: item.primary_node_id, mastery_probability: mastery,
      uncertainty: masteryUncertainty(mastery, evidenceCount), evidence_count: evidenceCount,
      last_practiced_at: attemptedAt, last_evidence_at: attemptedAt, updated_at: attemptedAt,
    }, { onConflict: "student_id,node_id" }),
    service.from("diagnostic_runs").update({ probe_count: probeCount }).eq("id", data.runId),
  ]);
  if (estimateError) throw new Error(estimateError.message);
  const next = probeCount >= 15 ? null : await nextDiagnosticItem(studentId, data.runId, service);
  if (next) return { correct, done: false as const, item: next, probeCount };
  const frontier = await frontierForStudent(studentId, service);
  const tested = [...frontier.report.mastered, ...frontier.report.fragile, ...frontier.report.missing].length || 1;
  const grade = Math.max(5, Math.min(12, 5 + (frontier.report.mastered.length / tested) * 7));
  await service.from("diagnostic_runs").update({ status: "completed", completed_at: attemptedAt, frontier_report: frontier, derived_reading_band: `Grade ${grade.toFixed(1)}` }).eq("id", data.runId);
  await service.from("student_reading_estimates").insert({ student_id: studentId, estimate_type: "adaptive_diagnostic", grade_min: Math.max(5, grade - 0.5), grade_max: Math.min(12, grade + 0.5), confidence: probeCount >= 8 ? "high" : "medium", evidence_count: probeCount });
  const bandNumber = Math.max(5, Math.min(10, Math.round(grade)));
  await service.from("diagnostic_results").insert({ student_id: studentId, grade_min: Math.max(5, grade - 0.5), grade_max: Math.min(12, grade + 0.5), confidence: probeCount >= 8 ? "high" : "medium", recommended_starting_level: bandNumber <= 6 ? `Foundation ${bandNumber}A` : `Secondary ${bandNumber}A`, narrative_estimate: grade, expository_estimate: grade, argumentative_estimate: Math.max(5, grade - 0.5), source_based_estimate: grade, summary_text: null, completed_at: attemptedAt });
  revalidatePath("/student"); revalidatePath("/student/frontier"); revalidatePath("/parent");
  return { correct, done: true as const, frontier, probeCount, grade };
}

export async function startReadingSession(input: unknown) {
  const data = checked(startSessionSchema, input);
  const { supabase, studentId } = await context();
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
  const { supabase } = await context();
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
    const { data: prior } = await service.from("student_competency_estimates").select("mastery_probability,evidence_count").eq("student_id", studentId).eq("node_id", mapping.node_id).maybeSingle();
    const evidenceCount = Number(prior?.evidence_count ?? 0) + 1;
    const mastery = bktUpdate(Number(prior?.mastery_probability ?? 0.1), result.successRate >= 0.8, { pTransit: 0.08, pSlip: 0.18, pGuess: 0.25 });
    await service.from("student_competency_estimates").upsert({ student_id: studentId, node_id: mapping.node_id, mastery_probability: mastery, uncertainty: masteryUncertainty(mastery, evidenceCount), evidence_count: evidenceCount, receptive_score: result.successRate, last_practiced_at: data.completedAt, last_evidence_at: data.completedAt, updated_at: data.completedAt }, { onConflict: "student_id,node_id" });
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
  await moderateOrReject({ supabase, studentId, text: data.answerText, field: "memory_retrieval" });
  const { data: card, error: cardError } = await supabase.from("retrieval_cards").select("id,rubric").eq("id", data.cardId).eq("student_id", studentId).single();
  if (cardError || !card) throw new Error("Carte introuvable.");
  const rubric = (card.rubric && typeof card.rubric === "object" ? card.rubric : {}) as Record<string, unknown>;
  const keywords = Array.isArray(rubric.keywords) ? rubric.keywords.filter((value): value is string => typeof value === "string") : [];
  const result = gradeRetrieval(data.answerText, keywords);
  const { data: schedule, error: scheduleError } = await supabase.from("retrieval_schedules").select("interval_days,ease_factor,repetitions").eq("retrieval_card_id", data.cardId).single();
  if (scheduleError || !schedule) throw new Error("Programme de révision introuvable.");
  const next = scheduleNext({ intervalDays: schedule.interval_days ?? 1, ease: Number(schedule.ease_factor), repetitions: schedule.repetitions }, result);
  const service = createServiceClient();
  const { error: attemptError } = await service.from("retrieval_attempts").insert({
    retrieval_card_id: data.cardId, student_id: studentId, answer_text: data.answerText,
    score: result === "easy" ? 1 : result === "good" ? 0.8 : result === "hard" ? 0.5 : 0,
    result, attempted_at: data.attemptedAt,
  });
  if (attemptError) throw new Error(attemptError.message);
  const { error: updateError } = await supabase.from("retrieval_schedules").update({
    due_at: dueAtFrom(Date.parse(data.attemptedAt), next.intervalDays), interval_days: next.intervalDays,
    ease_factor: next.ease, repetitions: next.repetitions, last_result: result, status: "due",
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
