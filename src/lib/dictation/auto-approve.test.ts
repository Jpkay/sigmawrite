import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/lib/ai/provider";

const f = vi.hoisted(() => ({ render: vi.fn(), rpc: vi.fn(), updates: [] as Record<string, unknown>[], row: {} as Record<string, unknown> }));
vi.mock("./audio", () => ({ renderPendingDictationAudio: f.render }));
import { autoApproveDictation, languageToolGate, moderationGate } from "./auto-approve";

const segments = ["Le matin, les enfants descendent vers la rivière.", "Ils portent des seaux et des filets.", "Les grenouilles sautent entre les pierres et disparaissent."];
const baseRow = {
  id: "11111111-1111-4111-8111-111111111111", key: "riviere", title_fr: "La rivière", kind: "flash", text_fr: segments.join(" "),
  segments: segments.map((text) => ({ text, audioPath: null })), grade_min: 6, grade_max: 7, target_node_keys: ["accorder_sujet_verbe_ecrit"],
  review_status: "needs_human_review", themes: ["nature"], interests: ["animals"], tenses: ["present"], target_lemmas: ["rivière"], grammar_node_keys: [], cefr_band: "A2",
};
const db = {
  from: () => {
    const q = { select: () => q, eq: () => q, single: async () => ({ data: f.row, error: null }), update: (value: Record<string, unknown>) => { f.updates.push(value); return q; }, then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve({ error: null })) };
    return q;
  },
  rpc: f.rpc,
} as unknown as SupabaseClient;
const offline = { languageTool: languageToolGate({ configured: false }), moderation: moderationGate({ provider: null }) };

beforeEach(() => { vi.clearAllMocks(); f.updates = []; f.row = { ...baseRow }; f.rpc.mockResolvedValue({ error: null }); f.render.mockResolvedValue({ rendered: 1, failed: 0, considered: 1 }); });

it("approves a passing dictée with its pipeline version and text-bound gate results, then can render audio", async () => {
  const outcome = await autoApproveDictation(db, { key: "riviere", ...offline, renderAudio: true });
  expect(outcome.status).toBe("auto_approved");
  const [name, args] = f.rpc.mock.calls[0];
  expect(name).toBe("auto_approve_dictation");
  expect(args.p_pipeline_version).toBe("dictation-gates-1");
  expect(args.p_gate_results).toMatchObject({ passed: true, pipelineVersion: "dictation-gates-1" });
  expect(args.p_gate_results.textSha256).toMatch(/^[0-9a-f]{64}$/u);
  expect(args.p_gate_results.gates.find((gate: { gate: string }) => gate.gate === "languagetool").status).toBe("skipped");
  expect(f.render).toHaveBeenCalledWith(db, { dictationId: baseRow.id, limit: 1 });
});

it("holds a dictée that fails a gate and records why, without approving", async () => {
  f.row = { ...baseRow, text_fr: "Autre texte." };
  const outcome = await autoApproveDictation(db, { key: "riviere", ...offline });
  expect(outcome.status).toBe("held");
  expect(f.rpc).not.toHaveBeenCalled();
  expect(f.updates[0].gate_results).toMatchObject({ passed: false });
});

it("lets plugged-in editorial gates block publication", async () => {
  const outcome = await autoApproveDictation(db, { key: "riviere", ...offline, extraGates: [{ name: "literary_rubric", version: "h19", blocking: true, run: () => ({ status: "fail", details: { score: 3.9 } }) }] });
  expect(outcome.status).toBe("held");
});

it("never overrides a human decision or a takedown", async () => {
  f.row = { ...baseRow, review_status: "taken_down" };
  expect((await autoApproveDictation(db, { key: "riviere", ...offline })).status).toBe("taken_down");
  f.row = { ...baseRow, review_status: "human_approved" };
  expect((await autoApproveDictation(db, { key: "riviere", ...offline })).status).toBe("already_human_approved");
  expect(f.rpc).not.toHaveBeenCalled();
});

it("fails on LanguageTool findings and on provider moderation flags", async () => {
  const checker = { check: vi.fn().mockResolvedValue({ text: "", language: "fr", clean: false, matches: [{ ruleId: "AGREEMENT", message: "Accord", offset: 3, length: 4, category: "GRAMMAR", replacements: [] }] }) };
  expect((await languageToolGate({ checker }).run({ key: "k", title: "T", kind: "flash", gradeMin: 6, gradeMax: 7, segments, targetNodeKeys: [], tags: { themes: [], interests: [], tenses: [], target_lemmas: [], grammar_node_keys: [], cefr_band: null } })).status).toBe("fail");
  const provider = { moderate: vi.fn().mockResolvedValue({ passed: false, flaggedCategories: ["violence"], needsHumanReview: false }) } as unknown as AIProvider;
  const result = await moderationGate({ provider }).run({ key: "k", title: "T", kind: "flash", gradeMin: 6, gradeMax: 7, segments, targetNodeKeys: [], tags: { themes: [], interests: [], tenses: [], target_lemmas: [], grammar_node_keys: [], cefr_band: null } });
  expect(result).toMatchObject({ status: "fail", details: { source: "provider" } });
});
