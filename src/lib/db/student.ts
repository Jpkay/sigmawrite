import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiagnosticResult, ReadingSessionResult } from "@/lib/types";
import { SUCCESS_ZONE } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import {
  diagnosticSectionProfileFromRows,
  diagnosticSkillsFromDb,
  type DiagnosticSectionProfileKey,
  type StudentState,
} from "@/lib/student-state";
import type { RetrievalResult } from "@/lib/scoring/retrieval";

type StudentRow = {
  id: string;
  current_grade: number | null;
  french_background: string | null;
  onboarding_completed_at: string | null;
};
type TextRow = { id: string; slug: string | null };
type VersionRow = { id: string; text_id: string };
type QuestionRow = { id: string; text_version_id: string; question_key: string | null };
type ChoiceRow = { id: string; question_id: string; choice_index: number | null };
type SessionRow = {
  id: string; text_version_id: string; started_at: string; completed_at: string | null;
  abandoned: boolean; success_rate: number | string | null; literal_score: number | string | null;
  inference_score: number | string | null; vocabulary_score: number | string | null;
  summary_score: number | string | null; retrieval_score: number | string | null;
  time_on_task_seconds: number | null; hints_used: number; recommended_next_action: ReadingSessionResult["recommendedNextAction"] | null;
};
type SkillRow = { id: string; key: string };
type SkillEstimateRow = { skill_id: string; ability: number | string; uncertainty: number | string; evidence_count: number };
type DiagnosticRow = {
  id: string; diagnostic_run_id: string | null; grade_min: number | string; grade_max: number | string;
  confidence: DiagnosticResult["overallReadingBand"]["confidence"];
  recommended_starting_level: string; narrative_estimate: number | string;
  expository_estimate: number | string; argumentative_estimate: number | string;
  provisional: boolean;
  source_based_estimate: number | string;
};
type DiagnosticSkillRow = { skill_id: string; ability: number | string; is_foundation_gap: boolean };
type DiagnosticNodeResultRow = {
  section_key: DiagnosticSectionProfileKey;
  classification: "mastered" | "fragile" | "missing" | "unknown";
  mastery_probability: number | string;
  evidence_coverage_confirmed: boolean;
  evidence_kind: string;
};
type DiagnosticRunSectionRow = { section_key: DiagnosticSectionProfileKey; target_node_count: number };
type AnswerRow = { session_id: string; question_id: string; selected_choice_id: string | null };
type CardRow = { id: string; source_text_version_id: string | null; prompt_fr: string; rubric: unknown };
type ScheduleRow = { retrieval_card_id: string; due_at: string; interval_days: number | null; ease_factor: number | string; repetitions: number; last_result: RetrievalResult | null; stability: number | string | null; difficulty: number | string | null; last_reviewed_at: string | null };
type MasteryRow = { vocabulary_item_id: string; exposures: number; last_seen_at: string | null };
type VocabRow = { id: string; display_word: string };

const number = (value: number | string | null | undefined, fallback = 0) =>
  value == null ? fallback : Number(value);

export async function getCurrentStudentId(client?: SupabaseClient): Promise<string> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("students").select("id").limit(1).maybeSingle();
  if (error || !data) throw new Error("Profil élève introuvable.");
  return data.id as string;
}

export async function getStudentStateData(
  studentId: string,
  client?: SupabaseClient
): Promise<Omit<StudentState, "hydrated">> {
  const supabase = client ?? (await createClient());
  const [studentResult, interestsResult, sessionsResult, skillsResult, skillEstimatesResult,
    diagnosticResult, textsResult, versionsResult, questionsResult, choicesResult,
    cardsResult, schedulesResult, masteryResult, vocabResult] = await Promise.all([
    supabase.from("students").select("id,current_grade,french_background,onboarding_completed_at").eq("id", studentId).single(),
    supabase.from("student_interests").select("interest_key").eq("student_id", studentId),
    supabase.from("reading_sessions").select("id,text_version_id,started_at,completed_at,abandoned,success_rate,literal_score,inference_score,vocabulary_score,summary_score,retrieval_score,time_on_task_seconds,hints_used,recommended_next_action").eq("student_id", studentId).order("started_at"),
    supabase.from("skills").select("id,key"),
    supabase.from("student_skill_estimates").select("skill_id,ability,uncertainty,evidence_count").eq("student_id", studentId),
    supabase.from("diagnostic_results").select("id,diagnostic_run_id,grade_min,grade_max,confidence,recommended_starting_level,narrative_estimate,expository_estimate,argumentative_estimate,source_based_estimate,provisional").eq("student_id", studentId).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("texts").select("id,slug"),
    supabase.from("text_versions").select("id,text_id"),
    supabase.from("questions").select("id,text_version_id,question_key"),
    supabase.from("question_choices").select("id,question_id,choice_index"),
    supabase.from("retrieval_cards").select("id,source_text_version_id,prompt_fr,rubric").eq("student_id", studentId),
    supabase.from("retrieval_schedules").select("retrieval_card_id,due_at,interval_days,ease_factor,repetitions,last_result,stability,difficulty,last_reviewed_at"),
    supabase.from("student_word_mastery").select("vocabulary_item_id,exposures,last_seen_at").eq("student_id", studentId),
    supabase.from("vocabulary_items").select("id,display_word"),
  ]);
  if (studentResult.error || !studentResult.data) throw new Error("Profil élève introuvable.");

  const student = studentResult.data as StudentRow;
  const skills = (skillsResult.data ?? []) as SkillRow[];
  const skillById = new Map(skills.map((row) => [row.id, row.key]));
  const textById = new Map(((textsResult.data ?? []) as TextRow[]).map((row) => [row.id, row.slug ?? row.id]));
  const versionRows = (versionsResult.data ?? []) as VersionRow[];
  const versionToKey = new Map(versionRows.map((row) => [row.id, textById.get(row.text_id) ?? row.id]));

  const skillEstimates: StudentState["skillEstimates"] = {};
  for (const row of (skillEstimatesResult.data ?? []) as SkillEstimateRow[]) {
    const key = skillById.get(row.skill_id);
    if (key) skillEstimates[key] = {
      ability: number(row.ability), uncertainty: number(row.uncertainty), evidenceCount: row.evidence_count,
    };
  }

  let diagnostic: DiagnosticResult | null = null;
  let diagnosticSectionProfile: StudentState["diagnosticSectionProfile"] = {};
  const diagnosticRow = diagnosticResult.data as DiagnosticRow | null;
  if (diagnosticRow) {
    const [{ data }, nodeResults, runSections] = await Promise.all([
      supabase.from("diagnostic_skill_results")
        .select("skill_id,ability,is_foundation_gap").eq("diagnostic_result_id", diagnosticRow.id),
      diagnosticRow.diagnostic_run_id
        ? supabase.from("diagnostic_node_results")
          .select("section_key,classification,mastery_probability,evidence_coverage_confirmed,evidence_kind")
          .eq("run_id", diagnosticRow.diagnostic_run_id)
        : Promise.resolve({ data: [], error: null }),
      diagnosticRow.diagnostic_run_id
        ? supabase.from("diagnostic_run_sections")
          .select("section_key,target_node_count")
          .eq("run_id", diagnosticRow.diagnostic_run_id)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (nodeResults.error || runSections.error) {
      throw new Error(nodeResults.error?.message ?? runSections.error?.message);
    }
    const byKey: Record<string, number> = {};
    const gaps: string[] = [];
    for (const row of (data ?? []) as DiagnosticSkillRow[]) {
      const key = skillById.get(row.skill_id);
      if (!key) continue;
      byKey[key] = number(row.ability);
      if (row.is_foundation_gap) gaps.push(key);
    }
    diagnostic = {
      studentId,
      overallReadingBand: { minGrade: number(diagnosticRow.grade_min), maxGrade: number(diagnosticRow.grade_max), confidence: diagnosticRow.confidence },
      textTypeEstimates: {
        narrative: number(diagnosticRow.narrative_estimate), expository: number(diagnosticRow.expository_estimate),
        argumentative: number(diagnosticRow.argumentative_estimate), sourceBased: number(diagnosticRow.source_based_estimate),
      },
      skillEstimates: diagnosticSkillsFromDb(byKey),
      recommendedStartingLevel: diagnosticRow.recommended_starting_level,
      foundationGaps: gaps,
    };
    const targetCounts = Object.fromEntries(
      ((runSections.data ?? []) as DiagnosticRunSectionRow[]).map((row) => [
        row.section_key,
        Number(row.target_node_count),
      ]),
    ) as Partial<Record<DiagnosticSectionProfileKey, number>>;
    diagnosticSectionProfile = diagnosticSectionProfileFromRows(
      ((nodeResults.data ?? []) as DiagnosticNodeResultRow[]).map((row) => ({
        sectionKey: row.section_key,
        classification: row.classification,
        masteryProbability: number(row.mastery_probability, .5),
        evidenceCoverageConfirmed: Boolean(row.evidence_coverage_confirmed),
        evidenceKind: row.evidence_kind,
      })),
      targetCounts,
    );
  }

  const sessions: ReadingSessionResult[] = ((sessionsResult.data ?? []) as SessionRow[]).map((row) => ({
    studentId, textVersionId: versionToKey.get(row.text_version_id) ?? row.text_version_id,
    startedAt: row.started_at, completedAt: row.completed_at ?? undefined, abandoned: row.abandoned,
    successRate: number(row.success_rate), literalScore: number(row.literal_score), inferenceScore: number(row.inference_score),
    vocabularyScore: number(row.vocabulary_score), summaryScore: number(row.summary_score), retrievalScore: number(row.retrieval_score),
    timeOnTaskSeconds: row.time_on_task_seconds ?? 0, hintsUsed: row.hints_used,
    targetSuccessZone: { min: SUCCESS_ZONE.min, max: SUCCESS_ZONE.max },
    recommendedNextAction: row.recommended_next_action ?? "maintain",
  }));

  const sessionById = new Map(((sessionsResult.data ?? []) as SessionRow[]).map((row) => [row.id, row]));
  const questionRows = (questionsResult.data ?? []) as QuestionRow[];
  const questionById = new Map(questionRows.map((row) => [row.id, row]));
  const choiceById = new Map(((choicesResult.data ?? []) as ChoiceRow[]).map((row) => [row.id, row]));
  const answersByText: StudentState["answersByText"] = {};
  const sessionIds = [...sessionById.keys()];
  if (sessionIds.length) {
    const { data } = await supabase.from("student_answers").select("session_id,question_id,selected_choice_id").in("session_id", sessionIds);
    for (const row of (data ?? []) as AnswerRow[]) {
      const session = sessionById.get(row.session_id);
      const question = questionById.get(row.question_id);
      const choice = row.selected_choice_id ? choiceById.get(row.selected_choice_id) : null;
      if (!session || !question?.question_key || choice?.choice_index == null) continue;
      const textKey = versionToKey.get(session.text_version_id) ?? session.text_version_id;
      (answersByText[textKey] ??= {})[question.question_key] = choice.choice_index;
    }
  }

  const scheduleByCard = new Map(((schedulesResult.data ?? []) as ScheduleRow[]).map((row) => [row.retrieval_card_id, row]));
  const retrievalCards: StudentState["retrievalCards"] = ((cardsResult.data ?? []) as CardRow[]).flatMap((row) => {
    const schedule = scheduleByCard.get(row.id);
    if (!schedule) return [];
    const rubric = (row.rubric && typeof row.rubric === "object" ? row.rubric : {}) as Record<string, unknown>;
    return [{
      id: row.id,
      conceptLabel: typeof rubric.concept_label === "string" ? rubric.concept_label : "Notion",
      promptFr: row.prompt_fr,
      keywords: Array.isArray(rubric.keywords) ? rubric.keywords.filter((v): v is string => typeof v === "string") : [],
      sourceTextId: row.source_text_version_id ? versionToKey.get(row.source_text_version_id) ?? row.source_text_version_id : "",
      intervalDays: schedule.interval_days ?? 1, ease: number(schedule.ease_factor, 2.5), repetitions: schedule.repetitions,
      dueAt: schedule.due_at, ...(schedule.last_result ? { lastResult: schedule.last_result } : {}),
      ...(schedule.stability != null ? { stability: Number(schedule.stability) } : {}),
      ...(schedule.difficulty != null ? { difficulty: Number(schedule.difficulty) } : {}),
      ...(schedule.last_reviewed_at ? { lastReviewedAt: schedule.last_reviewed_at } : {}),
    }];
  });

  const vocabById = new Map(((vocabResult.data ?? []) as VocabRow[]).map((row) => [row.id, row.display_word]));
  const vocab: StudentState["vocab"] = {};
  for (const row of (masteryResult.data ?? []) as MasteryRow[]) {
    const word = vocabById.get(row.vocabulary_item_id);
    if (word) vocab[word] = { exposures: row.exposures, lastSeenAt: row.last_seen_at ?? "" };
  }

  return {
    onboarded: !!student.onboarding_completed_at,
    grade: student.current_grade,
    frenchBackground: student.french_background,
    interests: (interestsResult.data ?? []).map((row) => row.interest_key as string),
    diagnostic, diagnosticProvisional: Boolean(diagnosticRow?.provisional), diagnosticSectionProfile, sessions, answersByText, skillEstimates, retrievalCards, vocab,
  };
}
