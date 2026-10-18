import { describe, expect, it } from "vitest";
import { orthographicSimilarity, pickDistractors, seededShuffle, type LexicalNeighbour } from "./distractors";
import { misuseSentence, parseExamples, rankSentences, splitAroundWord } from "./sentences";

const n = (senseId: string, word: string, extra: Partial<LexicalNeighbour> = {}): LexicalNeighbour => ({ senseId, word, definition: `déf ${word}`, partOfSpeech: "adj", domain: null, sentences: [], ...extra });

describe("distractors close in meaning and spelling (D.4)", () => {
  const target = { senseId: "t", word: "intrépide", partOfSpeech: "adj", domain: null, relations: [{ senseId: "syn", type: "synonym" as const, strength: 1 }, { senseId: "conf", type: "commonly_confused_with" as const, strength: 1 }] };
  it("prefers commonly confused and look-alike words, never synonyms", () => {
    const picked = pickDistractors(target, [n("syn", "courageux"), n("far", "table", { partOfSpeech: "nom" }), n("look", "insipide"), n("conf", "intrigant")], 2);
    expect(picked.map((entry) => entry.word)).toEqual(["intrigant", "insipide"]);
  });
  it("skips duplicates of the target's spelling and definition", () => {
    const picked = pickDistractors(target, [n("dup", "Intrépide"), n("same", "audacieux", { definition: "Qui n'a pas peur du danger." }), n("ok", "insipide")], 3, { needsDefinition: true, targetDefinition: "Qui n'a pas peur du danger." });
    expect(picked.map((entry) => entry.word)).toEqual(["insipide"]);
  });
  it("orthographic similarity is high for look-alikes", () => {
    expect(orthographicSimilarity("intrépide", "insipide")).toBeGreaterThan(orthographicSimilarity("intrépide", "table"));
  });
  it("shuffles deterministically", () => {
    expect(seededShuffle(["a", "b", "c", "d"], "x")).toEqual(seededShuffle(["a", "b", "c", "d"], "x"));
  });
});

describe("context sentences", () => {
  it("splits around a form, keeping an elided article outside", () => {
    expect(splitAroundWord("L'intrépide pilote décolle.", ["intrépide"])).toEqual({ before: "L'", word: "intrépide", after: " pilote décolle." });
    expect(splitAroundWord("Rien ici.", ["intrépide"])).toBeNull();
  });
  it("ranks the student's interests first and can avoid the first-met sentence", () => {
    const ranked = rankSentences([
      { text: "Le gardien intrépide plonge.", interest: "football", source: "first_seen" },
      { text: "Le héros intrépide combat.", interest: "manga", source: "example" },
      { text: "Un enfant intrépide grimpe.", interest: null, source: "example" },
    ], ["manga", "football"], ["intrépide"], { avoid: "Le gardien intrépide plonge." });
    expect(ranked.map((entry) => entry.interest)).toEqual(["manga", null]);
  });
  it("builds a misuse by putting the word in another word's sentence", () => {
    expect(misuseSentence("Cette soupe insipide manque de sel.", ["insipide"], "intrépide")).toBe("Cette soupe intrépide manque de sel.");
    expect(misuseSentence("Rapide, le train file.", ["rapide"], "intrépide")).toBe("Intrépide, le train file.");
  });
  it("parses loosely typed examples", () => {
    expect(parseExamples(["Une phrase.", { text: "Autre.", interest: "manga" }, { nope: 1 }, 4])).toEqual([{ text: "Une phrase.", interest: null }, { text: "Autre.", interest: "manga" }]);
  });
});
