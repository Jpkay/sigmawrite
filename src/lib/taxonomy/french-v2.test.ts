import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import lexical from "../../../generated/french-baseline-lexicon.json";
import {
  buildFrenchTaxonomyV2,
  FRENCH_TAXONOMY_V2_CANDIDATE,
  FRENCH_TAXONOMY_V2_CONSTRUCTION_NODES,
} from "./french-v2";
import type { BaselineLexiconArtifact } from "@/lib/lexicon/baseline";
import { DIAGNOSTIC_SECTIONS, sectionForStrand } from "@/lib/diagnostic/protocol";

const build = () => buildFrenchTaxonomyV2({
  ontologyText: readFileSync("docs/french-ontology-v1.md", "utf8"),
  sourceRegisterText: readFileSync("docs/french-source-register.md", "utf8"),
  lexical: lexical as BaselineLexiconArtifact,
});

describe("French Taxonomy v2 diagnostic release", () => {
  it("uses a new immutable release identity", () => {
    expect(FRENCH_TAXONOMY_V2_CANDIDATE.release).toMatchObject({ key: "french-taxonomy-v2", version: "2.0.0" });
  });

  it("is deterministic and valid across all four diagnostic sections", () => {
    const artifact = build();
    expect(artifact).toEqual(build());
    expect(artifact.validation.valid).toBe(true);
    expect(artifact.coverage).toMatchObject({
      conjugationNodes: 48,
      readingNodes: 40,
      constructionNodes: 33,
      spellingNodes: 40,
    });
    expect(artifact.coverage.evidenceDefinitions).toBeGreaterThan(artifact.coverage.nodes);
  });

  it("adds controlled grammar production without mutating the v1 construction slice", () => {
    expect(FRENCH_TAXONOMY_V2_CONSTRUCTION_NODES.every((node) =>
      node.evidence.some((evidence) => evidence.expectation === "controlled_production")
    )).toBe(true);
    expect(FRENCH_TAXONOMY_V2_CANDIDATE.nodes
      .filter((node) => node.strand === "grammaire_syntaxe")
      .every((node) => node.evidence.some((evidence) => evidence.modality === "writing")))
      .toBe(true);
  });

  it("can satisfy every section's direct and productive evidence gate", () => {
    for (const section of DIAGNOSTIC_SECTIONS) {
      const nodes = FRENCH_TAXONOMY_V2_CANDIDATE.nodes.filter((node) =>
        sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]) === section.key
      );
      const productiveNodes = nodes.filter((node) => node.evidence.some((evidence) =>
        evidence.expectation === "controlled_production"
      ));
      const minimumProductive = section.key === "reading_comprehension" || section.key === "grammar" ? 2 : 4;

      expect(nodes.length, section.key).toBeGreaterThanOrEqual(section.minDistinctNodes);
      expect(productiveNodes.length, section.key).toBeGreaterThanOrEqual(minimumProductive);
    }
  });
});
