import { beforeEach, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  from: vi.fn(),
  journal: vi.fn(),
  update: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: f.from }),
  createServiceClient: () => ({ from: f.from }),
}));
vi.mock("@/lib/db/student", () => ({ getCurrentStudentId: async () => "owner" }));
vi.mock("@/lib/diagnostic/access", () => ({
  requireStudentAccessAuthorized: async () => undefined,
  requireStudentLearningUnlocked: async () => undefined,
}));
vi.mock("@/lib/diagnostic/granular/server-delivery-journal", () => ({ journalStudentPayload: f.journal }));

import { submitDictation, submitDictationJustifications } from "./student";
import { dictationJustificationOutcomeDisplay, dictationResultDisplay } from "@/lib/diagnostic/granular/dictation-display";

const input = {
  attemptId: "11111111-1111-4111-8111-111111111111",
  choices: [{ errorIndex: 0, category: "morphogrammique_grammaticale" }],
};

const savedError = {
  segment: 0,
  position: 1,
  expected: "chevaux",
  actual: "chevals",
  category: "morphogrammique_grammaticale" as const,
  nodeKey: "former_pluriel_noms_al_aux",
  explanationFr: "Les noms en -al font leur pluriel en -aux.",
};

let scenario: "justification" | "result" = "justification";

beforeEach(() => {
  vi.clearAllMocks();
  scenario = "justification";
  f.journal.mockImplementation(async (_owner, _boundary, payload) => payload);
  f.from.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      order: () => query,
      update: (...args: unknown[]) => { f.update(table, ...args); return query; },
      single: async () => ({
        data: table === "dictation_attempts" ? (scenario === "result" ? {
          id: input.attemptId,
          dictation_id: "22222222-2222-4222-8222-222222222222",
          mode: "flash",
          submitted_at: "2026-09-13T08:00:00.000Z",
          answers: ["Les chevals arrivent."],
          errors: [savedError],
          score: 8,
          accuracy: 0.8,
          xp_awarded: 10,
          error_profile: { morphogrammique_grammaticale: 1 },
        } : {
          id: input.attemptId,
          errors: [savedError],
          submitted_at: "2026-09-13T08:00:00.000Z",
          justifications: [{ errorIndex: 0, category: "morphogrammique_grammaticale", correct: true }],
          justification_correct: 1,
        }) : null,
        error: null,
      }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({
        data: table === "dictations" ? [{
          id: "22222222-2222-4222-8222-222222222222",
          key: "horses",
          title_fr: "Les chevaux",
          kind: "flash",
          text_fr: "Les chevaux arrivent.",
          segments: [{ text: "Les chevaux arrivent.", audioPath: "horses/segment-00.mp3" }],
          word_count: 3,
          grade_min: 6,
          grade_max: 9,
          target_node_keys: ["former_pluriel_noms_al_aux"],
          focus_fr: "Le pluriel",
          review_status: "human_approved",
          audio_status: "ready",
          audio_manifest: null,
        }] : [],
        error: null,
      })),
    };
    return query;
  });
});

it("returns and journals the saved correct count on an idempotent retry without writing evidence again", async () => {
  const result = await submitDictationJustifications(input);
  const display = dictationJustificationOutcomeDisplay(result);
  expect(result).toEqual({ correct: 1, total: 1 });
  expect(f.journal).toHaveBeenCalledWith("owner", "legacy:dictation-justification-result", { outcome: result, display });
  expect(f.update).not.toHaveBeenCalled();
  expect(f.from).not.toHaveBeenCalledWith("competency_nodes");
});

it("captures the saved correction transcript before an idempotent result is exposed", async () => {
  scenario = "result";
  const result = await submitDictation({ attemptId: input.attemptId, answers: [] });
  expect(result.segments[0].expected).toBe("Les chevaux arrivent.");
  expect(f.journal).toHaveBeenCalledWith("owner", "legacy:dictation-result", {
    result,
    display: dictationResultDisplay(result),
  });
  expect(f.update).not.toHaveBeenCalled();
});

it("withholds a saved correction transcript when its display capture fails", async () => {
  scenario = "result";
  f.journal.mockRejectedValueOnce(Error("journal unavailable"));
  await expect(submitDictation({ attemptId: input.attemptId, answers: [] })).rejects.toThrow("journal unavailable");
  expect(f.update).not.toHaveBeenCalled();

  await expect(submitDictation({ attemptId: input.attemptId, answers: [] })).resolves.toMatchObject({ score: 8 });
  expect(f.update).not.toHaveBeenCalled();
});

it("withholds a saved outcome when its display capture fails and permits a mutation-free retry", async () => {
  f.journal.mockRejectedValueOnce(Error("journal unavailable"));
  await expect(submitDictationJustifications(input)).rejects.toThrow("journal unavailable");
  expect(f.update).not.toHaveBeenCalled();
  expect(f.from).not.toHaveBeenCalledWith("competency_nodes");

  await expect(submitDictationJustifications(input)).resolves.toEqual({ correct: 1, total: 1 });
  expect(f.update).not.toHaveBeenCalled();
  expect(f.from).not.toHaveBeenCalledWith("competency_nodes");
});
