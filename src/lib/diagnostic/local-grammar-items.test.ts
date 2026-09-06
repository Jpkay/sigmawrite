import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FrenchTaxonomyV2Artifact } from "@/lib/taxonomy/french-v2";
import { buildLocalGrammarDraftItems } from "./local-grammar-items";
import { gradePracticeResponse } from "@/lib/practice/grade-response";
import { validateAnswer } from "@/lib/linguistic/validator";
import type { CanonicalDiagnosticBankArtifact } from "./item-bank";

const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;

describe("local grammar diagnostic authoring", () => {
  it("accepts word order with or without a final period in authored and shipped exercises", async () => {
    const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v2.json", "utf8")) as CanonicalDiagnosticBankArtifact;
    for (const entries of [await buildLocalGrammarDraftItems(taxonomy.taxonomy), bank.items]) {
      const ordering = entries.filter((entry) => entry.item.nodeKey === "construction_phrase_canonique" && entry.evidenceExpectation === "controlled_production");
      expect(ordering).toHaveLength(3);
      for (const { item } of ordering) {
        expect(item.instructionsFr).toContain("point final est facultatif");
        const expected = item.correctAnswer!;
        for (const answer of [expected, expected.slice(0, -1)]) {
          // The diagnostic and review/practice paths must agree.
          expect((await validateAnswer(answer, item)).pass).toBe(true);
          expect((await gradePracticeResponse({ response_type: item.responseType, validator_type: item.validatorType, validator_config: null, correct_answer: expected, acceptable_answers: item.acceptableAnswers }, [], { answerText: answer })).correct).toBe(true);
        }
        for (const wrong of [expected.split(" ").reverse().join(" "), expected.slice(0, -1) + "?", expected.replace(" ", ", ")]) {
          expect((await validateAnswer(wrong, item)).pass).toBe(false);
        }
      }
    }
  });

  it("still requires punctuation when the exercise assesses it", async () => {
    const spec = { validatorType: "exact" as const, correctAnswer: "Viendras-tu ?", acceptableAnswers: [] };
    expect((await validateAnswer("Viendras-tu ?", spec)).pass).toBe(true);
    expect((await validateAnswer("Viendras-tu", spec)).pass).toBe(false);
    expect((await validateAnswer("Viendras-tu.", spec)).pass).toBe(false);
  });

  it("authors the 27 missing construction nodes at three tiers", async () => {
    const items = await buildLocalGrammarDraftItems(taxonomy.taxonomy);

    expect(items).toHaveLength(162);
    expect(new Set(items.map((entry) => entry.itemKey)).size).toBe(162);
    expect(new Set(items.map((entry) => `${entry.item.nodeKey}\0${entry.item.promptFr}`)).size).toBe(162);
    expect(items.every((entry) => !/^Cas\s+[1-3]\s*[—–-]/u.test(entry.item.promptFr))).toBe(true);
    expect(items.every((entry) =>
      entry.reviewStatus === "needs_human_review"
      && entry.qcGates.gate1_schema
      && entry.qcGates.gate1_invariants.ok
      && entry.qcGates.gate2_answer_key.ok
      && entry.qcGates.verdict !== "rejected"
    )).toBe(true);
  });
});
