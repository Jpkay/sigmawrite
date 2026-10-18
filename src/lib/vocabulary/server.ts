import "server-only";
/**
 * Server-side word memory API (roadmap 2026-10 Phases A–C). Every function
 * takes a service-role Supabase client: callers authenticate the student
 * (requireRole + requireStudentLearningUnlocked) before calling. See
 * README.md in this folder for the interface Phase D builds on.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { captureError } from "@/lib/observability";
import { countsForFsrs, introducedCardSchedule, reviewWordCard } from "./card-scheduler";
import { NO_CALENDAR, type CalendarSettings, type HolidayPeriod } from "./calendar";
import { planWordDay, type DailyPlan, type PlannedReview } from "./daily-plan";
import { localDay } from "./days";
import { selectParameterSet, type ParameterSet, type SelectedParameters } from "./fsrs-params";
import { ratingForAttempt } from "./grading";
import { learningStatusFor, masteryForStatus, wordStatus, WORD_STATUS_RANK, type WordStatusResult } from "./word-status";
import {
  evidenceKindFor,
  FORMAT_CREDIT,
  type FsrsRating,
  type WordActivityFormat,
  type WordCardState,
  type WordEvidence,
  type WordEvidenceSource,
  type WordFacet,
  type WordStatus,
} from "./types";

type Db = SupabaseClient;

// ---------------------------------------------------------------------------
// Lexical resolution (A.3)
// ---------------------------------------------------------------------------

export type WordTarget = {
  vocabularyItemId: string;
  lemmaId: string;
  /** The one sense this occurrence is about, or null when the lemma is ambiguous and nothing pins it. */
  senseId: string | null;
  /** Every teachable sense of the lemma (spelling evidence applies to all of them). */
  senseIds: string[];
  displayWord: string;
};

type ResolveRow = { match_key: string; vocabulary_item_id: string; lemma_id: string; sense_id: string | null; sense_count: number; display_word: string; definition_fr: string | null };

function targetsFromRows(rows: ResolveRow[]): Map<string, WordTarget> {
  const byKey = new Map<string, WordTarget>();
  for (const row of rows) {
    const existing = byKey.get(row.match_key);
    if (existing && existing.lemmaId !== row.lemma_id) continue; // homographs of different lemmas: keep the first
    const target = existing ?? { vocabularyItemId: row.vocabulary_item_id, lemmaId: row.lemma_id, senseId: null, senseIds: [], displayWord: row.display_word };
    if (row.sense_id && !target.senseIds.includes(row.sense_id)) target.senseIds.push(row.sense_id);
    target.senseId = target.senseIds.length === 1 ? target.senseIds[0] : null;
    byKey.set(row.match_key, target);
  }
  return byKey;
}

/** Vocabulary items → targets (anchors are created when missing). `pins` maps item id → sense id. */
export async function resolveItemTargets(db: Db, itemIds: string[], pins: Map<string, string | null> = new Map()): Promise<Map<string, WordTarget>> {
  const ids = [...new Set(itemIds)];
  if (!ids.length) return new Map();
  const ensured = await db.rpc("ensure_vocabulary_lexical_anchors", { p_item_ids: ids });
  if (ensured.error) throw new Error(ensured.error.message);
  const { data, error } = await db.rpc("resolve_word_senses", { p_item_ids: ids, p_forms: [] });
  if (error) throw new Error(error.message);
  const targets = targetsFromRows((data ?? []) as ResolveRow[]);
  for (const [itemId, senseId] of pins) {
    const target = targets.get(itemId);
    if (target && senseId && target.senseIds.includes(senseId)) target.senseId = senseId;
  }
  return targets;
}

/** Normalised surface forms → targets ("courait" → courir). Unknown forms are absent. */
export async function resolveFormTargets(db: Db, forms: string[]): Promise<Map<string, WordTarget>> {
  const unique = [...new Set(forms.filter(Boolean))].slice(0, 2000);
  if (!unique.length) return new Map();
  const { data, error } = await db.rpc("resolve_word_senses", { p_item_ids: [], p_forms: unique });
  if (error) throw new Error(error.message);
  return targetsFromRows((data ?? []) as ResolveRow[]);
}

// ---------------------------------------------------------------------------
// Cards, settings, parameters
// ---------------------------------------------------------------------------

export type WordCardRow = WordCardState & { id: string; senseId: string; importance: number; paramsVersion: string | null };

const CARD_COLUMNS = "id,target_id,facet,due_at,last_reviewed_at,introduced_at,fsrs_state,repetitions,lapse_count,importance";

function cardFromRow(row: Record<string, unknown>): WordCardRow {
  const state = (row.fsrs_state ?? {}) as Record<string, unknown>;
  const num = (value: unknown) => (value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value));
  return {
    id: row.id as string,
    senseId: row.target_id as string,
    facet: row.facet as WordFacet,
    stability: num(state.stability),
    difficulty: num(state.difficulty),
    reps: Number(row.repetitions ?? 0),
    lapses: Number(row.lapse_count ?? 0),
    dueAt: row.due_at as string,
    lastReviewedAt: (row.last_reviewed_at as string | null) ?? null,
    introducedAt: (row.introduced_at as string | null) ?? null,
    importance: Number(row.importance ?? 1),
    paramsVersion: (state.params_version as string | undefined) ?? null,
  };
}

export async function loadWordCards(db: Db, studentId: string, senseIds?: string[]): Promise<WordCardRow[]> {
  if (senseIds && !senseIds.length) return [];
  let query = db.from("learning_retrieval_schedules").select(CARD_COLUMNS).eq("student_id", studentId).eq("target_type", "lexical_sense").neq("status", "retired");
  if (senseIds) query = query.in("target_id", [...new Set(senseIds)]);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => cardFromRow(row as Record<string, unknown>));
}

export type MemorySettings = CalendarSettings & { maxDailyReviews: number | null; maxNewWords: number | null };

export async function loadMemorySettings(db: Db, studentId: string): Promise<MemorySettings> {
  const { data, error } = await db.from("student_memory_settings").select("calendar_zone,custom_holidays,pause_during_holidays,max_daily_reviews,max_new_words").eq("student_id", studentId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ...NO_CALENDAR, maxDailyReviews: null, maxNewWords: null };
  const custom = Array.isArray(data.custom_holidays)
    ? (data.custom_holidays as unknown[]).filter((value): value is HolidayPeriod => !!value && typeof value === "object" && typeof (value as HolidayPeriod).start === "string" && typeof (value as HolidayPeriod).end === "string").map((value) => ({ start: value.start, end: value.end, label: typeof value.label === "string" ? value.label : "Vacances" }))
    : [];
  return {
    zone: (data.calendar_zone as CalendarSettings["zone"]) ?? null,
    customHolidays: custom,
    pauseDuringHolidays: !!data.pause_during_holidays,
    maxDailyReviews: data.max_daily_reviews == null ? null : Number(data.max_daily_reviews),
    maxNewWords: data.max_new_words == null ? null : Number(data.max_new_words),
  };
}

async function loadParameters(db: Db, studentId: string): Promise<(facet: WordFacet) => SelectedParameters> {
  const [{ data: student }, { data: sets, error }] = await Promise.all([
    db.from("students").select("current_grade").eq("id", studentId).maybeSingle(),
    db.from("fsrs_parameter_sets").select("version,scope,cohort_key,facet,student_id,weights,status").eq("status", "active").or(`student_id.is.null,student_id.eq.${studentId}`),
  ]);
  if (error) throw new Error(error.message);
  const parsed: ParameterSet[] = (sets ?? []).map((row) => ({
    version: row.version as string, scope: row.scope as ParameterSet["scope"], cohortKey: (row.cohort_key as ParameterSet["cohortKey"]) ?? null,
    facet: row.facet as WordFacet, studentId: (row.student_id as string | null) ?? null,
    weights: Array.isArray(row.weights) ? (row.weights as unknown[]).map(Number) : [], status: row.status as ParameterSet["status"],
  }));
  const grade = student?.current_grade == null ? null : Number(student.current_grade);
  return (facet) => selectParameterSet(parsed, { studentId, grade, facet });
}

async function loadItemStatuses(db: Db, studentId: string, itemIds: string[]): Promise<Map<string, WordStatus>> {
  if (!itemIds.length) return new Map();
  const { data, error } = await db.from("student_word_mastery").select("vocabulary_item_id,word_status").eq("student_id", studentId).in("vocabulary_item_id", [...new Set(itemIds)]);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.vocabulary_item_id as string, row.word_status as WordStatus]));
}

// ---------------------------------------------------------------------------
// Evidence (A.4) and reviews (B.1, B.4, C.4)
// ---------------------------------------------------------------------------

export type WordEvidenceInput = {
  target: WordTarget;
  format: WordActivityFormat;
  source: WordEvidenceSource;
  /** Exactly right. For exposure / look-up formats pass true. */
  correct: boolean;
  accentOnly?: boolean;
  hintLevel?: number;
  answerRevealed?: boolean;
  responseMs?: number | null;
  novelContext?: boolean;
  /** Restrict to some facets of a two-facet format. */
  facets?: WordFacet[];
  /** Unique per student and occurrence; makes every write idempotent. */
  occurrenceKey: string;
  at: string;
  firstSeen?: { sentence?: string | null; interest?: string | null };
  payload?: Record<string, unknown>;
};

export type FacetOutcome = { senseId: string; facet: WordFacet; reviewed: boolean; countedForFsrs: boolean; rating: FsrsRating | null; dueAt: string | null };

type Context = {
  db: Db;
  studentId: string;
  cards: Map<string, WordCardRow>;
  statuses: Map<string, WordStatus>;
  params: (facet: WordFacet) => SelectedParameters;
};

const cardKey = (senseId: string, facet: WordFacet) => `${senseId}:${facet}`;

async function buildContext(db: Db, studentId: string, inputs: WordEvidenceInput[]): Promise<Context> {
  const senseIds = [...new Set(inputs.flatMap((input) => input.target.senseIds))];
  const [cards, statuses, params] = await Promise.all([
    loadWordCards(db, studentId, senseIds),
    loadItemStatuses(db, studentId, inputs.map((input) => input.target.vocabularyItemId)),
    loadParameters(db, studentId),
  ]);
  return { db, studentId, cards: new Map(cards.map((card) => [cardKey(card.senseId, card.facet), card])), statuses, params };
}

function evidenceRow(input: WordEvidenceInput, facet: WordFacet | null, senseId: string | null, extra: Record<string, unknown> = {}) {
  const kind = evidenceKindFor(input.format, facet);
  const credit = FORMAT_CREDIT[input.format].credit;
  return {
    vocabulary_item_id: input.target.vocabularyItemId,
    lexical_sense_id: senseId,
    evidence_kind: kind,
    successful: input.correct,
    typed_production: credit === "recall",
    facet,
    source: input.source,
    activity_format: input.format,
    hint_level: Math.max(0, Math.min(3, input.hintLevel ?? 0)),
    answer_revealed: !!input.answerRevealed,
    accent_only: !!input.accentOnly,
    novel_context: !!input.novelContext,
    response_ms: input.responseMs == null ? null : Math.max(0, Math.round(input.responseMs)),
    occurred_at: input.at,
    first_seen_sentence: input.firstSeen?.sentence ?? null,
    first_seen_interest: input.firstSeen?.interest ?? null,
    payload: input.payload ?? {},
    ...extra,
  };
}

async function reviewCard(ctx: Context, input: WordEvidenceInput, card: WordCardRow, occurrenceKey: string): Promise<FacetOutcome> {
  const rating = ratingForAttempt({ correct: input.correct, accentOnly: input.accentOnly, hintLevel: input.hintLevel, answerRevealed: input.answerRevealed, responseMs: input.responseMs, format: input.format });
  const params = ctx.params(card.facet);
  for (let attempt = 0; attempt < 2; attempt++) {
    const current = attempt === 0 ? card : (await loadWordCards(ctx.db, ctx.studentId, [card.senseId])).find((row) => row.facet === card.facet);
    if (!current) throw new Error("Carte de mot introuvable.");
    const counted = countsForFsrs(current, input.at);
    const status = ctx.statuses.get(input.target.vocabularyItemId) ?? null;
    const next = counted ? reviewWordCard({ card: current, rating, at: input.at, status, weights: params.weights }) : null;
    const scheduledDays = current.lastReviewedAt ? Math.max(0, (Date.parse(current.dueAt) - Date.parse(current.lastReviewedAt)) / 86_400_000) : null;
    const { data, error } = await ctx.db.rpc("record_word_review", {
      p_payload: {
        student_id: ctx.studentId,
        schedule_id: current.id,
        occurrence_key: occurrenceKey,
        reviewed_at: input.at,
        counts_for_fsrs: counted,
        expected_last_reviewed_at: current.lastReviewedAt,
        rating,
        correct: input.correct,
        accent_only: !!input.accentOnly,
        elapsed_days: next?.elapsedDays ?? null,
        scheduled_days: scheduledDays,
        activity_format: input.format,
        hint_level: Math.max(0, Math.min(3, input.hintLevel ?? 0)),
        answer_revealed: !!input.answerRevealed,
        response_ms: input.responseMs == null ? null : Math.max(0, Math.round(input.responseMs)),
        source: input.source,
        stability_before: current.stability,
        difficulty_before: current.difficulty,
        retrievability_before: next?.retrievabilityBefore ?? null,
        desired_retention: next?.retention ?? null,
        params_version: params.version,
        fsrs: next ? {
          stability: next.stability, difficulty: next.difficulty, reps: next.reps, lapses: next.lapses,
          interval_days: next.intervalDays, due_at: next.dueAt, retention: next.retention, params_version: params.version,
        } : null,
        evidence: evidenceRow(input, card.facet, card.senseId, { payload: { ...(input.payload ?? {}), stability_before: current.stability } }),
      },
    });
    if (error?.code === "40001" && attempt === 0) continue;
    if (error) throw new Error(error.message);
    const duplicate = !!(data as { duplicate?: boolean } | null)?.duplicate;
    if (next && !duplicate) ctx.cards.set(cardKey(card.senseId, card.facet), { ...current, stability: next.stability, difficulty: next.difficulty, reps: next.reps, lapses: next.lapses, dueAt: next.dueAt, lastReviewedAt: input.at });
    return { senseId: card.senseId, facet: card.facet, reviewed: true, countedForFsrs: counted && !duplicate, rating, dueAt: next?.dueAt ?? current.dueAt };
  }
  throw new Error("La révision n’a pas pu être enregistrée.");
}

async function processEvidence(ctx: Context, input: WordEvidenceInput): Promise<FacetOutcome[]> {
  const credit = FORMAT_CREDIT[input.format];
  const target = input.target;
  const plainRows: Record<string, unknown>[] = [];
  const outcomes: FacetOutcome[] = [];
  if (credit.credit === "none") {
    const introduced = target.senseIds.some((senseId) => ctx.cards.has(cardKey(senseId, "spelling")) || ctx.cards.has(cardKey(senseId, "meaning")));
    plainRows.push(evidenceRow(input, null, target.senseId, {
      occurrence_key: input.occurrenceKey,
      // C.2: exposure only puts a teachable word on the "to introduce" list.
      to_introduce: input.format !== "lookup" && target.senseIds.length > 0 && !introduced,
    }));
  } else {
    const facets = credit.facets.filter((facet) => !input.facets || input.facets.includes(facet));
    for (const facet of facets) {
      // Spelling is shared by every sense of the lemma; meaning needs the exact sense.
      const candidates = facet === "spelling" ? target.senseIds : target.senseId ? [target.senseId] : [];
      const withCards = candidates.filter((senseId) => ctx.cards.has(cardKey(senseId, facet)));
      if (withCards.length) {
        for (const senseId of withCards) {
          const key = withCards.length > 1 ? `${input.occurrenceKey}:${facet}:${senseId}` : `${input.occurrenceKey}:${facet}`;
          outcomes.push(await reviewCard(ctx, input, ctx.cards.get(cardKey(senseId, facet))!, key));
        }
      } else if (facet === "spelling" || target.senseId) {
        plainRows.push(evidenceRow(input, facet, target.senseId, { occurrence_key: `${input.occurrenceKey}:${facet}` }));
        outcomes.push({ senseId: target.senseId ?? "", facet, reviewed: false, countedForFsrs: false, rating: null, dueAt: null });
      }
    }
  }
  if (plainRows.length) {
    const { error } = await ctx.db.rpc("record_word_evidence", { p_student_id: ctx.studentId, p_rows: plainRows });
    if (error) throw new Error(error.message);
  }
  return outcomes;
}

/**
 * THE single entry point for word evidence (A.4): reading, dictées,
 * practice, the diagnostic, free writing, story chapters and reviews all
 * call this. If the student has a card for the facet, the answer is a card
 * review (FSRS updated only on the first counted attempt of the day);
 * otherwise it is stored as evidence. Then the word status is recomputed.
 *
 * Only teachable words are tracked: a lemma needs at least one approved
 * sense (a vetted definition). Function words and unknown lemmas are ignored.
 */
export async function recordWordEvidence(db: Db, studentId: string, allInputs: WordEvidenceInput[]): Promise<FacetOutcome[]> {
  const inputs = allInputs.filter((input) => input.target.senseIds.length > 0);
  if (!inputs.length) return [];
  const ctx = await buildContext(db, studentId, inputs);
  const outcomes: FacetOutcome[] = [];
  for (const input of inputs) outcomes.push(...await processEvidence(ctx, input));
  await refreshWordStatuses(db, studentId, inputs.map((input) => input.target.vocabularyItemId));
  return outcomes;
}

// ---------------------------------------------------------------------------
// Status (B.2, B.3)
// ---------------------------------------------------------------------------

export type WordStatusView = {
  vocabularyItemId: string;
  senseId: string | null;
  status: WordStatus;
  detail: WordStatusResult;
};

const EVIDENCE_COLUMNS = "vocabulary_item_id,lexical_sense_id,evidence_kind,facet,successful,activity_format,source,hint_level,answer_revealed,accent_only,novel_context,rating,counts_for_fsrs,occurred_at,evidence_payload";

function evidenceFromRow(row: Record<string, unknown>): WordEvidence {
  const payload = (row.evidence_payload ?? {}) as Record<string, unknown>;
  return {
    at: row.occurred_at as string,
    kind: row.evidence_kind as WordEvidence["kind"],
    facet: (row.facet as WordFacet | null) ?? null,
    successful: !!row.successful,
    format: (row.activity_format as WordActivityFormat | null) ?? null,
    source: (row.source as WordEvidenceSource | null) ?? null,
    hintLevel: Number(row.hint_level ?? 0),
    answerRevealed: !!row.answer_revealed,
    accentOnly: !!row.accent_only,
    novelContext: !!row.novel_context,
    rating: row.rating == null ? null : (Number(row.rating) as FsrsRating),
    countsForFsrs: row.counts_for_fsrs == null ? undefined : !!row.counts_for_fsrs,
    stabilityBefore: payload.stability_before == null ? null : Number(payload.stability_before),
  };
}

/** Computes the status of each sense of the given words (best sense first). */
export async function computeWordStatuses(db: Db, studentId: string, itemIds: string[]): Promise<Map<string, WordStatusView[]>> {
  const ids = [...new Set(itemIds)];
  const out = new Map<string, WordStatusView[]>();
  if (!ids.length) return out;
  const targets = await resolveItemTargets(db, ids);
  const senseIds = [...targets.values()].flatMap((target) => target.senseIds);
  const [cards, evidenceResult] = await Promise.all([
    loadWordCards(db, studentId, senseIds),
    db.from("vocabulary_learning_evidence").select(EVIDENCE_COLUMNS).eq("student_id", studentId).in("vocabulary_item_id", ids).order("occurred_at", { ascending: true }).limit(5000),
  ]);
  if (evidenceResult.error) throw new Error(evidenceResult.error.message);
  const evidenceByItem = new Map<string, Array<{ senseId: string | null; evidence: WordEvidence }>>();
  for (const row of evidenceResult.data ?? []) {
    const list = evidenceByItem.get(row.vocabulary_item_id as string) ?? [];
    list.push({ senseId: (row.lexical_sense_id as string | null) ?? null, evidence: evidenceFromRow(row as Record<string, unknown>) });
    evidenceByItem.set(row.vocabulary_item_id as string, list);
  }
  for (const id of ids) {
    const target = targets.get(id);
    const all = evidenceByItem.get(id) ?? [];
    const senses = target?.senseIds.length ? target.senseIds : [null];
    const views = senses.map((senseId) => {
      // Spelling evidence without a sense belongs to the lemma, so to every sense.
      const evidence = all.filter((entry) => entry.senseId === senseId || (entry.senseId == null && entry.evidence.facet !== "meaning")).map((entry) => entry.evidence);
      const own = senseId ? cards.filter((card) => card.senseId === senseId) : [];
      const detail = wordStatus(evidence, { spelling: own.find((card) => card.facet === "spelling") ?? null, meaning: own.find((card) => card.facet === "meaning") ?? null });
      return { vocabularyItemId: id, senseId, status: detail.status, detail };
    }).sort((a, b) => WORD_STATUS_RANK[b.status] - WORD_STATUS_RANK[a.status]);
    out.set(id, views);
  }
  return out;
}

/** Writes the recomputed status, legacy mastery and learning_status to student_word_mastery. */
export async function refreshWordStatuses(db: Db, studentId: string, itemIds: string[]): Promise<Map<string, WordStatusView[]>> {
  const statuses = await computeWordStatuses(db, studentId, itemIds);
  const now = new Date().toISOString();
  for (const [itemId, views] of statuses) {
    const best = views[0];
    if (!best) continue;
    const patch: Record<string, unknown> = {
      word_status: best.status,
      mastery: masteryForStatus(best.detail),
      learning_status: learningStatusFor(best.status),
      status_updated_at: now,
    };
    if (WORD_STATUS_RANK[best.status] >= WORD_STATUS_RANK.presque) patch.status_note = null;
    const { error } = await db.from("student_word_mastery").update(patch).eq("student_id", studentId).eq("vocabulary_item_id", itemId);
    if (error) throw new Error(error.message);
  }
  return statuses;
}

// ---------------------------------------------------------------------------
// Phase D interface: introduce, review, plan
// ---------------------------------------------------------------------------

/**
 * D.1 → C.2: introduces a word. Creates its two cards (first review the next
 * day), records the introduction as an exposure with the sentence where the
 * student met it, and takes the word off the "to introduce" list.
 */
export async function introduceWord(db: Db, input: {
  studentId: string;
  senseId: string;
  at?: string;
  importance?: number;
  context?: { sentence?: string | null; interest?: string | null };
  occurrenceKey?: string;
}): Promise<WordCardRow[]> {
  const at = input.at ?? new Date().toISOString();
  const schedule = introducedCardSchedule(at);
  const { data, error } = await db.rpc("introduce_word_cards", {
    p_student_id: input.studentId, p_sense_id: input.senseId, p_introduced_at: at, p_due_at: schedule.dueAt, p_importance: input.importance ?? 1,
  });
  if (error) throw new Error(error.message);
  const cards = ((data ?? []) as Record<string, unknown>[]).map(cardFromRow);
  const { data: sense } = await db.from("lexical_senses").select("lexical_lemmas!inner(vocabulary_item_id)").eq("id", input.senseId).maybeSingle();
  const itemId = (sense?.lexical_lemmas as unknown as { vocabulary_item_id: string } | null)?.vocabulary_item_id;
  if (itemId) {
    const { error: evidenceError } = await db.rpc("record_word_evidence", {
      p_student_id: input.studentId,
      p_rows: [{
        vocabulary_item_id: itemId, lexical_sense_id: input.senseId, evidence_kind: "exposure", successful: true, source: "introduction",
        activity_format: "reading_exposure", occurred_at: at, occurrence_key: input.occurrenceKey ?? `introduction:${input.senseId}`,
        first_seen_sentence: input.context?.sentence ?? null, first_seen_interest: input.context?.interest ?? null,
      }],
    });
    if (evidenceError) throw new Error(evidenceError.message);
    await refreshWordStatuses(db, input.studentId, [itemId]);
  }
  return cards;
}

export type WordReviewAttempt = {
  studentId: string;
  senseId: string;
  format: WordActivityFormat;
  /** Defaults to the facets the format proves (type_from_definition → both). */
  facets?: WordFacet[];
  correct: boolean;
  accentOnly?: boolean;
  hintLevel?: number;
  answerRevealed?: boolean;
  responseMs?: number | null;
  novelContext?: boolean;
  /** 'review' for a review activity, 'embedded' for a due word met inside other content (D.6). */
  source?: WordEvidenceSource;
  /** Unique per attempt (e.g. `review:<sessionId>:<position>`). */
  occurrenceKey: string;
  at?: string;
};

/** Records one review answer. In-session retries are logged but only the first attempt of the day moves FSRS. */
export async function recordWordReviewAttempt(db: Db, attempt: WordReviewAttempt): Promise<{ outcomes: FacetOutcome[]; status: WordStatus | null }> {
  const { data: sense, error } = await db.from("lexical_senses").select("id,lemma_id,lexical_lemmas!inner(vocabulary_item_id,lemma)").eq("id", attempt.senseId).maybeSingle();
  if (error) throw new Error(error.message);
  const lemma = sense?.lexical_lemmas as unknown as { vocabulary_item_id: string | null; lemma: string } | null;
  if (!sense || !lemma?.vocabulary_item_id) throw new Error("Mot introuvable.");
  const target: WordTarget = { vocabularyItemId: lemma.vocabulary_item_id, lemmaId: sense.lemma_id as string, senseId: attempt.senseId, senseIds: [attempt.senseId], displayWord: lemma.lemma };
  const outcomes = await recordWordEvidence(db, attempt.studentId, [{
    target, format: attempt.format, source: attempt.source ?? "review", correct: attempt.correct, accentOnly: attempt.accentOnly,
    hintLevel: attempt.hintLevel, answerRevealed: attempt.answerRevealed, responseMs: attempt.responseMs, novelContext: attempt.novelContext,
    facets: attempt.facets, occurrenceKey: attempt.occurrenceKey, at: attempt.at ?? new Date().toISOString(),
  }]);
  const { data: row } = await db.from("student_word_mastery").select("word_status").eq("student_id", attempt.studentId).eq("vocabulary_item_id", lemma.vocabulary_item_id).maybeSingle();
  return { outcomes, status: (row?.word_status as WordStatus | undefined) ?? null };
}

export type DueWordCard = PlannedReview & {
  vocabularyItemId: string | null;
  word: string | null;
  definition: string | null;
};

export type WordToIntroduce = { vocabularyItemId: string; senseId: string; word: string; definition: string | null; firstSeenSentence: string | null; interest: string | null };

export type DueWordPlan = Omit<DailyPlan, "reviews"> & { reviews: DueWordCard[]; toIntroduce: WordToIntroduce[] };

/**
 * Today's word work for a student, caps applied (C.5): due cards ordered by
 * priority (never more than the daily review cap, holidays paused if the
 * student chose so) and up to `newWordAllowance` words to introduce.
 */
export async function getDueWordCards(db: Db, studentId: string, options: { now?: string } = {}): Promise<DueWordPlan> {
  const now = options.now ?? new Date().toISOString();
  const today = localDay(now);
  const since = new Date(Date.parse(now) - 120 * 86_400_000).toISOString();
  const [cards, settings, logResult, statusResult] = await Promise.all([
    loadWordCards(db, studentId),
    loadMemorySettings(db, studentId),
    db.from("word_review_log").select("reviewed_at,rating,counts_for_fsrs").eq("student_id", studentId).gte("reviewed_at", since).order("reviewed_at", { ascending: false }).limit(1000),
    db.from("student_word_mastery").select("vocabulary_item_id,word_status").eq("student_id", studentId).in("word_status", ["ancre"]),
  ]);
  if (logResult.error) throw new Error(logResult.error.message);
  if (statusResult.error) throw new Error(statusResult.error.message);
  const log = logResult.data ?? [];
  const reviewsDoneToday = log.filter((row) => localDay(row.reviewed_at as string) === today).length;
  const firsts = log.filter((row) => row.counts_for_fsrs).slice(0, 60);
  const recentSuccessRate = firsts.length >= 20 ? firsts.filter((row) => Number(row.rating) > 1).length / firsts.length : null;
  const activeDays = new Set([...log.map((row) => localDay(row.reviewed_at as string)), ...cards.flatMap((card) => (card.introducedAt ? [localDay(card.introducedAt)] : []))]).size;
  const newWordsIntroducedToday = new Set(cards.filter((card) => card.introducedAt && localDay(card.introducedAt) === today).map((card) => card.senseId)).size;
  const anchoredItems = new Set((statusResult.data ?? []).map((row) => row.vocabulary_item_id as string));

  const senseIds = [...new Set(cards.map((card) => card.senseId))];
  const senseInfo = new Map<string, { itemId: string | null; word: string | null; definition: string | null }>();
  if (senseIds.length) {
    const { data, error } = await db.from("lexical_senses").select("id,definition_fr,lexical_lemmas!inner(vocabulary_item_id,lemma)").in("id", senseIds);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const lemma = row.lexical_lemmas as unknown as { vocabulary_item_id: string | null; lemma: string };
      senseInfo.set(row.id as string, { itemId: lemma.vocabulary_item_id, word: lemma.lemma, definition: row.definition_fr as string });
    }
  }
  const plan = planWordDay({
    cards: cards.map((card) => ({ ...card, learning: !anchoredItems.has(senseInfo.get(card.senseId)?.itemId ?? "") })),
    now,
    calendar: settings,
    reviewsDoneToday,
    newWordsIntroducedToday,
    recentSuccessRate,
    activeDays,
    caps: {
      ...(settings.maxDailyReviews != null ? { maxReviews: settings.maxDailyReviews } : {}),
      ...(settings.maxNewWords != null ? { newWordsMax: settings.maxNewWords, newWordsMin: Math.min(3, settings.maxNewWords), gentleNewWords: Math.min(3, settings.maxNewWords) } : {}),
    },
  });
  let toIntroduce: WordToIntroduce[] = [];
  if (plan.newWordAllowance > 0) {
    const { data, error } = await db.from("student_word_mastery").select("vocabulary_item_id,first_seen_sentence,first_seen_interest,last_seen_at").eq("student_id", studentId).eq("to_introduce", true).order("last_seen_at", { ascending: false, nullsFirst: false }).limit(plan.newWordAllowance * 4);
    if (error) throw new Error(error.message);
    const targets = await resolveItemTargets(db, (data ?? []).map((row) => row.vocabulary_item_id as string));
    for (const row of data ?? []) {
      const target = targets.get(row.vocabulary_item_id as string);
      const senseId = target?.senseId ?? target?.senseIds[0];
      if (!target || !senseId || senseIds.includes(senseId)) continue;
      toIntroduce.push({ vocabularyItemId: target.vocabularyItemId, senseId, word: target.displayWord, definition: null, firstSeenSentence: (row.first_seen_sentence as string | null) ?? null, interest: (row.first_seen_interest as string | null) ?? null });
      if (toIntroduce.length >= plan.newWordAllowance) break;
    }
    if (toIntroduce.length) {
      const { data: defs } = await db.from("lexical_senses").select("id,definition_fr").in("id", toIntroduce.map((word) => word.senseId));
      const byId = new Map((defs ?? []).map((row) => [row.id as string, row.definition_fr as string]));
      toIntroduce = toIntroduce.map((word) => ({ ...word, definition: byId.get(word.senseId) ?? null }));
    }
  }
  return {
    ...plan,
    reviews: plan.reviews.map((review) => {
      const info = senseInfo.get(review.senseId);
      return { ...review, vocabularyItemId: info?.itemId ?? null, word: info?.word ?? null, definition: info?.definition ?? null };
    }),
    toIntroduce,
  };
}

/** Best-effort wrapper for capture paths: evidence must never block a student's activity. */
export async function safely<T>(label: string, work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch (error) {
    captureError(error, { area: "word_memory", label });
    return null;
  }
}
