import { describe, expect, it } from "vitest";
import {
  assessDiagnosticBankReadiness,
  DIAGNOSTIC_MAX_TOTAL_PROBES,
  DIAGNOSTIC_MIN_TOTAL_PROBES,
  DIAGNOSTIC_ITEM_BANK_RELEASE_KEY,
  DIAGNOSTIC_SECTIONS,
  DIAGNOSTIC_TAXONOMY_RELEASE_KEY,
  evaluateDiagnosticSection,
  mergeDiagnosticEstimateSnapshots,
  nextDiagnosticSection,
  selectDiagnosticTargets,
  sectionForStrand,
  type DiagnosticSectionProgress,
} from "./protocol";

function progress(
  key: DiagnosticSectionProgress["key"],
  patch: Partial<DiagnosticSectionProgress> = {},
): DiagnosticSectionProgress {
  return {
    key,
    probeCount: 8,
    distinctNodesTested: 6,
    confirmedNodeCount: 2,
    targetNodeCount: 10,
    resolvedNodeCount: 8,
    meanUncertainty: 0.3,
    nextInformationGain: 0.1,
    eligibleItemCount: 12,
    status: "active",
    ...patch,
  };
}

describe("section-aware diagnostic protocol", () => {
  it("covers the four required domains with a 32–80 probe adaptive envelope", () => {
    expect(DIAGNOSTIC_SECTIONS.map((section) => section.key)).toEqual([
      "reading_comprehension",
      "grammar",
      "spelling",
      "conjugation",
    ]);
    expect(DIAGNOSTIC_MIN_TOTAL_PROBES).toBe(32);
    expect(DIAGNOSTIC_MAX_TOTAL_PROBES).toBe(80);
    expect(sectionForStrand("orthographe_lexicale")).toBe("spelling");
    expect(sectionForStrand("orthographe_grammaticale")).toBe("spelling");
    expect(DIAGNOSTIC_TAXONOMY_RELEASE_KEY).toBe("french-taxonomy-v2");
    expect(DIAGNOSTIC_ITEM_BANK_RELEASE_KEY).toBe("french-diagnostic-bank-v2");
  });

  it("does not resolve a section without direct and graph breadth", () => {
    expect(evaluateDiagnosticSection(progress("grammar", { probeCount: 5 })).stop).toBe(false);
    expect(evaluateDiagnosticSection(progress("grammar", { distinctNodesTested: 3 })).stop).toBe(false);
    expect(evaluateDiagnosticSection(progress("grammar", { confirmedNodeCount: 1 })).stop).toBe(false);
    expect(evaluateDiagnosticSection(progress("grammar", { resolvedNodeCount: 4 })).stop).toBe(false);
    expect(evaluateDiagnosticSection(progress("grammar"))).toMatchObject({
      stop: true,
      reason: "resolved",
      confidence: "high",
    });
  });

  it("fails closed when a section runs out of items before sufficient coverage", () => {
    expect(evaluateDiagnosticSection(progress("spelling", {
      probeCount: 6,
      distinctNodesTested: 4,
      resolvedNodeCount: 4,
      eligibleItemCount: 0,
    }))).toMatchObject({ stop: true, reason: "insufficient_items", confidence: "low" });
  });

  it("keeps each section independent and advances in a stable order", () => {
    const rows = [
      progress("reading_comprehension", { status: "completed" }),
      progress("grammar", { status: "active" }),
      progress("spelling", { status: "pending" }),
      progress("conjugation", { status: "pending" }),
    ];
    expect(nextDiagnosticSection(rows)).toBe("grammar");
    rows[1] = progress("grammar", { status: "completed" });
    expect(nextDiagnosticSection(rows)).toBe("spelling");
  });

  it("rejects a bank that merely has many items concentrated on too few nodes", () => {
    const rows = DIAGNOSTIC_SECTIONS.map((section) => ({
      key: section.key,
      targetNodeCount: 20,
      nodesWithItems: section.key === "reading_comprehension" ? 2 : 8,
      approvedItemCount: 40,
    }));
    const readiness = assessDiagnosticBankReadiness(rows);
    expect(readiness.ready).toBe(false);
    expect(readiness.sections.find((section) => section.key === "reading_comprehension")?.ready).toBe(false);
  });

  it("preserves the database production and diversity readiness gates", () => {
    const rows = DIAGNOSTIC_SECTIONS.map((section) => ({
      key: section.key,
      targetNodeCount: 20,
      nodesWithItems: 8,
      approvedItemCount: 12,
      productionItemCount: section.key === "spelling" ? 2 : 4,
      promptFamilyCount: 2,
      difficultyTierCount: 2,
      ready: section.key !== "spelling",
    }));
    const readiness = assessDiagnosticBankReadiness(rows);
    expect(readiness.ready).toBe(false);
    expect(readiness.sections.find((section) => section.key === "spelling")?.ready).toBe(false);
  });

  it("rejects a bank that cannot confirm at least two separate nodes", () => {
    const rows = DIAGNOSTIC_SECTIONS.map((section) => ({
      key: section.key,
      targetNodeCount: 20,
      nodesWithItems: 8,
      approvedItemCount: 12,
      confirmableNodeCount: section.key === "grammar" ? 1 : 4,
      productionItemCount: 4,
      promptFamilyCount: 2,
      difficultyTierCount: 2,
      ready: section.key !== "grammar",
    }));
    expect(assessDiagnosticBankReadiness(rows).ready).toBe(false);
  });

  it("scopes targets to the active progression ceiling and its hard prerequisites", () => {
    const nodes = DIAGNOSTIC_SECTIONS.flatMap((section) =>
      Array.from({ length: 8 }, (_, index) => ({
        id: `${section.key}-${index}`,
        sectionKey: section.key,
      })),
    );
    nodes.push({ id: "grammar-hard-foundation", sectionKey: "grammar" });
    nodes.push({ id: "grammar-soft-foundation", sectionKey: "grammar" });
    const mappings = nodes.map((node) => ({
      nodeId: node.id,
      learnerMode: "french_second_language",
      framework: "cefr",
      levelMin: node.id.endsWith("-7") || node.id.includes("foundation") ? "B2" : "B1",
    }));
    const result = selectDiagnosticTargets({
      nodes,
      mappings,
      edges: [
        {
          sourceNodeId: "grammar-hard-foundation",
          targetNodeId: "grammar-6",
          prerequisiteClass: "hard",
        },
        {
          sourceNodeId: "grammar-soft-foundation",
          targetNodeId: "grammar-6",
          prerequisiteClass: "soft",
        },
      ],
      goal: {
        learnerMode: "french_second_language",
        framework: "cefr",
        targetLevel: "B1",
      },
      assessmentKind: "initial",
    });

    expect(result.targets.some((target) => target.id === "reading_comprehension-7")).toBe(false);
    expect(result.targets.some((target) => target.id === "grammar-hard-foundation")).toBe(true);
    expect(result.targets.some((target) => target.id === "grammar-soft-foundation")).toBe(false);
    expect(result.insufficientGoalSections).toEqual([]);
    expect(new Set(result.targets.map((target) => target.targetReason))).toEqual(new Set(["initial_scope"]));
  });

  it("focuses re-entry where breadth survives and explicitly falls back elsewhere", () => {
    const nodes = DIAGNOSTIC_SECTIONS.flatMap((section) =>
      Array.from({ length: 8 }, (_, index) => ({
        id: `${section.key}-${index}`,
        sectionKey: section.key,
      })),
    );
    const mappings = nodes.map((node) => ({
      nodeId: node.id,
      learnerMode: "french_first_language",
      framework: "native_grade",
      levelMin: "6",
    }));
    const grammarFocus = Array.from({ length: 6 }, (_, index) => `grammar-${index}`);
    const result = selectDiagnosticTargets({
      nodes,
      mappings,
      edges: [],
      goal: {
        learnerMode: "french_first_language",
        framework: "native_grade",
        targetLevel: "7",
      },
      assessmentKind: "reentry",
      focusNodeIds: [...grammarFocus, "reading_comprehension-0"],
      focusReason: "stale",
    });

    expect(result.targets.filter((target) => target.sectionKey === "grammar")).toHaveLength(6);
    expect(result.targets.filter((target) => target.sectionKey === "grammar").every(
      (target) => target.targetReason === "stale",
    )).toBe(true);
    expect(result.targets.filter((target) => target.sectionKey === "spelling")).toHaveLength(8);
    expect(result.targets.find((target) => target.id === "reading_comprehension-0")?.targetReason).toBe("stale");
    expect(result.fallbackSections).toEqual([
      "reading_comprehension",
      "spelling",
      "conjugation",
    ]);
  });

  it("keeps historical estimates unconfirmed and overlays current-run evidence", () => {
    const merged = mergeDiagnosticEstimateSnapshots([
      {
        node_id: "historical-only",
        mastery_probability: 0.98,
        uncertainty: 0.05,
        evidence_count: 40,
        evidence_coverage_confirmed: true,
        classification: "mastered",
      },
      {
        node_id: "retested",
        mastery_probability: 0.92,
        uncertainty: 0.1,
        evidence_count: 12,
      },
    ], [
      {
        node_id: "retested",
        mastery_probability: 0.42,
        uncertainty: 0.2,
        direct_evidence_count: 4,
        evidence_coverage_confirmed: true,
        evidence_kind: "direct",
        classification: "missing",
      },
    ]);

    expect(merged.get("historical-only")).toMatchObject({
      masteryProbability: 0.98,
      directEvidenceCount: 40,
      evidenceCoverageConfirmed: false,
      evidenceKind: "historical",
    });
    expect(merged.get("historical-only")?.classification).toBeUndefined();
    expect(merged.get("retested")).toMatchObject({
      masteryProbability: 0.42,
      evidenceCoverageConfirmed: true,
      evidenceKind: "direct",
      classification: "missing",
    });
  });
});
