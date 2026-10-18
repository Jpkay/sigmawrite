import { describe, expect, it } from "vitest";
import {
  brevetDue, dueWordOverlap, expectedErrorRate, interestMatch, newWordOverload, pickDailyDictation, rankDictations,
  recentThemePenalty, suggestDictations, weakSkillMatch, type PickerDictation, type PickerInput,
} from "./picker";

const NOW = Date.parse("2026-10-18T10:00:00Z");
const DAY = 86_400_000;
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

function dictation(id: string, extra: Partial<PickerDictation> = {}): PickerDictation {
  return { id, kind: "flash", title: id, wordCount: 35, gradeMin: 6, gradeMax: 7, targetNodeKeys: ["a"], grammarNodeKeys: [], themes: [], interests: [], targetLemmas: [], ...extra };
}

function input(extra: Partial<PickerInput> = {}): PickerInput {
  return { nowMs: NOW, grade: 6, dictations: [], attempts: [], interests: [], masteryByNodeKey: new Map(), ...extra };
}

describe("score parts", () => {
  it("rewards an interest match, a little more for each extra shared interest", () => {
    expect(interestMatch(dictation("x", { interests: ["football"] }), ["manga"])).toBe(0);
    expect(interestMatch(dictation("x", { interests: ["football"] }), ["football"])).toBe(3);
    expect(interestMatch(dictation("x", { interests: ["football", "animals"] }), ["football", "animals"])).toBe(3.5);
  });

  it("counts weak target and grammar nodes, ignoring unknown and secured ones", () => {
    const d = dictation("x", { targetNodeKeys: ["weak", "fragile", "secured"], grammarNodeKeys: ["unknown"] });
    expect(weakSkillMatch(d, new Map([["weak", 0.4], ["fragile", 0.8], ["secured", 0.95]]))).toBe(1.5);
    expect(weakSkillMatch(dictation("y", { targetNodeKeys: ["a", "b", "c", "d"] }), new Map([["a", 0.1], ["b", 0.1], ["c", 0.1], ["d", 0.1]]))).toBe(3);
  });

  it("counts due words among target lemmas, normalized, capped", () => {
    const d = dictation("x", { targetLemmas: ["Rivière", "seau", "filet"] });
    expect(dueWordOverlap(d, [])).toBe(0);
    expect(dueWordOverlap(d, [{ lemmaId: "1", lemma: "rivière" }, { lemmaId: "2", lemma: "seau" }, { lemmaId: "3", lemma: "chat" }])).toBe(2);
  });

  it("penalises more than two new words only when known words are supplied", () => {
    const d = dictation("x", { targetLemmas: ["a", "b", "c", "d", "e"] });
    expect(newWordOverload(d, null, [])).toBe(0);
    expect(newWordOverload(d, new Set(["a"]), [])).toBe(2);
    expect(newWordOverload(d, new Set(["a"]), [{ lemmaId: "1", lemma: "b" }])).toBe(1);
  });

  it("penalises themes seen in the last three dictées of the past two weeks", () => {
    const river = dictation("river", { themes: ["nature"] });
    const oak = dictation("oak", { themes: ["nature", "jardin"] });
    const school = dictation("school", { themes: ["école"] });
    const base = input({ dictations: [river, oak, school], attempts: [{ dictationId: "river", mode: "flash", submittedAt: ago(3) }] });
    expect(recentThemePenalty(oak, base)).toBe(1.5);
    expect(recentThemePenalty(school, base)).toBe(0);
    expect(recentThemePenalty(oak, { ...base, attempts: [{ dictationId: "river", mode: "flash", submittedAt: ago(20) }] })).toBe(0);
  });

  it("estimates the error rate from node mastery with the student's mean as fallback", () => {
    const d = dictation("x", { targetNodeKeys: ["a", "b"] });
    expect(expectedErrorRate(d, { masteryByNodeKey: new Map() })).toBe(0.22);
    expect(expectedErrorRate(d, { masteryByNodeKey: new Map([["a", 0.9], ["b", 0.7]]) })).toBe(0.2);
    expect(expectedErrorRate(d, { masteryByNodeKey: new Map([["a", 0.6]]) })).toBe(0.4);
  });
});

describe("hard filters", () => {
  it("never offers a dictée outside the student's grade", () => {
    const { ranked } = rankDictations(input({ grade: 8, dictations: [dictation("six"), dictation("eight", { gradeMin: 8, gradeMax: 9 })] }));
    expect(ranked.map((entry) => entry.dictation.id)).toEqual(["eight"]);
  });

  it("keeps CM1–CM2 dictées at 40 words or fewer", () => {
    const { ranked } = rankDictations(input({ grade: 5, dictations: [dictation("long", { gradeMin: 5, wordCount: 55 }), dictation("short", { gradeMin: 5, wordCount: 30 })] }));
    expect(ranked.map((entry) => entry.dictation.id)).toEqual(["short"]);
  });

  it("skips dictées done in the last 120 days while others remain", () => {
    const { ranked, relaxed } = rankDictations(input({
      dictations: [dictation("recent"), dictation("old"), dictation("new")],
      attempts: [{ dictationId: "recent", mode: "flash", submittedAt: ago(30) }, { dictationId: "old", mode: "flash", submittedAt: ago(150) }],
    }));
    expect(ranked.map((entry) => entry.dictation.id).sort()).toEqual(["new", "old"]);
    expect(relaxed).toEqual([]);
  });

  it("keeps only dictées inside the 15–30% expected error band", () => {
    const { ranked } = rankDictations(input({
      dictations: [dictation("easy", { targetNodeKeys: ["easy"] }), dictation("zone", { targetNodeKeys: ["zone"] }), dictation("hard", { targetNodeKeys: ["hard"] })],
      masteryByNodeKey: new Map([["easy", 0.97], ["zone", 0.8], ["hard", 0.4]]),
    }));
    expect(ranked.map((entry) => entry.dictation.id)).toEqual(["zone"]);
  });
});

describe("tiny pool fallback", () => {
  it("relaxes the band before recency and prefers easier over harder", () => {
    const { ranked, relaxed } = rankDictations(input({
      dictations: [dictation("easy", { targetNodeKeys: ["easy"] }), dictation("hard", { targetNodeKeys: ["hard"] })],
      masteryByNodeKey: new Map([["easy", 0.95], ["hard", 0.6]]),
    }));
    expect(relaxed).toEqual(["error_band"]);
    expect(ranked[0].dictation.id).toBe("easy");
  });

  it("repeats the least recently done dictée when everything was done", () => {
    const { ranked, relaxed } = rankDictations(input({
      dictations: [dictation("a"), dictation("b")],
      attempts: [{ dictationId: "a", mode: "flash", submittedAt: ago(10) }, { dictationId: "b", mode: "flash", submittedAt: ago(90) }],
    }));
    expect(relaxed).toEqual(["error_band", "recency"]);
    expect(ranked[0].dictation.id).toBe("b");
  });
});

describe("ranking", () => {
  it("adds interest, weak skills and due words and subtracts overload and recent themes", () => {
    const mastery = new Map([["weak", 0.75], ["ok", 0.8]]);
    const football = dictation("football", { interests: ["football"], targetNodeKeys: ["ok"], themes: ["sport"] });
    const weak = dictation("weak", { targetNodeKeys: ["weak"], targetLemmas: ["rivière"], themes: ["nature"] });
    const { ranked } = rankDictations(input({ dictations: [weak, football], interests: ["football"], masteryByNodeKey: mastery, dueWords: [{ lemmaId: "1", lemma: "rivière" }] }));
    expect(ranked.map((entry) => [entry.dictation.id, entry.score])).toEqual([["football", 3.5], ["weak", 1.5]]);
  });

  it("breaks ties by closeness to the band centre, then shorter", () => {
    const { ranked } = rankDictations(input({
      dictations: [dictation("long", { wordCount: 60 }), dictation("short", { wordCount: 30 })],
    }));
    expect(ranked.map((entry) => entry.dictation.id)).toEqual(["short", "long"]);
  });
});

describe("daily pick", () => {
  it("waits 36 hours after the last dictée", () => {
    const pool = [dictation("a"), dictation("b")];
    expect(pickDailyDictation(input({ dictations: pool, attempts: [{ dictationId: "a", mode: "flash", submittedAt: ago(1) }] }))).toBeNull();
    expect(pickDailyDictation(input({ dictations: pool, attempts: [{ dictationId: "a", mode: "flash", submittedAt: ago(2) }] }))?.dictation.id).toBe("b");
  });

  it("offers a brevet dictée to 3e every 90 days and otherwise keeps it out", () => {
    const pool = [dictation("brevet", { kind: "brevet", gradeMin: 9, gradeMax: 9, wordCount: 93 }), dictation("flash", { gradeMin: 8, gradeMax: 9 })];
    expect(pickDailyDictation(input({ grade: 9, dictations: pool }))?.dictation.id).toBe("brevet");
    const recentBrevet = [{ dictationId: "brevet", mode: "brevet", submittedAt: ago(30) }];
    expect(brevetDue(input({ grade: 9, attempts: recentBrevet }))).toBe(false);
    expect(pickDailyDictation(input({ grade: 9, dictations: pool, attempts: recentBrevet }))?.dictation.id).toBe("flash");
    expect(pickDailyDictation(input({ grade: 8, dictations: pool }))?.dictation.id).toBe("flash");
  });

  it("returns nothing when no dictée fits the grade", () => {
    expect(pickDailyDictation(input({ grade: 4, dictations: [dictation("six")] }))).toBeNull();
  });
});

describe("suggestions", () => {
  it("offers up to three choices with different themes first", () => {
    const pool = [
      dictation("n1", { themes: ["nature"], interests: ["animals"] }),
      dictation("n2", { themes: ["nature"], interests: ["animals"] }),
      dictation("s1", { themes: ["école"] }),
      dictation("m1", { themes: ["marché"] }),
    ];
    const ids = suggestDictations(input({ dictations: pool, interests: ["animals"] })).map((entry) => entry.dictation.id);
    expect(ids).toHaveLength(3);
    expect(ids[0]).toBe("n1");
    expect(ids).not.toContain("n2");
  });

  it("fills with remaining dictées when themes repeat", () => {
    const pool = [dictation("n1", { themes: ["nature"] }), dictation("n2", { themes: ["nature"] })];
    expect(suggestDictations(input({ dictations: pool }), 2)).toHaveLength(2);
  });
});
