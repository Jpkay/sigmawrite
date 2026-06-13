"use client";

import { useSyncExternalStore } from "react";
import type { DiagnosticResult, ReadingSessionResult } from "@/lib/types";
import { updateSkillEstimate, type SkillEstimate } from "@/lib/scoring/skill-estimate";
import {
  scheduleNext,
  dueAtFrom,
  INITIAL_SCHEDULE,
  type RetrievalResult,
} from "@/lib/scoring/retrieval";
import type { RetrievalCardSeed } from "@/lib/content/retrieval-cards";

export type RetrievalCard = {
  id: string;
  conceptLabel: string;
  promptFr: string;
  keywords: string[];
  sourceTextId: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  dueAt: string;
  lastResult?: RetrievalResult;
};

export type VocabState = { exposures: number; lastSeenAt: string };

/**
 * Student store. Source of truth is the authenticated student's
 * `students.app_state` JSON document in Supabase (RLS-protected, readable by
 * linked guardians/teachers). Falls back to localStorage when Supabase is not
 * configured, so the app still runs with no backend. Same sync API throughout:
 * writes update an in-memory cache + notify immediately, then persist async.
 */
const KEY = "rtl.student.v1";

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type StudentState = {
  /** False until the first load from the backend resolves. */
  hydrated: boolean;
  onboarded: boolean;
  grade: number | null;
  frenchBackground: string | null;
  interests: string[];
  diagnostic: DiagnosticResult | null;
  sessions: ReadingSessionResult[];
  /** Raw chosen answers per text, kept so the results page can give per-question feedback. */
  answersByText: Record<string, Record<string, number>>;
  /** Live adaptive skill estimates, keyed by skill (PRD §J). */
  skillEstimates: Record<string, SkillEstimate>;
  /** Spaced-retrieval cards (PRD §L). */
  retrievalCards: RetrievalCard[];
  /** Vocabulary exposure/retention, keyed by word (PRD §L). */
  vocab: Record<string, VocabState>;
};

const EMPTY: StudentState = {
  hydrated: false,
  onboarded: false,
  grade: null,
  frenchBackground: null,
  interests: [],
  diagnostic: null,
  sessions: [],
  answersByText: {},
  skillEstimates: {},
  retrievalCards: [],
  vocab: {},
};

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
let studentId: string | null = null;
let hydratePromise: Promise<void> | null = null;
let writeChain: Promise<unknown> = Promise.resolve();
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
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      snapshot = { ...EMPTY, hydrated: true };
      notify();
      return;
    }
    // RLS returns only the caller's own student row, so no filter is needed.
    const { data, error } = await supabase
      .from("students")
      .select("id, app_state")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    studentId = data?.id ?? null;
    const doc = (data?.app_state as Partial<StudentState> | null) ?? null;
    snapshot = { ...EMPTY, ...(doc ?? {}), hydrated: true };
  } catch {
    snapshot = { ...EMPTY, hydrated: true };
  }
  notify();
}

function persist(state: StudentState) {
  if (typeof window === "undefined") return;
  if (!configured) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(toDocument(state)));
    } catch {
      /* ignore quota errors */
    }
    return;
  }
  // Serialize writes; ensure hydration (and studentId) resolved first.
  writeChain = writeChain
    .then(() => ensureHydrated())
    .then(async () => {
      if (!studentId) return;
      const { createClient } = await import("@/lib/supabase/client");
      await createClient()
        .from("students")
        .update({ app_state: toDocument(state) })
        .eq("id", studentId);
    })
    .catch(() => {});
}

function save(state: StudentState) {
  snapshot = state;
  notify();
  persist(state);
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

// Hydrate as early as possible (any student page importing the store), so an
// imperative getStudentState() in a write path sees real data, not a stale base.
if (typeof window !== "undefined") ensureHydrated();

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
  answers?: Record<string, number>
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
  answers: Record<string, number>;
  skillEstimates: Record<string, SkillEstimate>;
  retrievalSeeds: RetrievalCardSeed[];
  vocabWords: string[];
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
    vocab[w] = { exposures: (prev?.exposures ?? 0) + 1, lastSeenAt: iso };
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
  return update({
    retrievalCards: state.retrievalCards.map((c) => {
      if (c.id !== cardId) return c;
      const next = scheduleNext(
        { intervalDays: c.intervalDays, ease: c.ease, repetitions: c.repetitions },
        result
      );
      return {
        ...c,
        ...next,
        dueAt: dueAtFrom(nowMs, next.intervalDays),
        lastResult: result,
      };
    }),
  });
}

export function getAnswers(textVersionId: string): Record<string, number> {
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
  persist(cleared);
  if (!configured) window.localStorage.removeItem(KEY);
}
