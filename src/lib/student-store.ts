"use client";

import { useSyncExternalStore } from "react";
import type { DiagnosticResult, ReadingSessionResult } from "@/lib/types";
import { updateSkillEstimate, type SkillEstimate } from "@/lib/scoring/skill-estimate";
import {
  dueAtFrom,
  INITIAL_SCHEDULE,
  type RetrievalResult,
} from "@/lib/scoring/retrieval";
import { scheduleFsrs } from "@/lib/scoring/fsrs";
import type { RetrievalCardSeed } from "@/lib/content/retrieval-cards";
import {
  EMPTY_STUDENT_STATE,
  type RetrievalCard,
  type StudentState,
} from "@/lib/student-state";
import { EMPTY_VOCABULARY_EVIDENCE, recordVocabularyEvidence, type VocabularyEvidenceKind } from "@/lib/vocabulary/learning";

export type { RetrievalCard, StudentState, VocabState } from "@/lib/student-state";

/**
 * Optimistic student cache. Postgres relational tables are authoritative when
 * Supabase is configured; this module hydrates through a guarded Server Action
 * and keeps synchronous UI updates responsive. Keyless local development keeps
 * the previous localStorage fallback.
 */
const KEY = "rtl.student.v1";

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasStudentBackend = configured;

const EMPTY = EMPTY_STUDENT_STATE;

/** Strips runtime-only fields before persisting the document. */
function toDocument(state: StudentState): Omit<StudentState, "hydrated"> {
  const { hydrated: _h, ...doc } = state;
  void _h;
  return doc;
}

function readLocal(): StudentState {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw
      ? { ...EMPTY, ...(JSON.parse(raw) as StudentState), hydrated: true }
      : { ...EMPTY, hydrated: true };
  } catch {
    return { ...EMPTY, hydrated: true };
  }
}

let snapshot: StudentState | null = null;
let hydratePromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

function ensureHydrated(): Promise<void> {
  if (!configured) return Promise.resolve();
  if (!hydratePromise) hydratePromise = hydrate();
  return hydratePromise;
}

export function getStudentState(): StudentState {
  if (typeof window === "undefined") return EMPTY;
  if (snapshot === null) {
    // Local mode resolves synchronously; Supabase mode hydrates via subscribe.
    snapshot = configured ? { ...EMPTY } : readLocal();
  }
  return snapshot;
}

async function hydrate() {
  try {
    const { loadStudentState } = await import("@/lib/actions/student");
    const data = await loadStudentState();
    snapshot = { ...EMPTY, ...data, hydrated: true };
  } catch {
    snapshot = { ...EMPTY, hydrated: true };
  }
  notify();
}

function persistLocal(state: StudentState) {
  if (typeof window === "undefined") return;
  if (configured) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(toDocument(state)));
  } catch {
    /* ignore quota errors */
  }
}

function save(state: StudentState) {
  snapshot = state;
  notify();
  persistLocal(state);
}

/** Replace the cache with a server-authoritative relational snapshot. */
export function replaceStudentState(state: Omit<StudentState, "hydrated">): StudentState {
  const next = { ...state, hydrated: true };
  save(next);
  return next;
}

export function update(patch: Partial<StudentState>): StudentState {
  const next = { ...getStudentState(), ...patch };
  save(next);
  return next;
}

export function useStudentState(): StudentState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      ensureHydrated();
      return () => listeners.delete(cb);
    },
    getStudentState,
    () => EMPTY
  );
}

export function saveOnboarding(input: {
  grade: number;
  frenchBackground: string;
  interests: string[];
}): StudentState {
  return update({ ...input, onboarded: true });
}

export function saveDiagnostic(result: DiagnosticResult): StudentState {
  return update({ diagnostic: result });
}

export function addSession(
  result: ReadingSessionResult,
  answers?: Record<string, number | string>
): StudentState {
  const state = getStudentState();
  return update({
    sessions: [...state.sessions, result],
    answersByText: answers
      ? { ...state.answersByText, [result.textVersionId]: answers }
      : state.answersByText,
  });
}

/**
 * Completes a session: stores the result + answers, folds evidence into skill
 * estimates, seeds spaced-retrieval cards (first due in 1 day), and records
 * vocabulary exposure (PRD §I, §L).
 */
export function completeReadingSession(input: {
  result: ReadingSessionResult;
  answers: Record<string, number | string>;
  skillEstimates: Record<string, SkillEstimate>;
  retrievalSeeds: RetrievalCardSeed[];
  vocabWords: string[];
  recognizedVocabWords?: string[];
  nowMs: number;
}): StudentState {
  const state = getStudentState();
  const iso = new Date(input.nowMs).toISOString();

  const newCards: RetrievalCard[] = input.retrievalSeeds.map((seed) => ({
    id: crypto.randomUUID(),
    ...seed,
    intervalDays: INITIAL_SCHEDULE.intervalDays,
    ease: INITIAL_SCHEDULE.ease,
    repetitions: INITIAL_SCHEDULE.repetitions,
    dueAt: dueAtFrom(input.nowMs, INITIAL_SCHEDULE.intervalDays),
  }));

  const vocab = { ...state.vocab };
  for (const w of input.vocabWords) {
    const prev = vocab[w];
    const evidence = recordVocabularyEvidence(prev?.evidence ?? EMPTY_VOCABULARY_EVIDENCE, "exposure", { occurredAt: iso });
    const withRecognition = input.recognizedVocabWords?.includes(w) ? recordVocabularyEvidence(evidence, "recognition", { successful: true, occurredAt: iso }) : evidence;
    vocab[w] = { exposures: withRecognition.exposure, lastSeenAt: iso, evidence: withRecognition, nextReviewAt: dueAtFrom(input.nowMs, 1) };
  }

  return update({
    sessions: [...state.sessions, input.result],
    answersByText: { ...state.answersByText, [input.result.textVersionId]: input.answers },
    skillEstimates: input.skillEstimates,
    retrievalCards: [...state.retrievalCards, ...newCards],
    vocab,
  });
}

/** Retrieval cards whose due time has passed (PRD §L). */
export function getDueCards(nowMs: number): RetrievalCard[] {
  return getStudentState().retrievalCards.filter(
    (c) => new Date(c.dueAt).getTime() <= nowMs
  );
}

/** Records a recall attempt and reschedules the card. */
export function recordRetrieval(
  cardId: string,
  result: RetrievalResult,
  nowMs: number
): StudentState {
  const state = getStudentState();
  let reviewedWord: string | undefined;
  const retrievalCards = state.retrievalCards.map((c) => {
      if (c.id !== cardId) return c;
      reviewedWord = c.vocabularyWord;
      const prevState =
        c.stability != null && c.difficulty != null
          ? { stability: c.stability, difficulty: c.difficulty }
          : null;
      const elapsedDays = c.lastReviewedAt
        ? Math.max(0, (nowMs - Date.parse(c.lastReviewedAt)) / 86_400_000)
        : c.intervalDays;
      const next = scheduleFsrs(prevState, result, elapsedDays);
      return {
        ...c,
        intervalDays: next.intervalDays,
        repetitions: result === "forgot" ? 0 : c.repetitions + 1,
        stability: next.stability,
        difficulty: next.difficulty,
        lastReviewedAt: new Date(nowMs).toISOString(),
        dueAt: dueAtFrom(nowMs, next.intervalDays),
        lastResult: result,
      };
    });
  const vocab = { ...state.vocab };
  if (reviewedWord) {
    const previous = vocab[reviewedWord];
    const evidence = recordVocabularyEvidence(previous?.evidence ?? EMPTY_VOCABULARY_EVIDENCE, "meaning_recall", { successful: result === "good" || result === "easy", occurredAt: new Date(nowMs).toISOString() });
    vocab[reviewedWord] = { exposures: evidence.exposure, lastSeenAt: previous?.lastSeenAt ?? "", evidence, nextReviewAt: retrievalCards.find((card) => card.id === cardId)?.dueAt };
  }
  return update({ retrievalCards, vocab });
}

export function recordWordInteraction(word: string, kind: VocabularyEvidenceKind, successful = false): StudentState {
  const state = getStudentState();
  const previous = state.vocab[word];
  const now = new Date().toISOString();
  const evidence = recordVocabularyEvidence(previous?.evidence ?? EMPTY_VOCABULARY_EVIDENCE, kind, { successful, occurredAt: now });
  return update({ vocab: { ...state.vocab, [word]: { exposures: evidence.exposure, lastSeenAt: previous?.lastSeenAt ?? now, evidence, nextReviewAt: previous?.nextReviewAt } } });
}

export function getAnswers(textVersionId: string): Record<string, number | string> {
  return getStudentState().answersByText[textVersionId] ?? {};
}

/** Folds foundation-repair practice results into a skill's estimate. */
export function applySkillResults(
  skillKey: string,
  corrects: boolean[]
): StudentState {
  const state = getStudentState();
  let est = state.skillEstimates[skillKey];
  for (const c of corrects) est = updateSkillEstimate(est, c);
  return update({
    skillEstimates: { ...state.skillEstimates, [skillKey]: est },
  });
}

export function getSession(textVersionId: string): ReadingSessionResult | null {
  const sessions = getStudentState().sessions;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].textVersionId === textVersionId) return sessions[i];
  }
  return null;
}

export function lastSuccessRate(): number | undefined {
  const sessions = getStudentState().sessions;
  return sessions.length ? sessions[sessions.length - 1].successRate : undefined;
}

export function resetStudentState() {
  if (typeof window === "undefined") return;
  const cleared = { ...EMPTY, hydrated: true };
  snapshot = cleared;
  notify();
  persistLocal(cleared);
  if (!configured) window.localStorage.removeItem(KEY);
}
