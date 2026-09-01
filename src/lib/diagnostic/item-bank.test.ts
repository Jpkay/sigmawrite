import { describe, expect, it } from "vitest";
import type { GeneratedItem } from "@/lib/ai/item-generation/schemas";
import type { TaxonomyCandidate } from "@/lib/taxonomy/validate";
import { validateCanonicalDiagnosticBank, type CanonicalDiagnosticBankItem } from "./item-bank";
import { DIAGNOSTIC_SECTIONS } from "./protocol";

const strands = {
  reading_comprehension: "comprehension_ecrite",
  grammar: "grammaire_syntaxe",
  spelling: "orthographe_lexicale",
  conjugation: "conjugaison",
} as const;
const taxonomy = {
  release: { key: "test", version: "1", ontologyVersion: "1" },
  sources: [{ key: "source", version: "1", rightsStatus: "importable" }],
  nodes: DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 6 }, (_, index) => ({
    key: `${section.key}-${index}`,
    strand: strands[section.key],
    nodeType: "linguistic" as const,
    labelFr: `Compétence ${index}`,
    descriptionFr: "Une description suffisamment longue.",
    atomicityLevel: 4,
    evidence: [
      { key: "receptive", actionFr: "Identifier une forme correcte.", modality: "reading" as const, expectation: "receptive" as const, successCriteria: {} },
      { key: "production", actionFr: "Produire une forme correcte.", modality: "writing" as const, expectation: "controlled_production" as const, successCriteria: {} },
    ],
    sourceKeys: ["source"],
    mappings: [],
  }))),
  edges: [],
} satisfies TaxonomyCandidate;

const gates = {
  gate1_schema: true,
  gate1_invariants: { ok: true, violations: [] },
  gate0_computed: { applied: false },
  gate2_answer_key: { ok: true },
  gate3_ensemble: { agreement: .9, agrees: true },
  verdict: "auto_approved" as const,
};

function item(nodeKey: string, strand: string, sectionKey: CanonicalDiagnosticBankItem["sectionKey"], index: number): CanonicalDiagnosticBankItem {
  const generated: GeneratedItem = {
    nodeKey,
    strand,
    modality: index % 2 ? "writing" : "reading",
    learnerMode: "shared",
    responseType: "short_answer",
    promptFr: `Question distincte ${nodeKey} ${index}`,
    correctAnswer: "réponse",
    acceptableAnswers: [],
    validatorType: "exact",
    difficulty: index % 3 === 0 ? 30 : 60,
  };
  return {
    itemKey: `${sectionKey}-${index}`,
    item: generated,
    evidenceKey: index % 2 ? "production" : "receptive",
    evidenceExpectation: index % 2 ? "controlled_production" : "receptive",
    sectionKey,
    promptFamily: index % 2 ? "production" : "recognition",
    difficultyTier: index % 3 === 0 ? "foundation" : "core",
    qcGates: gates,
    reviewStatus: "human_approved",
    review: {
      reviewerProfileId: "00000000-0000-0000-0000-000000000001",
      reviewedAt: "2026-07-12T00:00:00Z",
    },
  };
}

// The first two nodes receive two receptive and two controlled-production
// items each; the remaining four nodes preserve the section breadth gate.
const nodeIndex = (index: number) => index < 4 ? 0 : index < 8 ? 1 : index - 6;

describe("canonical diagnostic item-bank gate", () => {
  it("requires canonical node/evidence alignment and balanced section coverage", () => {
    const items = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    const artifact = {
      schemaVersion: 1 as const,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items,
    };
    expect(validateCanonicalDiagnosticBank(artifact, taxonomy)).toMatchObject({ valid: true, issues: [] });
  });

  it("does not count unreviewed model output as diagnostic-ready", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) => ({
      ...item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index),
      reviewStatus: "needs_human_review" as const,
    })));
    const result = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    }, taxonomy);
    expect(result.valid).toBe(false);
    expect(result.manifest.eligibleItemCount).toBe(0);
    expect(result.issues).toContain("items.0: item is not release-approved");
  });

  it("rejects a mixed release artifact that still contains an unreviewed item", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    entries.push({
      ...item("grammar-2", strands.grammar, "grammar", 99),
      itemKey: "grammar-unreviewed-extra",
      reviewStatus: "needs_human_review",
    });
    const result = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    }, taxonomy);
    expect(result.manifest.sectionReadiness.every((section) => section.ready)).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain(`items.${entries.length - 1}: item is not release-approved`);
  });

  it("pins answer keys, choices, validators, and QC decisions in the manifest", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    const artifact = {
      schemaVersion: 1 as const,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    };
    const original = validateCanonicalDiagnosticBank(artifact, taxonomy).manifest.checksum;
    const changedAnswer = structuredClone(artifact);
    changedAnswer.items[0].item.correctAnswer = "une autre réponse";
    const changedQc = structuredClone(artifact);
    changedQc.items[0].qcGates.gate3_ensemble.agreement = 0.91;
    const changedTaxonomy = structuredClone(artifact);
    changedTaxonomy.taxonomy.checksum = "sha256:different";
    const changedReviewer = structuredClone(artifact);
    changedReviewer.items[0].review!.reviewerProfileId = "00000000-0000-0000-0000-000000000002";

    expect(validateCanonicalDiagnosticBank(changedAnswer, taxonomy).manifest.checksum).not.toBe(original);
    expect(validateCanonicalDiagnosticBank(changedQc, taxonomy).manifest.checksum).not.toBe(original);
    expect(validateCanonicalDiagnosticBank(changedTaxonomy, taxonomy).manifest.checksum).not.toBe(original);
    expect(validateCanonicalDiagnosticBank(changedReviewer, taxonomy).manifest.checksum).not.toBe(original);
  });

  it("distinguishes MCQs by their complete visible surface while preserving strict open-prompt uniqueness", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    const first = entries[0];
    const second = entries[2];
    first.item = {
      ...first.item,
      responseType: "mcq",
      promptFr: "Quel mot est correctement orthographié ?",
      choices: [
        { text: "bateau", correct: true },
        { text: "bato", correct: false },
      ],
    };
    second.item = {
      ...second.item,
      responseType: "mcq",
      promptFr: "  QUEL mot est correctement   orthographié ? ",
      choices: [
        { text: "vélo", correct: true },
        { text: "vélau", correct: false },
      ],
    };
    const artifact = {
      schemaVersion: 1 as const,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    };

    expect(validateCanonicalDiagnosticBank(artifact, taxonomy).issues)
      .not.toContain("items.2: duplicate student surface for reading_comprehension-0");

    second.item.choices = [
      { text: " BATO ", correct: false },
      { text: "BATEAU", correct: true },
    ];
    expect(validateCanonicalDiagnosticBank(artifact, taxonomy).issues)
      .toContain("items.2: duplicate student surface for reading_comprehension-0");

    first.item = { ...first.item, responseType: "short_answer", choices: undefined };
    second.item = { ...second.item, responseType: "cloze", choices: undefined };
    expect(validateCanonicalDiagnosticBank(artifact, taxonomy).issues)
      .toContain("items.2: duplicate student surface for reading_comprehension-0");
  });

  it("does not trust a human-approved label without reviewer provenance", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    entries[0] = { ...entries[0], review: undefined };
    const result = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    }, taxonomy);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("items.0: human approval provenance is required");
  });

  it("recomputes conjugator-only auto approvals at release verification", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    const conjugationIndex = entries.findIndex((entry) => entry.itemKey === "conjugation-1");
    entries[conjugationIndex] = {
      ...entries[conjugationIndex],
      item: {
        ...entries[conjugationIndex].item,
        validatorType: "conjugator",
        validatorConfig: { verb: "parler", tense: "present", person: "2s" },
        correctAnswer: "parles",
      },
      qcGates: {
        ...entries[conjugationIndex].qcGates,
        gate0_computed: { applied: true, correctedAnswer: "parles" },
      },
      reviewStatus: "auto_approved",
      review: undefined,
    };
    const artifact = {
      schemaVersion: 1 as const,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    };
    expect(validateCanonicalDiagnosticBank(artifact, taxonomy).valid).toBe(true);
    const corrupted = structuredClone(artifact);
    corrupted.items[conjugationIndex].item.correctAnswer = "parlez";
    const result = validateCanonicalDiagnosticBank(corrupted, taxonomy);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain(`items.${conjugationIndex}: computed conjugation could not be reproduced`);
  });

  it("rejects hard-gate failures and evidence-incompatible modalities", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    entries[0] = {
      ...entries[0],
      item: { ...entries[0].item, modality: "speaking" },
      qcGates: { ...entries[0].qcGates, gate2_answer_key: { ok: false, reason: "wrong key" } },
    };
    entries[1] = {
      ...entries[1],
      item: { ...entries[1].item, validatorType: "agreement", responseType: "mcq" },
    };
    const result = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    }, taxonomy);

    expect(result.valid).toBe(false);
    expect(result.issues).toContain("items.0: item/evidence modality mismatch");
    expect(result.issues).toContain("items.0: hard QC gate did not pass");
    expect(result.issues).toContain("items.1: validator is not supported by the live diagnostic");
    expect(result.issues).toContain("items.1: controlled production cannot use a multiple-choice response");
  });

  it("requires at least two nodes per section that can receive confirming evidence", () => {
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    const readingLast = entries.findIndex((entry) =>
      entry.sectionKey === "reading_comprehension" && entry.itemKey === "reading_comprehension-7"
    );
    entries[readingLast] = {
      ...entries[readingLast],
      item: { ...entries[readingLast].item, nodeKey: "reading_comprehension-2" },
    };
    const result = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    }, taxonomy);

    expect(result.valid).toBe(false);
    expect(result.sections.find((section) => section.key === "reading_comprehension"))
      .toMatchObject({ confirmableNodeCount: 1, ready: false });
  });

  it("honors each pinned evidence definition's distinct-item minimum", () => {
    const strictTaxonomy = structuredClone(taxonomy) as TaxonomyCandidate;
    const readingAnchor = strictTaxonomy.nodes.find((node) => node.key === "reading_comprehension-0");
    const receptive = readingAnchor?.evidence.find((evidence) => evidence.key === "receptive");
    if (!receptive) throw new Error("test fixture evidence missing");
    receptive.successCriteria = { minimumDistinctItems: 3 };
    const entries = DIAGNOSTIC_SECTIONS.flatMap((section) => Array.from({ length: 12 }, (_, index) =>
      item(`${section.key}-${nodeIndex(index)}`, strands[section.key], section.key, index)
    ));
    const result = validateCanonicalDiagnosticBank({
      schemaVersion: 1,
      bank: { key: "test", version: "1" },
      taxonomy: { releaseKey: "test", releaseVersion: "1", checksum: "sha256:test" },
      generatedAt: "2026-07-12T00:00:00Z",
      items: entries,
    }, strictTaxonomy);
    expect(result.valid).toBe(false);
    expect(result.sections.find((section) => section.key === "reading_comprehension"))
      .toMatchObject({ confirmableNodeCount: 1, ready: false });
  });
});
