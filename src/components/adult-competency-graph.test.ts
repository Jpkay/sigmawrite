import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdultCompetencyGraph } from "./adult-competency-graph";
import type { StudentGraphView } from "@/lib/graph/presentation";

const graph: StudentGraphView = {
  meta: { releaseId: "release", runId: "run", nodeCount: 2, edgeCount: 1, readyCount: 1, pathStepCount: 1 },
  nodes: [
    {
      id: "base", key: "base", label: "Identifier le sujet", strand: "grammaire_syntaxe", classification: "mastered",
      isReadyToLearn: false, masteryProbability: 0.91, uncertainty: 0.12, evidenceCount: 4, blockedBy: [], path: null,
    },
    {
      id: "next", key: "next", label: "Accorder le verbe", strand: "grammaire_syntaxe", classification: "fragile",
      isReadyToLearn: true, masteryProbability: 0.62, uncertainty: 0.34, evidenceCount: 2, blockedBy: ["base"],
      path: { position: 1, stage: "consolidation", status: "available", rationaleFr: "Stabiliser l'accord.", requiredEvidenceExpectation: "controlled_production" },
    },
  ],
  edges: [{ id: "base:next:prerequisite", sourceNodeId: "base", targetNodeId: "next", edgeType: "prerequisite", prerequisiteClass: "hard", rationale: null }],
};

function render(audience: "parent" | "teacher", language: "fr" | "en", view = graph) {
  return renderToStaticMarkup(createElement(AdultCompetencyGraph, { graph: view, audience, language, studentName: "Maya" }));
}

describe("adult competency graph", () => {
  it("renders supportive parent language without raw diagnostic percentages or practice actions", () => {
    const html = render("parent", "fr");
    expect(html).toContain("Carte d&#x27;apprentissage de Maya");
    expect(html).toContain("En consolidation");
    expect(html).toContain("Preuves en développement");
    expect(html).not.toContain("Incertitude");
    expect(html).not.toContain("/student/practice/");
  });

  it("renders teacher evidence metrics and prerequisite language", () => {
    const html = render("teacher", "en");
    expect(html).toContain("Maya&#x27;s competency map");
    expect(html).toContain("Uncertainty");
    expect(html).toContain("Direct prerequisites");
    expect(html).toContain("Search a competency");
  });

  it("renders a safe empty state", () => {
    const empty: StudentGraphView = { ...graph, meta: { ...graph.meta, nodeCount: 0, edgeCount: 0, readyCount: 0, pathStepCount: 0 }, nodes: [], edges: [] };
    const html = render("parent", "en", empty);
    expect(html).toContain("No competency matches these filters.");
    expect(html).toContain("Choose a competency to see its context.");
  });
});
