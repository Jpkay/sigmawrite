import { describe, expect, it } from "vitest";
import { mapResponse } from "./languagetool";
import { normalize, validateAnswer } from "./validator";
import type { FrenchGrammarChecker, GrammarCheckResult } from "./types";

/** A grammar checker stub: flags answers matching a known-bad agreement pattern.
 *  Uses word boundaries so "cueilli" does not false-match inside "cueillies". */
const stubChecker = (badPatterns: RegExp[]): FrenchGrammarChecker => ({
  async check(text): Promise<GrammarCheckResult> {
    const hit = badPatterns.find((b) => b.test(text));
    return {
      text,
      language: "fr",
      clean: !hit,
      matches: hit
        ? [
            {
              message: "Accord du participe passé",
              offset: text.search(hit),
              length: 0,
              ruleId: "FR_PARTICIPE_PASSE",
              category: "GRAMMAR",
              replacements: ["cueillies"],
            },
          ]
        : [],
    };
  },
});

describe("normalize", () => {
  it("trims, collapses whitespace, lowercases by default, keeps accents", () => {
    expect(normalize("  Les   Élèves ")).toBe("les élèves");
  });
  it("respects caseSensitive", () => {
    expect(normalize("Été", { caseSensitive: true })).toBe("Été");
  });
  it("can ignore punctuation", () => {
    expect(normalize("oui, vraiment!", { ignorePunctuation: true })).toBe(
      "oui vraiment"
    );
  });
});

describe("validateAnswer — exact", () => {
  it("accepts the correct answer (accent- and case-insensitive trim)", async () => {
    const r = await validateAnswer("  Allé ", {
      validatorType: "exact",
      correctAnswer: "allé",
    });
    expect(r.pass).toBe(true);
  });
  it("accepts any acceptable variant", async () => {
    const r = await validateAnswer("partis", {
      validatorType: "exact",
      correctAnswer: "parti",
      acceptableAnswers: ["partis", "partie", "parties"],
    });
    expect(r.pass).toBe(true);
  });
  it("rejects a wrong answer", async () => {
    const r = await validateAnswer("mangé", {
      validatorType: "exact",
      correctAnswer: "allé",
    });
    expect(r.pass).toBe(false);
  });
  it("treats a missing accent as different when case-sensitive comparison is off but accents differ", async () => {
    const r = await validateAnswer("elève", {
      validatorType: "exact",
      correctAnswer: "élève",
    });
    expect(r.pass).toBe(false); // accents are meaningful
  });
});

describe("validateAnswer — regex", () => {
  it("matches a pattern", async () => {
    const r = await validateAnswer("j'ai mangé", {
      validatorType: "regex",
      correctAnswer: "^j'ai mang[ée]s?$",
    });
    expect(r.pass).toBe(true);
  });
  it("fails gracefully on a bad pattern", async () => {
    const r = await validateAnswer("x", {
      validatorType: "regex",
      correctAnswer: "([",
    });
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/invalid regex/);
  });
});

describe("validateAnswer — grammar service (Gate-2 primitive)", () => {
  const checker = stubChecker([/\bcueilli\b/]); // wrong PP agreement (not "cueillies")

  it("passes a clean (correct) answer", async () => {
    const r = await validateAnswer("Les fleurs que j'ai cueillies sont belles.", {
      validatorType: "agreement",
    }, { grammarChecker: checker });
    expect(r.pass).toBe(true);
    expect(r.ruleHits).toHaveLength(0);
  });

  it("fails an answer with a grammar error (so a distractor is rejected)", async () => {
    const r = await validateAnswer("Les fleurs que j'ai cueilli sont belles.", {
      validatorType: "agreement",
    }, { grammarChecker: checker });
    expect(r.pass).toBe(false);
    expect(r.ruleHits?.[0].ruleId).toBe("FR_PARTICIPE_PASSE");
  });

  it("throws if no checker is wired", async () => {
    await expect(
      validateAnswer("x", { validatorType: "grammalecte" })
    ).rejects.toThrow(/requires a grammarChecker/);
  });
});

describe("LanguageTool mapResponse", () => {
  it("maps the API shape to GrammarMatch and sets clean", () => {
    const clean = mapResponse("Bonjour.", "fr", { matches: [] });
    expect(clean.clean).toBe(true);

    const dirty = mapResponse("Je vais hier.", "fr", {
      matches: [
        {
          message: "Erreur de temps",
          offset: 3,
          length: 4,
          replacements: [{ value: "suis allé" }],
          rule: {
            id: "FR_TENSE",
            issueType: "grammar",
            category: { id: "GRAMMAR", name: "Grammaire" },
          },
        },
      ],
    });
    expect(dirty.clean).toBe(false);
    expect(dirty.matches[0]).toMatchObject({
      ruleId: "FR_TENSE",
      category: "GRAMMAR",
      replacements: ["suis allé"],
    });
  });
});
