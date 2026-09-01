import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { buildLocalSpellingGapDraftItems } from "./local-spelling-gap-items";

const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;

describe("local spelling gap authoring", () => {
  it("fills every remaining assessable spelling evidence slot", async () => {
    const items = await buildLocalSpellingGapDraftItems(taxonomy.taxonomy);
    expect(items).toHaveLength(51);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(51);
    expect(new Set(items.map((entry) => `${entry.item.nodeKey}\0${entry.item.promptFr}\0${JSON.stringify(entry.item.choices ?? [])}`)).size).toBe(51);
    expect(items.every((entry) => !/^Cas\s+[1-3]\s*[—–-]/u.test(entry.item.promptFr))).toBe(true);
    expect(items.every((entry) => entry.qcGates.gate1_invariants.ok && entry.qcGates.gate2_answer_key.ok)).toBe(true);
  });
});
