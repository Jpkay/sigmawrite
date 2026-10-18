import { describe, expect, it } from "vitest";
import {
  countWords,
  displaySpelling,
  isBlockedWord,
  editDistance,
  familyMatcher,
  gradeFromFrequency,
  lemmaEligibility,
  normalizeTypography,
  orthographicNeighbors,
  runDeterministicGates,
  typographyIssues,
  vetCloseWords,
} from "./gates";
import type { GeneratedDefinition, ReleaseLemma } from "./types";

const courage: ReleaseLemma = { id: "l1", lemma: "courage", normalizedLemma: "courage", partOfSpeech: "NOM", frequencyPerMillion: 60, forms: ["courage", "courages"] };
const courir: ReleaseLemma = { id: "l2", lemma: "courir", normalizedLemma: "courir", partOfSpeech: "VER", frequencyPerMillion: 150, forms: ["courir", "cours", "court", "courait", "couru", "courent"] };
const known = new Map([["bravoure", "bravoure"], ["peur", "peur"], ["audace", "audace"], ["lâcheté", "lâcheté"], ["force", "force"]]);

function generated(overrides: Partial<GeneratedDefinition> = {}): GeneratedDefinition {
  return {
    lemma: "courage",
    teachable: true,
    senseGloss: "force face au danger",
    definition: "Force qui permet d’affronter le danger ou la peur.",
    examples: [
      { text: "Le gardien a montré beaucoup de courage face au penalty.", interest: "football", form: "courage" },
      { text: "Il faut du courage pour parler devant toute la classe.", interest: null, form: "courage" },
    ],
    validation: {
      keyIdeas: [{ idea: "ne pas reculer devant la peur", keywords: ["peur", "oser", "danger", "brave"], required: true }],
      acceptedParaphrases: ["Quand on ose faire quelque chose même si on a peur."],
      misconceptions: ["Confondre avec la force physique."],
    },
    relatedTopics: ["football", "not_an_interest"],
    family: ["courageux", "courageusement", "encourager", "décourager"],
    synonyms: ["bravoure", "inventé"],
    antonyms: ["lâcheté", "peur"],
    semanticNeighbors: ["force", "audace"],
    ...overrides,
  };
}

describe("typography", () => {
  it("normalises apostrophes, spaces before high punctuation and guillemets", () => {
    expect(normalizeTypography("C'est vrai ?  « oui »")).toBe("C’est vrai ? « oui »");
    expect(normalizeTypography("Il court , vite ...")).toBe("Il court, vite…");
  });
  it("reports problems that cannot be normalised", () => {
    expect(typographyIssues("force qui aide.")).toContain("must start with a capital letter");
    expect(typographyIssues("Force qui aide")).toContain("must end with final punctuation");
    expect(typographyIssues("Il dit \"oui\".")).toContain("forbidden character (straight quotes, markdown or brackets)");
    expect(typographyIssues("Force qui aide à 3,5 km.")).toEqual([]);
  });
});

describe("family and circularity", () => {
  it("catches the word, its forms, derived words and declared family", () => {
    const isFamily = familyMatcher({ lemma: "courage", forms: courage.forms, family: ["encourager"] });
    for (const token of ["courage", "Courages", "courageux", "courageusement", "encourager"]) expect(isFamily(token)).toBe(true);
    for (const token of ["peur", "force", "danger", "cour"]) expect(isFamily(token)).toBe(false);
  });
  it("catches the base word inside a derived lemma", () => {
    const isFamily = familyMatcher({ lemma: "courageux", forms: ["courageux", "courageuse"] });
    expect(isFamily("courage")).toBe(true);
  });
  it("catches conjugated forms through the lexicon forms", () => {
    const isFamily = familyMatcher({ lemma: "courir", forms: courir.forms });
    expect(isFamily("courait")).toBe(true);
    expect(isFamily("coureur")).toBe(true);
  });
});

describe("grade and eligibility", () => {
  it("maps frequency to CM1–3e", () => {
    expect(gradeFromFrequency(1000)).toBe(4);
    expect(gradeFromFrequency(60)).toBe(6);
    expect(gradeFromFrequency(3)).toBe(9);
  });
  it("skips grammatical words, fragments and interjections before any model call", () => {
    expect(lemmaEligibility({ lemma: "de", normalizedLemma: "de", partOfSpeech: "PRE" })).toEqual({ eligible: false, reason: "grammatical" });
    expect(lemmaEligibility({ lemma: "h", normalizedLemma: "h", partOfSpeech: "NOM" })).toEqual({ eligible: false, reason: "fragment" });
    expect(lemmaEligibility({ lemma: "afin d'", normalizedLemma: "afin d'", partOfSpeech: "PRE" })).toEqual({ eligible: false, reason: "fragment" });
    expect(lemmaEligibility({ lemma: "la-la-la", normalizedLemma: "la-la-la", partOfSpeech: "ART:def" })).toEqual({ eligible: false, reason: "fragment" });
    expect(lemmaEligibility({ lemma: "chut", normalizedLemma: "chut", partOfSpeech: "ONO" })).toEqual({ eligible: false, reason: "interjection" });
    expect(lemmaEligibility(courage)).toEqual({ eligible: true });
  });
});

describe("display spelling and blocklist", () => {
  it("restores the œ ligature that Lexique spells oe, except in moelle", () => {
    expect(displaySpelling("soeur")).toBe("sœur");
    expect(displaySpelling("oeil")).toBe("œil");
    expect(displaySpelling("moelleux")).toBe("moelleux");
  });
  it("never offers vulgar words as close words", () => {
    expect(isBlockedWord("Merde")).toBe(true);
    expect(isBlockedWord("corde")).toBe(false);
    const isFamily = familyMatcher({ lemma: "corde", forms: ["corde"] });
    expect(vetCloseWords(["merde", "ficelle"], { knownLemmas: new Map([["merde", "merde"], ["ficelle", "ficelle"]]), isFamily })).toEqual(["ficelle"]);
  });
});

describe("close words", () => {
  it("measures edits with swaps", () => {
    expect(editDistance("chien", "chein")).toBe(1);
    expect(editDistance("courage", "cirage")).toBe(2);
  });
  it("finds orthographic neighbours outside the family, same part of speech first", () => {
    const candidates: ReleaseLemma[] = [
      courage,
      { id: "a", lemma: "cirage", normalizedLemma: "cirage", partOfSpeech: "NOM", frequencyPerMillion: 2, forms: ["cirage"] },
      { id: "b", lemma: "courageux", normalizedLemma: "courageux", partOfSpeech: "ADJ", frequencyPerMillion: 20, forms: ["courageux"] },
      { id: "c", lemma: "fromage", normalizedLemma: "fromage", partOfSpeech: "NOM", frequencyPerMillion: 30, forms: ["fromage"] },
      { id: "d", lemma: "de", normalizedLemma: "de", partOfSpeech: "PRE", frequencyPerMillion: 30000, forms: ["de"] },
    ];
    expect(orthographicNeighbors(courage, candidates)).toEqual(["cirage"]);
  });
  it("keeps only vetted spellings outside the family and not rejected", () => {
    const isFamily = familyMatcher({ lemma: "courage", forms: courage.forms });
    expect(vetCloseWords(["Bravoure", "inventé", "courageux", "audace"], { knownLemmas: known, isFamily, rejected: ["audace"] })).toEqual(["bravoure"]);
  });
});

describe("runDeterministicGates", () => {
  const context = { lemma: courage, knownLemmas: known, orthographic: ["cirage"] };

  it("passes a good item and cleans it", () => {
    const result = runDeterministicGates(generated(), context);
    expect(result.gates.filter((gate) => gate.status === "fail")).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.relatedTopics).toEqual(["football"]);
    expect(result.closeWords).toEqual({ synonyms: ["bravoure"], antonyms: ["lâcheté", "peur"], semantic: ["force", "audace"], orthographic: ["cirage"] });
    expect(result.validation[0]).toMatchObject({ kind: "key_idea", required: true });
    expect(result.validation.some((criterion) => criterion.kind === "accepted_paraphrase")).toBe(true);
  });

  it("fails a circular definition", () => {
    const result = runDeterministicGates(generated({ definition: "Qualité d’une personne courageuse." }), context);
    expect(result.gates.find((gate) => gate.gate === "definition_non_circular")?.status).toBe("fail");
  });

  it("fails a definition longer than 20 words", () => {
    const definition = `${Array.from({ length: 21 }, () => "mot").join(" ")}.`.replace(/^m/, "M");
    expect(countWords(definition)).toBe(21);
    const result = runDeterministicGates(generated({ definition }), context);
    expect(result.gates.find((gate) => gate.gate === "definition_length")?.status).toBe("fail");
  });

  it("fails an example without a form of the word", () => {
    const result = runDeterministicGates(generated({
      examples: [
        { text: "Le gardien a été très brave face au penalty.", interest: "football", form: "brave" },
        { text: "Il faut du courage pour parler devant la classe.", interest: null, form: "courage" },
      ],
    }), context);
    expect(result.gates.find((gate) => gate.gate === "examples_contain_inflected_form")).toMatchObject({ status: "fail" });
  });

  it("accepts conjugated and elided forms of a verb", () => {
    const result = runDeterministicGates(generated({
      lemma: "courir",
      definition: "Avancer très vite avec les jambes.",
      examples: [
        { text: "L’ailier courait vers le but adverse.", interest: "football", form: "courait" },
        { text: "Mon chien court après les pigeons du parc.", interest: "animals", form: "court" },
      ],
      validation: { keyIdeas: [{ idea: "aller vite à pied", keywords: ["vite", "jambes", "sprint"], required: true }], acceptedParaphrases: ["Aller très vite avec ses jambes."], misconceptions: [] },
      family: ["coureur", "course"],
    }), { lemma: courir, knownLemmas: known, orthographic: [] });
    expect(result.gates.filter((gate) => gate.status === "fail")).toEqual([]);
  });

  it("requires a student-interest example and 2–3 examples", () => {
    const result = runDeterministicGates(generated({
      examples: [{ text: "Il faut du courage pour parler devant la classe.", interest: "unknown", form: "courage" }],
    }), context);
    expect(result.gates.find((gate) => gate.gate === "examples_count_and_interest")?.details).toMatch(/1 examples.*no example tagged/);
  });

  it("rejects validation keywords that only repeat the word family", () => {
    const result = runDeterministicGates(generated({
      validation: { keyIdeas: [{ idea: "être courageux", keywords: ["courageux", "courage", "peur"], required: true }], acceptedParaphrases: ["C’est être courageux."], misconceptions: [] },
    }), context);
    const gate = result.gates.find((entry) => entry.gate === "definition_validation_shape");
    expect(gate?.status).toBe("fail");
    expect(gate?.details).toMatch(/2\+ keywords/);
    expect(gate?.details).toMatch(/paraphrase/);
  });

  it("fails bad typography in examples", () => {
    const result = runDeterministicGates(generated({
      examples: [
        { text: "le gardien a montré du courage", interest: "football", form: "courage" },
        { text: "Il faut du courage pour parler devant la classe.", interest: null, form: "courage" },
      ],
    }), context);
    expect(result.gates.find((gate) => gate.gate === "examples_typography")?.status).toBe("fail");
  });
});
