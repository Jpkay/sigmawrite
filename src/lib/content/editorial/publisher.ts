import type { SupabaseClient } from "@supabase/supabase-js";
import type { AudioCheckReport } from "./audio-check";
import type { EditorialBrief } from "./brief";
import type { LibraryOutcome } from "./library";
import { TENSE_LABELS, EDITORIAL_PIPELINE_VERSION } from "./types";

/**
 * Writes library-mode results (H.16/H.17) into the content tables, always as
 * auto_approved with the pipeline version and gate evidence — never as a
 * human approval.
 *
 * Dictées go to public.dictations through a column-tolerant adapter: the
 * dictée stream adds auto_approved + tag columns in its own migration
 * (202610181200xx). If a column is not there yet, it is dropped from the
 * insert; if auto_approved is not yet allowed, the row is stored as
 * needs_human_review and flagged so it can be promoted once the migration lands.
 */

type Published = Extract<LibraryOutcome, { decision: "publish" }>;

export async function saveLibraryItem(db: SupabaseClient, input: { kind: "passage" | "dictation" | "fallback_chapter"; brief: EditorialBrief; outcome: Published; runId: string; audioCheck?: AudioCheckReport | null }): Promise<string> {
  const { brief, outcome } = input;
  const { data, error } = await db.from("editorial_library_items").insert({
    kind: input.kind, interest: brief.interests[0], grade_band: brief.gradeBand, grade: brief.grade, style_key: brief.styleKey,
    title: outcome.text.title, body: outcome.text.body, segments: outcome.segments.length ? outcome.segments : null,
    choices: input.kind === "fallback_chapter" ? outcome.text.choices : null, questions: outcome.text.questions.length ? outcome.text.questions : null,
    target_lemmas: brief.targetLemmas, target_tenses: brief.targetTenses, rubric_mean: outcome.reviews.rubricMean,
    scores: { rubric: outcome.reviews.rubric, aiTells: outcome.gates.aiTells.score, styleFit: outcome.gates.styleFit, rounds: outcome.rounds, gates: outcome.gates.results.map((r) => ({ gate: r.gate, passed: r.passed, level: r.level })) },
    audio_check: input.audioCheck ?? null, run_id: input.runId, pipeline_version: EDITORIAL_PIPELINE_VERSION,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "library_item_not_saved");
  return data.id as string;
}

const MISSING_COLUMN = /column "([^"]+)" of relation "dictations" does not exist|Could not find the '([^']+)' column of 'dictations'/u;

/** Inserts a row, dropping columns the database does not have yet (other stream's migration not applied). */
export async function insertTolerant(db: SupabaseClient, table: string, row: Record<string, unknown>, maxDrops = 12): Promise<{ id: string; dropped: string[] }> {
  const current = { ...row };
  const dropped: string[] = [];
  for (let attempt = 0; attempt <= maxDrops; attempt += 1) {
    const { data, error } = await db.from(table).insert(current).select("id").single();
    if (!error && data) return { id: data.id as string, dropped };
    const match = error?.message.match(MISSING_COLUMN) ?? (error?.code === "PGRST204" ? error.message.match(/'([^']+)' column/u) : null);
    const column = match?.[1] ?? match?.[2];
    if (!column || !(column in current)) throw new Error(error?.message ?? "insert_failed");
    delete current[column];
    dropped.push(column);
  }
  throw new Error("insert_tolerant_exhausted");
}

export async function publishDictation(db: SupabaseClient, input: { brief: EditorialBrief; outcome: Published; libraryItemId: string; runId: string; audioCheck: AudioCheckReport | null }): Promise<{ dictationId: string; reviewStatus: string; dropped: string[] }> {
  const { brief, outcome } = input;
  const key = `editorial-${brief.gradeBand}-${input.libraryItemId.slice(0, 8)}`;
  const words = outcome.text.body.split(/\s+/u).filter(Boolean).length;
  const base = {
    key, title_fr: outcome.text.title, kind: "flash", text_fr: outcome.segments.join(" "),
    segments: outcome.segments.map((text) => ({ text, audioPath: null })), word_count: words,
    grade_min: brief.grade, grade_max: Math.min(9, brief.grade + 1), target_node_keys: [],
    focus_fr: `Temps : ${brief.targetTenses.map((t) => TENSE_LABELS[t]).join(", ")}`,
    source_note: `Écrite automatiquement par le pipeline éditorial ${EDITORIAL_PIPELINE_VERSION} (run ${input.runId}).`,
  };
  const tags = {
    interests: brief.interests, themes: brief.interests, tenses: brief.targetTenses, target_lemmas: brief.targetLemmas.map((l) => l.lemma),
    grammar_node_keys: [], pipeline_version: EDITORIAL_PIPELINE_VERSION,
    gate_results: { runId: input.runId, rubricMean: outcome.reviews.rubricMean, aiTells: outcome.gates.aiTells.score, audioCheck: input.audioCheck?.status ?? "skipped", gates: outcome.gates.results.map((r) => ({ gate: r.gate, passed: r.passed })) },
  };
  try {
    const { id, dropped } = await insertTolerant(db, "dictations", { ...base, ...tags, review_status: "auto_approved" });
    return { dictationId: id, reviewStatus: "auto_approved", dropped };
  } catch (error) {
    // auto_approved not yet accepted by the review_status check (dictée stream migration pending).
    if (!/review_status|check constraint/iu.test(error instanceof Error ? error.message : "")) throw error;
    const { id, dropped } = await insertTolerant(db, "dictations", { ...base, ...tags, review_status: "needs_human_review" });
    return { dictationId: id, reviewStatus: "needs_human_review(awaiting_auto_approved_migration)", dropped };
  }
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
