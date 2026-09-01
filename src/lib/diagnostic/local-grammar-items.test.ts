import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { buildLocalGrammarDraftItems } from "./local-grammar-items";

const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;

describe("local grammar diagnostic authoring", () => {
  it("authors the 27 missing construction nodes at three tiers", async () => {
    const items = await buildLocalGrammarDraftItems(taxonomy.taxonomy);

    expect(items).toHaveLength(162);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(162);
    expect(new Set(items.map((entry) => `${entry.item.nodeKey}\0${entry.item.promptFr}`)).size).toBe(162);
    expect(items.every((entry) => !/^Cas\s+[1-3]\s*[—–-]/u.test(entry.item.promptFr))).toBe(true);
    expect(items.every((entry) =>
      entry.reviewStatus === "needs_human_review"
      && entry.qcGates.gate1_schema
      && entry.qcGates.gate1_invariants.ok
      && entry.qcGates.gate2_answer_key.ok
      && entry.qcGates.verdict !== "rejected"
    )).toBe(true);
  });
});
