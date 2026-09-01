import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { buildLocalSpellingDraftItems } from "./local-spelling-items";

const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;

describe("local spelling diagnostic authoring", () => {
  it("authors three receptive and production tiers for 21 lexical nodes", async () => {
    const items = await buildLocalSpellingDraftItems(taxonomy.taxonomy);

    expect(items).toHaveLength(126);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(126);
    expect(new Set(items.map((entry) => `${entry.item.nodeKey}\0${entry.item.promptFr}\0${JSON.stringify(entry.item.choices ?? [])}`)).size).toBe(126);
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
