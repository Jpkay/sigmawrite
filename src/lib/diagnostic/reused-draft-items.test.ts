import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import {
  buildReusedDiagnosticDraftItems,
  REUSED_DIAGNOSTIC_ITEM_PREFIX,
} from "./reused-draft-items";

const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;
const sources = [
  ...JSON.parse(readFileSync("generated/past-narration-items.json", "utf8")),
  ...JSON.parse(readFileSync("generated/present-agreement-items.json", "utf8")),
] as GeneratedItem[];

describe("reused diagnostic draft items", () => {
  it("converts reviewed-source candidates into three hard-QC tiers", async () => {
    const items = await buildReusedDiagnosticDraftItems(taxonomy.taxonomy, sources);

    expect(items.length).toBeGreaterThanOrEqual(120);
    expect(items.length % 3).toBe(0);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(items.length);
    expect(new Set(items.map((entry) => entry.item.promptFr)).size).toBe(items.length);
    expect(items.every((entry) =>
      entry.itemKey.startsWith(REUSED_DIAGNOSTIC_ITEM_PREFIX)
      && entry.reviewStatus === "needs_human_review"
      && entry.qcGates.gate1_schema
      && entry.qcGates.gate1_invariants.ok
      && entry.qcGates.gate2_answer_key.ok
      && entry.qcGates.verdict !== "rejected"
      && entry.item.validatorType === "exact"
      && (entry.evidenceExpectation !== "controlled_production"
        || entry.item.responseType !== "mcq")
    )).toBe(true);
  });
});
