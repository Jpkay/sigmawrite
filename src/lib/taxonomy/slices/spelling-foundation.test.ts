import { describe, expect, it } from "vitest";
import { validateTaxonomy, type TaxonomyCandidate } from "../validate";
import { CONJUGATION_FOUNDATION_CANDIDATE } from "./conjugation-foundation";
import { CONSTRUCTION_CROSS_SLICE_EDGES, CONSTRUCTION_FOUNDATION_CANDIDATE } from "./construction-foundation";
import { READING_FOUNDATION_CANDIDATE } from "./reading-comprehension-foundation";
import {
  SPELLING_ASSESSMENT_TEMPLATES,
  SPELLING_CROSS_SLICE_EDGES,
  SPELLING_FOUNDATION_CANDIDATE,
  SPELLING_FOUNDATION_NODES,
} from "./spelling-foundation";

describe("French spelling foundation v1", () => {
  it("is graph-valid, granular, and mapped separately for L1 and FSL", () => {
    const result = validateTaxonomy(SPELLING_FOUNDATION_CANDIDATE);
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(SPELLING_FOUNDATION_NODES.length).toBeGreaterThanOrEqual(40);
    expect(SPELLING_FOUNDATION_NODES.filter((node) => node.strand === "orthographe_lexicale").length).toBeGreaterThanOrEqual(20);
    expect(SPELLING_FOUNDATION_NODES.filter((node) => node.strand === "orthographe_grammaticale").length).toBeGreaterThanOrEqual(15);
    expect(SPELLING_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "native_grade"))).toBe(true);
    expect(SPELLING_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "cefr"))).toBe(true);
  });

  it("requires recognition and controlled written production for every atomic node", () => {
    for (const node of SPELLING_FOUNDATION_NODES) {
      expect(node.evidence.some((evidence) => evidence.modality === "reading" && evidence.expectation === "receptive"), node.key).toBe(true);
      expect(node.evidence.some((evidence) => evidence.modality === "writing" && evidence.expectation === "controlled_production"), node.key).toBe(true);
      expect(node.evidence.every((evidence) => Number(evidence.successCriteria.minimumDistinctItems ?? evidence.successCriteria.minimumDistinctTexts) >= 2), node.key).toBe(true);
    }
  });

  it("adds independent transfer evidence in both spelling strands", () => {
    const independent = SPELLING_FOUNDATION_NODES.filter((node) => node.evidence.some((evidence) => evidence.expectation === "independent_production"));
    expect(new Set(independent.map((node) => node.strand))).toEqual(new Set(["orthographe_lexicale", "orthographe_grammaticale"]));
    expect(independent.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SPELLING_ASSESSMENT_TEMPLATES.map((template) => template.expectation))).toEqual(
      new Set(["receptive", "controlled_production", "independent_production"]),
    );
  });

  it("connects productive spelling to the existing grammar and conjugation graph", () => {
    const combined: TaxonomyCandidate = {
      release: { key: "spelling-combined-test", version: "0.1.0", ontologyVersion: "1.0.0" },
      sources: SPELLING_FOUNDATION_CANDIDATE.sources,
      nodes: [
        ...CONJUGATION_FOUNDATION_CANDIDATE.nodes,
        ...READING_FOUNDATION_CANDIDATE.nodes,
        ...CONSTRUCTION_FOUNDATION_CANDIDATE.nodes,
        ...SPELLING_FOUNDATION_CANDIDATE.nodes,
      ],
      edges: [
        ...CONJUGATION_FOUNDATION_CANDIDATE.edges,
        ...READING_FOUNDATION_CANDIDATE.edges,
        ...CONSTRUCTION_FOUNDATION_CANDIDATE.edges,
        ...CONSTRUCTION_CROSS_SLICE_EDGES,
        ...SPELLING_FOUNDATION_CANDIDATE.edges,
        ...SPELLING_CROSS_SLICE_EDGES,
      ],
    };
    const result = validateTaxonomy(combined);
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(SPELLING_CROSS_SLICE_EDGES).toContainEqual(expect.objectContaining({ source: "construction_accord_sujet_verbe", target: "accorder_sujet_verbe_ecrit" }));
    expect(SPELLING_CROSS_SLICE_EDGES).toContainEqual(expect.objectContaining({ source: "distinguer_infinitif_participe", target: "distinguer_infinitif_participe_ecrit" }));
  });
});
