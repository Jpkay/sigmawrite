import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ageBandForDifficultyBand } from "@/lib/content/interest-coverage";
import { passageMetrics, publishEditorialPassage, publishPendingEditorialPassages, PASSAGE_BAND_FOR_GRADE } from "./passage-publisher";

const body = "Sous la pluie fine, Malik cherchait son crampon dans la boue.\n\nLe gardien riait en silence, les mains sur les genoux.";
const payload = { title: "Le crampon perdu !", body, grade: 6, questions: [{ questionType: "literal" }, { questionType: "inference" }], targetLemmas: [{ lemma: "crampon", kind: "new" }] };

function fakeDb(options: { candidate?: unknown; rpc?: Record<string, { data?: unknown; error?: { message: string } | null }> } = {}) {
  const rpc = vi.fn(async (name: string) => options.rpc?.[name] ?? { data: null, error: null });
  const updates: unknown[] = [];
  const from = vi.fn((table: string) => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: table === "ai_generated_candidates" ? options.candidate ?? null : null, error: options.candidate ? null : { message: "not found" } }) }) }),
    update: (value: unknown) => ({ eq: async () => { updates.push({ table, value }); return { error: null }; } }),
  }));
  return { db: { rpc, from } as unknown as SupabaseClient, rpc, updates };
}

describe("editorial passage publication (H.16)", () => {
  it("measures the passage deterministically and files it under the brief's grade", () => {
    const metrics = passageMetrics(payload);
    expect(metrics.slug).toBe("le-crampon-perdu");
    expect(metrics.wordCount).toBeGreaterThan(10);
    expect(metrics.difficultyBand).toBe("Foundation 6A");
    expect(metrics.overall).toBeGreaterThanOrEqual(0);
  });

  it("maps every grade to a band the interest coverage counts in the right age band", () => {
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[4])).toBe("cm");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[5])).toBe("cm");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[6])).toBe("6e_5e");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[7])).toBe("6e_5e");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[8])).toBe("4e_3e");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[9])).toBe("4e_3e");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[10])).toBe("lycee");
    expect(ageBandForDifficultyBand(PASSAGE_BAND_FOR_GRADE[12])).toBe("lycee");
    expect(passageMetrics({ ...payload, grade: 12 }).difficultyBand).toBe("Advanced 11-12");
    expect(passageMetrics({ ...payload, grade: 14 }).difficultyBand).toBe("Advanced 11-12");
  });

  it("publishes through the service-only SQL function and stores the embedding", async () => {
    const { db, rpc, updates } = fakeDb({ candidate: { payload, candidate_type: "editorial_reading_text" }, rpc: { publish_editorial_passage: { data: { textVersionId: "tv-1", created: true }, error: null } } });
    const embed = vi.fn(async () => [0.1, 0.2]);
    const result = await publishEditorialPassage(db, "cand-1", { embed, model: "emb" });
    expect(result).toEqual({ candidateId: "cand-1", textVersionId: "tv-1", created: true });
    expect(rpc).toHaveBeenCalledWith("publish_editorial_passage", expect.objectContaining({ p_candidate_id: "cand-1", p_metrics: expect.objectContaining({ difficultyBand: "Foundation 6A" }) }));
    expect(updates).toEqual([{ table: "text_versions", value: { embedding: "[0.1,0.2]", embedding_model: "emb" } }]);
  });

  it("refuses other candidate types and surfaces evidence failures", async () => {
    await expect(publishEditorialPassage(fakeDb({ candidate: { payload, candidate_type: "reading_text" } }).db, "c")).rejects.toThrow("editorial_candidate_not_found");
    const failing = fakeDb({ candidate: { payload, candidate_type: "editorial_reading_text" }, rpc: { publish_editorial_passage: { data: null, error: { message: "editorial_rubric_below_bar" } } } });
    await expect(publishEditorialPassage(failing.db, "c")).rejects.toThrow("editorial_rubric_below_bar");
  });

  it("an embedding failure never blocks publication", async () => {
    const { db } = fakeDb({ candidate: { payload, candidate_type: "editorial_reading_text" }, rpc: { publish_editorial_passage: { data: { textVersionId: "tv-1", created: true }, error: null } } });
    const result = await publishEditorialPassage(db, "c", { embed: async () => { throw new Error("down"); }, model: "emb" });
    expect(result.textVersionId).toBe("tv-1");
  });

  it("the sweep publishes each pending candidate and records failures without stopping", async () => {
    const { db } = fakeDb({ candidate: { payload, candidate_type: "editorial_reading_text" }, rpc: {
      pending_editorial_passages: { data: ["a", { pending_editorial_passages: "b" }], error: null },
      publish_editorial_passage: { data: { textVersionId: "tv", created: true }, error: null },
    } });
    const results = await publishPendingEditorialPassages(db);
    expect(results.map((r) => r.candidateId)).toEqual(["a", "b"]);
    expect(results.every((r) => r.textVersionId === "tv")).toBe(true);
    const broken = fakeDb({ candidate: null, rpc: { pending_editorial_passages: { data: ["x"], error: null } } });
    expect((await publishPendingEditorialPassages(broken.db))[0]).toMatchObject({ candidateId: "x", textVersionId: null, error: "not found" });
  });
});
