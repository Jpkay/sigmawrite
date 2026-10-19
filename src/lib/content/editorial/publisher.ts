import type { SupabaseClient } from "@supabase/supabase-js";
import type { AudioCheckReport } from "./audio-check";
import type { EditorialBrief } from "./brief";
import type { LibraryOutcome } from "./library";
import { TENSE_LABELS, EDITORIAL_PIPELINE_VERSION } from "./types";
import { RUBRIC_BARS } from "./rubric";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import { autoApproveDictation } from "@/lib/dictation/auto-approve";
import { dictationText, dictationWordCount, type DictationGate } from "@/lib/dictation/gates";
import { DICTATION_TENSES, TENSE_NODE_KEYS, THEME_PATTERN, type DictationTense } from "@/lib/dictation/tags";

/**
 * Writes library-mode results (H.16/H.17) into the content tables, always as
 * auto_approved with the pipeline version and gate evidence — never as a
 * human approval.
 *
 * Dictées go to public.dictations with their tags and are approved by
 * autoApproveDictation (dictée stream, G.2) with the editorial evidence as an
 * extra blocking gate.
 */

type Published = Extract<LibraryOutcome, { decision: "publish" }>;

export async function saveLibraryItem(db: SupabaseClient, input: { kind: "passage" | "dictation" | "fallback_chapter"; brief: EditorialBrief; outcome: Published; runId: string; audioCheck?: AudioCheckReport | null }): Promise<string> {
  const { brief, outcome } = input;
  const { data, error } = await db.from("editorial_library_items").insert({
    kind: input.kind, interest: brief.interests[0], grade_band: brief.gradeBand, grade: brief.grade, style_key: brief.styleKey,
    title: outcome.text.title, body: outcome.text.body, segments: outcome.segments.length ? outcome.segments : null,
    choices: input.kind === "fallback_chapter" ? outcome.text.choices : null, questions: outcome.text.questions.length ? outcome.text.questions : null,
    // H.3: gated again when the fallback is served (chapter-extras.ts).
    ...(input.kind === "fallback_chapter" && outcome.text.bonusScene ? { bonus_scene: outcome.text.bonusScene.slice(0, 1500) } : {}),
    target_lemmas: brief.targetLemmas, target_tenses: brief.targetTenses, rubric_mean: outcome.reviews.rubricMean,
    scores: { rubric: outcome.reviews.rubric, aiTells: outcome.gates.aiTells.score, styleFit: outcome.gates.styleFit, rounds: outcome.rounds, gates: outcome.gates.results.map((r) => ({ gate: r.gate, passed: r.passed, level: r.level })) },
    audio_check: input.audioCheck ?? null, run_id: input.runId, pipeline_version: EDITORIAL_PIPELINE_VERSION,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "library_item_not_saved");
  return data.id as string;
}

/**
 * Editorial evidence as a dictée gate (plugs into autoApproveDictation's
 * extraGates, src/lib/dictation/auto-approve.ts): the library run must have
 * met the 4.3 rubric bar with every editorial gate passing, the read-aloud
 * review must have passed, and the TTS round trip must not have failed.
 */
export function editorialEvidenceGate(outcome: Published, audioCheck: AudioCheckReport | null): DictationGate {
  return {
    name: "editorial_pipeline", version: EDITORIAL_PIPELINE_VERSION, blocking: true,
    run: () => {
      const problems: string[] = [];
      if (!outcome.verdict.meetsBar) problems.push(`verdict:${outcome.verdict.reasons.join(",")}`);
      if ((outcome.reviews.rubricMean ?? 0) < RUBRIC_BARS.library) problems.push(`rubric:${outcome.reviews.rubricMean}`);
      if (outcome.gates.hardFailed || outcome.gates.requiredFailed) problems.push("editorial_gates");
      if (audioCheck?.status === "failed") problems.push(`audio:${audioCheck.reason}`);
      const details = { rubricMean: outcome.reviews.rubricMean, aiTells: outcome.gates.aiTells.score, readAloud: outcome.reviews.dictation?.readAloudScore ?? null, audioCheck: audioCheck?.status ?? "skipped", problems };
      return problems.length ? { status: "fail", details } : { status: "pass", details };
    },
  };
}

const CEFR: Record<EditorialBrief["gradeBand"], "A2" | "B1" | "B2" | "C1"> = { cm: "A2", "6e-5e": "B1", "4e-3e": "B2", lycee: "C1" };

/** Inserts the dictée with its tags, then approves it through the dictée stream's gates plus the editorial evidence gate. */
export async function publishDictation(db: SupabaseClient, input: { brief: EditorialBrief; outcome: Published; libraryItemId: string; runId: string; audioCheck: AudioCheckReport | null }): Promise<{ dictationId: string; status: string }> {
  const { brief, outcome } = input;
  const interests = brief.interests.filter((key) => key in INTEREST_BY_KEY);
  const tenses = brief.targetTenses.filter((t) => (DICTATION_TENSES as readonly string[]).includes(t)) as DictationTense[];
  const segments = outcome.segments;
  const { data, error } = await db.from("dictations").insert({
    key: `editorial-${brief.gradeBand}-${input.libraryItemId.slice(0, 8)}`, title_fr: outcome.text.title, kind: "flash",
    text_fr: dictationText(segments), segments: segments.map((text) => ({ text, audioPath: null })), word_count: dictationWordCount(segments),
    grade_min: brief.grade, grade_max: Math.min(12, brief.grade + 1), target_node_keys: tenses.map((t) => TENSE_NODE_KEYS[t]),
    focus_fr: `Temps : ${brief.targetTenses.map((t) => TENSE_LABELS[t]).join(", ")}`,
    source_note: `Écrite automatiquement par le pipeline éditorial ${EDITORIAL_PIPELINE_VERSION} (run ${input.runId}).`,
    review_status: "needs_human_review",
    themes: interests.map((key) => key.replace(/_/gu, " ")).filter((t) => THEME_PATTERN.test(t)).slice(0, 8),
    interests, tenses, target_lemmas: brief.targetLemmas.map((l) => l.lemma), grammar_node_keys: tenses.map((t) => TENSE_NODE_KEYS[t]), cefr_band: CEFR[brief.gradeBand],
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "dictation_not_created");
  const result = await autoApproveDictation(db, { dictationId: data.id as string, pipelineVersion: EDITORIAL_PIPELINE_VERSION, extraGates: [editorialEvidenceGate(outcome, input.audioCheck)] });
  return { dictationId: data.id as string, status: result.status };
}

/**
 * Reading passages: stored as an ai_generated_candidates row (auto_approved,
 * candidate_type editorial_reading_text) carrying the full evidence. The
 * reading-passage auto-approval route (G.2) materialises it into
 * text_versions; the existing expository QA worker does not pick it up.
 */
export async function submitPassageCandidate(db: SupabaseClient, input: { brief: EditorialBrief; outcome: Published; libraryItemId: string; runId: string; authorModel: string }): Promise<string> {
  const { brief, outcome } = input;
  const { data: job, error: jobError } = await db.from("ai_generation_jobs").insert({
    job_type: "editorial_library", status: "completed", provider: "editorial", model_id: input.authorModel, input_payload: { brief, runId: input.runId, model: input.authorModel },
    output_payload: { libraryItemId: input.libraryItemId }, completed_at: new Date().toISOString(),
  }).select("id").single();
  if (jobError || !job) throw new Error(jobError?.message ?? "job_not_created");
  const { data, error } = await db.from("ai_generated_candidates").insert({
    generation_job_id: job.id, candidate_type: "editorial_reading_text", review_status: "auto_approved",
    payload: {
      pipelineVersion: EDITORIAL_PIPELINE_VERSION, runId: input.runId, libraryItemId: input.libraryItemId,
      interest: brief.interests[0], grade: brief.grade, gradeBand: brief.gradeBand, styleKey: brief.styleKey,
      title: outcome.text.title, body: outcome.text.body, questions: outcome.text.questions,
      targetLemmas: brief.targetLemmas, targetTenses: brief.targetTenses, rubricMean: outcome.reviews.rubricMean,
      gates: outcome.gates.results.map((r) => ({ gate: r.gate, passed: r.passed, level: r.level })),
    },
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "candidate_not_created");
  return data.id as string;
}
