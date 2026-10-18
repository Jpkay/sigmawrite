import { describe, expect, it } from "vitest";
import { masteryForStatus, wordStatus, WORD_STATUS_LABELS } from "./word-status";
import type { WordCardState, WordCards, WordEvidence, WordFacet } from "./types";

const day = (n: number, hour = 10) => new Date(Date.UTC(2026, 8, 1 + n, hour)).toISOString();
const card = (facet: WordFacet, stability: number): WordCardState => ({
  facet, stability, difficulty: 5, reps: 4, lapses: 0, dueAt: day(400), lastReviewedAt: day(30), introducedAt: day(0),
});
const both = (spelling: number, meaning: number): WordCards => ({ spelling: card("spelling", spelling), meaning: card("meaning", meaning) });

const spell = (n: number, extra: Partial<WordEvidence> = {}): WordEvidence => ({
  at: day(n), kind: "correct_spelling", facet: "spelling", successful: true, format: "hear_and_type", rating: 3, ...extra,
});
const mean = (n: number, format: WordEvidence["format"], extra: Partial<WordEvidence> = {}): WordEvidence => ({
  at: day(n), kind: "meaning_recall", facet: "meaning", successful: true, format, rating: 3, ...extra,
});
const securedSpelling = [spell(1), spell(4), spell(12)];
const securedMeaning = [mean(1, "explain_own_words"), mean(4, "judge_usage", { novelContext: true }), mean(12, "explain_own_words")];

describe("wordStatus (B.2)", () => {
  const cases: Array<{ name: string; evidence: WordEvidence[]; cards: WordCards; status: string }> = [
    { name: "exposure only is Découvert", evidence: Array.from({ length: 10 }, (_, n) => ({ at: day(n), kind: "exposure" as const, facet: null, successful: true })), cards: {}, status: "decouvert" },
    { name: "look-ups never count", evidence: [{ at: day(1), kind: "help_lookup", facet: null, successful: true }], cards: {}, status: "decouvert" },
    { name: "10 recognition successes = not mastered", evidence: Array.from({ length: 10 }, (_, n) => ({ at: day(n * 8), kind: "recognition" as const, facet: (n % 2 ? "meaning" : "spelling") as WordFacet, successful: true, format: "pick_definition" as const, rating: 2 as const })), cards: both(200, 200), status: "en_route" },
    { name: "introduced word is En route", evidence: [], cards: both(0.5, 0.5), status: "en_route" },
    { name: "spelling secured without meaning = not mastered (Presque)", evidence: securedSpelling, cards: both(30, 30), status: "presque" },
    { name: "both secured = Maîtrisé", evidence: [...securedSpelling, ...securedMeaning], cards: both(30, 25), status: "maitrise" },
    { name: "both secured and ≥ 180 days stable = Ancré", evidence: [...securedSpelling, ...securedMeaning], cards: both(200, 190), status: "ancre" },
    { name: "spelling stability below 21 days blocks the spelling trace", evidence: [...securedSpelling, ...securedMeaning], cards: both(15, 30), status: "presque" },
    { name: "last spelling success must be ≥ 7 days after the previous one", evidence: [spell(1), spell(4), spell(8), ...securedMeaning], cards: both(30, 30), status: "presque" },
    { name: "three successes on two days are not enough", evidence: [spell(1), spell(1, { at: day(1, 15) }), spell(12), ...securedMeaning], cards: both(30, 30), status: "presque" },
    { name: "meaning needs two activity formats", evidence: [...securedSpelling, mean(1, "explain_own_words", { novelContext: true }), mean(4, "explain_own_words"), mean(12, "explain_own_words")], cards: both(30, 30), status: "presque" },
    { name: "meaning needs one new sentence", evidence: [...securedSpelling, mean(1, "explain_own_words"), mean(4, "judge_usage"), mean(12, "explain_own_words")], cards: both(30, 30), status: "presque" },
    { name: "an accent mistake is not a success", evidence: [spell(1), spell(4), spell(12, { successful: false, accentOnly: true, rating: 2 }), ...securedMeaning], cards: both(30, 30), status: "presque" },
    { name: "hinted answers are not unaided", evidence: [spell(1), spell(4, { hintLevel: 1 }), spell(12), ...securedMeaning], cards: both(30, 30), status: "presque" },
    { name: "seeing the answer is not a success", evidence: [spell(1), spell(4), spell(12, { answerRevealed: true, rating: 1 }), ...securedMeaning], cards: both(30, 30), status: "presque" },
    { name: "a slow answer capped at Hard is not a success", evidence: [spell(1), spell(4), spell(12, { rating: 2 }), ...securedMeaning], cards: both(30, 30), status: "presque" },
    { name: "a lapse on a mastered word = À revoir", evidence: [...securedSpelling, ...securedMeaning, spell(40, { successful: false, rating: 1, stabilityBefore: 30 })], cards: both(3, 30), status: "a_revoir" },
    { name: "relearning alone does not bring Maîtrisé back", evidence: [...securedSpelling, ...securedMeaning, spell(40, { successful: false, rating: 1, stabilityBefore: 30 }), spell(40, { at: day(40, 14) })], cards: both(3, 30), status: "presque" },
    { name: "relearning plus one spaced review restores Maîtrisé", evidence: [...securedSpelling, ...securedMeaning, spell(40, { successful: false, rating: 1, stabilityBefore: 30 }), spell(40, { at: day(40, 14) }), spell(43)], cards: both(8, 30), status: "maitrise" },
    { name: "a same-day retry miss is not a lapse", evidence: [...securedSpelling, ...securedMeaning, spell(40), spell(40, { at: day(40, 14), successful: false, rating: 1, countsForFsrs: false })], cards: both(30, 30), status: "maitrise" },
    { name: "a correct dictée word without cards stays En route", evidence: [spell(1, { source: "dictation", format: "dictation" }), spell(9, { source: "dictation", format: "dictation" }), spell(20, { source: "dictation", format: "dictation" })], cards: {}, status: "en_route" },
  ];
  for (const testCase of cases) {
    it(testCase.name, () => {
      expect(wordStatus(testCase.evidence, testCase.cards).status).toBe(testCase.status);
    });
  }

  it("exposure and recognition never raise legacy mastery", () => {
    const recognition = wordStatus(Array.from({ length: 10 }, (_, n) => ({ at: day(n), kind: "recognition" as const, facet: "spelling" as const, successful: true, rating: 2 as const })), both(1, 1));
    expect(masteryForStatus(recognition)).toBe(0);
    expect(masteryForStatus(wordStatus([], {}))).toBe(0);
  });

  it("has a gentle student-facing label for every status", () => {
    expect(WORD_STATUS_LABELS.a_revoir).toBe("On le revoit");
    expect(Object.values(WORD_STATUS_LABELS).every((label) => !/perdu|oubli/i.test(label))).toBe(true);
  });
});
