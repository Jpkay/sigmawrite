import { describe, expect, it, vi } from "vitest";
import { gradePracticeResponse } from "@/lib/practice/grade-response";
import { allowsMissingFinalPeriod, assessmentFromRow, OPTIONAL_PERIOD_FEEDBACK } from "./assessment-policy";
import { validateAnswer } from "./validator";
import type { FrenchGrammarChecker, GrammarMatch, ValidationSpec } from "./types";

const context = { nodeKey: "construction_phrase_canonique", promptFr: "Remets les mots dans l’ordre.", modality: "writing", responseType: "short_answer" };
const spec: ValidationSpec = { validatorType: "exact", correctAnswer: "Lina prépare le repas.", assessment: context };

describe("shared final-period grading policy", () => {
  it.each(["construction_phrase_canonique", "construction_voix_passive", "accorder_sujet_verbe_ecrit", "nouvelle_competence"])("applies to %s without a per-item answer variant", async (nodeKey) => {
    const assessment = { ...context, nodeKey, instructionsFr: "Écris une phrase complète avec la ponctuation demandée." };
    const result = await validateAnswer("Lina prépare le repas", { ...spec, assessment });
    expect(result.pass).toBe(true);
    expect(result.reason).toBe(OPTIONAL_PERIOD_FEEDBACK);
    expect((await validateAnswer("Lina prépare le repas.", { ...spec, assessment })).pass).toBe(true);
  });

  it.each(["Le repas prépare Lina", "Lina prepare le repas", "Lina préparent le repas", "Lina, prépare le repas", "Lina prépare le repas?", "Lina prépare le repas!", "Lina prépare le repas…", "Lina prépare le repas..", "Lina prépare le repas;", ""])("does not repair a different error: %s", async (answer) => {
    expect((await validateAnswer(answer, spec)).pass).toBe(false);
  });

  it("preserves apostrophes, hyphens, internal full stops and other punctuation", async () => {
    const target = { ...spec, correctAnswer: "L’élève arrive. Le porte-monnaie est ici." };
    expect((await validateAnswer("L’élève arrive. Le porte-monnaie est ici", target)).pass).toBe(true);
    for (const answer of ["Lélève arrive. Le porte-monnaie est ici", "L’élève arrive Le porte-monnaie est ici", "L’élève arrive. Le porte monnaie est ici"]) {
      expect((await validateAnswer(answer, target)).pass).toBe(false);
    }
    expect((await validateAnswer("", { ...spec, correctAnswer: "." })).pass).toBe(false);
    expect((await validateAnswer("Lina prépare le repas", { ...spec, correctAnswer: "Lina prépare le repas..." })).pass).toBe(false);
  });

  it.each(["ponctuation", "ponctuation_phrase", "point_final", "construction_discours_direct", "phrase_interrogative", "abreviation"])("keeps %s strict even with an inappropriate optional override", async (nodeKey) => {
    const target = { ...spec, assessment: { ...context, nodeKey }, config: { punctuationPolicy: "optional_final_period" } };
    expect((await validateAnswer("Lina prépare le repas", target)).pass).toBe(false);
    expect((await validateAnswer("Lina prépare le repas.", target)).pass).toBe(true);
  });

  it.each(["Ajoute le point final.", "Ponctue correctement cette phrase.", "Mets un point à la fin.", "Écris l’abréviation de monsieur."])("recognizes explicit punctuation tasks: %s", (promptFr) => {
    expect(allowsMissingFinalPeriod({ ...context, promptFr })).toBe(false);
  });

  it("keeps dictation, missing context, and explicit strict policies strict", async () => {
    for (const target of [
      { ...spec, assessment: undefined },
      { ...spec, assessment: { ...context, modality: "dictee" } },
      { ...spec, config: { punctuationPolicy: "strict" } },
      { ...spec, config: { punctuationPolicy: "invalid" } },
    ]) expect((await validateAnswer("Lina prépare le repas", target)).pass).toBe(false);
    expect((await validateAnswer("Lina prépare le repas", { ...spec, assessment: undefined, config: { punctuationPolicy: "optional_final_period" } })).pass).toBe(true);
  });

  it("uses the same rule for review/practice and diagnostic validation", async () => {
    const item = { competency_nodes: { key: context.nodeKey }, prompt_fr: context.promptFr, modality: "writing", response_type: "short_answer", validator_type: "exact", validator_config: null, correct_answer: spec.correctAnswer!, acceptable_answers: [] };
    const review = await gradePracticeResponse(item, [], { answerText: "Lina prépare le repas" });
    const diagnostic = await validateAnswer("Lina prépare le repas", { ...spec, assessment: assessmentFromRow(item) });
    expect(review).toEqual({ correct: true, feedbackFr: diagnostic.reason });
    expect(diagnostic.pass).toBe(true);
  });

  it("supports ordering tokens that do not contain a full stop", async () => {
    const item = { competency_nodes: { key: context.nodeKey }, prompt_fr: context.promptFr, response_type: "ordering", validator_type: "exact", validator_config: { tokens: ["Lina", "prépare", "le repas"] }, correct_answer: spec.correctAnswer!, acceptable_answers: [] };
    expect((await gradePracticeResponse(item, [], { answerText: item.validator_config.tokens.join(" ") })).correct).toBe(true);
  });

  it("supports regex validators without loosening their word or punctuation checks", async () => {
    const regex = { ...spec, validatorType: "regex" as const, correctAnswer: "^Lina prépare (le repas|la soupe)\\.$" };
    expect((await validateAnswer("Lina prépare la soupe", regex)).pass).toBe(true);
    expect((await validateAnswer("Lina prépare la soupe?", regex)).pass).toBe(false);
    expect((await validateAnswer("Lina préparent la soupe", regex)).pass).toBe(false);
    expect((await validateAnswer("Lina prépare la soupe", { ...regex, config: { punctuationPolicy: "strict" } })).pass).toBe(false);
  });

  it("only tolerates a grammar-service failure if adding the period clears every error", async () => {
    const issue: GrammarMatch = { message: "Erreur", offset: 0, length: 1, ruleId: "TEST", category: "GRAMMAR", replacements: [] };
    const check = vi.fn(async (answer: string) => ({ text: answer, language: "fr", clean: answer === "Lina prépare le repas.", matches: answer === "Lina prépare le repas." ? [] : [issue] }));
    const grammarChecker: FrenchGrammarChecker = { check };
    const grammar = { ...spec, validatorType: "agreement" as const };
    expect((await validateAnswer("Lina prépare le repas", grammar, { grammarChecker })).pass).toBe(true);
    expect(check.mock.calls.map(([answer]) => answer)).toEqual(["Lina prépare le repas", "Lina prépare le repas."]);
    expect((await validateAnswer("Lina préparent le repas", grammar, { grammarChecker })).pass).toBe(false);
    check.mockClear();
    expect((await validateAnswer("Lina prépare le repas", { ...grammar, config: { punctuationPolicy: "strict" } }, { grammarChecker })).pass).toBe(false);
    expect(check).toHaveBeenCalledTimes(1);
  });
});
