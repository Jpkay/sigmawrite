import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { buildLocalConjugationGapDraftItems } from "./local-conjugation-gap-items";

const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;

describe("local conjugation gap authoring", () => {
  it("fills every remaining assessable conjugation evidence slot", async () => {
    const items = await buildLocalConjugationGapDraftItems(taxonomy.taxonomy);
    expect(items).toHaveLength(84);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(84);
    expect(new Set(items.map((entry) => `${entry.item.nodeKey}\0${entry.item.promptFr}`)).size).toBe(84);
    expect(items.every((entry) => entry.qcGates.gate1_invariants.ok && entry.qcGates.gate2_answer_key.ok)).toBe(true);
  });
});
