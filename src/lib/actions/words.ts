"use server";
/**
 * Word sessions (roadmap 2026-10 Phase D): "Rappel éclair" bursts inside the
 * daily session, introductions (D.1), answers to recall items (D.3, D.4),
 * "explique avec tes mots" (D.5) and "Mon trésor de mots" (D.7).
 *
 * Every answer is graded here, never on the client: the expected word and
 * the right option travel in a signed token (session/token.ts).
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getCurrentStudentId } from "@/lib/db/student";
import { requireStudentAccessAuthorized, requireStudentLearningUnlocked } from "@/lib/diagnostic/access";
import { journalStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import { XP_AWARDS } from "@/lib/motivation";
import { captureError } from "@/lib/observability";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { gradeSpelling } from "@/lib/vocabulary/grading";
import { introduceWord, recordWordReviewAttempt } from "@/lib/vocabulary/server";
import { localDay } from "@/lib/vocabulary/days";
import type { WordActivityFormat, WordStatus } from "@/lib/vocabulary/types";
import { buildWordSession, type DraftCore, type DraftItem } from "@/lib/vocabulary/session/builder";
import { WORD_SESSION_COPY as copy, praise, statusLabel, TREASURE_STATUS_ORDER } from "@/lib/vocabulary/session/copy";
import { gradeExplanation, parseValidation, type ExplainVerdict } from "@/lib/vocabulary/session/explain";
import { moderateWordExplanation, providerJudge } from "@/lib/vocabulary/session/explain-server";
import { spellingFeedback } from "@/lib/vocabulary/session/feedback";
import { loadRelatedWords, loadWordSessionData } from "@/lib/vocabulary/session/loader";
import { openItem, sealItem, type ItemClaims } from "@/lib/vocabulary/session/token";
import type { FeedbackSegment, WordAnswerOutcome, WordItem, WordItemCore } from "@/lib/vocabulary/session/types";

async function studentContext() {
  await requireRole(["student"]);
  const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  await requireStudentAccessAuthorized(supabase, studentId);
  return { supabase, studentId };
}

// ---------------------------------------------------------------------------
// Loading a burst
// ---------------------------------------------------------------------------

const loadSchema = z.object({
  units: z.number().int().min(0).max(16),
  newWords: z.number().int().min(0).max(6),
  offset: z.number().int().min(0).max(20).optional(),
}).strict();

export type WordSession = { sessionId: string; items: WordItem[]; holiday: boolean; unavailable: boolean };

function seal(draft: DraftCore, base: { sub: string; sid: string }): WordItemCore {
  const token = sealItem({ ...draft.secret, ...base, iid: draft.view.id });
  if (draft.view.format === "mini_dictation") {
    return {
      ...draft.view,
      token,
      words: draft.view.words.map((word, index) => {
        const part = draft.parts?.[index];
        return {
          ...word,
          token: part ? sealItem({ ...part.secret, ...base, iid: word.id }) : "",
          retry: part?.retry ? seal(part.retry, base) : undefined,
        };
      }),
    } as WordItemCore;
  }
  return { ...draft.view, token } as WordItemCore;
}

function sealItemTree(draft: DraftItem, base: { sub: string; sid: string }): WordItem {
  return {
    ...seal(draft, base),
    retry: draft.retry ? seal(draft.retry, base) : undefined,
    rescue: draft.rescue ? seal(draft.rescue, base) : undefined,
    harder: draft.harder ? seal(draft.harder, base) : undefined,
  } as WordItem;
}

/** Strips tokens (secrets) before journaling what the student was shown. */
function journalView(items: WordItem[]) {
  return JSON.parse(JSON.stringify(items, (key, value) => (key === "token" || key === "audioUrl" ? undefined : value)));
}

export async function loadWordSession(input: unknown): Promise<WordSession> {
  const data = loadSchema.parse(input);
  const { supabase, studentId } = await studentContext();
  await requireStudentLearningUnlocked(supabase, studentId);
  const sessionId = randomUUID();
  try {
    const loaded = await loadWordSessionData(createServiceClient(), studentId, { units: data.units, newWords: data.newWords, offset: data.offset });
    const drafts = buildWordSession(loaded.input);
    const items = drafts.map((draft) => sealItemTree(draft, { sub: studentId, sid: sessionId }));
    await journalStudentPayload(studentId, "words:session", { copy, items: journalView(items) });
    return { sessionId, items, holiday: loaded.plan.paused, unavailable: false };
  } catch (error) {
    // Never a broken page: the daily session simply has no words right now.
    captureError(error, { area: "word_memory", label: "load_word_session" });
    return { sessionId, items: [], holiday: false, unavailable: true };
  }
}

// ---------------------------------------------------------------------------
// Introductions (D.1)
// ---------------------------------------------------------------------------

const tokenSchema = z.object({ token: z.string().min(10).max(8000) }).strict();

export async function introduceSessionWord(input: unknown): Promise<{ ok: true; message: string }> {
  const data = tokenSchema.parse(input);
  const { supabase, studentId } = await studentContext();
  await requireStudentLearningUnlocked(supabase, studentId);
  const claims = openItem(data.token, studentId);
  if (claims.format !== "introduce") throw new Error("Cette question a expiré. Recharge la page.");
  const service = createServiceClient();
  const at = new Date().toISOString();
  await introduceWord(service, {
    studentId, senseId: claims.senseId, at,
    context: claims.context ?? undefined,
    occurrenceKey: `introduction:session:${claims.senseId}`,
  });
  await awardWordXp(service, studentId, claims.senseId, at);
  return { ok: true, message: copy.introduced(claims.word) };
}

// ---------------------------------------------------------------------------
// Answers (D.3, D.4)
// ---------------------------------------------------------------------------

const answerSchema = z.object({
  token: z.string().min(10).max(8000),
  answer: z.string().max(120).optional(),
  choiceId: z.string().max(20).optional(),
  hintLevel: z.number().int().min(0).max(3).default(0),
  responseMs: z.number().int().min(0).max(600_000).optional(),
  attempt: z.number().int().min(0).max(8).default(0),
}).strict();

export type WordAnswerResult = {
  outcome: WordAnswerOutcome;
  correct: boolean;
  /** The right spelling / option, shown after the answer. */
  expected: string | null;
  correctChoiceId: string | null;
  segments: FeedbackSegment[] | null;
  message: string;
  celebration: string | null;
};

const TYPED = new Set(["hear_and_type", "type_from_definition", "gap_fill_typed", "mini_dictation", "rebuild_letters"]);
const CHOICE = new Set(["judge_usage", "synonym_antonym", "odd_one_out", "pick_definition"]);

async function awardWordXp(service: ReturnType<typeof createServiceClient>, studentId: string, senseId: string, at: string) {
  try {
    await service.rpc("award_student_xp", { p_student_id: studentId, p_event_key: `vocabulary_review:${senseId}:${localDay(at)}`, p_source_type: "vocabulary_review", p_source_id: senseId, p_base_xp: XP_AWARDS.vocabularyReview, p_bonus_xp: 0, p_awarded_at: at });
  } catch (error) {
    captureError(error, { area: "word_memory", label: "word_xp" });
  }
}

async function record(claims: ItemClaims, studentId: string, attempt: { correct: boolean; accentOnly?: boolean; hintLevel: number; responseMs?: number; n: number }): Promise<WordStatus | null> {
  const service = createServiceClient();
  const at = new Date().toISOString();
  try {
    const result = await recordWordReviewAttempt(service, {
      studentId, senseId: claims.senseId, format: claims.format as WordActivityFormat, facets: claims.facets,
      correct: attempt.correct, accentOnly: attempt.accentOnly, hintLevel: attempt.hintLevel, answerRevealed: attempt.hintLevel >= 3,
      responseMs: attempt.responseMs ?? null, novelContext: claims.novelContext, source: "review",
      occurrenceKey: `words:${claims.sid}:${claims.iid}:${attempt.n}`, at,
    });
    if (attempt.correct && attempt.n === 0) await awardWordXp(service, studentId, claims.senseId, at);
    return result.status;
  } catch (error) {
    // The student still gets feedback; the evidence is retried on their next answer.
    captureError(error, { area: "word_memory", label: "record_word_answer" });
    return null;
  }
}

export async function submitWordAnswer(input: unknown): Promise<WordAnswerResult> {
  const data = answerSchema.parse(input);
  const { supabase, studentId } = await studentContext();
  await requireStudentLearningUnlocked(supabase, studentId);
  const claims = openItem(data.token, studentId);
  let outcome: WordAnswerOutcome;
  let segments: FeedbackSegment[] | null = null;
  if (TYPED.has(claims.format) && claims.expected) {
    const graded = gradeSpelling(data.answer ?? "", claims.expected);
    outcome = graded === "exact" ? "correct" : graded;
    if (outcome !== "correct") segments = spellingFeedback(data.answer ?? "", claims.expected);
  } else if (CHOICE.has(claims.format) && claims.correct) {
    outcome = data.choiceId === claims.correct ? "correct" : "wrong";
  } else {
    throw new Error("Cette question a expiré. Recharge la page.");
  }
  const correct = outcome === "correct";
  await record(claims, studentId, { correct, accentOnly: outcome === "accent", hintLevel: data.hintLevel, responseMs: data.responseMs, n: data.attempt });
  const message = correct ? praise(`${claims.iid}:${data.attempt}`) : outcome === "accent" ? copy.accent : outcome === "near" ? copy.near : TYPED.has(claims.format) ? copy.wrong : copy.wrongChoice;
  return {
    outcome, correct,
    expected: TYPED.has(claims.format) ? claims.expected ?? null : null,
    correctChoiceId: CHOICE.has(claims.format) && !correct ? claims.correct ?? null : null,
    segments, message,
    celebration: correct && claims.rescue && data.hintLevel === 0 ? copy.rescued(claims.word) : null,
  };
}

// ---------------------------------------------------------------------------
// Explain in your own words (D.5)
// ---------------------------------------------------------------------------

const explainSchema = z.object({
  token: z.string().min(10).max(8000),
  text: z.string().trim().min(1).max(400),
  responseMs: z.number().int().min(0).max(600_000).optional(),
}).strict();

export type ExplainResult = { verdict: ExplainVerdict; message: string; definition: string; celebration: string | null };

export async function explainWordAnswer(input: unknown): Promise<ExplainResult> {
  const data = explainSchema.parse(input);
  const { supabase, studentId } = await studentContext();
  await requireStudentLearningUnlocked(supabase, studentId);
  const claims = openItem(data.token, studentId);
  if (claims.format !== "explain_own_words") throw new Error("Cette question a expiré. Recharge la page.");
  await moderateWordExplanation({ supabase, studentId, text: data.text });
  const service = createServiceClient();
  const { data: sense, error } = await service.from("lexical_senses").select("definition_fr,lexical_lemmas!inner(vocabulary_item_id)").eq("id", claims.senseId).maybeSingle();
  if (error || !sense) throw new Error("Mot introuvable.");
  const itemId = (sense.lexical_lemmas as unknown as { vocabulary_item_id: string | null }).vocabulary_item_id;
  const [{ data: item }, related] = await Promise.all([
    itemId ? service.from("vocabulary_items").select("definition_validation").eq("id", itemId).maybeSingle() : Promise.resolve({ data: null }),
    loadRelatedWords(service, claims.senseId),
  ]);
  const definition = sense.definition_fr as string;
  const grade = await gradeExplanation(data.text, { word: claims.word, definition, validation: parseValidation(item?.definition_validation), ...related }, providerJudge());
  if (grade.verdict !== "uncertain") {
    // Partly right = graded Hard (recorded like a clue), never a lapse.
    await record(claims, studentId, { correct: grade.verdict !== "wrong", hintLevel: grade.verdict === "partial" ? 2 : 0, responseMs: data.responseMs, n: 0 });
  }
  const message = grade.verdict === "correct" ? copy.explainCorrect : grade.verdict === "partial" ? copy.explainPartial : grade.verdict === "wrong" ? copy.explainWrong : copy.explainUncertain;
  return { verdict: grade.verdict, message, definition, celebration: grade.verdict === "correct" && claims.rescue ? copy.rescued(claims.word) : null };
}

// ---------------------------------------------------------------------------
// Mon trésor de mots (D.7)
// ---------------------------------------------------------------------------

export type TreasureWord = { itemId: string; word: string; definition: string | null; status: WordStatus; statusLabel: string; firstMet: string | null };
export type TreasureGroup = { interest: string | null; words: TreasureWord[] };

export async function loadWordTreasure(): Promise<TreasureGroup[]> {
  const { studentId } = await studentContext();
  // Service read after authentication: the collection is the student's own rows only.
  const service = createServiceClient();
  const [{ data, error }, { data: interests }] = await Promise.all([
    service.from("student_word_mastery")
      .select("word_status,first_seen_sentence,first_seen_interest,vocabulary_items!inner(id,display_word,definition_fr)")
      .eq("student_id", studentId).not("vocabulary_items.definition_fr", "is", null).limit(1000),
    service.from("student_interests").select("interest_key,declared_strength").eq("student_id", studentId),
  ]);
  if (error) throw new Error(error.message);
  const order = (interests ?? []).sort((a, b) => Number(b.declared_strength ?? 0) - Number(a.declared_strength ?? 0)).map((row) => row.interest_key as string);
  const groups = new Map<string | null, TreasureWord[]>();
  for (const row of data ?? []) {
    const item = row.vocabulary_items as unknown as { id: string; display_word: string; definition_fr: string | null };
    const status = ((row.word_status as WordStatus | null) ?? "decouvert");
    const interest = (row.first_seen_interest as string | null) ?? null;
    const list = groups.get(interest) ?? [];
    list.push({ itemId: item.id, word: item.display_word, definition: item.definition_fr, status, statusLabel: statusLabel(status), firstMet: (row.first_seen_sentence as string | null) ?? null });
    groups.set(interest, list);
  }
  const rank = (interest: string | null) => (interest == null ? 1000 : order.includes(interest) ? order.indexOf(interest) : 500);
  const result = [...groups.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].length - a[1].length)
    .map(([interest, words]) => ({
      interest,
      words: words.sort((a, b) => TREASURE_STATUS_ORDER.indexOf(a.status) - TREASURE_STATUS_ORDER.indexOf(b.status) || a.word.localeCompare(b.word, "fr")),
    }));
  await journalStudentPayload(studentId, "words:treasure", { copy: { title: copy.treasure, help: copy.treasureHelp }, groups: result });
  return result;
}
