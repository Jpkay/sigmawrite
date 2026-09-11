import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { assembleDraftBank } from "./assemble-drafts";
import { adaptV3ForAssessment } from "./v3-adapter";
import { applyFacetTargets } from "./facet-adapter";
import { buildV3Facets } from "./facets";
import { CONJUGATION_TEACHING } from "./conjugation-teaching";
import { reviewConjugationPathways } from "./conjugation-pathway-review";
import { validateCanonicalDiagnosticBank } from "../item-bank";
import { PRESENT_APPLICATION_CONTEXTS } from "./present-application-contexts";
import { conjugate } from "@/lib/linguistic/conjugation";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), base = read("generated/diagnostic-bank-v3-draft.json");
const assembled = assembleDraftBank(base, artifact.taxonomy, [read("generated/french-v3-conjugation-expansion.json")]);
const compile = (bank: typeof assembled.bank) => applyFacetTargets(adaptV3ForAssessment({ artifact, bank }), buildV3Facets(artifact.taxonomy), bank).assessment;

it("plans disjoint draft pools with real spelling-feature coverage without changing approval or inputs", () => {
  const assessment = compile(assembled.bank), before = JSON.stringify({ assessment, bank: assembled.bank, lessons: CONJUGATION_TEACHING });
  const report = reviewConjugationPathways(assessment, assembled.bank, artifact.taxonomy, CONJUGATION_TEACHING);
  expect(report.rows).toHaveLength(18);
  const contextualTargets = new Set(["pattern:regular_er", "pattern:regular_ir", "pattern:spelling_ger", "pattern:spelling_cer", "verb:aller", "verb:faire"]);
  const contextualRows = report.rows.filter(row => contextualTargets.has(row.facetKey!.split("::")[1]));
  expect(contextualRows).toHaveLength(6);
  for (const row of report.rows.filter(row => !contextualRows.includes(row))) {
    expect(row.releaseReady).toBe(false);
    expect(row.sentenceContextQuestions).toBe(0);
    expect(row.sentenceApplicationPools.status).toBe("insufficient_coverage");
  }
  for (const row of contextualRows) {
    expect(row.releaseReady).toBe(false);
    expect(row.proposedAllocationStatus).toBe("allocated");
    expect(row.unapprovedCandidates).toBeGreaterThan(0);
    expect(row.proposedLaterQuestions.some(id => row.proposedInitialQuestions.includes(id))).toBe(false);
    expect(row.sentenceContextQuestions).toBe(row.facetKey?.includes("spelling_") ? 6 : 12);
    expect(row.sentenceApplicationPools.status).toBe("allocated");
    expect(row.sentenceApplicationPools.initialQuestionIds.length).toBeGreaterThanOrEqual(3);
    expect(row.sentenceApplicationPools.laterQuestionIds.length).toBeGreaterThanOrEqual(3);
    expect(row.sentenceApplicationPools.laterQuestionIds.some(id => row.sentenceApplicationPools.initialQuestionIds.includes(id))).toBe(false);
    for (const id of [...row.sentenceApplicationPools.initialQuestionIds, ...row.sentenceApplicationPools.laterQuestionIds]) {
      expect(assembled.bank.items.find(entry => entry.itemKey === id)?.promptFamily).toBe("sentence-form-application");
    }
    if (!row.facetKey?.includes("spelling_")) continue;
    expect(row.sentenceContextQuestions).toBe(6);
    for (const ids of [row.proposedInitialQuestions, row.proposedLaterQuestions]) {
      const distinctive = ids.map(id => assembled.bank.items.find(item => item.itemKey === id)!).filter(entry => entry.item.validatorConfig?.person === "1p");
      expect(distinctive.length).toBeGreaterThanOrEqual(3);
      expect(new Set(distinctive.map(entry => entry.item.validatorConfig?.verb)).size).toBeGreaterThanOrEqual(2);
    }
  }
  expect(JSON.stringify({ assessment, bank: assembled.bank, lessons: CONJUGATION_TEACHING })).toBe(before);
  expect(assembled.bank.items.filter(item => item.itemKey.includes("present-spelling-context")).every(item => item.reviewStatus === "needs_human_review" && !item.review)).toBe(true);
});
it("adds varied present-form application without copying guided sentences or awarding another target", () => {
  const expected = [
    "parle", "joues", "aime", "donnons", "regardez", "chantent", "travaille", "aimes", "parle", "jouons", "donnez", "regardent",
    "finis", "choisis", "grandit", "réussissons", "finissez", "choisissent", "réussis", "grandis", "finit", "choisissons", "grandissez", "réussissent",
    "vais", "vas", "va", "allons", "allez", "vont", "vais", "vas", "va", "allons", "allez", "vont",
    "fais", "fais", "fait", "faisons", "faites", "font", "fais", "fais", "fait", "faisons", "faites", "font",
  ];
  expect(PRESENT_APPLICATION_CONTEXTS.map(([verb, person]) => conjugate(verb, "present", person))).toEqual(expected);
  const taught = CONJUGATION_TEACHING.flatMap(lesson => [...lesson.steps.map(step => step.exampleFr), ...lesson.practice.map(exercise => exercise.explanationFr)]).join("\n");
  const targets = new Map<string, string[]>();
  for (const [index, [verb, person, sentence]] of PRESENT_APPLICATION_CONTEXTS.entries()) {
    expect(sentence.match(/___/g)).toHaveLength(1);
    expect(taught).not.toContain(sentence.replace("___", expected[index]));
    const entry = assembled.bank.items.find(entry => entry.itemKey === `v3-granular-forms:present-application-context:${verb}:${person}:${index}`)!;
    expect(entry.item.correctAnswer).toBe(expected[index]);
    expect(entry.item.nodeKey).toBe("produire_present_indicatif");
    expect(entry.reviewStatus).toBe("needs_human_review");
    const annotation = assembled.annotations.find(annotation => annotation.itemKey === entry.itemKey)!;
    const facet = annotation.facetKey!;
    targets.set(facet, [...(targets.get(facet) ?? []), person]);
  }
  expect(targets.size).toBe(4);
  for (const persons of targets.values()) {
    expect(persons).toHaveLength(12);
    for (const person of ["1s", "2s", "3s", "1p", "2p", "3p"]) expect(persons.filter(value => value === person)).toHaveLength(2);
  }
});
it("reports the distinctive-form gap when the sentence additions are absent", () => {
  const bank = structuredClone(assembled.bank);
  bank.items = bank.items.filter(item => !item.itemKey.includes("present-spelling-context"));
  delete bank.manifest;
  bank.manifest = validateCanonicalDiagnosticBank(bank, artifact.taxonomy).manifest;
  const report = reviewConjugationPathways(compile(bank), bank, artifact.taxonomy, CONJUGATION_TEACHING);
  const spelling = report.rows.filter(row => row.facetKey?.includes("spelling_"));
  expect(spelling).toHaveLength(2);
  expect(spelling.every(row => row.proposedAllocationStatus === "insufficient_coverage")).toBe(true);
});
