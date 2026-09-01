import { describe, expect, it } from "vitest";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import {
  diagnosticDifficultyForTier,
  diagnosticItemModality,
  diagnosticPromptFamilies,
} from "./item-authoring";

const node = (strand: string): TaxonomyCandidate["nodes"][number] => ({
  key: `node_${strand}`,
  strand,
  nodeType: "linguistic",
  labelFr: "Compétence test",
  descriptionFr: "Une description suffisamment précise.",
  atomicityLevel: 4,
  evidence: [],
  sourceKeys: ["source"],
  mappings: [],
});
const evidence = (
  modality: "reading" | "writing",
  expectation: "receptive" | "controlled_production",
): TaxonomyCandidate["nodes"][number]["evidence"][number] => ({
  key: `${modality}-${expectation}`,
  actionFr: "Produire une réponse vérifiable.",
  modality,
  expectation,
  successCriteria: {},
});
describe("diagnostic item authoring plan", () => {
  it("uses distinct prompt families and ordered difficulty priors", () => {
    expect(new Set(diagnosticPromptFamilies("grammar", "controlled_production")).size).toBe(3);
    expect(["foundation", "core", "stretch"].map((tier) =>
      diagnosticDifficultyForTier(tier as "foundation" | "core" | "stretch")
    )).toEqual([25, 50, 75]);
  });

  it("does not label text-only spelling prompts as dictation", () => {
    expect(diagnosticItemModality(
      node("orthographe_lexicale"),
      evidence("writing", "controlled_production"),
    )).toBe("writing");
    expect(diagnosticItemModality(
      node("grammaire_syntaxe"),
      evidence("reading", "receptive"),
    )).toBe("grammar_analysis");
  });
});
