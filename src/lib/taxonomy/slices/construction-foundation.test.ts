import { describe, expect, it } from "vitest";
import { validateTaxonomy, type TaxonomyCandidate } from "../validate";
import { CONJUGATION_FOUNDATION_CANDIDATE } from "./conjugation-foundation";
import { READING_FOUNDATION_CANDIDATE } from "./reading-comprehension-foundation";
import {
  CONSTRUCTION_CROSS_SLICE_EDGES,
  CONSTRUCTION_FOUNDATION_CANDIDATE,
  CONSTRUCTION_FOUNDATION_NODES,
} from "./construction-foundation";

describe("French construction foundation v1", () => {
  it("is graph-valid and mapped separately for L1 and FSL", () => {
    const result = validateTaxonomy(CONSTRUCTION_FOUNDATION_CANDIDATE);
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(CONSTRUCTION_FOUNDATION_NODES.length).toBeGreaterThanOrEqual(30);
    expect(CONSTRUCTION_FOUNDATION_NODES.every((node) => node.evidence.length > 0)).toBe(true);
    expect(CONSTRUCTION_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "native_grade"))).toBe(true);
    expect(CONSTRUCTION_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "cefr"))).toBe(true);
  });

  it("links constructions explicitly to conjugation and reading without duplicating their nodes", () => {
    const combined: TaxonomyCandidate = {
      release: { key: "combined-test", version: "0.1.0", ontologyVersion: "1.0.0" },
      sources: CONSTRUCTION_FOUNDATION_CANDIDATE.sources,
      nodes: [
        ...CONJUGATION_FOUNDATION_CANDIDATE.nodes,
        ...READING_FOUNDATION_CANDIDATE.nodes,
        ...CONSTRUCTION_FOUNDATION_CANDIDATE.nodes,
      ],
      edges: [
        ...CONJUGATION_FOUNDATION_CANDIDATE.edges,
        ...READING_FOUNDATION_CANDIDATE.edges,
        ...CONSTRUCTION_FOUNDATION_CANDIDATE.edges,
        ...CONSTRUCTION_CROSS_SLICE_EDGES,
      ],
    };
    const result = validateTaxonomy(combined);
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(CONSTRUCTION_CROSS_SLICE_EDGES.some((edge) => edge.target === "construction_accord_participe")).toBe(true);
    expect(CONSTRUCTION_CROSS_SLICE_EDGES.some((edge) => edge.target === "inferer_cause_locale")).toBe(true);
  });
});

