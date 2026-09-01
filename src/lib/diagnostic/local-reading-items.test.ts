import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { buildLocalReadingDraftItems } from "./local-reading-items";

const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;

describe("local reading diagnostic authoring", () => {
  it("authors three distinct-text items for every reading evidence definition", async () => {
    const items = await buildLocalReadingDraftItems(taxonomy.taxonomy);
    expect(items).toHaveLength(120);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(120);
    expect(new Set(items.map((entry) => `${entry.item.nodeKey}\0${entry.item.promptFr}`)).size).toBe(120);
    expect(items.every((entry) =>
      entry.item.promptFr.includes("Lis le texte.")
      && entry.qcGates.gate1_invariants.ok
      && entry.qcGates.gate2_answer_key.ok
      && entry.reviewStatus === "needs_human_review"
    )).toBe(true);
    for (const node of taxonomy.taxonomy.nodes.filter((candidate) =>
      candidate.strand === "comprehension_ecrite"
    )) {
      const nodeItems = items.filter((entry) => entry.item.nodeKey === node.key);
      expect(new Set(nodeItems.map((entry) => entry.item.validatorConfig?.sourceTextKey)).size, node.key).toBe(3);
      if (node.evidence[0]?.key.startsWith("all-")) {
        expect(new Set(nodeItems.map((entry) => entry.item.validatorConfig?.sourceTextType)).size, node.key).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
