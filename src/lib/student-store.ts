"use client";

import { useSyncExternalStore } from "react";
import type { DiagnosticResult, ReadingSessionResult } from "@/lib/types";
import { updateSkillEstimate, type SkillEstimate } from "@/lib/scoring/skill-estimate";

/**
 * Phase 1 client-side store (localStorage). Lets the full student slice —
 * onboarding → diagnostic → reading session → results → progress — run with
 * no backend. Phase 3+ replaces this with Supabase-backed reads/writes; the
 * shape mirrors the DB tables so the swap is mechanical.
 */
const KEY = "rtl.student.v1";

export type StudentState = {
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
};

const EMPTY: StudentState = {
  onboarded: false,
  grade: null,
  frenchBackground: null,
  interests: [],
  diagnostic: null,
  sessions: [],
  answersByText: {},
  skillEstimates: {},
};

function read(): StudentState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as StudentState) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Cached snapshot for useSyncExternalStore: getSnapshot must return a stable
// reference between writes, so we only swap it inside save().
let snapshot: StudentState | null = null;
const listeners = new Set<() => void>();

export function getStudentState(): StudentState {
  if (typeof window === "undefined") return EMPTY;
  if (snapshot === null) snapshot = read();
  return snapshot;
}

function save(state: StudentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  snapshot = state;
  listeners.forEach((l) => l());
}

export function update(patch: Partial<StudentState>): StudentState {
  const next = { ...getStudentState(), ...patch };
  save(next);
  return next;
}

/**
 * Subscribe to the student store. The idiomatic React way to read
 * client-only storage without hydration mismatch or setState-in-effect.
 */
export function useStudentState(): StudentState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
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

/** Completes a session and folds its evidence into the adaptive skill estimates. */
export function completeReadingSession(
  result: ReadingSessionResult,
  answers: Record<string, number>,
  skillEstimates: Record<string, SkillEstimate>
): StudentState {
  const state = getStudentState();
  return update({
    sessions: [...state.sessions, result],
    answersByText: { ...state.answersByText, [result.textVersionId]: answers },
    skillEstimates,
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
  window.localStorage.removeItem(KEY);
  snapshot = EMPTY;
  listeners.forEach((l) => l());
}
