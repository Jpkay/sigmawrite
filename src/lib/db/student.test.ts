import {afterEach, expect, it, vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({createClient: vi.fn()}));
import {getStudentStateData} from "./student";

afterEach(() => vi.unstubAllEnvs());

function fixture(sessions: Array<Record<string, unknown>>) {
  const tables: Record<string, unknown> = {
    students: {id: "student", current_grade: 8, onboarding_completed_at: "2026-10-01"},
    diagnostic_results: null,
    reading_sessions: sessions,
    texts: [{id: "text", slug: "reading"}],
    text_versions: [{id: "version", text_id: "text"}],
    questions: [{id: "question", text_version_id: "version", question_key: "q1"}],
    question_choices: [{id: "choice", question_id: "question", choice_index: 2}],
    student_answers: [{session_id: "unfinished", question_id: "question", selected_choice_id: "choice"}],
  };
  const from = vi.fn((table: string) => {
    const result = Promise.resolve({data: tables[table] ?? [], error: null});
    const query = {select: () => query, eq: () => query, order: () => query,
      limit: () => query, in: () => query, single: () => result,
      maybeSingle: () => result, then: result.then.bind(result)};
    return query;
  });
  return {from} as unknown as SupabaseClient;
}

const reading = (id: string, completed_at: string | null, success_rate: number | null, abandoned = false) => ({
  id, text_version_id: "version", started_at: "2026-10-18T08:00:00Z", completed_at,
  success_rate, abandoned, hints_used: 0,
});

it("does not count opening reading questions as a completed text or a zero score", async () => {
  vi.stubEnv("GRANULAR_DIAGNOSTIC_ENABLED", "false");
  const state = await getStudentStateData("student", fixture([reading("unfinished", null, null)]));
  expect(state.sessions).toEqual([]);
  // Saved answers remain available for resuming an unfinished reading.
  expect(state.answersByText.reading).toEqual({q1: 2});
});

it("retains completed zero scores but excludes unfinished and abandoned results from averages", async () => {
  vi.stubEnv("GRANULAR_DIAGNOSTIC_ENABLED", "false");
  const state = await getStudentStateData("student", fixture([
    reading("completed", "2026-10-18T08:05:00Z", .8),
    reading("unfinished", null, null),
    reading("abandoned", "2026-10-18T08:06:00Z", .2, true),
    reading("completed-zero", "2026-10-18T08:07:00Z", 0),
  ]));
  expect(state.sessions).toHaveLength(2);
  expect(state.sessions.map(session => session.successRate)).toEqual([.8, 0]);
  expect(state.sessions.reduce((sum, session) => sum + session.successRate, 0) / state.sessions.length).toBe(.4);
});
