import { describe, expect, it } from "vitest";
import { buildTaxonomyManifest, validateInstructionalProgression, validateTaxonomy, type TaxonomyCandidate } from "./validate";

const node = (key: string, level = "A1") => ({
  key,
  strand: "conjugaison",
  nodeType: "linguistic" as const,
  labelFr: `Reconnaître ${key}`,
  descriptionFr: `Reconnaître de manière fiable la forme ${key}.`,
  atomicityLevel: 4,
  evidence: [{ key: "reading-recognition", actionFr: `Identifier la forme ${key}`, modality: "reading" as const, expectation: "receptive" as const, successCriteria: { accuracy: 0.8 } }],
  sourceKeys: ["sigma-original-taxonomy"],
  mappings: [{ learnerMode: "french_second_language" as const, framework: "cefr" as const, levelMin: level, levelMax: level, status: "reviewed" as const, sourceKey: "sigma-original-taxonomy" }],
});

const candidate = (): TaxonomyCandidate => ({
  release: { key: "test", version: "0.1.0", ontologyVersion: "1.0.0" },
  sources: [{ key: "sigma-original-taxonomy", version: "1.0.0", rightsStatus: "importable", checksum: "sha256:test" }],
  nodes: [node("a"), node("b", "A2")],
  edges: [{ source: "a", target: "b", type: "prerequisite", prerequisiteClass: "hard", rationale: "A précède nécessairement B.", sourceKey: "sigma-original-taxonomy" }],
});

describe("taxonomy release validation", () => {
  it("produces the same manifest regardless of input order", () => {
    const first = candidate();
    const second = { ...first, nodes: [...first.nodes].reverse(), edges: [...first.edges].reverse() };
    expect(buildTaxonomyManifest(second)).toEqual(buildTaxonomyManifest(first));
    expect(validateTaxonomy(first).valid).toBe(true);
  });

  it("hard-fails planted cycles, dangling edges, and self loops", () => {
    const input = candidate();
    input.edges.push(
      { source: "b", target: "a", type: "prerequisite", prerequisiteClass: "hard", rationale: "Cycle volontaire pour le test.", sourceKey: "sigma-original-taxonomy" },
      { source: "a", target: "missing", type: "prerequisite", prerequisiteClass: "hard", rationale: "Lien pendant volontaire.", sourceKey: "sigma-original-taxonomy" },
      { source: "a", target: "a", type: "same_family", rationale: "Boucle volontaire pour le test.", sourceKey: "sigma-original-taxonomy" },
    );
    const codes = validateTaxonomy(input).issues.map((issue) => issue.code);
    expect(codes).toContain("prerequisite_cycle");
    expect(codes).toContain("dangling_edge");
    expect(codes).toContain("self_loop");
  });

  it("fails missing provenance and retains non-blocking warnings", () => {
    const input = candidate();
    input.nodes[0].sourceKeys = ["unknown"];
    input.nodes[1].labelFr = "Reconnaître et produire b";
    const result = validateTaxonomy(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_provenance", severity: "error" }),
      expect.objectContaining({ code: "atomicity_review", severity: "warning" }),
    ]));
  });
});

describe("instructional progression validation", () => {
  it("rejects isolated advanced and productive nodes without prerequisites", () => {
    const input = candidate();
    input.nodes.push({
      ...node("advanced", "B1"),
      labelFr: "Produire seul",
      evidence: [{ ...node("advanced").evidence[0], expectation: "controlled_production" }],
    });
    const codes = validateInstructionalProgression(input).map((issue) => issue.code);
    expect(codes).toContain("isolated_instructional_node");
    expect(codes).toContain("advanced_node_without_prerequisite");
    expect(codes).toContain("productive_node_without_prerequisite");
  });
});
