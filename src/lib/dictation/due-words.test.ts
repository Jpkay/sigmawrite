import { expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadDueWordsForDictation } from "./due-words";

function chain(result: unknown) {
  const query: Record<string, unknown> = {};
  for (const name of ["select", "eq", "neq", "lte", "in"]) query[name] = () => query;
  query.limit = async () => result;
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

it("returns due lemmas, least retrievable first, one entry per lemma", async () => {
  const now = Date.parse("2026-10-20T10:00:00Z");
  const db = { from: (table: string) => table === "learning_retrieval_schedules"
    ? chain({ data: [
        { target_id: "s1", fsrs_state: { stability: 20, difficulty: 5 }, last_reviewed_at: "2026-10-01T10:00:00Z" },
        { target_id: "s1", fsrs_state: { stability: 2, difficulty: 5 }, last_reviewed_at: "2026-10-01T10:00:00Z" },
        { target_id: "s2", fsrs_state: { stability: 40, difficulty: 5 }, last_reviewed_at: "2026-10-10T10:00:00Z" },
      ], error: null })
    : chain({ data: [{ id: "s1", lemma_id: "l1", lexical_lemmas: { normalized_lemma: "intrépide" } }, { id: "s2", lemma_id: "l2", lexical_lemmas: { normalized_lemma: "falaise" } }], error: null }) };
  const words = await loadDueWordsForDictation(db as unknown as SupabaseClient, "student", now);
  expect(words.map((word) => word.lemma)).toEqual(["intrépide", "falaise"]);
  expect(words[0].retrievability).toBeLessThan(words[1].retrievability!);
});

it("never throws", async () => {
  const db = { from: () => { throw new Error("down"); } };
  expect(await loadDueWordsForDictation(db as unknown as SupabaseClient, "student", Date.now())).toEqual([]);
});
